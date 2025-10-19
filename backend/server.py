from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, File, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict
import uuid
import shutil
import requests
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import math
import asyncio
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create uploads directory
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Create the main app without a prefix
app = FastAPI()

# Mount static files for serving uploaded images
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
app.mount("/api/uploads", StaticFiles(directory=UPLOAD_DIR), name="api_uploads")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 43200  # 30 days

# Email configuration
GMAIL_USER = os.environ.get("GMAIL_USER", "")
GMAIL_APP_PASSWORD = os.environ.get("GMAIL_APP_PASSWORD", "")
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        # Update last_seen and is_online
        await db.users.update_one(
            {"id": user_id},
            {
                "$set": {
                    "last_seen": datetime.now(timezone.utc),
                    "is_online": True
                }
            }
        )
        user["last_seen"] = datetime.now(timezone.utc)
        user["is_online"] = True
        
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

# Admin middleware
async def get_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# Email sending function
def send_email(to_email: str, subject: str, html_content: str):
    """Send email using Gmail SMTP"""
    if not GMAIL_USER or not GMAIL_APP_PASSWORD:
        logger.warning(f"Email credentials not configured. Would send to: {to_email}")
        logger.info(f"Email subject: {subject}")
        logger.info(f"Email content: {html_content}")
        return False
    
    try:
        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = f"KAIS App <{GMAIL_USER}>"
        message["To"] = to_email
        
        # Add HTML content
        html_part = MIMEText(html_content, "html")
        message.attach(html_part)
        
        # Send email
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
            server.send_message(message)
        
        logger.info(f"Email sent successfully to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False

# Models
class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str
    confirmPassword: Optional[str] = None
    country: str
    languages: List[str] = []

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: EmailStr
    country: str
    languages: List[str] = []
    role: str = "user"  # "user" or "admin"
    member_number: Optional[str] = None  # Üye numarası (örn: #K00001)
    rating: float = 0.0
    total_ratings: int = 0
    last_seen: Optional[datetime] = None
    is_online: bool = False
    terms_accepted: bool = False
    privacy_accepted: bool = False
    kvkk_accepted: bool = False
    agreements_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    location_sharing_enabled: bool = False
    current_location: Optional[dict] = None  # {"latitude": float, "longitude": float}
    has_seen_tutorial: bool = False  # Rehberi gördü mü?
    profile_photo: Optional[str] = None  # Profile photo URL
    blocked_users: List[str] = []  # Engellenen kullanıcı ID'leri
    achievements: List[str] = []  # Kazanılan başarı rozetleri

class ListingCreate(BaseModel):
    from_currency: str
    from_amount: float
    to_currency: str
    to_amount: Optional[float] = None
    country: str
    city: str
    description: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class Listing(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    username: str
    from_currency: str
    from_amount: float
    to_currency: str
    to_amount: Optional[float] = None
    country: str
    city: str
    description: str
    status: str = "active"  # "active", "expired", "archived"
    photos: List[str] = []  # List of photo filenames
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(hours=12))
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    distance: Optional[float] = None  # For nearby listings

class ExchangeConfirmation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    listing_id: str
    user1_id: str  # Listing owner
    user2_id: str  # Other user
    user1_confirmed: bool = False
    user2_confirmed: bool = False
    initiated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    deadline: datetime = Field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(hours=12))
    status: str = "pending"  # "pending", "confirmed", "expired", "cancelled"
    
class ExchangeInitiate(BaseModel):
    listing_id: str
    other_user_id: str

class MessageCreate(BaseModel):
    listing_id: str
    recipient_id: str
    content: str

class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    listing_id: str
    sender_id: str
    sender_username: str
    recipient_id: str
    content: str
    read: bool = False
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    deleted_by: List[str] = []  # List of user IDs who deleted this message

class Chat(BaseModel):
    listing_id: str
    other_user: dict
    last_message: Optional[str] = None
    last_message_time: Optional[datetime] = None
    unread_count: int = 0

class LocationSharingUpdate(BaseModel):
    location_sharing_enabled: bool
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class GoogleSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    session_token: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(days=7))

class SessionRequest(BaseModel):
    session_id: str

class UserLocationInfo(BaseModel):
    user_id: str
    username: str
    latitude: float
    longitude: float

class RatingCreate(BaseModel):
    rated_user_id: str
    listing_id: str
    rating: int
    comment: Optional[str] = None

class Rating(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    rated_user_id: str
    rater_id: str
    rater_username: str
    listing_id: str
    rating: int
    comment: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    type: str
    content: str
    read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ReportCreate(BaseModel):
    listing_id: str
    reason: str
    description: Optional[str] = None

class Report(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    listing_id: str
    reporter_id: str
    reporter_username: str
    reason: str
    description: Optional[str] = None
    status: str = "pending"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SupportMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sender_id: str
    sender_type: str  # "user" or "admin"
    message: str
    image_url: Optional[str] = None  # For image attachments
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SupportConversation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_name: str
    user_email: str
    messages: List[SupportMessage] = []
    status: str = "open"  # open, closed
    unread_admin: int = 0  # Unread messages for admin
    unread_user: int = 0   # Unread messages for user
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_activity: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_typing_admin: bool = False
    is_typing_user: bool = False

class UserStatus(BaseModel):
    user_id: str
    status: str = "offline"  # online, offline, away
    last_seen: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# WebSocket Connection Manager for Live Support
class SupportConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}  # user_id: websocket
        self.admin_connections: Dict[str, WebSocket] = {}  # admin_id: websocket
    
    async def connect_user(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        # Update last activity
        await db.support_conversations.update_one(
            {"user_id": user_id},
            {"$set": {"last_activity": datetime.now(timezone.utc)}}
        )
    
    async def connect_admin(self, admin_id: str, websocket: WebSocket):
        await websocket.accept()
        self.admin_connections[admin_id] = websocket
    
    def disconnect_user(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
    
    def disconnect_admin(self, admin_id: str):
        if admin_id in self.admin_connections:
            del self.admin_connections[admin_id]
    
    async def send_to_user(self, user_id: str, message: dict):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json(message)
            except:
                self.disconnect_user(user_id)
    
    async def send_to_admin(self, admin_id: str, message: dict):
        if admin_id in self.admin_connections:
            try:
                await self.admin_connections[admin_id].send_json(message)
            except:
                self.disconnect_admin(admin_id)
    
    async def broadcast_to_admins(self, message: dict):
        for admin_id in list(self.admin_connections.keys()):
            await self.send_to_admin(admin_id, message)

support_manager = SupportConnectionManager()

# Giveaway Models
class Giveaway(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str = "Apple MacBook Air 13 inch Çekilişi"
    prize: str = "Apple MacBook Air 13 inch"
    instagram_account: str = "@kaissocial"
    start_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    end_date: datetime
    total_participants: int = 322  # Başlangıç katılımcı sayısı
    status: str = "active"  # active, ended
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class GiveawayParticipation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    giveaway_id: str
    user_id: str
    username: str
    member_number: str
    instagram_username: str
    invited_member1: str  # İlk davet edilen üye numarası
    invited_member2: str  # İkinci davet edilen üye numarası
    invited_verified: bool = False  # Davetliler doğrulandı mı
    admin_approved: bool = False  # Admin onayı
    participated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class GiveawayParticipationCreate(BaseModel):
    instagram_username: str
    invited_member1: str
    invited_member2: str

# Auth Routes
@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    # Check if email exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Validate username
    username = user_data.username.strip()
    
    # 1. Convert to lowercase
    username_lower = username.lower()
    
    # 2. Check if username has uppercase letters (reject if yes)
    if username != username_lower:
        raise HTTPException(status_code=400, detail="Username must be lowercase only")
    
    # 3. Check if username contains "kais" (case insensitive)
    if "kais" in username_lower:
        raise HTTPException(status_code=400, detail="Username cannot contain 'kais'")
    
    # 4. Check if username is "admin"
    if username_lower == "admin":
        raise HTTPException(status_code=400, detail="This username is reserved and cannot be used")
    
    # 5. Check if username already exists (case insensitive)
    existing_username = await db.users.find_one({
        "$or": [
            {"username": username},
            {"username": {"$regex": f"^{username}$", "$options": "i"}}
        ]
    })
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Validate password confirmation if provided
    if user_data.confirmPassword and user_data.password != user_data.confirmPassword:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    
    # Üye numarası oluştur - 1000'den başlat
    # En son üye numarasını bul
    last_user = await db.users.find_one(
        {"member_number": {"$exists": True, "$ne": None}},
        sort=[("member_number", -1)]
    )
    
    if last_user and last_user.get("member_number"):
        # Son numarayı parse et (#K01000 -> 1000)
        try:
            last_num = int(last_user["member_number"].replace("#K", ""))
            new_num = last_num + 1
        except:
            new_num = 1000
    else:
        new_num = 1000
    
    member_number = f"#K{new_num:05d}"  # #K01000 formatında
    
    # Create user with validated lowercase username
    user = User(
        username=username_lower,
        email=user_data.email,
        country=user_data.country,
        languages=user_data.languages,
        member_number=member_number,
        terms_accepted=True,
        privacy_accepted=True,
        kvkk_accepted=True,
        agreements_date=datetime.now(timezone.utc)
    )
    
    user_dict = user.model_dump()
    user_dict['password'] = hash_password(user_data.password)
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    if user_dict.get('agreements_date'):
        user_dict['agreements_date'] = user_dict['agreements_date'].isoformat()
    
    await db.users.insert_one(user_dict)
    
    # Create token
    token = create_access_token({"sub": user.id})
    
    return {"token": token, "user": user}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token({"sub": user['id']})
    
    # Remove password from response
    user.pop('password', None)
    if isinstance(user.get('created_at'), str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    
    return {"token": token, "user": user}

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    current_user.pop('password', None)
    return current_user

@api_router.post("/auth/mark-tutorial-seen")
async def mark_tutorial_seen(current_user: dict = Depends(get_current_user)):
    """Mark tutorial as seen for current user"""
    await db.users.update_one(
        {"id": current_user['id']},
        {"$set": {"has_seen_tutorial": True}}
    )
    return {"message": "Tutorial marked as seen"}

@api_router.get("/user/{user_id}")
async def get_user_by_id(user_id: str, current_user: dict = Depends(get_current_user)):
    """Get user data by user ID"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Location Sharing Routes
@api_router.put("/user/location-sharing")
async def update_location_sharing(
    location_data: LocationSharingUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update user's location sharing settings"""
    update_data = {
        "location_sharing_enabled": location_data.location_sharing_enabled
    }
    
    if location_data.location_sharing_enabled and location_data.latitude and location_data.longitude:
        update_data["current_location"] = {
            "latitude": location_data.latitude,
            "longitude": location_data.longitude
        }
    elif not location_data.location_sharing_enabled:
        # Clear location when disabled
        update_data["current_location"] = None
    
    await db.users.update_one(
        {"id": current_user['id']},
        {"$set": update_data}
    )
    
    return {
        "message": "Konum paylaşımı güncellendi",
        "location_sharing_enabled": location_data.location_sharing_enabled
    }

@api_router.get("/chats/user-locations", response_model=List[UserLocationInfo])
async def get_chat_users_locations(current_user: dict = Depends(get_current_user)):
    """Get locations of users who have chatted with current user and have location sharing enabled"""
    # Get all users who have chatted with current user
    messages = await db.messages.find({
        "$or": [
            {"sender_id": current_user['id']},
            {"recipient_id": current_user['id']}
        ]
    }, {"_id": 0}).to_list(10000)
    
    # Get unique user IDs
    chat_user_ids = set()
    for msg in messages:
        other_user_id = msg['recipient_id'] if msg['sender_id'] == current_user['id'] else msg['sender_id']
        chat_user_ids.add(other_user_id)
    
    # Get users with location sharing enabled
    users_with_location = await db.users.find({
        "id": {"$in": list(chat_user_ids)},
        "location_sharing_enabled": True,
        "current_location": {"$ne": None}
    }, {"_id": 0, "id": 1, "username": 1, "current_location": 1}).to_list(1000)
    
    # Format response
    result = []
    for user in users_with_location:
        if user.get('current_location'):
            result.append(UserLocationInfo(
                user_id=user['id'],
                username=user['username'],
                latitude=user['current_location']['latitude'],
                longitude=user['current_location']['longitude']
            ))
    
    return result

# Password Reset Routes
class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    token: str
    new_password: str

@api_router.post("/auth/forgot-password")
async def forgot_password(request: PasswordResetRequest):
    user = await db.users.find_one({"email": request.email})
    if not user:
        # Don't send email if user doesn't exist
        # Return error to prevent spam
        raise HTTPException(status_code=404, detail="No account found with this email address")
    
    # Create reset token (valid for 1 hour)
    reset_token = create_access_token({
        "sub": user['id'],
        "type": "password_reset",
        "exp": datetime.now(timezone.utc) + timedelta(hours=1)
    })
    
    # Store reset token in database
    await db.password_resets.insert_one({
        "user_id": user['id'],
        "token": reset_token,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "used": False
    })
    
    # Create reset link
    reset_link = f"https://exchange-hub-26.preview.emergentagent.com/reset-password?token={reset_token}"
    
    # Create HTML email content
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            * {{ margin: 0; padding: 0; box-sizing: border-box; }}
            body {{ 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                background: #f3f4f6;
                padding: 20px;
            }}
            .email-wrapper {{
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
            }}
            .header {{
                background: linear-gradient(135deg, #14b8a6 0%, #0d9488 50%, #f97316 100%);
                padding: 40px 30px;
                text-align: center;
            }}
            .logo {{
                font-size: 48px;
                font-weight: 800;
                color: white;
                text-shadow: 0 2px 4px rgba(0,0,0,0.1);
                letter-spacing: 2px;
                margin-bottom: 10px;
            }}
            .tagline {{
                color: rgba(255,255,255,0.95);
                font-size: 14px;
                letter-spacing: 1px;
            }}
            .content {{
                padding: 40px 30px;
                background: white;
            }}
            .greeting {{
                font-size: 24px;
                font-weight: 600;
                color: #111827;
                margin-bottom: 20px;
            }}
            .message {{
                font-size: 16px;
                color: #4b5563;
                line-height: 1.8;
                margin-bottom: 16px;
            }}
            .button-container {{
                text-align: center;
                margin: 35px 0;
            }}
            .button {{
                display: inline-block;
                background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
                color: white !important;
                padding: 16px 40px;
                text-decoration: none;
                border-radius: 12px;
                font-weight: 600;
                font-size: 16px;
                box-shadow: 0 4px 14px rgba(20, 184, 166, 0.4);
                transition: all 0.3s ease;
            }}
            .button:hover {{
                box-shadow: 0 6px 20px rgba(20, 184, 166, 0.5);
                transform: translateY(-2px);
            }}
            .divider {{
                height: 1px;
                background: linear-gradient(to right, transparent, #e5e7eb, transparent);
                margin: 30px 0;
            }}
            .link-box {{
                background: #f9fafb;
                border: 2px dashed #d1d5db;
                border-radius: 8px;
                padding: 16px;
                word-break: break-all;
                font-size: 13px;
                color: #6b7280;
                margin: 20px 0;
            }}
            .info-box {{
                background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                border-left: 4px solid #f59e0b;
                padding: 20px;
                border-radius: 8px;
                margin: 25px 0;
            }}
            .info-title {{
                font-weight: 700;
                color: #92400e;
                font-size: 16px;
                margin-bottom: 12px;
                display: flex;
                align-items: center;
            }}
            .info-list {{
                margin-left: 20px;
                color: #78350f;
            }}
            .info-list li {{
                margin: 8px 0;
                font-size: 14px;
            }}
            .footer {{
                background: #f9fafb;
                padding: 30px;
                text-align: center;
                border-top: 1px solid #e5e7eb;
            }}
            .footer-text {{
                color: #6b7280;
                font-size: 13px;
                line-height: 1.6;
            }}
            .social-links {{
                margin: 20px 0;
            }}
            .social-links a {{
                color: #14b8a6;
                text-decoration: none;
                margin: 0 10px;
                font-weight: 500;
            }}
            .copyright {{
                color: #9ca3af;
                font-size: 12px;
                margin-top: 20px;
            }}
        </style>
    </head>
    <body>
        <div class="email-wrapper">
            <div class="header">
                <div class="logo">KAIS</div>
                <div class="tagline">Peer-to-Peer Currency Exchange</div>
            </div>
            
            <div class="content">
                <div class="greeting">Merhaba {user.get('username', 'Kullanıcı')} 👋</div>
                
                <p class="message">
                    Hesabınız için bir şifre sıfırlama talebi aldık. Güvenliğiniz bizim için önemli!
                </p>
                
                <p class="message">
                    Yeni bir şifre belirlemek için aşağıdaki butona tıklayın:
                </p>
                
                <div class="button-container">
                    <a href="{reset_link}" class="button">🔐 Şifremi Şimdi Sıfırla</a>
                </div>
                
                <div class="divider"></div>
                
                <p class="message" style="font-size: 14px; color: #6b7280;">
                    Buton çalışmıyorsa, aşağıdaki linki kopyalayıp tarayıcınıza yapıştırın:
                </p>
                
                <div class="link-box">
                    {reset_link}
                </div>
                
                <div class="info-box">
                    <div class="info-title">⚠️ Önemli Güvenlik Bilgileri</div>
                    <ul class="info-list">
                        <li>Bu link <strong>1 saat</strong> süreyle geçerlidir</li>
                        <li>Link yalnızca <strong>tek kullanımlık</strong>tır</li>
                        <li>Bu talebi <strong>siz yapmadıysanız</strong>, bu e-postayı görmezden gelin</li>
                        <li>KAIS ekibi asla şifrenizi sormaz</li>
                    </ul>
                </div>
                
                <p class="message" style="font-size: 14px; color: #9ca3af; margin-top: 30px;">
                    Herhangi bir sorunuz mu var? Destek ekibimiz size yardımcı olmak için burada!
                </p>
            </div>
            
            <div class="footer">
                <p class="footer-text">
                    Bu e-posta <strong>KAIS</strong> tarafından otomatik olarak gönderilmiştir.
                </p>
                
                <div class="social-links">
                    <a href="https://exchange-hub-26.preview.emergentagent.com">Website</a> •
                    <a href="#">Destek</a> •
                    <a href="#">Gizlilik</a>
                </div>
                
                <p class="copyright">
                    &copy; 2024 KAIS. Tüm hakları saklıdır.<br>
                    Güvenli ve hızlı para transferi platformu
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Send email
    email_sent = send_email(
        to_email=request.email,
        subject="🔐 KAIS - Şifre Sıfırlama Talebi",
        html_content=html_content
    )
    
    # Log the reset link for development
    logger.info(f"Password reset link for {request.email}: {reset_link}")
    
    response = {"message": "Şifre sıfırlama linki email adresinize gönderildi."}
    
    # In development mode (when email not configured), include the link
    if not GMAIL_USER or not GMAIL_APP_PASSWORD:
        response["reset_link"] = reset_link
        response["dev_mode"] = True
    
    return response

@api_router.post("/auth/reset-password")
async def reset_password(reset_data: PasswordReset):
    try:
        # Verify token
        payload = jwt.decode(reset_data.token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        token_type = payload.get("type")
        
        if token_type != "password_reset":
            raise HTTPException(status_code=400, detail="Invalid token type")
        
        # Check if token was already used
        token_record = await db.password_resets.find_one({
            "token": reset_data.token,
            "used": False
        })
        
        if not token_record:
            raise HTTPException(status_code=400, detail="Token invalid or already used")
        
        # Update password
        new_password_hash = hash_password(reset_data.new_password)
        await db.users.update_one(
            {"id": user_id},
            {"$set": {"password": new_password_hash}}
        )
        
        # Mark token as used
        await db.password_resets.update_one(
            {"token": reset_data.token},
            {"$set": {"used": True}}
        )
        
        return {"message": "Şifreniz başarıyla değiştirildi."}
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=400, detail="Invalid token")

# Google OAuth Routes
@api_router.post("/auth/google/session")
async def process_google_session(session_request: SessionRequest):
    """Process Google OAuth session_id and create session_token"""
    try:
        # Call Emergent Auth API to get user data
        headers = {"X-Session-ID": session_request.session_id}
        response = requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers=headers,
            timeout=10
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Invalid session_id")
        
        user_data = response.json()
        email = user_data.get("email")
        name = user_data.get("name", email.split("@")[0])
        picture = user_data.get("picture")
        session_token = user_data.get("session_token")
        
        # Check if user exists
        existing_user = await db.users.find_one({"email": email}, {"_id": 0})
        
        if existing_user:
            user_id = existing_user["id"]
            username = existing_user["username"]
        else:
            # Create new user
            # Generate member number
            user_count = await db.users.count_documents({})
            member_number = f"#K{str(user_count + 1).zfill(5)}"
            
            new_user = User(
                username=name,
                email=email,
                country="",  # Can be updated later
                languages=[],
                member_number=member_number,
                terms_accepted=True,  # Google auth implies agreement
                privacy_accepted=True,
                kvkk_accepted=True,
                agreements_date=datetime.now(timezone.utc)
            )
            
            user_dict = new_user.model_dump()
            user_dict['created_at'] = user_dict['created_at'].isoformat()
            if user_dict.get('agreements_date'):
                user_dict['agreements_date'] = user_dict['agreements_date'].isoformat()
            
            # No password for OAuth users
            await db.users.insert_one(user_dict)
            user_id = new_user.id
            username = name
        
        # Create session in database
        google_session = GoogleSession(
            user_id=user_id,
            session_token=session_token
        )
        
        session_dict = google_session.model_dump()
        session_dict['created_at'] = session_dict['created_at'].isoformat()
        session_dict['expires_at'] = session_dict['expires_at'].isoformat()
        
        await db.google_sessions.insert_one(session_dict)
        
        # Also create JWT token for compatibility with existing system
        jwt_token = create_access_token(data={"sub": user_id})
        
        return {
            "session_token": session_token,
            "jwt_token": jwt_token,
            "user": {
                "id": user_id,
                "username": username,
                "email": email,
                "picture": picture
            }
        }
        
    except requests.RequestException as e:
        logger.error(f"Error calling Emergent Auth API: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to authenticate with Google")
    except Exception as e:
        logger.error(f"Error in Google OAuth: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@api_router.post("/auth/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """Logout user and delete session"""
    try:
        # Delete all sessions for this user
        await db.google_sessions.delete_many({"user_id": current_user["id"]})
        return {"message": "Logged out successfully"}
    except Exception as e:
        logger.error(f"Error during logout: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to logout")

# Listing Routes
@api_router.post("/listings", response_model=Listing)
async def create_listing(listing_data: ListingCreate, current_user: dict = Depends(get_current_user)):
    listing = Listing(
        user_id=current_user['id'],
        username=current_user['username'],
        **listing_data.model_dump()
    )
    
    listing_dict = listing.model_dump()
    listing_dict['created_at'] = listing_dict['created_at'].isoformat()
    
    await db.listings.insert_one(listing_dict)
    
    # Check for achievements
    asyncio.create_task(check_and_award_achievements(current_user['id']))
    
    return listing

@api_router.get("/listings", response_model=List[Listing])
async def get_listings(
    country: Optional[str] = None,
    from_currency: Optional[str] = None,
    to_currency: Optional[str] = None,
    status: str = "active",
    current_user: Optional[dict] = Depends(get_current_user)
):
    query = {"status": status}
    if country:
        query["country"] = country
    if from_currency:
        query["from_currency"] = from_currency
    if to_currency:
        query["to_currency"] = to_currency
    
    # Exclude listings from blocked users
    if current_user:
        blocked_users = current_user.get('blocked_users', [])
        if blocked_users:
            query["user_id"] = {"$nin": blocked_users}
    
    listings = await db.listings.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    for listing in listings:
        if isinstance(listing.get('created_at'), str):
            listing['created_at'] = datetime.fromisoformat(listing['created_at'])
    
    return listings

# Haversine formula to calculate distance between two coordinates
def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in kilometers between two coordinates using Haversine formula"""
    R = 6371  # Earth's radius in kilometers
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
    c = 2 * math.asin(math.sqrt(a))
    
    return R * c

@api_router.get("/listings/nearby", response_model=List[Listing])
async def get_nearby_listings(
    lat: float,
    lng: float,
    radius: float = 75.0,  # Default 75km
    status: str = "active"
):
    """Get listings within specified radius (in km) from given coordinates"""
    # Get all active listings
    query = {"status": status}
    all_listings = await db.listings.find(query, {"_id": 0}).to_list(1000)
    
    nearby_listings = []
    for listing in all_listings:
        # Skip if listing doesn't have coordinates
        if not listing.get('latitude') or not listing.get('longitude'):
            continue
            
        # Calculate distance
        distance = calculate_distance(lat, lng, listing['latitude'], listing['longitude'])
        
        # Add to result if within radius
        if distance <= radius:
            listing['distance'] = round(distance, 2)  # Add distance info
            if isinstance(listing.get('created_at'), str):
                listing['created_at'] = datetime.fromisoformat(listing['created_at'])
            nearby_listings.append(listing)
    
    # Sort by distance (closest first)
    nearby_listings.sort(key=lambda x: x.get('distance', float('inf')))
    
    return nearby_listings

@api_router.get("/listings/my-listings", response_model=List[Listing])
async def get_my_listings(current_user: dict = Depends(get_current_user)):
    """Get all listings created by current user"""
    listings = await db.listings.find(
        {"user_id": current_user['id']},
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    
    # Format dates and calculate time remaining
    now = datetime.now(timezone.utc)
    for listing in listings:
        if isinstance(listing.get('created_at'), str):
            listing['created_at'] = datetime.fromisoformat(listing['created_at'])
        if isinstance(listing.get('expires_at'), str):
            listing['expires_at'] = datetime.fromisoformat(listing['expires_at'])
        
        # Calculate time remaining in seconds
        if listing.get('expires_at'):
            expires_at = listing['expires_at']
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            time_remaining = (expires_at - now).total_seconds()
            listing['time_remaining'] = max(0, int(time_remaining))
    
    return listings

@api_router.get("/listings/{listing_id}", response_model=Listing)
async def get_listing(listing_id: str):
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    if isinstance(listing.get('created_at'), str):
        listing['created_at'] = datetime.fromisoformat(listing['created_at'])
    
    return listing

@api_router.put("/listings/{listing_id}")
async def update_listing(listing_id: str, listing_data: ListingCreate, current_user: dict = Depends(get_current_user)):
    listing = await db.listings.find_one({"id": listing_id})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    if listing['user_id'] != current_user['id']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = listing_data.model_dump()
    await db.listings.update_one({"id": listing_id}, {"$set": update_data})
    
    updated_listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if isinstance(updated_listing.get('created_at'), str):
        updated_listing['created_at'] = datetime.fromisoformat(updated_listing['created_at'])
    
    return updated_listing

@api_router.delete("/listings/{listing_id}")
async def delete_listing(listing_id: str, current_user: dict = Depends(get_current_user)):
    listing = await db.listings.find_one({"id": listing_id})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    if listing['user_id'] != current_user['id']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.listings.update_one({"id": listing_id}, {"$set": {"status": "closed"}})
    return {"message": "Listing closed"}

@api_router.post("/listings/{listing_id}/republish")
async def republish_listing(listing_id: str, current_user: dict = Depends(get_current_user)):
    """Republish an expired listing"""
    listing = await db.listings.find_one({"id": listing_id})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    if listing['user_id'] != current_user['id']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if listing.get('status') != "expired":
        raise HTTPException(status_code=400, detail="Only expired listings can be republished")
    
    # Update to active and reset expiry
    now = datetime.now(timezone.utc)
    new_expires_at = now + timedelta(hours=12)
    
    await db.listings.update_one(
        {"id": listing_id},
        {
            "$set": {
                "status": "active",
                "expires_at": new_expires_at.isoformat()
            }
        }
    )
    
    return {"message": "Listing republished successfully", "expires_at": new_expires_at.isoformat()}

@api_router.post("/listings/{listing_id}/upload-photos")
async def upload_listing_photos(
    listing_id: str, 
    files: List[UploadFile] = File(...),
    current_user: dict = Depends(get_current_user)
):
    # Verify listing exists and user owns it
    listing = await db.listings.find_one({"id": listing_id})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    if listing['user_id'] != current_user['id']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    uploaded_filenames = []
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB in bytes
    
    for file in files:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail=f"File {file.filename} is not a valid image")
        
        # Read file to check size
        file_content = await file.read()
        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail=f"File {file.filename} is too large. Maximum size is 5MB")
        
        # Generate unique filename
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
        unique_filename = f"{listing_id}_{uuid.uuid4().hex[:8]}.{file_extension}"
        file_path = UPLOAD_DIR / unique_filename
        
        # Save file
        try:
            with open(file_path, "wb") as buffer:
                buffer.write(file_content)
            uploaded_filenames.append(unique_filename)
        except Exception:
            raise HTTPException(status_code=500, detail=f"Failed to save file {file.filename}")
    
    # Update listing with photo filenames
    await db.listings.update_one(
        {"id": listing_id}, 
        {"$push": {"photos": {"$each": uploaded_filenames}}}
    )
    
    return {"message": "Photos uploaded successfully", "filenames": uploaded_filenames}

# Message Routes
@api_router.post("/messages", response_model=Message)
async def send_message(message_data: MessageCreate, current_user: dict = Depends(get_current_user)):
    # Check if recipient is blocked
    recipient = await db.users.find_one({"id": message_data.recipient_id})
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")
    
    # Check if current user is blocked by recipient
    if current_user['id'] in recipient.get('blocked_users', []):
        raise HTTPException(status_code=403, detail="You cannot message this user")
    
    # Check if recipient is blocked by current user
    if message_data.recipient_id in current_user.get('blocked_users', []):
        raise HTTPException(status_code=403, detail="You have blocked this user")
    
    # Check if listing is active
    listing = await db.listings.find_one({"id": message_data.listing_id})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    if listing.get('status') != "active":
        raise HTTPException(
            status_code=403, 
            detail="Cannot send messages for expired or closed listings"
        )
    
    message = Message(
        listing_id=message_data.listing_id,
        sender_id=current_user['id'],
        sender_username=current_user['username'],
        recipient_id=message_data.recipient_id,
        content=message_data.content
    )
    
    message_dict = message.model_dump()
    message_dict['timestamp'] = message_dict['timestamp'].isoformat()
    
    await db.messages.insert_one(message_dict)
    
    # Create notification
    notification = Notification(
        user_id=message_data.recipient_id,
        type="message",
        content=f"New message from {current_user['username']}"
    )
    notif_dict = notification.model_dump()
    notif_dict['created_at'] = notif_dict['created_at'].isoformat()
    await db.notifications.insert_one(notif_dict)
    
    # Check for achievements
    asyncio.create_task(check_and_award_achievements(current_user['id']))
    
    return message

@api_router.delete("/messages/{message_id}")
async def delete_message(message_id: str, current_user: dict = Depends(get_current_user)):
    """Soft delete a message - only sender can delete, but it remains visible to admin"""
    message = await db.messages.find_one({"id": message_id})
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Only sender can delete their own message
    if message['sender_id'] != current_user['id']:
        raise HTTPException(status_code=403, detail="You can only delete your own messages")
    
    # Soft delete: Add user ID to deleted_by list
    deleted_by = message.get('deleted_by', [])
    if current_user['id'] not in deleted_by:
        deleted_by.append(current_user['id'])
    
    result = await db.messages.update_one(
        {"id": message_id},
        {"$set": {"deleted_by": deleted_by}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")
    
    return {"message": "Message deleted successfully (soft delete)"}

@api_router.get("/chats", response_model=List[Chat])
async def get_chats(current_user: dict = Depends(get_current_user)):
    # Get all messages involving current user that are NOT deleted by them
    messages = await db.messages.find({
        "$or": [
            {"sender_id": current_user['id']},
            {"recipient_id": current_user['id']}
        ],
        # Exclude messages deleted by current user
        "deleted_by": {"$ne": current_user['id']}
    }, {"_id": 0}).to_list(10000)
    
    # Group by listing and other user
    chats_map = {}
    
    for msg in messages:
        other_user_id = msg['recipient_id'] if msg['sender_id'] == current_user['id'] else msg['sender_id']
        key = f"{msg['listing_id']}_{other_user_id}"
        
        if key not in chats_map:
            other_user = await db.users.find_one({"id": other_user_id}, {"_id": 0, "password": 0})
            listing = await db.listings.find_one({"id": msg['listing_id']}, {"_id": 0})
            
            chats_map[key] = {
                "listing_id": msg['listing_id'],
                "other_user": other_user,
                "listing_from_currency": listing.get('from_currency', 'N/A') if listing else 'N/A',
                "listing_to_currency": listing.get('to_currency', 'N/A') if listing else 'N/A',
                "last_message": msg['content'],
                "last_message_time": msg['timestamp'],
                "unread_count": 0
            }
        else:
            msg_time = datetime.fromisoformat(msg['timestamp']) if isinstance(msg['timestamp'], str) else msg['timestamp']
            current_time = datetime.fromisoformat(chats_map[key]['last_message_time']) if isinstance(chats_map[key]['last_message_time'], str) else chats_map[key]['last_message_time']
            
            if msg_time > current_time:
                chats_map[key]['last_message'] = msg['content']
                chats_map[key]['last_message_time'] = msg['timestamp']
        
        if msg['recipient_id'] == current_user['id'] and not msg['read']:
            chats_map[key]['unread_count'] += 1
    
    # Sort by last message time
    sorted_chats = sorted(chats_map.values(), key=lambda x: x['last_message_time'], reverse=True)
    
    return sorted_chats

@api_router.delete("/chats/{listing_id}/{other_user_id}")
async def delete_chat(listing_id: str, other_user_id: str, current_user: dict = Depends(get_current_user)):
    """Soft delete all messages in a chat - Cannot delete admin chats"""
    
    # Check if other user is admin
    other_user = await db.users.find_one({"id": other_user_id}, {"_id": 0})
    if not other_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if other_user.get('role') == 'admin':
        raise HTTPException(
            status_code=403, 
            detail="Cannot delete conversations with admin"
        )
    
    # Soft delete: Add current user ID to deleted_by array for all messages in this conversation
    result = await db.messages.update_many(
        {
            "listing_id": listing_id,
            "$or": [
                {"sender_id": current_user['id'], "recipient_id": other_user_id},
                {"sender_id": other_user_id, "recipient_id": current_user['id']}
            ]
        },
        {
            "$addToSet": {"deleted_by": current_user['id']}
        }
    )
    
    return {
        "message": "Chat deleted successfully (soft delete - visible to admin)",
        "modified_count": result.modified_count
    }

@api_router.get("/chats/unread-count")
async def get_unread_messages_count(current_user: dict = Depends(get_current_user)):
    """Get total count of unread messages and latest unread chat info"""
    unread_count = await db.messages.count_documents({
        "recipient_id": current_user['id'],
        "read": False
    })
    
    # Get the latest unread message to know which chat to navigate to
    latest_unread = None
    if unread_count > 0:
        latest_message = await db.messages.find_one(
            {"recipient_id": current_user['id'], "read": False},
            {"_id": 0},
            sort=[("timestamp", -1)]
        )
        if latest_message:
            latest_unread = {
                "listing_id": latest_message.get("listing_id"),
                "sender_id": latest_message.get("sender_id")
            }
    
    return {
        "unread_count": unread_count,
        "latest_unread": latest_unread
    }

# Admin Routes
@api_router.get("/admin/users")
async def get_all_users(admin_user: dict = Depends(get_admin_user)):
    """Get all users for admin panel"""
    users = await db.users.find({}, {"_id": 0}).to_list(length=None)
    
    # Add stats for each user
    for user in users:
        user_stats = {
            "total_listings": await db.listings.count_documents({"user_id": user['id']}),
            "active_listings": await db.listings.count_documents({"user_id": user['id'], "status": "active"}),
            "total_messages_sent": await db.messages.count_documents({"sender_id": user['id']}),
            "total_messages_received": await db.messages.count_documents({"recipient_id": user['id']})
        }
        user.update(user_stats)
    
    return users

@api_router.get("/admin/listings")
async def get_all_listings(admin_user: dict = Depends(get_admin_user)):
    """Get all listings for admin panel"""
    listings = await db.listings.find({}, {"_id": 0}).to_list(length=None)
    return listings

@api_router.get("/admin/messages")
async def get_all_messages(admin_user: dict = Depends(get_admin_user)):
    """Get all messages for admin panel - including soft deleted ones"""
    messages = await db.messages.find({}, {"_id": 0}).to_list(length=None)
    return messages

@api_router.get("/admin/chats")
async def get_all_chats(admin_user: dict = Depends(get_admin_user)):
    """Get all chats for admin panel - including those deleted by users"""
    # Get ALL messages (no deleted_by filter)
    messages = await db.messages.find({}, {"_id": 0}).to_list(10000)
    
    # Group by listing and users
    chats_map = {}
    
    for msg in messages:
        # Create a unique key for each conversation
        users = sorted([msg['sender_id'], msg['recipient_id']])
        key = f"{msg['listing_id']}_{users[0]}_{users[1]}"
        
        if key not in chats_map:
            sender = await db.users.find_one({"id": msg['sender_id']}, {"_id": 0, "password": 0})
            recipient = await db.users.find_one({"id": msg['recipient_id']}, {"_id": 0, "password": 0})
            listing = await db.listings.find_one({"id": msg['listing_id']}, {"_id": 0})
            
            chats_map[key] = {
                "listing_id": msg['listing_id'],
                "user1": sender,
                "user2": recipient,
                "listing_info": listing,
                "last_message": msg['content'],
                "last_message_time": msg['timestamp'],
                "total_messages": 1,
                "deleted_by": msg.get('deleted_by', [])
            }
        else:
            msg_time = datetime.fromisoformat(msg['timestamp']) if isinstance(msg['timestamp'], str) else msg['timestamp']
            current_time = datetime.fromisoformat(chats_map[key]['last_message_time']) if isinstance(chats_map[key]['last_message_time'], str) else chats_map[key]['last_message_time']
            
            if msg_time > current_time:
                chats_map[key]['last_message'] = msg['content']
                chats_map[key]['last_message_time'] = msg['timestamp']
            
            chats_map[key]['total_messages'] += 1
            
            # Merge deleted_by arrays
            for user_id in msg.get('deleted_by', []):
                if user_id not in chats_map[key]['deleted_by']:
                    chats_map[key]['deleted_by'].append(user_id)
    
    # Sort by last message time
    sorted_chats = sorted(chats_map.values(), key=lambda x: x['last_message_time'], reverse=True)
    
    return sorted_chats

@api_router.get("/admin/stats")
async def get_admin_stats(admin_user: dict = Depends(get_admin_user)):
    """Get general statistics for admin dashboard"""
    total_users = await db.users.count_documents({})
    total_listings = await db.listings.count_documents({})
    active_listings = await db.listings.count_documents({"status": "active"})
    total_messages = await db.messages.count_documents({})
    
    return {
        "total_users": total_users,
        "total_listings": total_listings,
        "active_listings": active_listings,
        "total_messages": total_messages,
        "generated_at": datetime.now(timezone.utc).isoformat()
    }

@api_router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, admin_user: dict = Depends(get_admin_user)):
    """Delete a user and all related data"""
    # Delete user's listings
    await db.listings.delete_many({"user_id": user_id})
    
    # Delete user's messages
    await db.messages.delete_many({"$or": [{"sender_id": user_id}, {"recipient_id": user_id}]})
    
    # Delete user's notifications
    await db.notifications.delete_many({"user_id": user_id})
    
    # Delete user
    result = await db.users.delete_one({"id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User and all related data deleted successfully"}

class DeleteListingRequest(BaseModel):
    reason: Optional[str] = "Politika ihlali"

@api_router.delete("/admin/listings/{listing_id}")
async def delete_listing_by_admin(listing_id: str, request_data: DeleteListingRequest, admin_user: dict = Depends(get_admin_user)):
    """Delete a listing as admin and send notification to user via email and in-app"""
    # Get listing details
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Get user details
    user = await db.users.find_one({"id": listing["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Extract reason from request body
    reason = request_data.reason or "Politika ihlali"
    
    # Delete the listing
    await db.listings.delete_one({"id": listing_id})
    
    # Create in-app notification for the user
    notification_content = f"İlanınız ({listing['from_amount']} {listing['from_currency']} → {listing['to_amount']} {listing['to_currency']}) yönetici tarafından kaldırılmıştır. Sebep: {reason}"
    notification = Notification(
        user_id=listing["user_id"],
        type="listing_deleted",
        content=notification_content,
        read=False
    )
    
    notification_dict = notification.model_dump()
    await db.notifications.insert_one(notification_dict)
    
    # Send email notification
    email_subject = "KAIS - İlanınız Kaldırıldı"
    email_html = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #e74c3c;">İlanınız Kaldırıldı</h2>
                <p>Merhaba <strong>{user['username']}</strong>,</p>
                <p>Aşağıdaki ilanınız yönetici tarafından kaldırılmıştır:</p>
                <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #e74c3c; margin: 20px 0;">
                    <p style="margin: 0;"><strong>İlan:</strong> {listing['from_amount']} {listing['from_currency']} → {listing['to_amount']} {listing['to_currency']}</p>
                    <p style="margin: 10px 0 0 0;"><strong>Sebep:</strong> {reason}</p>
                </div>
                <p>Herhangi bir sorunuz varsa lütfen bizimle iletişime geçin.</p>
                <p style="margin-top: 30px;">Saygılarımızla,<br><strong>KAIS Ekibi</strong></p>
            </div>
        </body>
    </html>
    """
    
    # Send email
    email_sent = send_email(user["email"], email_subject, email_html)
    
    return {
        "message": "Listing deleted successfully", 
        "notification_sent": True,
        "email_sent": email_sent,
        "listing_title": f"{listing['from_amount']} {listing['from_currency']} → {listing['to_amount']} {listing['to_currency']}",
        "user": user["username"]
    }

# ==================== Support Endpoints ====================
@api_router.get("/support/conversation")
async def get_support_conversation(current_user: dict = Depends(get_current_user)):
    """Get or create support conversation for current user"""
    conversation = await db.support_conversations.find_one({"user_id": current_user["id"]}, {"_id": 0})
    
    if not conversation:
        # Create new conversation
        new_conversation = SupportConversation(
            user_id=current_user["id"],
            user_name=current_user["username"],
            user_email=current_user["email"]
        )
        conversation_dict = new_conversation.model_dump()
        await db.support_conversations.insert_one(conversation_dict)
        return new_conversation
    
    return conversation

@api_router.post("/support/message")
async def send_support_message(message: dict, current_user: dict = Depends(get_current_user)):
    """Send a message to support"""
    conversation = await db.support_conversations.find_one({"user_id": current_user["id"]})
    
    if not conversation:
        # Create new conversation
        new_conversation = SupportConversation(
            user_id=current_user["id"],
            user_name=current_user["username"],
            user_email=current_user["email"]
        )
        conversation = new_conversation.model_dump()
        await db.support_conversations.insert_one(conversation)
    
    # Create message
    new_message = SupportMessage(
        sender_id=current_user["id"],
        sender_type="user",
        message=message.get("message", "")
    )
    
    # Update conversation
    await db.support_conversations.update_one(
        {"user_id": current_user["id"]},
        {
            "$push": {"messages": new_message.model_dump()},
            "$set": {
                "updated_at": datetime.now(timezone.utc),
                "status": "open"
            },
            "$inc": {"unread_admin": 1}
        }
    )
    
    return {"message": "Message sent successfully", "message_id": new_message.id}

@api_router.get("/admin/support")
async def get_all_support_conversations(admin_user: dict = Depends(get_admin_user)):
    """Get all support conversations for admin"""
    conversations = await db.support_conversations.find({}, {"_id": 0}).sort("updated_at", -1).to_list(length=None)
    return conversations

@api_router.get("/admin/support/unread-count")
async def get_unread_support_count(admin_user: dict = Depends(get_admin_user)):
    """Get count of unread support conversations"""
    count = await db.support_conversations.count_documents({"unread_admin": {"$gt": 0}})
    return {"count": count}

@api_router.get("/admin/notifications")
async def get_admin_notifications(admin_user: dict = Depends(get_admin_user)):
    """Get recent admin notifications"""
    # Get recent support messages
    recent_conversations = await db.support_conversations.find(
        {"unread_admin": {"$gt": 0}},
        {"user_name": 1, "user_email": 1, "updated_at": 1, "unread_admin": 1}
    ).sort("updated_at", -1).limit(10).to_list(length=10)
    
    notifications = []
    for conv in recent_conversations:
        notifications.append({
            "type": "support",
            "title": f"New message from {conv.get('user_name', 'User')}",
            "message": f"{conv.get('unread_admin')} unread message(s)",
            "time": conv.get('updated_at').strftime("%H:%M") if conv.get('updated_at') else "Now"
        })
    
    return {"notifications": notifications}

@api_router.post("/admin/support/{conversation_id}/reply")
async def reply_to_support(conversation_id: str, message: dict, admin_user: dict = Depends(get_admin_user)):
    """Admin reply to support conversation"""
    conversation = await db.support_conversations.find_one({"id": conversation_id})
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Create admin message
    admin_message = SupportMessage(
        sender_id=admin_user["id"],
        sender_type="admin",
        message=message.get("message", "")
    )
    
    # Update conversation
    await db.support_conversations.update_one(
        {"id": conversation_id},
        {
            "$push": {"messages": admin_message.model_dump()},
            "$set": {
                "updated_at": datetime.now(timezone.utc),
                "unread_admin": 0
            },
            "$inc": {"unread_user": 1}
        }
    )
    
    # CRITICAL FIX: Send real-time message to user via WebSocket
    user_id = conversation.get("user_id")
    if user_id:
        await support_manager.send_to_user(user_id, {
            "type": "new_admin_message",
            "message": admin_message.model_dump(mode="json")
        })
    
    return {"message": "Reply sent successfully", "message_id": admin_message.id}

@api_router.post("/support/mark-read")
async def mark_support_read(current_user: dict = Depends(get_current_user)):
    """Mark user's support messages as read"""
    await db.support_conversations.update_one(
        {"user_id": current_user["id"]},
        {"$set": {"unread_user": 0}}
    )
    return {"message": "Messages marked as read"}

@api_router.post("/admin/support/{conversation_id}/mark-read")
async def mark_admin_support_read(conversation_id: str, admin_user: dict = Depends(get_admin_user)):
    """Mark admin support messages as read"""
    await db.support_conversations.update_one(
        {"id": conversation_id},
        {"$set": {"unread_admin": 0}}
    )
    return {"message": "Messages marked as read"}

@api_router.post("/admin/support/{conversation_id}/close")
async def close_support_conversation(conversation_id: str, admin_user: dict = Depends(get_admin_user)):
    """Close support conversation"""
    await db.support_conversations.update_one(
        {"id": conversation_id},
        {"$set": {"status": "closed", "updated_at": datetime.now(timezone.utc)}}
    )
    return {"message": "Conversation closed"}

# WebSocket endpoint for user support
@app.websocket("/api/support/ws/{token}")
async def support_websocket(websocket: WebSocket, token: str):
    """WebSocket endpoint for live support"""
    try:
        # Verify token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=4001)
            return
        
        # Get user
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            await websocket.close(code=4002)
            return
        
        # Connect user
        await support_manager.connect_user(user_id, websocket)
        
        # Check conversation status and send appropriate welcome message
        conversation = await db.support_conversations.find_one({"user_id": user_id})
        should_send_welcome = False
        welcome_msg = None
        
        if not conversation:
            # No conversation exists - send welcome message
            should_send_welcome = True
            welcome_msg = SupportMessage(
                sender_id="system",
                sender_type="admin",
                message="Hello! Welcome to KAIS Support team. 👋\n\nHow can we help you? Share your questions or issues with us, and our team will get back to you within 3-5 minutes.\n\nHave a great day! 🌟"
            )
            
            new_conversation = SupportConversation(
                user_id=user_id,
                user_name=user.get("username", ""),
                user_email=user.get("email", "")
            )
            conversation_dict = new_conversation.model_dump()
            conversation_dict["messages"] = [welcome_msg.model_dump()]
            await db.support_conversations.insert_one(conversation_dict)
        
        elif conversation.get("status") == "closed":
            # Conversation is closed - reopen with new welcome message
            should_send_welcome = True
            welcome_msg = SupportMessage(
                sender_id="system",
                sender_type="admin",
                message="Hello again! Welcome back to KAIS Support. 👋\n\nHow can we help you today? Our team is ready to assist you.\n\nHave a great day! 🌟"
            )
            
            # Reopen conversation with new welcome message
            await db.support_conversations.update_one(
                {"user_id": user_id},
                {
                    "$push": {"messages": welcome_msg.model_dump()},
                    "$set": {
                        "status": "open",
                        "updated_at": datetime.now(timezone.utc),
                        "last_activity": datetime.now(timezone.utc)
                    }
                }
            )
        
        elif len(conversation.get("messages", [])) == 0:
            # Conversation exists but no messages - send welcome
            should_send_welcome = True
            welcome_msg = SupportMessage(
                sender_id="system",
                sender_type="admin",
                message="Hello! Welcome to KAIS Support team. 👋\n\nHow can we help you? Share your questions or issues with us, and our team will get back to you within 3-5 minutes.\n\nHave a great day! 🌟"
            )
            
            await db.support_conversations.update_one(
                {"user_id": user_id},
                {
                    "$push": {"messages": welcome_msg.model_dump()},
                    "$set": {"last_activity": datetime.now(timezone.utc)}
                }
            )
        else:
            # Active conversation exists - just update last activity
            await db.support_conversations.update_one(
                {"user_id": user_id},
                {"$set": {"last_activity": datetime.now(timezone.utc)}}
            )
        
        # Send welcome message if needed
        if should_send_welcome and welcome_msg:
            logger.info(f"📨 Sending welcome message to user {user_id}")
            await websocket.send_json({
                "type": "welcome",
                "message": welcome_msg.model_dump(mode="json")
            })
        
        # Main message loop
        while True:
            data = await websocket.receive_json()
            
            if data.get("type") == "message":
                # Create new message
                new_message = SupportMessage(
                    sender_id=user_id,
                    sender_type="user",
                    message=data.get("message", ""),
                    image_url=data.get("image_url")  # Support image attachments
                )
                
                # Save to database
                await db.support_conversations.update_one(
                    {"user_id": user_id},
                    {
                        "$push": {"messages": new_message.model_dump()},
                        "$set": {
                            "updated_at": datetime.now(timezone.utc),
                            "last_activity": datetime.now(timezone.utc),
                            "status": "open"
                        },
                        "$inc": {"unread_admin": 1}
                    }
                )
                
                # Send confirmation to user
                await websocket.send_json({
                    "type": "message_sent",
                    "message": new_message.model_dump(mode="json")
                })
                
                # Notify admins
                await support_manager.broadcast_to_admins({
                    "type": "new_user_message",
                    "user_id": user_id,
                    "message": new_message.model_dump(mode="json")
                })
            
            elif data.get("type") == "typing":
                # Update typing status
                await db.support_conversations.update_one(
                    {"user_id": user_id},
                    {"$set": {"is_typing_user": data.get("typing", False)}}
                )
                
                # Notify admins
                await support_manager.broadcast_to_admins({
                    "type": "user_typing",
                    "user_id": user_id,
                    "typing": data.get("typing", False)
                })
            
            elif data.get("type") == "ping":
                # Update last activity
                await db.support_conversations.update_one(
                    {"user_id": user_id},
                    {"$set": {"last_activity": datetime.now(timezone.utc)}}
                )
                await websocket.send_json({"type": "pong"})
    
    except WebSocketDisconnect:
        support_manager.disconnect_user(user_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        support_manager.disconnect_user(user_id)

# Typing indicator endpoint
@api_router.post("/support/typing")
async def set_typing_status(data: dict, current_user: dict = Depends(get_current_user)):
    """Update typing status for current user"""
    is_typing = data.get("typing", False)
    await db.support_conversations.update_one(
        {"user_id": current_user["id"]},
        {"$set": {"is_typing_user": is_typing}}
    )
    return {"status": "ok"}

@api_router.post("/support/upload-image")
async def upload_support_image(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Upload image for support conversation"""
    try:
        # Validate file type
        allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Invalid file type. Only images allowed.")
        
        # Validate file size (max 5MB)
        file_content = await file.read()
        if len(file_content) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Max 5MB allowed.")
        
        # Create uploads directory if not exists
        upload_dir = Path("/app/backend/uploads/support")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate unique filename
        file_extension = file.filename.split('.')[-1]
        unique_filename = f"{current_user['id']}_{uuid.uuid4()}.{file_extension}"
        file_path = upload_dir / unique_filename
        
        # Save file
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        # Return URL
        image_url = f"/uploads/support/{unique_filename}"
        logger.info(f"📸 Image uploaded: {image_url} by user {current_user['id']}")
        
        return {
            "success": True,
            "image_url": image_url,
            "filename": unique_filename
        }
    
    except Exception as e:
        logger.error(f"❌ Error uploading image: {e}")
        raise HTTPException(status_code=500, detail="Error uploading image")

@api_router.post("/user/upload-profile-photo")
async def upload_profile_photo(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Upload profile photo for user"""
    try:
        # Validate file type
        allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Invalid file type. Only JPEG, PNG, WebP allowed.")
        
        # Validate file size (max 2MB for profile photos)
        file_content = await file.read()
        if len(file_content) > 2 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Max 2MB allowed.")
        
        # Create uploads directory
        upload_dir = Path("/app/backend/uploads/profiles")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Delete old profile photo if exists
        old_photo = current_user.get('profile_photo')
        if old_photo:
            old_path = Path(f"/app/backend{old_photo}")
            if old_path.exists():
                old_path.unlink()
        
        # Generate unique filename
        file_extension = file.filename.split('.')[-1]
        unique_filename = f"profile_{current_user['id']}.{file_extension}"
        file_path = upload_dir / unique_filename
        
        # Save file
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        # Update user profile
        photo_url = f"/uploads/profiles/{unique_filename}"
        await db.users.update_one(
            {"id": current_user['id']},
            {"$set": {"profile_photo": photo_url}}
        )
        
        logger.info(f"👤 Profile photo uploaded: {photo_url} by user {current_user['id']}")
        
        return {
            "success": True,
            "profile_photo": photo_url
        }
    
    except Exception as e:
        logger.error(f"❌ Error uploading profile photo: {e}")
        raise HTTPException(status_code=500, detail="Error uploading profile photo")

@api_router.delete("/user/delete-profile-photo")
async def delete_profile_photo(current_user: dict = Depends(get_current_user)):
    """Delete profile photo for user"""
    try:
        old_photo = current_user.get('profile_photo')
        
        if not old_photo:
            raise HTTPException(status_code=404, detail="No profile photo to delete")
        
        # Delete file from disk
        old_path = Path(f"/app/backend{old_photo}")
        if old_path.exists():
            old_path.unlink()
            logger.info(f"🗑️ Profile photo file deleted: {old_photo}")
        
        # Update user profile - remove photo
        await db.users.update_one(
            {"id": current_user['id']},
            {"$set": {"profile_photo": None}}
        )
        
        logger.info(f"👤 Profile photo removed for user {current_user['id']}")
        
        return {
            "success": True,
            "message": "Profile photo deleted successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error deleting profile photo: {e}")
        raise HTTPException(status_code=500, detail="Error deleting profile photo")

# Admin typing indicator
@api_router.post("/admin/support/{conversation_id}/typing")
async def admin_set_typing(conversation_id: str, data: dict, admin_user: dict = Depends(get_admin_user)):
    """Admin typing indicator"""
    is_typing = data.get("typing", False)
    await db.support_conversations.update_one(
        {"id": conversation_id},
        {"$set": {"is_typing_admin": is_typing}}
    )
    
    # Notify user via WebSocket if connected
    conversation = await db.support_conversations.find_one({"id": conversation_id})
    if conversation:
        await support_manager.send_to_user(conversation["user_id"], {
            "type": "admin_typing",
            "typing": is_typing
        })
    
    return {"status": "ok"}

@api_router.post("/admin/create-admin")
async def create_admin_account():
    """Create admin account - should be called once"""
    # Check if admin already exists
    existing_admin = await db.users.find_one({"email": "admin@kais.com"})
    if existing_admin:
        return {"message": "Admin account already exists"}
    
    # Create admin user
    admin_user = User(
        username="Admin KAIS",
        email="admin@kais.com",
        country="Turkey",
        languages=["Turkish"],
        role="admin"
    )
    
    # Hash password
    hashed_password = hash_password("kais")
    admin_dict = admin_user.model_dump()
    admin_dict['password'] = hashed_password
    
    await db.users.insert_one(admin_dict)
    return {"message": "Admin account created successfully", "email": "admin@kais.com"}

@api_router.get("/messages/{listing_id}/{other_user_id}", response_model=List[Message])
async def get_messages(listing_id: str, other_user_id: str, current_user: dict = Depends(get_current_user)):
    # Get messages that are NOT deleted by current user
    messages = await db.messages.find({
        "listing_id": listing_id,
        "$or": [
            {"sender_id": current_user['id'], "recipient_id": other_user_id},
            {"sender_id": other_user_id, "recipient_id": current_user['id']}
        ],
        # Exclude messages deleted by current user
        "deleted_by": {"$ne": current_user['id']}
    }, {"_id": 0}).sort("timestamp", 1).to_list(1000)
    
    # Mark as read
    await db.messages.update_many({
        "listing_id": listing_id,
        "sender_id": other_user_id,
        "recipient_id": current_user['id'],
        "read": False
    }, {"$set": {"read": True}})
    
    # Update the messages in the response to reflect the read status change
    for msg in messages:
        if isinstance(msg.get('timestamp'), str):
            msg['timestamp'] = datetime.fromisoformat(msg['timestamp'])
        # Mark messages from other_user to current_user as read in the response
        if msg['sender_id'] == other_user_id and msg['recipient_id'] == current_user['id']:
            msg['read'] = True
    
    return messages

# Rating Routes
@api_router.post("/ratings", response_model=Rating)
async def create_rating(rating_data: RatingCreate, current_user: dict = Depends(get_current_user)):
    # Check if already rated
    existing = await db.ratings.find_one({
        "rater_id": current_user['id'],
        "listing_id": rating_data.listing_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already rated this transaction")
    
    # Check if exchange was confirmed
    exchange = await db.exchange_confirmations.find_one({
        "listing_id": rating_data.listing_id,
        "status": "confirmed",
        "$or": [
            {"user1_id": current_user['id'], "user2_id": rating_data.rated_user_id},
            {"user2_id": current_user['id'], "user1_id": rating_data.rated_user_id}
        ]
    })
    
    if not exchange:
        raise HTTPException(
            status_code=403, 
            detail="You can only rate users after a confirmed exchange"
        )
    
    rating = Rating(
        rated_user_id=rating_data.rated_user_id,
        rater_id=current_user['id'],
        rater_username=current_user['username'],
        listing_id=rating_data.listing_id,
        rating=rating_data.rating,
        comment=rating_data.comment
    )
    
    rating_dict = rating.model_dump()
    rating_dict['created_at'] = rating_dict['created_at'].isoformat()
    
    await db.ratings.insert_one(rating_dict)
    
    # Update user rating
    all_ratings = await db.ratings.find({"rated_user_id": rating_data.rated_user_id}, {"_id": 0}).to_list(10000)
    avg_rating = sum(r['rating'] for r in all_ratings) / len(all_ratings)
    
    await db.users.update_one(
        {"id": rating_data.rated_user_id},
        {"$set": {"rating": avg_rating, "total_ratings": len(all_ratings)}}
    )
    
    return rating

@api_router.get("/ratings/{user_id}", response_model=List[Rating])
async def get_user_ratings(user_id: str):
    ratings = await db.ratings.find({"rated_user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    for rating in ratings:
        if isinstance(rating.get('created_at'), str):
            rating['created_at'] = datetime.fromisoformat(rating['created_at'])
    
    return ratings

# Exchange Confirmation Routes
@api_router.post("/exchange/initiate")
async def initiate_exchange(exchange_data: ExchangeInitiate, current_user: dict = Depends(get_current_user)):
    """Initiate an exchange confirmation"""
    # Get listing
    listing = await db.listings.find_one({"id": exchange_data.listing_id})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Check if listing is active
    if listing.get('status') != "active":
        raise HTTPException(status_code=400, detail="Listing is not active")
    
    # Check if exchange already exists
    existing = await db.exchange_confirmations.find_one({
        "listing_id": exchange_data.listing_id,
        "status": {"$in": ["pending", "confirmed"]},
        "$or": [
            {"user1_id": current_user['id'], "user2_id": exchange_data.other_user_id},
            {"user2_id": current_user['id'], "user1_id": exchange_data.other_user_id}
        ]
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Exchange confirmation already exists")
    
    # Create exchange confirmation
    exchange = ExchangeConfirmation(
        listing_id=exchange_data.listing_id,
        user1_id=listing['user_id'],
        user2_id=exchange_data.other_user_id
    )
    
    exchange_dict = exchange.model_dump()
    exchange_dict['initiated_at'] = exchange_dict['initiated_at'].isoformat()
    exchange_dict['deadline'] = exchange_dict['deadline'].isoformat()
    
    await db.exchange_confirmations.insert_one(exchange_dict)
    
    return {"message": "Exchange confirmation initiated", "exchange_id": exchange.id}

@api_router.post("/exchange/{exchange_id}/confirm")
async def confirm_exchange(exchange_id: str, current_user: dict = Depends(get_current_user)):
    """Confirm an exchange"""
    exchange = await db.exchange_confirmations.find_one({"id": exchange_id})
    if not exchange:
        raise HTTPException(status_code=404, detail="Exchange not found")
    
    if exchange.get('status') != "pending":
        raise HTTPException(status_code=400, detail="Exchange is not pending")
    
    # Check if user is part of the exchange
    user_id = current_user['id']
    if user_id not in [exchange['user1_id'], exchange['user2_id']]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Update confirmation status
    update_field = "user1_confirmed" if user_id == exchange['user1_id'] else "user2_confirmed"
    await db.exchange_confirmations.update_one(
        {"id": exchange_id},
        {"$set": {update_field: True}}
    )
    
    # Check if both confirmed
    updated_exchange = await db.exchange_confirmations.find_one({"id": exchange_id})
    if updated_exchange['user1_confirmed'] and updated_exchange['user2_confirmed']:
        # Mark as confirmed
        await db.exchange_confirmations.update_one(
            {"id": exchange_id},
            {"$set": {"status": "confirmed"}}
        )
        return {"message": "Exchange confirmed by both parties", "status": "confirmed"}
    
    return {"message": "Exchange confirmation recorded", "status": "pending"}

@api_router.get("/exchange/my-exchanges")
async def get_my_exchanges(current_user: dict = Depends(get_current_user)):
    """Get all exchanges for current user"""
    exchanges = await db.exchange_confirmations.find({
        "$or": [
            {"user1_id": current_user['id']},
            {"user2_id": current_user['id']}
        ]
    }, {"_id": 0}).sort("initiated_at", -1).to_list(100)
    
    # Format dates
    for exchange in exchanges:
        if isinstance(exchange.get('initiated_at'), str):
            exchange['initiated_at'] = datetime.fromisoformat(exchange['initiated_at'])
        if isinstance(exchange.get('deadline'), str):
            exchange['deadline'] = datetime.fromisoformat(exchange['deadline'])
        
        # Add listing info
        listing = await db.listings.find_one({"id": exchange['listing_id']}, {"_id": 0})
        if listing:
            exchange['listing_info'] = {
                "from_currency": listing.get('from_currency'),
                "from_amount": listing.get('from_amount'),
                "to_currency": listing.get('to_currency'),
                "to_amount": listing.get('to_amount')
            }
        
        # Add other user info
        other_user_id = exchange['user2_id'] if exchange['user1_id'] == current_user['id'] else exchange['user1_id']
        other_user = await db.users.find_one({"id": other_user_id}, {"_id": 0, "username": 1})
        if other_user:
            exchange['other_user'] = other_user
    
    return exchanges

# Notification Routes
@api_router.get("/notifications", response_model=List[Notification])
async def get_notifications(current_user: dict = Depends(get_current_user)):
    notifications = await db.notifications.find(
        {"user_id": current_user['id']},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    for notif in notifications:
        # Ensure created_at is timezone-aware datetime
        if isinstance(notif.get('created_at'), str):
            notif['created_at'] = datetime.fromisoformat(notif['created_at'].replace('Z', '+00:00'))
        elif isinstance(notif.get('created_at'), datetime):
            if notif['created_at'].tzinfo is None:
                notif['created_at'] = notif['created_at'].replace(tzinfo=timezone.utc)
    
    return notifications

@api_router.post("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    await db.notifications.update_one(
        {"id": notification_id, "user_id": current_user['id']},
        {"$set": {"read": True}}
    )
    return {"message": "Notification marked as read"}

@api_router.delete("/notifications/{notification_id}")
async def delete_notification(notification_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.notifications.delete_one(
        {"id": notification_id, "user_id": current_user['id']}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification deleted"}

# Report Routes
@api_router.post("/reports", response_model=Report)
async def create_report(report_data: ReportCreate, current_user: dict = Depends(get_current_user)):
    # Check if user already reported this listing
    existing_report = await db.reports.find_one({
        "listing_id": report_data.listing_id,
        "reporter_id": current_user['id']
    })
    
    if existing_report:
        raise HTTPException(status_code=400, detail="You have already reported this listing")
    
    report = Report(
        listing_id=report_data.listing_id,
        reporter_id=current_user['id'],
        reporter_username=current_user['username'],
        reason=report_data.reason,
        description=report_data.description
    )
    
    report_dict = report.model_dump()
    report_dict['created_at'] = report_dict['created_at'].isoformat()
    
    await db.reports.insert_one(report_dict)
    
    # Send notification to listing owner if needed
    listing = await db.listings.find_one({"id": report_data.listing_id})
    if listing:
        logger.info(f"📋 İlan raporlandı: {report_data.listing_id} - Sebep: {report_data.reason}")
    
    return report

@api_router.get("/reports", response_model=List[Report])
async def get_reports(current_user: dict = Depends(get_current_user)):
    # Only admins can view all reports
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Only admins can view reports")
    
    reports = await db.reports.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    
    for report in reports:
        if isinstance(report.get('created_at'), str):
            report['created_at'] = datetime.fromisoformat(report['created_at'].replace('Z', '+00:00'))
        elif isinstance(report.get('created_at'), datetime):
            if report['created_at'].tzinfo is None:
                report['created_at'] = report['created_at'].replace(tzinfo=timezone.utc)
    
    return reports

# Block User Routes
@api_router.post("/users/block/{user_id}")
async def block_user(user_id: str, current_user: dict = Depends(get_current_user)):
    """Block a user"""
    if user_id == current_user['id']:
        raise HTTPException(status_code=400, detail="Cannot block yourself")
    
    # Check if user exists
    blocked_user = await db.users.find_one({"id": user_id})
    if not blocked_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if already blocked
    if user_id in current_user.get('blocked_users', []):
        raise HTTPException(status_code=400, detail="User already blocked")
    
    # Add to blocked list
    await db.users.update_one(
        {"id": current_user['id']},
        {"$addToSet": {"blocked_users": user_id}}
    )
    
    logger.info(f"🚫 Kullanıcı engellendi: {current_user['username']} -> {blocked_user['username']}")
    
    return {"message": f"User {blocked_user['username']} blocked successfully"}

@api_router.delete("/users/unblock/{user_id}")
async def unblock_user(user_id: str, current_user: dict = Depends(get_current_user)):
    """Unblock a user"""
    # Check if user is actually blocked
    if user_id not in current_user.get('blocked_users', []):
        raise HTTPException(status_code=400, detail="User is not blocked")
    
    # Remove from blocked list
    await db.users.update_one(
        {"id": current_user['id']},
        {"$pull": {"blocked_users": user_id}}
    )
    
    blocked_user = await db.users.find_one({"id": user_id})
    username = blocked_user['username'] if blocked_user else "Unknown"
    
    logger.info(f"✅ Kullanıcı engeli kaldırıldı: {current_user['username']} -> {username}")
    
    return {"message": f"User {username} unblocked successfully"}

@api_router.get("/users/blocked")
async def get_blocked_users(current_user: dict = Depends(get_current_user)):
    """Get list of blocked users"""
    blocked_ids = current_user.get('blocked_users', [])
    
    if not blocked_ids:
        return {"blocked_users": []}
    
    # Get user details for blocked users
    blocked_users = await db.users.find(
        {"id": {"$in": blocked_ids}},
        {"_id": 0, "id": 1, "username": 1, "profile_photo": 1}
    ).to_list(1000)
    
    return {"blocked_users": blocked_users}

# Achievement Routes
@api_router.get("/achievements/{user_id}")
async def get_user_achievements(user_id: str):
    """Get achievements for a user"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "id": 1, "username": 1, "achievements": 1})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Define all available achievements
    all_achievements = {
        "first_listing": {
            "id": "first_listing",
            "name": "İlk İlan",
            "description": "İlk ilanını oluştur",
            "icon": "🎉",
            "unlocked": "first_listing" in user.get('achievements', [])
        },
        "ten_listings": {
            "id": "ten_listings",
            "name": "10 İlan",
            "description": "10 ilan oluştur",
            "icon": "⭐",
            "unlocked": "ten_listings" in user.get('achievements', [])
        },
        "popular_seller": {
            "id": "popular_seller",
            "name": "Popüler Satıcı",
            "description": "İlanların 1000+ görüntülenme alsın",
            "icon": "🔥",
            "unlocked": "popular_seller" in user.get('achievements', [])
        },
        "chat_master": {
            "id": "chat_master",
            "name": "Sohbet Ustası",
            "description": "100+ mesaj gönder",
            "icon": "💬",
            "unlocked": "chat_master" in user.get('achievements', [])
        },
        "giveaway_creator": {
            "id": "giveaway_creator",
            "name": "Hediye Veren",
            "description": "Çekilişe katıl",
            "icon": "🎁",
            "unlocked": "giveaway_creator" in user.get('achievements', [])
        },
        "exchange_expert": {
            "id": "exchange_expert",
            "name": "Döviz Uzmanı",
            "description": "Döviz çeviricisini 10 kez kullan",
            "icon": "💱",
            "unlocked": "exchange_expert" in user.get('achievements', [])
        }
    }
    
    return {
        "user_id": user_id,
        "username": user['username'],
        "achievements": list(all_achievements.values()),
        "total_unlocked": len(user.get('achievements', []))
    }

async def check_and_award_achievements(user_id: str):
    """Check and award achievements to user"""
    try:
        user = await db.users.find_one({"id": user_id})
        if not user:
            return
        
        current_achievements = set(user.get('achievements', []))
        new_achievements = []
        
        # Check first_listing
        if 'first_listing' not in current_achievements:
            listing_count = await db.listings.count_documents({"user_id": user_id})
            if listing_count >= 1:
                new_achievements.append('first_listing')
        
        # Check ten_listings
        if 'ten_listings' not in current_achievements:
            listing_count = await db.listings.count_documents({"user_id": user_id})
            if listing_count >= 10:
                new_achievements.append('ten_listings')
        
        # Check popular_seller
        if 'popular_seller' not in current_achievements:
            total_views = 0
            user_listings = await db.listings.find({"user_id": user_id}).to_list(1000)
            for listing in user_listings:
                total_views += listing.get('view_count', 0)
            if total_views >= 1000:
                new_achievements.append('popular_seller')
        
        # Check chat_master
        if 'chat_master' not in current_achievements:
            message_count = await db.messages.count_documents({"sender_id": user_id})
            if message_count >= 100:
                new_achievements.append('chat_master')
        
        # Award new achievements
        if new_achievements:
            await db.users.update_one(
                {"id": user_id},
                {"$addToSet": {"achievements": {"$each": new_achievements}}}
            )
            
            # Send notifications for new achievements
            for achievement in new_achievements:
                achievement_names = {
                    "first_listing": "🎉 First Listing",
                    "ten_listings": "⭐ 10 Listings",
                    "popular_seller": "🔥 Popular User",
                    "chat_master": "💬 Chat Master",
                    "giveaway_creator": "🎁 Gift Hunter",
                    "exchange_expert": "💱 Exchange Expert"
                }
                
                notification = Notification(
                    user_id=user_id,
                    type="achievement",
                    title="New Achievement Badge! 🏆",
                    content=f"You earned the {achievement_names.get(achievement, achievement)} badge!"
                )
                
                notif_dict = notification.model_dump()
                notif_dict['created_at'] = notif_dict['created_at'].isoformat()
                await db.notifications.insert_one(notif_dict)
                
                logger.info(f"🏆 Yeni rozet kazanıldı: {user['username']} -> {achievement}")
    
    except Exception as e:
        logger.error(f"❌ Achievement check error: {e}")

# Currency Exchange Rate Routes
@api_router.get("/exchange-rates/convert")
async def convert_currency(
    amount: float,
    from_currency: str,
    to_currency: str
):
    """Convert amount from one currency to another"""
    try:
        # Get latest rates
        rate_data = await db.exchange_rates.find_one({}, {"_id": 0}, sort=[("last_updated", -1)])
        
        if not rate_data:
            raise HTTPException(status_code=503, detail="Exchange rates not available")
        
        rates = rate_data.get("rates", {})
        base = rate_data.get("base_currency", "USD")
        
        # Convert currencies
        from_currency = from_currency.upper()
        to_currency = to_currency.upper()
        
        if from_currency not in rates and from_currency != base:
            raise HTTPException(status_code=400, detail=f"Currency {from_currency} not supported")
        
        if to_currency not in rates and to_currency != base:
            raise HTTPException(status_code=400, detail=f"Currency {to_currency} not supported")
        
        # Calculate conversion
        # If from_currency is base, just multiply by to rate
        if from_currency == base:
            converted_amount = amount * rates.get(to_currency, 1)
        # If to_currency is base, divide by from rate
        elif to_currency == base:
            converted_amount = amount / rates.get(from_currency, 1)
        # Otherwise, convert through base
        else:
            amount_in_base = amount / rates.get(from_currency, 1)
            converted_amount = amount_in_base * rates.get(to_currency, 1)
        
        return {
            "amount": amount,
            "from_currency": from_currency,
            "to_currency": to_currency,
            "converted_amount": round(converted_amount, 2),
            "rate": round(converted_amount / amount, 6) if amount > 0 else 0,
            "last_updated": rate_data.get("last_updated")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error converting currency: {e}")
        raise HTTPException(status_code=500, detail="Error converting currency")

@api_router.get("/exchange-rates/history")
async def get_exchange_rate_history(
    currency: str = "TRY",
    days: int = 7
):
    """Get historical exchange rate data for trend analysis"""
    try:
        currency = currency.upper()
        
        # Calculate start date
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=days)
        
        # Fetch historical data
        history = await db.exchange_rate_history.find(
            {"recorded_at": {"$gte": start_date.isoformat()}},
            {"_id": 0, "recorded_at": 1, "date": 1, "rates": 1}
        ).sort("recorded_at", 1).to_list(1000)
        
        # Extract specific currency rates
        result = []
        for record in history:
            if currency in record.get("rates", {}):
                result.append({
                    "date": record.get("date"),
                    "recorded_at": record.get("recorded_at"),
                    "rate": record["rates"][currency]
                })
        
        # Calculate change percentage if we have data
        change_percentage = 0
        if len(result) >= 2:
            first_rate = result[0]["rate"]
            last_rate = result[-1]["rate"]
            change_percentage = ((last_rate - first_rate) / first_rate) * 100
        
        return {
            "currency": currency,
            "base": "USD",
            "days": days,
            "data": result,
            "change_percentage": round(change_percentage, 2),
            "trend": "up" if change_percentage > 0 else "down" if change_percentage < 0 else "stable"
        }
        
    except Exception as e:
        logger.error(f"❌ Error fetching exchange rate history: {e}")
        raise HTTPException(status_code=500, detail="Error fetching historical data")

@api_router.get("/exchange-rates/changes")
async def get_exchange_rate_changes(currencies: str = "TRY,EUR,GBP,JPY"):
    """Get 24-hour change percentages for currencies"""
    try:
        currency_list = [c.strip().upper() for c in currencies.split(",")]
        
        # Get current rates
        current_data = await db.exchange_rates.find_one({}, {"_id": 0}, sort=[("last_updated", -1)])
        if not current_data:
            raise HTTPException(status_code=503, detail="Exchange rates not available")
        
        # Get rates from 24 hours ago
        yesterday = datetime.now(timezone.utc) - timedelta(hours=24)
        old_data = await db.exchange_rate_history.find_one(
            {"recorded_at": {"$lte": yesterday.isoformat()}},
            {"_id": 0},
            sort=[("recorded_at", -1)]
        )
        
        changes = {}
        for currency in currency_list:
            current_rate = current_data.get("rates", {}).get(currency)
            old_rate = old_data.get("rates", {}).get(currency) if old_data else None
            
            if current_rate and old_rate:
                change_percentage = ((current_rate - old_rate) / old_rate) * 100
                changes[currency] = {
                    "current_rate": round(current_rate, 4),
                    "change_percentage": round(change_percentage, 2),
                    "trend": "up" if change_percentage > 0 else "down" if change_percentage < 0 else "stable"
                }
            elif current_rate:
                changes[currency] = {
                    "current_rate": round(current_rate, 4),
                    "change_percentage": 0,
                    "trend": "stable"
                }
        
        return {
            "base": "USD",
            "changes": changes,
            "last_updated": current_data.get("last_updated")
        }
        
    except Exception as e:
        logger.error(f"❌ Error calculating exchange rate changes: {e}")
        raise HTTPException(status_code=500, detail="Error calculating changes")

@api_router.get("/exchange-rates/{base_currency}")
async def get_exchange_rates(base_currency: str):
    """Get current exchange rates for a base currency using free API"""
    try:
        # Using exchangerate-api.com free tier (1500 requests/month)
        url = f"https://api.exchangerate-api.com/v4/latest/{base_currency.upper()}"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            return {
                "base": data["base"],
                "rates": data["rates"],
                "last_updated": data["date"]
            }
        else:
            raise HTTPException(status_code=503, detail="Exchange rate service unavailable")
    except requests.RequestException:
        # Fallback with mock data if API is down based on common exchange rates
        base = base_currency.upper()
        mock_rates_usd = {
            "USD": 1.0, "EUR": 0.92, "TRY": 34.5, "GBP": 0.79, 
            "AED": 3.67, "SAR": 3.75, "JPY": 149.8, "CHF": 0.88,
            "CAD": 1.36, "AUD": 1.53, "CNY": 7.24, "INR": 83.2,
            "KRW": 1342.5, "RUB": 96.8, "BRL": 5.15, "MXN": 17.2
        }
        
        # Convert to requested base currency
        if base == "USD":
            rates = mock_rates_usd
        else:
            base_rate = mock_rates_usd.get(base, 1.0)
            rates = {code: round(rate / base_rate, 6) for code, rate in mock_rates_usd.items()}
        
        return {
            "base": base,
            "rates": rates,
            "last_updated": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "note": "Fallback rates - API service unavailable"
        }

@api_router.get("/popular-currencies")
async def get_popular_currencies():
    """Get list of popular currencies for exchange rate display"""
    return {
        "currencies": [
            {"code": "USD", "name": "US Dollar", "symbol": "$"},
            {"code": "EUR", "name": "Euro", "symbol": "€"},
            {"code": "TRY", "name": "Turkish Lira", "symbol": "₺"},
            {"code": "GBP", "name": "British Pound", "symbol": "£"},
            {"code": "AED", "name": "UAE Dirham", "symbol": "د.إ"},
            {"code": "SAR", "name": "Saudi Riyal", "symbol": "﷼"},
            {"code": "JPY", "name": "Japanese Yen", "symbol": "¥"},
            {"code": "CHF", "name": "Swiss Franc", "symbol": "CHF"},
            {"code": "CAD", "name": "Canadian Dollar", "symbol": "C$"},
            {"code": "AUD", "name": "Australian Dollar", "symbol": "A$"},
            {"code": "CNY", "name": "Chinese Yuan", "symbol": "¥"},
            {"code": "INR", "name": "Indian Rupee", "symbol": "₹"},
            {"code": "KRW", "name": "South Korean Won", "symbol": "₩"},
            {"code": "RUB", "name": "Russian Ruble", "symbol": "₽"},
            {"code": "BRL", "name": "Brazilian Real", "symbol": "R$"},
            {"code": "MXN", "name": "Mexican Peso", "symbol": "$"},
        ]
    }

@api_router.get("/reports/listing/{listing_id}")
async def get_listing_reports(listing_id: str):
    reports = await db.reports.find({"listing_id": listing_id}, {"_id": 0}).to_list(100)
    for report in reports:
        if isinstance(report.get('created_at'), str):
            report['created_at'] = datetime.fromisoformat(report['created_at'])
    return reports

# User Status Routes
@api_router.post("/users/status")
async def update_user_status(status: str, current_user: dict = Depends(get_current_user)):
    await db.user_status.update_one(
        {"user_id": current_user['id']},
        {"$set": {
            "user_id": current_user['id'],
            "status": status,
            "last_seen": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    return {"message": "Status updated"}

@api_router.get("/users/{user_id}/status")
async def get_user_status(user_id: str):
    """Get user online/offline status"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "last_seen": 1, "is_online": 1, "username": 1})
    
    if not user:
        return {"user_id": user_id, "is_online": False, "last_seen": None, "username": "Unknown"}
    
    # Check if user is still online (last activity within 5 minutes)
    is_online = False
    if user.get('last_seen'):
        last_seen = user['last_seen']
        if isinstance(last_seen, str):
            last_seen = datetime.fromisoformat(last_seen.replace('Z', '+00:00'))
        
        # Ensure timezone aware
        if last_seen.tzinfo is None:
            last_seen = last_seen.replace(tzinfo=timezone.utc)
        
        time_diff = datetime.now(timezone.utc) - last_seen
        is_online = time_diff < timedelta(minutes=5)
        
        # Update is_online in database if changed
        if is_online != user.get('is_online', False):
            await db.users.update_one(
                {"id": user_id},
                {"$set": {"is_online": is_online}}
            )
    
    return {
        "user_id": user_id,
        "username": user.get("username", "Unknown"),
        "is_online": is_online,
        "last_seen": user.get('last_seen')
    }

# Exchange Rate Route (using external API)
@api_router.get("/exchange-rate/{from_currency}/{to_currency}")
async def get_exchange_rate(from_currency: str, to_currency: str):
    try:
        import requests
        # Using exchangerate-api.com (free tier: 1500 requests/month)
        url = f"https://api.exchangerate-api.com/v4/latest/{from_currency}"
        response = requests.get(url, timeout=5)
        data = response.json()
        
        if to_currency in data['rates']:
            rate = data['rates'][to_currency]
            return {
                "from": from_currency,
                "to": to_currency,
                "rate": rate,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        else:
            raise HTTPException(status_code=404, detail="Currency not found")
    except Exception as e:
        logger.error(f"Error fetching exchange rate: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not fetch exchange rate")

# User Stats Route
@api_router.get("/users/{user_id}/stats")
async def get_user_stats(user_id: str):
    # Total listings
    total_listings = await db.listings.count_documents({"user_id": user_id})
    active_listings = await db.listings.count_documents({"user_id": user_id, "status": "active"})
    
    # Total messages sent
    total_messages_sent = await db.messages.count_documents({"sender_id": user_id})
    
    # Total ratings received
    ratings = await db.ratings.find({"rated_user_id": user_id}, {"_id": 0}).to_list(1000)
    avg_rating = sum(r['rating'] for r in ratings) / len(ratings) if ratings else 0
    
    # Total transactions (estimated by completed chats)
    total_transactions = len(ratings)
    
    return {
        "total_listings": total_listings,
        "active_listings": active_listings,
        "total_messages_sent": total_messages_sent,
        "total_ratings": len(ratings),
        "average_rating": round(avg_rating, 2),
        "total_transactions": total_transactions
    }

# Giveaway Routes
@api_router.get("/giveaway/active")
async def get_active_giveaway():
    """Aktif çekilişi getir"""
    giveaway = await db.giveaways.find_one({"status": "active"}, {"_id": 0})
    if not giveaway:
        return None
    
    # ISO string'leri datetime'a çevir
    if isinstance(giveaway.get('start_date'), str):
        giveaway['start_date'] = datetime.fromisoformat(giveaway['start_date'])
    if isinstance(giveaway.get('end_date'), str):
        giveaway['end_date'] = datetime.fromisoformat(giveaway['end_date'])
    if isinstance(giveaway.get('created_at'), str):
        giveaway['created_at'] = datetime.fromisoformat(giveaway['created_at'])
    
    return giveaway

@api_router.post("/giveaway/participate")
async def participate_giveaway(
    participation_data: GiveawayParticipationCreate,
    current_user: dict = Depends(get_current_user)
):
    """Çekilişe katıl"""
    # Aktif çekiliş var mı kontrol et
    giveaway = await db.giveaways.find_one({"status": "active"})
    if not giveaway:
        raise HTTPException(status_code=404, detail="Aktif çekiliş bulunamadı")
    
    # Kullanıcı zaten katılmış mı kontrol et
    existing = await db.giveaway_participations.find_one({
        "giveaway_id": giveaway["id"],
        "user_id": current_user["id"]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Bu çekilişe zaten katıldınız")
    
    # Davet edilen üyeleri kontrol et
    invited1 = await db.users.find_one({"member_number": participation_data.invited_member1})
    invited2 = await db.users.find_one({"member_number": participation_data.invited_member2})
    
    if not invited1:
        raise HTTPException(status_code=400, detail=f"Üye numarası {participation_data.invited_member1} bulunamadı")
    if not invited2:
        raise HTTPException(status_code=400, detail=f"Üye numarası {participation_data.invited_member2} bulunamadı")
    
    # Aynı gün kayıt olmuş mu kontrol et
    user_created = current_user.get('created_at')
    if isinstance(user_created, str):
        user_created = datetime.fromisoformat(user_created)
    
    invited1_created = invited1.get('created_at')
    if isinstance(invited1_created, str):
        invited1_created = datetime.fromisoformat(invited1_created)
        
    invited2_created = invited2.get('created_at')
    if isinstance(invited2_created, str):
        invited2_created = datetime.fromisoformat(invited2_created)
    
    # Aynı gün kontrolü (tarih kısmı)
    same_day1 = user_created.date() == invited1_created.date()
    same_day2 = user_created.date() == invited2_created.date()
    invited_verified = same_day1 and same_day2
    
    # Katılım oluştur
    participation = GiveawayParticipation(
        giveaway_id=giveaway["id"],
        user_id=current_user["id"],
        username=current_user["username"],
        member_number=current_user.get("member_number", ""),
        instagram_username=participation_data.instagram_username,
        invited_member1=participation_data.invited_member1,
        invited_member2=participation_data.invited_member2,
        invited_verified=invited_verified,
        admin_approved=invited_verified  # Otomatik onay eğer aynı gün kayıt oldularsa
    )
    
    participation_dict = participation.model_dump()
    participation_dict['participated_at'] = participation_dict['participated_at'].isoformat()
    
    await db.giveaway_participations.insert_one(participation_dict)
    
    # Çekiliş katılımcı sayısını artır (sadece onaylanmışsa)
    if invited_verified:
        await db.giveaways.update_one(
            {"id": giveaway["id"]},
            {"$inc": {"total_participants": 1}}
        )
    
    return {
        "message": "Katılımınız alındı!" if invited_verified else "Katılımınız admin onayı bekliyor.",
        "auto_approved": invited_verified,
        "participation": participation
    }

@api_router.get("/giveaway/my-participation")
async def get_my_participation(current_user: dict = Depends(get_current_user)):
    """Kullanıcının katılımını getir"""
    giveaway = await db.giveaways.find_one({"status": "active"})
    if not giveaway:
        return None
    
    participation = await db.giveaway_participations.find_one({
        "giveaway_id": giveaway["id"],
        "user_id": current_user["id"]
    }, {"_id": 0})
    
    if participation and isinstance(participation.get('participated_at'), str):
        participation['participated_at'] = datetime.fromisoformat(participation['participated_at'])
    
    return participation

@api_router.get("/giveaway/admin/participations")
async def get_all_participations(current_user: dict = Depends(get_current_user)):
    """Tüm katılımları getir (Admin)"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin yetkisi gerekli")
    
    participations = await db.giveaway_participations.find({}, {"_id": 0}).to_list(length=None)
    
    for p in participations:
        if isinstance(p.get('participated_at'), str):
            p['participated_at'] = datetime.fromisoformat(p['participated_at'])
    
    return participations

@api_router.put("/giveaway/admin/approve/{participation_id}")
async def approve_participation(
    participation_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Katılımı onayla (Admin)"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin yetkisi gerekli")
    
    participation = await db.giveaway_participations.find_one({"id": participation_id})
    if not participation:
        raise HTTPException(status_code=404, detail="Katılım bulunamadı")
    
    # Onay durumunu güncelle
    await db.giveaway_participations.update_one(
        {"id": participation_id},
        {"$set": {"admin_approved": True}}
    )
    
    # Çekiliş katılımcı sayısını artır
    await db.giveaways.update_one(
        {"id": participation["giveaway_id"]},
        {"$inc": {"total_participants": 1}}
    )
    
    return {"message": "Katılım onaylandı"}

@api_router.put("/giveaway/admin/reject/{participation_id}")
async def reject_participation(
    participation_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Katılımı reddet (Admin)"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin yetkisi gerekli")
    
    result = await db.giveaway_participations.delete_one({"id": participation_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Katılım bulunamadı")
    
    return {"message": "Katılım reddedildi"}

# Exchange Rates Routes
@api_router.get("/exchange-rates")
async def get_exchange_rates():
    """Get current exchange rates"""
    try:
        # Fetch latest exchange rates from database
        rate_data = await db.exchange_rates.find_one({}, {"_id": 0}, sort=[("last_updated", -1)])
        
        if not rate_data:
            # If no rates in database, fetch them now
            await fetch_exchange_rates()
            rate_data = await db.exchange_rates.find_one({}, {"_id": 0}, sort=[("last_updated", -1)])
            
            if not rate_data:
                raise HTTPException(status_code=503, detail="Exchange rates not available")
        
        return rate_data
        
    except Exception as e:
        logger.error(f"❌ Error fetching exchange rates: {e}")
        raise HTTPException(status_code=500, detail="Error fetching exchange rates")

# Moved convert function before parameterized endpoint

# Include the router in the main app
app.include_router(api_router)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Scheduler for giveaway
scheduler = AsyncIOScheduler()

async def increment_giveaway_participants():
    """Her saat başı aktif çekilişe 1 katılımcı ekle"""
    try:
        result = await db.giveaways.update_one(
            {"status": "active"},
            {"$inc": {"total_participants": 1}}
        )
        if result.modified_count > 0:
            logger.info("✅ Çekiliş katılımcı sayısı 1 artırıldı")
        else:
            logger.info("ℹ️ Aktif çekiliş bulunamadı")
    except Exception as e:
        logger.error(f"❌ Çekiliş güncelleme hatası: {e}")

async def check_inactive_support_sessions():
    """Check for inactive support sessions (30 min) and auto-close them"""
    try:
        thirty_minutes_ago = datetime.now(timezone.utc) - timedelta(minutes=30)
        
        # Find open conversations with no activity in last 30 minutes
        inactive_conversations = await db.support_conversations.find({
            "status": "open",
            "last_activity": {"$lt": thirty_minutes_ago}
        }).to_list(length=None)
        
        for conversation in inactive_conversations:
            # Send auto-close message
            auto_close_msg = SupportMessage(
                sender_id="system",
                sender_type="admin",
                message="This conversation has been automatically closed due to 30 minutes of inactivity. If you need further assistance, please send a new message and we'll be happy to help! 😊"
            )
            
            # Update conversation
            await db.support_conversations.update_one(
                {"id": conversation["id"]},
                {
                    "$push": {"messages": auto_close_msg.model_dump()},
                    "$set": {
                        "status": "closed",
                        "updated_at": datetime.now(timezone.utc)
                    }
                }
            )
            
            # Notify user if connected
            await support_manager.send_to_user(conversation["user_id"], {
                "type": "conversation_closed",
                "message": auto_close_msg.model_dump(mode="json")
            })
            
            logger.info(f"✅ Auto-closed inactive conversation for user {conversation['user_id']}")
    
    except Exception as e:
        logger.error(f"❌ Error checking inactive sessions: {e}")

async def send_followup_messages():
    """Send follow-up messages for conversations with no activity in last 1 hour"""
    try:
        one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)
        two_hours_ago = datetime.now(timezone.utc) - timedelta(hours=2)
        
        # Find open conversations with last activity between 1-2 hours ago
        # (to avoid sending follow-up multiple times)
        conversations_needing_followup = await db.support_conversations.find({
            "status": "open",
            "last_activity": {
                "$lt": one_hour_ago,
                "$gte": two_hours_ago
            }
        }).to_list(length=None)
        
        for conversation in conversations_needing_followup:
            # Check if last message was from user (not already a follow-up from admin)
            messages = conversation.get("messages", [])
            if not messages:
                continue
            
            last_message = messages[-1]
            
            # Only send follow-up if last message was from user or if it's not already a follow-up
            if last_message.get("sender_type") == "user" or (
                last_message.get("sender_type") == "admin" and 
                "still need help" not in last_message.get("message", "").lower()
            ):
                # Send follow-up message
                followup_msg = SupportMessage(
                    sender_id="system",
                    sender_type="admin",
                    message="Hi there! 👋\n\nDo you still need help with your question? Our support team is here and ready to assist you.\n\nFeel free to send a message if you need anything! 😊"
                )
                
                # Update conversation
                await db.support_conversations.update_one(
                    {"id": conversation["id"]},
                    {
                        "$push": {"messages": followup_msg.model_dump()},
                        "$set": {
                            "updated_at": datetime.now(timezone.utc),
                            "last_activity": datetime.now(timezone.utc)  # Update to prevent multiple follow-ups
                        },
                        "$inc": {"unread_user": 1}
                    }
                )
                
                # Notify user if connected
                await support_manager.send_to_user(conversation["user_id"], {
                    "type": "followup_message",
                    "message": followup_msg.model_dump(mode="json")
                })
                
                logger.info(f"✅ Sent follow-up message to user {conversation['user_id']}")
    
    except Exception as e:
        logger.error(f"❌ Error sending follow-up messages: {e}")

async def auto_delete_old_messages():
    """Delete messages older than 5 minutes from all conversations"""
    try:
        five_minutes_ago = datetime.now(timezone.utc) - timedelta(minutes=5)
        
        # Find all conversations with messages
        all_conversations = await db.support_conversations.find({}).to_list(length=None)
        
        deleted_count = 0
        for conversation in all_conversations:
            messages = conversation.get("messages", [])
            if not messages:
                continue
            
            # Filter out messages older than 5 minutes
            original_count = len(messages)
            filtered_messages = []
            
            for msg in messages:
                try:
                    # Parse timestamp - handle both datetime objects and strings
                    timestamp = msg.get("timestamp")
                    if isinstance(timestamp, str):
                        # Remove 'Z' and parse
                        timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                    elif isinstance(timestamp, datetime):
                        # If already datetime, ensure it's timezone aware
                        if timestamp.tzinfo is None:
                            timestamp = timestamp.replace(tzinfo=timezone.utc)
                    
                    # Keep message if it's newer than 5 minutes
                    if timestamp > five_minutes_ago:
                        filtered_messages.append(msg)
                except Exception as e:
                    # If parsing fails, keep the message to avoid data loss
                    logger.error(f"❌ Error parsing timestamp: {e}")
                    filtered_messages.append(msg)
            
            # If any messages were removed, update the conversation
            if len(filtered_messages) < original_count:
                removed = original_count - len(filtered_messages)
                deleted_count += removed
                
                await db.support_conversations.update_one(
                    {"id": conversation["id"]},
                    {
                        "$set": {
                            "messages": filtered_messages,
                            "updated_at": datetime.now(timezone.utc)
                        }
                    }
                )
                
                # Notify user if connected to refresh conversation
                await support_manager.send_to_user(conversation["user_id"], {
                    "type": "messages_deleted",
                    "deleted_count": removed
                })
                
                logger.info(f"🗑️ Deleted {removed} old messages from conversation {conversation['id']}")
        
        if deleted_count > 0:
            logger.info(f"✅ Total deleted messages: {deleted_count}")
    
    except Exception as e:
        logger.error(f"❌ Error deleting old messages: {e}")
async def check_expired_listings():
    """Check and expire listings older than 12 hours"""
    try:
        now = datetime.now(timezone.utc)
        
        # Find active listings that have expired
        expired_listings = await db.listings.find({
            "status": "active",
            "expires_at": {"$lt": now.isoformat()}
        }).to_list(1000)
        
        if expired_listings:
            # Update to expired status
            await db.listings.update_many(
                {
                    "status": "active",
                    "expires_at": {"$lt": now.isoformat()}
                },
                {"$set": {"status": "expired"}}
            )
            logger.info(f"⏰ Expired {len(expired_listings)} listings")
    except Exception as e:
        logger.error(f"❌ Error checking expired listings: {e}")

async def check_expired_exchanges():
    """Check and expire exchange confirmations older than 12 hours"""
    try:
        now = datetime.now(timezone.utc)
        
        # Find pending exchanges that have expired
        expired_exchanges = await db.exchange_confirmations.find({
            "status": "pending",
            "deadline": {"$lt": now.isoformat()}
        }).to_list(1000)
        
        if expired_exchanges:
            # Update to expired status
            await db.exchange_confirmations.update_many(
                {
                    "status": "pending",
                    "deadline": {"$lt": now.isoformat()}
                },
                {"$set": {"status": "expired"}}
            )
            logger.info(f"⏰ Expired {len(expired_exchanges)} exchange confirmations")
    except Exception as e:
        logger.error(f"❌ Error checking expired exchanges: {e}")

async def fetch_exchange_rates():
    """Fetch live currency exchange rates and store in database"""
    try:
        # Using exchangerate-api.com free tier (1,500 requests/month)
        # Base currency: USD
        api_url = "https://api.exchangerate-api.com/v4/latest/USD"
        
        response = requests.get(api_url, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        current_time = datetime.now(timezone.utc)
        
        # Prepare exchange rate document
        exchange_rate_doc = {
            "id": str(uuid.uuid4()),
            "base_currency": data.get("base", "USD"),
            "rates": data.get("rates", {}),
            "last_updated": current_time.isoformat(),
            "timestamp": data.get("time_last_updated", None)
        }
        
        # Store in database (replace existing rates)
        await db.exchange_rates.delete_many({})  # Clear old rates
        await db.exchange_rates.insert_one(exchange_rate_doc)
        
        # Save historical data for trend analysis
        historical_doc = {
            "id": str(uuid.uuid4()),
            "base_currency": data.get("base", "USD"),
            "rates": data.get("rates", {}),
            "recorded_at": current_time.isoformat(),
            "date": current_time.strftime("%Y-%m-%d"),
            "timestamp": current_time.timestamp()
        }
        await db.exchange_rate_history.insert_one(historical_doc)
        
        # Clean up old historical data (keep only last 30 days)
        thirty_days_ago = current_time - timedelta(days=30)
        await db.exchange_rate_history.delete_many({
            "recorded_at": {"$lt": thirty_days_ago.isoformat()}
        })
        
        logger.info(f"💱 Successfully updated exchange rates with {len(exchange_rate_doc['rates'])} currencies and saved to history")
        
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Error fetching exchange rates from API: {e}")
    except Exception as e:
        logger.error(f"❌ Error updating exchange rates in database: {e}")

@app.on_event("startup")
async def startup_scheduler():
    """Uygulaması başladığında scheduler'ı başlat"""
    # Her saat başı çalış (0. dakika)
    scheduler.add_job(
        increment_giveaway_participants,
        CronTrigger(minute=0),  # Her saat başında (XX:00)
        id="giveaway_increment",
        replace_existing=True
    )
    
    # Check inactive support sessions every 5 minutes
    scheduler.add_job(
        check_inactive_support_sessions,
        CronTrigger(minute="*/5"),  # Every 5 minutes
        id="support_inactivity_check",
        replace_existing=True
    )
    
    # Send follow-up messages every 30 minutes
    scheduler.add_job(
        send_followup_messages,
        CronTrigger(minute="*/30"),  # Every 30 minutes
        id="support_followup_messages",
        replace_existing=True
    )
    
    # Auto-delete messages older than 5 minutes - runs every minute
    scheduler.add_job(
        auto_delete_old_messages,
        CronTrigger(minute="*"),  # Every minute
        id="auto_delete_messages",
        replace_existing=True
    )
    
    # Check expired listings every 30 minutes
    scheduler.add_job(
        check_expired_listings,
        CronTrigger(minute="*/30"),  # Every 30 minutes
        id="check_expired_listings",
        replace_existing=True
    )
    
    # Check expired exchanges every 30 minutes
    scheduler.add_job(
        check_expired_exchanges,
        CronTrigger(minute="*/30"),  # Every 30 minutes
        id="check_expired_exchanges",
        replace_existing=True
    )
    
    # Fetch exchange rates every 5 hours
    scheduler.add_job(
        fetch_exchange_rates,
        CronTrigger(hour="*/5"),  # Every 5 hours
        id="fetch_exchange_rates",
        replace_existing=True
    )
    
    # Fetch exchange rates immediately on startup
    asyncio.create_task(fetch_exchange_rates())
    
    scheduler.start()
    logger.info("🚀 Scheduler başlatıldı - Çekiliş, destek, follow-up, otomatik silme, süre dolmuş ilanlar, takaslar ve döviz kurları (5 saatte bir) aktif")

@app.on_event("shutdown")
async def shutdown_all():
    """Uygulama kapandığında temizlik yap"""
    scheduler.shutdown()
    client.close()
    logger.info("🛑 Scheduler ve MongoDB bağlantısı kapatıldı")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)