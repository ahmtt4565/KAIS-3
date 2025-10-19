#!/usr/bin/env python3
"""
Backend Test Suite for KAIS2.1 New Features
Tests the 4 newly implemented features:
1. Report Listing Endpoints
2. Block/Unblock User Endpoints  
3. Exchange Rate Changes Endpoint
4. Achievement System
"""

import requests
import json
import time
from datetime import datetime
import sys
import uuid

# Backend URL from environment
BACKEND_URL = "https://exchange-hub-26.preview.emergentagent.com"

class KAIS21NewFeatureTests:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.test_results = []
        self.failed_tests = []
        self.auth_token = None
        self.admin_token = None
        self.test_user_id = None
        self.test_user2_id = None
        self.test_listing_id = None
        
    def log_test(self, test_name, success, message, response_data=None):
        """Log test results"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'timestamp': datetime.now().isoformat(),
            'response_data': response_data
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        
        if not success:
            self.failed_tests.append(result)
            if response_data:
                print(f"   Response: {json.dumps(response_data, indent=2)}")
    
    def setup_authentication(self):
        """Setup authentication by registering test users"""
        print("\n🔐 Setting up authentication...")
        
        # Register test user 1
        try:
            unique_id = str(uuid.uuid4())[:8]
            user_data = {
                "username": f"testuser{unique_id}",
                "email": f"testuser{unique_id}@example.com",
                "password": "TestPassword123!",
                "country": "Turkey",
                "languages": ["Turkish", "English"]
            }
            
            response = requests.post(f"{self.base_url}/api/auth/register", json=user_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get('token')
                self.test_user_id = data.get('user', {}).get('id')
                self.log_test("Authentication Setup - User 1", True, f"Test user 1 registered: {user_data['username']}")
            else:
                self.log_test("Authentication Setup - User 1", False, 
                            f"Failed to register test user 1: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Authentication Setup - User 1", False, f"Error: {str(e)}")
            return False
        
        # Register test user 2 for blocking tests
        try:
            unique_id2 = str(uuid.uuid4())[:8]
            user_data2 = {
                "username": f"testuser2{unique_id2}",
                "email": f"testuser2{unique_id2}@example.com",
                "password": "TestPassword123!",
                "country": "Turkey",
                "languages": ["Turkish", "English"]
            }
            
            response = requests.post(f"{self.base_url}/api/auth/register", json=user_data2, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.test_user2_id = data.get('user', {}).get('id')
                self.log_test("Authentication Setup - User 2", True, f"Test user 2 registered: {user_data2['username']}")
            else:
                self.log_test("Authentication Setup - User 2", False, 
                            f"Failed to register test user 2: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Authentication Setup - User 2", False, f"Error: {str(e)}")
            return False
        
        # Create a test listing for report tests
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            listing_data = {
                "from_currency": "USD",
                "from_amount": 1000,
                "to_currency": "TRY",
                "to_amount": 41000,
                "country": "Turkey",
                "city": "Istanbul",
                "description": "Test listing for report functionality"
            }
            
            response = requests.post(f"{self.base_url}/api/listings", json=listing_data, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.test_listing_id = data.get('id')
                self.log_test("Authentication Setup - Test Listing", True, "Test listing created for reports")
            else:
                self.log_test("Authentication Setup - Test Listing", False, 
                            f"Failed to create test listing: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Authentication Setup - Test Listing", False, f"Error: {str(e)}")
        
        return True
    
    def test_report_listing_endpoints(self):
        """Test Report Listing functionality"""
        print("\n📋 Testing Report Listing Endpoints...")
        
        if not self.auth_token or not self.test_listing_id:
            self.log_test("Report Listing - Prerequisites", False, "Missing auth token or test listing")
            return
        
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        # Test 1: Submit a report
        try:
            report_data = {
                "listing_id": self.test_listing_id,
                "reason": "spam",
                "description": "This is a test report for spam content"
            }
            
            response = requests.post(f"{self.base_url}/api/reports", json=report_data, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ['id', 'listing_id', 'reporter_id', 'reason', 'status']
                missing_fields = [f for f in required_fields if f not in data]
                
                if not missing_fields:
                    self.log_test("Report Listing - Submit Report", True, "Report submitted successfully with all fields")
                else:
                    self.log_test("Report Listing - Submit Report", False, f"Missing fields: {missing_fields}", data)
            else:
                self.log_test("Report Listing - Submit Report", False, 
                            f"Expected 200, got {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Report Listing - Submit Report", False, f"Error: {str(e)}")
        
        # Test 2: Duplicate report prevention
        try:
            response = requests.post(f"{self.base_url}/api/reports", json=report_data, headers=headers, timeout=10)
            
            if response.status_code == 400:
                data = response.json()
                if "already reported" in data.get('detail', '').lower():
                    self.log_test("Report Listing - Duplicate Prevention", True, "Duplicate report correctly prevented")
                else:
                    self.log_test("Report Listing - Duplicate Prevention", False, 
                                f"Wrong error message: {data.get('detail')}")
            else:
                self.log_test("Report Listing - Duplicate Prevention", False, 
                            f"Expected 400, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Report Listing - Duplicate Prevention", False, f"Error: {str(e)}")
        
        # Test 3: Invalid listing ID
        try:
            invalid_report = {
                "listing_id": "invalid-listing-id",
                "reason": "inappropriate",
                "description": "Test with invalid listing"
            }
            
            response = requests.post(f"{self.base_url}/api/reports", json=invalid_report, headers=headers, timeout=10)
            
            # Should still create report (listing validation might not be enforced)
            if response.status_code in [200, 400, 404]:
                self.log_test("Report Listing - Invalid Listing", True, "Invalid listing handled appropriately")
            else:
                self.log_test("Report Listing - Invalid Listing", False, 
                            f"Unexpected status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Report Listing - Invalid Listing", False, f"Error: {str(e)}")
        
        # Test 4: Get reports (should fail for non-admin)
        try:
            response = requests.get(f"{self.base_url}/api/reports", headers=headers, timeout=10)
            
            if response.status_code == 403:
                data = response.json()
                if "admin" in data.get('detail', '').lower():
                    self.log_test("Report Listing - Admin Only Access", True, "Non-admin correctly denied access")
                else:
                    self.log_test("Report Listing - Admin Only Access", False, 
                                f"Wrong error message: {data.get('detail')}")
            else:
                self.log_test("Report Listing - Admin Only Access", False, 
                            f"Expected 403, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Report Listing - Admin Only Access", False, f"Error: {str(e)}")
        
        # Test 5: Test different report reasons
        reasons = ["inappropriate", "scam", "duplicate", "other"]
        for reason in reasons:
            try:
                # Create new listing for each reason test
                listing_data = {
                    "from_currency": "EUR",
                    "from_amount": 500,
                    "to_currency": "USD",
                    "country": "Turkey",
                    "city": "Ankara",
                    "description": f"Test listing for {reason} report"
                }
                
                listing_response = requests.post(f"{self.base_url}/api/listings", json=listing_data, headers=headers, timeout=10)
                if listing_response.status_code == 200:
                    new_listing_id = listing_response.json().get('id')
                    
                    report_data = {
                        "listing_id": new_listing_id,
                        "reason": reason,
                        "description": f"Test report with reason: {reason}"
                    }
                    
                    response = requests.post(f"{self.base_url}/api/reports", json=report_data, headers=headers, timeout=10)
                    
                    if response.status_code == 200:
                        self.log_test(f"Report Listing - Reason '{reason}'", True, f"Report with reason '{reason}' accepted")
                    else:
                        self.log_test(f"Report Listing - Reason '{reason}'", False, 
                                    f"Failed to submit report with reason '{reason}': {response.status_code}")
                        
            except Exception as e:
                self.log_test(f"Report Listing - Reason '{reason}'", False, f"Error: {str(e)}")
    
    def test_block_unblock_user_endpoints(self):
        """Test Block/Unblock User functionality"""
        print("\n🚫 Testing Block/Unblock User Endpoints...")
        
        if not self.auth_token or not self.test_user2_id:
            self.log_test("Block User - Prerequisites", False, "Missing auth token or test user 2")
            return
        
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        # Test 1: Block a user
        try:
            response = requests.post(f"{self.base_url}/api/users/block/{self.test_user2_id}", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "blocked successfully" in data.get('message', '').lower():
                    self.log_test("Block User - Block User", True, "User blocked successfully")
                else:
                    self.log_test("Block User - Block User", False, f"Unexpected message: {data.get('message')}")
            else:
                self.log_test("Block User - Block User", False, 
                            f"Expected 200, got {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Block User - Block User", False, f"Error: {str(e)}")
        
        # Test 2: Try to block same user again (should fail)
        try:
            response = requests.post(f"{self.base_url}/api/users/block/{self.test_user2_id}", headers=headers, timeout=10)
            
            if response.status_code == 400:
                data = response.json()
                if "already blocked" in data.get('detail', '').lower():
                    self.log_test("Block User - Duplicate Block", True, "Duplicate block correctly prevented")
                else:
                    self.log_test("Block User - Duplicate Block", False, 
                                f"Wrong error message: {data.get('detail')}")
            else:
                self.log_test("Block User - Duplicate Block", False, 
                            f"Expected 400, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Block User - Duplicate Block", False, f"Error: {str(e)}")
        
        # Test 3: Try to block self (should fail)
        try:
            response = requests.post(f"{self.base_url}/api/users/block/{self.test_user_id}", headers=headers, timeout=10)
            
            if response.status_code == 400:
                data = response.json()
                if "cannot block yourself" in data.get('detail', '').lower():
                    self.log_test("Block User - Self Block Prevention", True, "Self-blocking correctly prevented")
                else:
                    self.log_test("Block User - Self Block Prevention", False, 
                                f"Wrong error message: {data.get('detail')}")
            else:
                self.log_test("Block User - Self Block Prevention", False, 
                            f"Expected 400, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Block User - Self Block Prevention", False, f"Error: {str(e)}")
        
        # Test 4: Get blocked users list
        try:
            response = requests.get(f"{self.base_url}/api/users/blocked", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                blocked_users = data.get('blocked_users', [])
                
                if isinstance(blocked_users, list) and len(blocked_users) > 0:
                    # Check if our blocked user is in the list
                    blocked_ids = [user.get('id') for user in blocked_users]
                    if self.test_user2_id in blocked_ids:
                        self.log_test("Block User - Get Blocked List", True, f"Blocked users list contains {len(blocked_users)} users")
                    else:
                        self.log_test("Block User - Get Blocked List", False, "Blocked user not found in list")
                else:
                    self.log_test("Block User - Get Blocked List", False, "Blocked users list is empty or invalid")
            else:
                self.log_test("Block User - Get Blocked List", False, 
                            f"Expected 200, got {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Block User - Get Blocked List", False, f"Error: {str(e)}")
        
        # Test 5: Unblock user
        try:
            response = requests.delete(f"{self.base_url}/api/users/unblock/{self.test_user2_id}", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "unblocked successfully" in data.get('message', '').lower():
                    self.log_test("Block User - Unblock User", True, "User unblocked successfully")
                else:
                    self.log_test("Block User - Unblock User", False, f"Unexpected message: {data.get('message')}")
            else:
                self.log_test("Block User - Unblock User", False, 
                            f"Expected 200, got {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Block User - Unblock User", False, f"Error: {str(e)}")
        
        # Test 6: Try to unblock user that's not blocked (should fail)
        try:
            response = requests.delete(f"{self.base_url}/api/users/unblock/{self.test_user2_id}", headers=headers, timeout=10)
            
            if response.status_code == 400:
                data = response.json()
                if "not blocked" in data.get('detail', '').lower():
                    self.log_test("Block User - Unblock Non-blocked", True, "Unblocking non-blocked user correctly prevented")
                else:
                    self.log_test("Block User - Unblock Non-blocked", False, 
                                f"Wrong error message: {data.get('detail')}")
            else:
                self.log_test("Block User - Unblock Non-blocked", False, 
                            f"Expected 400, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Block User - Unblock Non-blocked", False, f"Error: {str(e)}")
        
        # Test 7: Try to block non-existent user
        try:
            fake_user_id = str(uuid.uuid4())
            response = requests.post(f"{self.base_url}/api/users/block/{fake_user_id}", headers=headers, timeout=10)
            
            if response.status_code == 404:
                data = response.json()
                if "not found" in data.get('detail', '').lower():
                    self.log_test("Block User - Non-existent User", True, "Non-existent user correctly handled")
                else:
                    self.log_test("Block User - Non-existent User", False, 
                                f"Wrong error message: {data.get('detail')}")
            else:
                self.log_test("Block User - Non-existent User", False, 
                            f"Expected 404, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Block User - Non-existent User", False, f"Error: {str(e)}")
    
    def test_exchange_rate_changes_endpoint(self):
        """Test Exchange Rate Changes functionality"""
        print("\n📈 Testing Exchange Rate Changes Endpoint...")
        
        # Test 1: Default currencies (TRY,EUR,GBP,JPY)
        try:
            response = requests.get(f"{self.base_url}/api/exchange-rates/changes", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ['base', 'changes', 'last_updated']
                missing_fields = [f for f in required_fields if f not in data]
                
                if not missing_fields:
                    self.log_test("Exchange Rate Changes - Default Request", True, "All required fields present")
                else:
                    self.log_test("Exchange Rate Changes - Default Request", False, 
                                f"Missing fields: {missing_fields}", data)
                
                # Check base currency
                if data.get('base') == 'USD':
                    self.log_test("Exchange Rate Changes - Base Currency", True, "Base currency is USD")
                else:
                    self.log_test("Exchange Rate Changes - Base Currency", False, 
                                f"Expected USD, got {data.get('base')}")
                
                # Check changes structure
                changes = data.get('changes', {})
                if isinstance(changes, dict):
                    self.log_test("Exchange Rate Changes - Changes Structure", True, 
                                f"Changes object contains {len(changes)} currencies")
                    
                    # Check individual currency data
                    for currency, change_data in changes.items():
                        required_change_fields = ['current_rate', 'change_percentage', 'trend']
                        missing_change_fields = [f for f in required_change_fields if f not in change_data]
                        
                        if not missing_change_fields:
                            self.log_test(f"Exchange Rate Changes - {currency} Structure", True, 
                                        f"{currency} has all required fields")
                        else:
                            self.log_test(f"Exchange Rate Changes - {currency} Structure", False, 
                                        f"{currency} missing fields: {missing_change_fields}")
                        
                        # Check trend values
                        trend = change_data.get('trend')
                        if trend in ['up', 'down', 'stable']:
                            self.log_test(f"Exchange Rate Changes - {currency} Trend", True, 
                                        f"{currency} trend is valid: {trend}")
                        else:
                            self.log_test(f"Exchange Rate Changes - {currency} Trend", False, 
                                        f"{currency} invalid trend: {trend}")
                else:
                    self.log_test("Exchange Rate Changes - Changes Structure", False, "Changes is not a dict")
                    
            else:
                self.log_test("Exchange Rate Changes - Default Request", False, 
                            f"Expected 200, got {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Exchange Rate Changes - Default Request", False, f"Error: {str(e)}")
        
        # Test 2: Custom currencies
        try:
            params = {"currencies": "EUR,GBP"}
            response = requests.get(f"{self.base_url}/api/exchange-rates/changes", params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                changes = data.get('changes', {})
                
                expected_currencies = ['EUR', 'GBP']
                found_currencies = list(changes.keys())
                
                if all(currency in found_currencies for currency in expected_currencies):
                    self.log_test("Exchange Rate Changes - Custom Currencies", True, 
                                f"Custom currencies present: {found_currencies}")
                else:
                    self.log_test("Exchange Rate Changes - Custom Currencies", False, 
                                f"Expected {expected_currencies}, got {found_currencies}")
            else:
                self.log_test("Exchange Rate Changes - Custom Currencies", False, 
                            f"Expected 200, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Exchange Rate Changes - Custom Currencies", False, f"Error: {str(e)}")
        
        # Test 3: Single currency
        try:
            params = {"currencies": "TRY"}
            response = requests.get(f"{self.base_url}/api/exchange-rates/changes", params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                changes = data.get('changes', {})
                
                if 'TRY' in changes and len(changes) == 1:
                    self.log_test("Exchange Rate Changes - Single Currency", True, "Single currency TRY returned")
                else:
                    self.log_test("Exchange Rate Changes - Single Currency", False, 
                                f"Expected only TRY, got {list(changes.keys())}")
            else:
                self.log_test("Exchange Rate Changes - Single Currency", False, 
                            f"Expected 200, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Exchange Rate Changes - Single Currency", False, f"Error: {str(e)}")
        
        # Test 4: Invalid currency
        try:
            params = {"currencies": "XYZ"}
            response = requests.get(f"{self.base_url}/api/exchange-rates/changes", params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                changes = data.get('changes', {})
                
                # Should return empty changes or handle gracefully
                self.log_test("Exchange Rate Changes - Invalid Currency", True, 
                            f"Invalid currency handled gracefully: {len(changes)} currencies returned")
            else:
                self.log_test("Exchange Rate Changes - Invalid Currency", False, 
                            f"Unexpected status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Exchange Rate Changes - Invalid Currency", False, f"Error: {str(e)}")
        
        # Test 5: Response time
        try:
            start_time = time.time()
            response = requests.get(f"{self.base_url}/api/exchange-rates/changes", timeout=10)
            response_time = time.time() - start_time
            
            if response_time < 3.0:
                self.log_test("Exchange Rate Changes - Response Time", True, 
                            f"Response time: {response_time:.2f}s")
            else:
                self.log_test("Exchange Rate Changes - Response Time", False, 
                            f"Response time too slow: {response_time:.2f}s")
                
        except Exception as e:
            self.log_test("Exchange Rate Changes - Response Time", False, f"Error: {str(e)}")
    
    def test_achievement_system(self):
        """Test Achievement System functionality"""
        print("\n🏆 Testing Achievement System...")
        
        if not self.test_user_id:
            self.log_test("Achievement System - Prerequisites", False, "Missing test user ID")
            return
        
        # Test 1: Get achievements for user
        try:
            response = requests.get(f"{self.base_url}/api/achievements/{self.test_user_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ['user_id', 'username', 'achievements', 'total_unlocked']
                missing_fields = [f for f in required_fields if f not in data]
                
                if not missing_fields:
                    self.log_test("Achievement System - Get Achievements", True, "All required fields present")
                else:
                    self.log_test("Achievement System - Get Achievements", False, 
                                f"Missing fields: {missing_fields}", data)
                
                # Check achievements structure
                achievements = data.get('achievements', [])
                if isinstance(achievements, list) and len(achievements) > 0:
                    self.log_test("Achievement System - Achievements List", True, 
                                f"Found {len(achievements)} achievements")
                    
                    # Check for all 6 expected achievements
                    expected_achievements = [
                        'first_listing', 'ten_listings', 'popular_seller', 
                        'chat_master', 'giveaway_creator', 'exchange_expert'
                    ]
                    
                    achievement_ids = [ach.get('id') for ach in achievements]
                    missing_achievements = [ach for ach in expected_achievements if ach not in achievement_ids]
                    
                    if not missing_achievements:
                        self.log_test("Achievement System - All 6 Achievements", True, "All 6 achievements present")
                    else:
                        self.log_test("Achievement System - All 6 Achievements", False, 
                                    f"Missing achievements: {missing_achievements}")
                    
                    # Check achievement structure
                    for achievement in achievements:
                        required_ach_fields = ['id', 'name', 'description', 'icon', 'unlocked']
                        missing_ach_fields = [f for f in required_ach_fields if f not in achievement]
                        
                        if not missing_ach_fields:
                            self.log_test(f"Achievement System - {achievement.get('id')} Structure", True, 
                                        f"{achievement.get('name')} has all required fields")
                        else:
                            self.log_test(f"Achievement System - {achievement.get('id')} Structure", False, 
                                        f"{achievement.get('name')} missing fields: {missing_ach_fields}")
                        
                        # Check unlocked field type
                        unlocked = achievement.get('unlocked')
                        if isinstance(unlocked, bool):
                            self.log_test(f"Achievement System - {achievement.get('id')} Unlocked Type", True, 
                                        f"{achievement.get('name')} unlocked is boolean: {unlocked}")
                        else:
                            self.log_test(f"Achievement System - {achievement.get('id')} Unlocked Type", False, 
                                        f"{achievement.get('name')} unlocked is not boolean: {type(unlocked)}")
                    
                    # Check if first_listing is unlocked (user created a listing during setup)
                    first_listing_ach = next((ach for ach in achievements if ach.get('id') == 'first_listing'), None)
                    if first_listing_ach and first_listing_ach.get('unlocked'):
                        self.log_test("Achievement System - First Listing Auto-Award", True, 
                                    "First listing achievement automatically awarded")
                    else:
                        self.log_test("Achievement System - First Listing Auto-Award", False, 
                                    "First listing achievement not automatically awarded")
                    
                else:
                    self.log_test("Achievement System - Achievements List", False, "Achievements list is empty or invalid")
                
                # Check total_unlocked count
                total_unlocked = data.get('total_unlocked', 0)
                unlocked_count = len([ach for ach in achievements if ach.get('unlocked')])
                
                if total_unlocked == unlocked_count:
                    self.log_test("Achievement System - Total Count", True, 
                                f"Total unlocked count matches: {total_unlocked}")
                else:
                    self.log_test("Achievement System - Total Count", False, 
                                f"Total unlocked mismatch: reported {total_unlocked}, actual {unlocked_count}")
                    
            else:
                self.log_test("Achievement System - Get Achievements", False, 
                            f"Expected 200, got {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Achievement System - Get Achievements", False, f"Error: {str(e)}")
        
        # Test 2: Get achievements for non-existent user
        try:
            fake_user_id = str(uuid.uuid4())
            response = requests.get(f"{self.base_url}/api/achievements/{fake_user_id}", timeout=10)
            
            if response.status_code == 404:
                data = response.json()
                if "not found" in data.get('detail', '').lower():
                    self.log_test("Achievement System - Non-existent User", True, "Non-existent user correctly handled")
                else:
                    self.log_test("Achievement System - Non-existent User", False, 
                                f"Wrong error message: {data.get('detail')}")
            else:
                self.log_test("Achievement System - Non-existent User", False, 
                            f"Expected 404, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Achievement System - Non-existent User", False, f"Error: {str(e)}")
        
        # Test 3: Test achievement auto-awarding by creating another listing
        if self.auth_token:
            try:
                headers = {"Authorization": f"Bearer {self.auth_token}"}
                listing_data = {
                    "from_currency": "GBP",
                    "from_amount": 200,
                    "to_currency": "TRY",
                    "country": "Turkey",
                    "city": "Izmir",
                    "description": "Test listing for achievement auto-award"
                }
                
                # Create another listing
                response = requests.post(f"{self.base_url}/api/listings", json=listing_data, headers=headers, timeout=10)
                
                if response.status_code == 200:
                    # Wait a moment for achievement processing
                    time.sleep(2)
                    
                    # Check achievements again
                    ach_response = requests.get(f"{self.base_url}/api/achievements/{self.test_user_id}", timeout=10)
                    
                    if ach_response.status_code == 200:
                        ach_data = ach_response.json()
                        achievements = ach_data.get('achievements', [])
                        first_listing_ach = next((ach for ach in achievements if ach.get('id') == 'first_listing'), None)
                        
                        if first_listing_ach and first_listing_ach.get('unlocked'):
                            self.log_test("Achievement System - Auto-Award Verification", True, 
                                        "Achievement auto-awarding working correctly")
                        else:
                            self.log_test("Achievement System - Auto-Award Verification", False, 
                                        "Achievement auto-awarding not working")
                    else:
                        self.log_test("Achievement System - Auto-Award Verification", False, 
                                    "Failed to verify achievement auto-awarding")
                else:
                    self.log_test("Achievement System - Auto-Award Test Setup", False, 
                                "Failed to create test listing for auto-award test")
                    
            except Exception as e:
                self.log_test("Achievement System - Auto-Award Test", False, f"Error: {str(e)}")
        
        # Test 4: Response time
        try:
            start_time = time.time()
            response = requests.get(f"{self.base_url}/api/achievements/{self.test_user_id}", timeout=10)
            response_time = time.time() - start_time
            
            if response_time < 2.0:
                self.log_test("Achievement System - Response Time", True, 
                            f"Response time: {response_time:.2f}s")
            else:
                self.log_test("Achievement System - Response Time", False, 
                            f"Response time too slow: {response_time:.2f}s")
                
        except Exception as e:
            self.log_test("Achievement System - Response Time", False, f"Error: {str(e)}")
    
    def run_all_tests(self):
        """Run all KAIS2.1 new feature tests"""
        print("🚀 Starting KAIS2.1 New Features Backend Tests")
        print(f"Backend URL: {self.base_url}")
        print("=" * 70)
        
        # Setup authentication first
        if not self.setup_authentication():
            print("❌ Authentication setup failed. Cannot proceed with tests.")
            return False
        
        # Run tests for all 4 new features
        self.test_report_listing_endpoints()
        self.test_block_unblock_user_endpoints()
        self.test_exchange_rate_changes_endpoint()
        self.test_achievement_system()
        
        # Summary
        print("\n" + "=" * 70)
        print("📊 TEST SUMMARY")
        print("=" * 70)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t['success']])
        failed_tests = len(self.failed_tests)
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        # Group failed tests by feature
        if self.failed_tests:
            print("\n❌ FAILED TESTS BY FEATURE:")
            
            features = {
                "Authentication": [],
                "Report Listing": [],
                "Block User": [],
                "Exchange Rate Changes": [],
                "Achievement System": [],
                "Other": []
            }
            
            for test in self.failed_tests:
                test_name = test['test']
                if "Authentication" in test_name:
                    features["Authentication"].append(test)
                elif "Report Listing" in test_name:
                    features["Report Listing"].append(test)
                elif "Block User" in test_name:
                    features["Block User"].append(test)
                elif "Exchange Rate Changes" in test_name:
                    features["Exchange Rate Changes"].append(test)
                elif "Achievement System" in test_name:
                    features["Achievement System"].append(test)
                else:
                    features["Other"].append(test)
            
            for feature, tests in features.items():
                if tests:
                    print(f"\n  {feature}:")
                    for test in tests:
                        print(f"    - {test['test']}: {test['message']}")
        
        # Feature-specific summary
        print("\n📋 FEATURE SUMMARY:")
        feature_results = {
            "Report Listing": 0,
            "Block User": 0, 
            "Exchange Rate Changes": 0,
            "Achievement System": 0
        }
        
        for test in self.test_results:
            test_name = test['test']
            if "Report Listing" in test_name and test['success']:
                feature_results["Report Listing"] += 1
            elif "Block User" in test_name and test['success']:
                feature_results["Block User"] += 1
            elif "Exchange Rate Changes" in test_name and test['success']:
                feature_results["Exchange Rate Changes"] += 1
            elif "Achievement System" in test_name and test['success']:
                feature_results["Achievement System"] += 1
        
        for feature, passed_count in feature_results.items():
            total_feature_tests = len([t for t in self.test_results if feature in t['test']])
            if total_feature_tests > 0:
                success_rate = (passed_count / total_feature_tests) * 100
                status = "✅" if success_rate >= 80 else "⚠️" if success_rate >= 60 else "❌"
                print(f"  {status} {feature}: {passed_count}/{total_feature_tests} ({success_rate:.1f}%)")
        
        return failed_tests == 0

if __name__ == "__main__":
    tester = ExchangeRateTests()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 All tests passed!")
        sys.exit(0)
    else:
        print("\n💥 Some tests failed!")
        sys.exit(1)