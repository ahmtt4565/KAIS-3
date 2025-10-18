import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Star, MapPin, DollarSign, MessageSquare, ArrowLeft, Instagram, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Star, MapPin, Globe, DollarSign, Plus, Moon, Sun, MessageSquare, Headphones, LogOut, Copy } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "../contexts/ThemeContext";
import BottomNav from "@/components/BottomNav";
import KaisLogo from "@/components/KaisLogo";

export default function Profile({ user, logout, unreadCount = 0 }) {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDarkMode, toggleTheme } = useTheme();
  const [profileUser, setProfileUser] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [userListings, setUserListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [ratingForm, setRatingForm] = useState({
    rating: 5,
    comment: "",
    listing_id: ""
  });
  const [locationSharing, setLocationSharing] = useState(false);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 2MB",
        variant: "destructive"
      });
      return;
    }

    setUploadingPhoto(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API}/user/upload-profile-photo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      setProfileUser({
        ...profileUser,
        profile_photo: response.data.profile_photo
      });

      toast({
        title: "Success!",
        description: "Profile photo updated successfully"
      });
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast({
        title: "Error",
        description: "Failed to upload photo",
        variant: "destructive"
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePhotoDelete = async () => {
    if (!window.confirm("Are you sure you want to remove your profile photo?")) {
      return;
    }

    setUploadingPhoto(true);

    try {
      await axios.delete(`${API}/user/delete-profile-photo`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      setProfileUser({
        ...profileUser,
        profile_photo: null
      });

      toast({
        title: "Success!",
        description: "Profile photo removed successfully"
      });
    } catch (error) {
      console.error("Error deleting photo:", error);
      toast({
        title: "Error",
        description: "Failed to delete photo",
        variant: "destructive"
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [userId]);

  const fetchProfileData = async () => {
    try {
      // For now, using current user data. In production, would fetch specific user by ID
      const [ratingsRes, listingsRes] = await Promise.all([
        axios.get(`${API}/ratings/${userId}`),
        axios.get(`${API}/listings`)
      ]);

      setRatings(ratingsRes.data);
      // Filter listings by user
      setUserListings(listingsRes.data.filter(l => l.user_id === userId));
      
      // Set profile user (in real app, would fetch from user endpoint)
      if (userId === user.id) {
        setProfileUser(user);
        // Set location sharing status from user data
        setLocationSharing(user.location_sharing_enabled || false);
      } else {
        // Mock other user data
        setProfileUser({
          id: userId,
          username: "User",
          country: "UAE",
          languages: ["English"],
          rating: ratingsRes.data.length > 0
            ? ratingsRes.data.reduce((acc, r) => acc + r.rating, 0) / ratingsRes.data.length
            : 0,
          total_ratings: ratingsRes.data.length
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSharingToggle = async (enabled) => {
    if (updatingLocation) return;
    
    setUpdatingLocation(true);
    try {
      if (enabled) {
        // Request location permission
        if (!navigator.geolocation) {
          toast({
            title: "Error",
            description: "Your browser doesn't support location sharing.",
            variant: "destructive",
          });
          setUpdatingLocation(false);
          return;
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const token = localStorage.getItem('token');
              await axios.put(`${API}/user/location-sharing`, {
                location_sharing_enabled: true,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              }, {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              });

              setLocationSharing(true);
              toast({
                title: "Success",
                description: "Location sharing enabled. People you chat with can now see your location.",
              });
            } catch (error) {
              console.error("Error enabling location sharing:", error);
              toast({
                title: "Error",
                description: "Could not enable location sharing.",
                variant: "destructive",
              });
            } finally {
              setUpdatingLocation(false);
            }
          },
          (error) => {
            console.error("Error getting location:", error);
            toast({
              title: "Location permission required",
              description: "You must grant location permission from your browser for location sharing.",
              variant: "destructive",
            });
            setUpdatingLocation(false);
          }
        );
      } else {
        // Disable location sharing
        const token = localStorage.getItem('token');
        await axios.put(`${API}/user/location-sharing`, {
          location_sharing_enabled: false
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        setLocationSharing(false);
        toast({
          title: "Success",
          description: "Location sharing disabled.",
        });
        setUpdatingLocation(false);
      }
    } catch (error) {
      console.error("Error updating location sharing:", error);
      toast({
        title: "Error",
        description: "Could not update setting.",
        variant: "destructive",
      });
      setUpdatingLocation(false);
    }
  };

  const handleSubmitRating = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/ratings`, {
        rated_user_id: userId,
        ...ratingForm
      });
      setShowRatingDialog(false);
      setRatingForm({ rating: 5, comment: "", listing_id: "" });
      toast({
        title: "Rating successful",
        description: "Your rating has been saved.",
      });
      fetchProfileData();
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast({
        title: "Error",
        description: "Could not submit rating.",
        variant: "destructive",
      });
    }
  };

  const handleEditListing = (listing) => {
    setEditingListing(listing);
    setShowEditDialog(true);
  };

  const handleUpdateListing = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/listings/${editingListing.id}`, editingListing);
      setShowEditDialog(false);
      setEditingListing(null);
      toast({
        title: "Success",
        description: "Listing updated.",
      });
      fetchProfileData();
    } catch (error) {
      console.error("Error updating listing:", error);
      toast({
        title: "Error",
        description: "Could not update listing.",
        variant: "destructive",
      });
    }
  };

  const handleCloseListing = async (listingId) => {
    if (window.confirm("Are you sure you want to close this listing?")) {
      try {
        await axios.delete(`${API}/listings/${listingId}`);
        toast({
          title: "Success",
          description: "Listing closed.",
        });
        fetchProfileData();
      } catch (error) {
        console.error("Error closing listing:", error);
        toast({
          title: "Error",
          description: "Could not close listing.",
          variant: "destructive",
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-orange-50 flex items-center justify-center">
        <p className="text-xl text-gray-600">Loading profile...</p>
      </div>
    );
  }

  const isOwnProfile = userId === user.id;

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-purple-900 dark:via-gray-900 dark:to-blue-900 pb-20 md:pb-8">
      {/* Header */}
      <header className="bg-white dark:bg-gradient-to-r dark:from-purple-900/90 dark:via-gray-900/90 dark:to-blue-900/90 backdrop-blur-md border-b border-gray-200 dark:border-purple-500/30 sticky top-0 z-50 dark:shadow-lg dark:shadow-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} data-testid="back-to-dashboard-btn">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div 
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity select-none"
                onClick={() => navigate('/dashboard')}
                style={{ cursor: 'pointer' }}
              >
                <KaisLogo className="h-14 w-auto" />
              </div>
              <span className="text-lg font-semibold text-gray-700 dark:text-transparent dark:bg-gradient-to-r dark:from-cyan-400 dark:to-purple-400 dark:bg-clip-text hidden md:block">Profil</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/about')}
              >
                About
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/listings')}
              >
                Listings
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => navigate('/chat')}
              >
                <MessageSquare className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/support')}
                title="Support"
              >
                <Headphones className="w-5 h-5" />
              </Button>

              {isOwnProfile && (
                <Button
                  variant="outline"
                  onClick={logout}
                  className="text-red-600 dark:text-pink-400 border-red-600 dark:border-pink-500 hover:bg-red-50 dark:hover:bg-pink-900/20"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="md:col-span-1">
            <Card className="border-2 border-teal-100 dark:border-gray-700 dark:bg-gray-800">
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  {/* Avatar with Upload/Delete - Only for own profile */}
                  <div className="relative w-24 h-24 mx-auto mb-4">
                    {profileUser?.profile_photo ? (
                      <img 
                        src={`${API}${profileUser.profile_photo}`}
                        alt={profileUser?.username}
                        className="w-24 h-24 rounded-full object-cover border-4 border-teal-500"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-gradient-to-br from-teal-500 to-orange-400 rounded-full flex items-center justify-center">
                        <span className="text-4xl font-bold text-white">
                          {profileUser?.username?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    
                    {/* Buttons - only for own profile */}
                    {userId === user?.id && (
                      <>
                        {/* Upload button */}
                        <label 
                          htmlFor="photo-upload"
                          className="absolute bottom-0 right-0 bg-teal-500 hover:bg-teal-600 text-white rounded-full p-2 cursor-pointer shadow-lg transform hover:scale-110 transition-all"
                          title="Upload photo"
                        >
                          {uploadingPhoto ? (
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                        </label>
                        
                        {/* Delete button - only show if photo exists */}
                        {profileUser?.profile_photo && (
                          <button
                            onClick={handlePhotoDelete}
                            className="absolute top-0 right-0 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transform hover:scale-110 transition-all"
                            title="Remove photo"
                            disabled={uploadingPhoto}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}
                    
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      disabled={uploadingPhoto}
                    />
                  </div>
                  <h2 className="text-2xl font-bold mb-2 dark:text-white">{profileUser?.username}</h2>
                  
                  {/* Üye Numarası with Copy Button */}
                  {profileUser?.member_number && (
                    <div className="mb-3 flex items-center justify-center gap-2">
                      <Badge variant="outline" className="bg-teal-50 dark:bg-teal-900/30 border-teal-300 dark:border-teal-600 text-teal-700 dark:text-teal-400 font-mono text-base px-3 py-1">
                        {profileUser.member_number}
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 hover:bg-teal-100 dark:hover:bg-teal-900/30"
                        onClick={() => {
                          navigator.clipboard.writeText(profileUser.member_number);
                          // Optional: Show a toast notification
                          alert('Üye numarası kopyalandı!');
                        }}
                        title="Üye numarasını kopyala"
                      >
                        <Copy className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      </Button>
                    </div>
                  )}
                  
                  {/* Rating */}
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${
                            star <= Math.round(profileUser?.rating || 0)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      ({profileUser?.total_ratings || 0} reviews)
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="w-5 h-5 text-teal-600" />
                    <span>{profileUser?.country}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Globe className="w-5 h-5 text-teal-600" />
                    <span>{profileUser?.languages?.join(', ') || 'Not specified'}</span>
                  </div>
                </div>

                {/* Theme Settings - Only for own profile */}
                {isOwnProfile && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Ayarlar</h3>
                    
                    {/* Dark Mode Toggle */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {isDarkMode ? (
                          <Moon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                        ) : (
                          <Sun className="w-5 h-5 text-orange-500" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Dark Mode</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Reduces eye strain</p>
                        </div>
                      </div>
                      <Switch 
                        checked={isDarkMode} 
                        onCheckedChange={toggleTheme}
                        className="data-[state=checked]:bg-teal-600"
                      />
                    </div>

                    {/* Location Sharing Toggle */}
                    <div className="space-y-3 p-4 bg-gradient-to-r from-teal-50 to-orange-50 dark:from-teal-900/20 dark:to-orange-900/20 rounded-lg border border-teal-200 dark:border-teal-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-teal-500 rounded-lg">
                            <MapPin className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">Location Sharing</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Share your location with chat partners</p>
                          </div>
                        </div>
                        <Switch 
                          checked={locationSharing} 
                          onCheckedChange={handleLocationSharingToggle}
                          disabled={updatingLocation}
                          className="data-[state=checked]:bg-teal-600"
                        />
                      </div>
                      
                      {/* Info box */}
                      <div className="flex items-start gap-2 pt-2 border-t border-teal-200 dark:border-teal-800">
                        <div className="mt-0.5">
                          <svg className="w-4 h-4 text-teal-600 dark:text-teal-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                            <strong>How it works:</strong> Share your location with people you chat with about currency exchanges. 
                            When both users enable location sharing, click the location button in the chat to see each other on a map and find the best meeting point. 
                            Your location is private and only shown to users you're actively messaging.
                          </p>
                        </div>
                      </div>
                      
                      {locationSharing && (
                        <div className="flex items-center gap-2 pt-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <p className="text-xs text-green-700 dark:text-green-400 font-medium">
                            ✓ Location sharing is active
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Logout Button for Mobile - Only on own profile */}
                {isOwnProfile && (
                  <div className="md:hidden mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      variant="outline"
                      onClick={logout}
                      className="w-full text-red-600 dark:text-pink-400 border-red-600 dark:border-pink-500 hover:bg-red-50 dark:hover:bg-pink-900/20"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                )}

                {!isOwnProfile && (
                  <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
                    <DialogTrigger asChild>
                      <Button className="w-full mt-6 bg-teal-600 hover:bg-teal-700" data-testid="rate-user-btn">
                        Rate This User
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Rate {profileUser?.username}</DialogTitle>
                        <DialogDescription>Share your experience with this user</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleSubmitRating} className="space-y-4">
                        <div>
                          <Label>Rating</Label>
                          <div className="flex gap-2 mt-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setRatingForm({...ratingForm, rating: star})}
                                data-testid={`star-rating-${star}`}
                              >
                                <Star
                                  className={`w-8 h-8 cursor-pointer ${
                                    star <= ratingForm.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="listing_id">Related Listing ID (optional)</Label>
                          <input
                            id="listing_id"
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            value={ratingForm.listing_id}
                            onChange={(e) => setRatingForm({...ratingForm, listing_id: e.target.value})}
                            data-testid="listing-id-input"
                          />
                        </div>
                        <div>
                          <Label htmlFor="comment">Comment (optional)</Label>
                          <Textarea
                            id="comment"
                            rows={3}
                            value={ratingForm.comment}
                            onChange={(e) => setRatingForm({...ratingForm, comment: e.target.value})}
                            data-testid="rating-comment-input"
                          />
                        </div>
                        <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" data-testid="submit-rating-btn">
                          Submit Rating
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}

                {/* Edit Listing Dialog */}
                <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>İlanı Edit</DialogTitle>
                      <DialogDescription>İlan bilgilerini güncelleyin</DialogDescription>
                    </DialogHeader>
                    {editingListing && (
                      <form onSubmit={handleUpdateListing} className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <Label>Miktar</Label>
                            <Input
                              type="number"
                              value={editingListing.from_amount}
                              onChange={(e) => setEditingListing({...editingListing, from_amount: parseFloat(e.target.value)})}
                              required
                            />
                          </div>
                          <div>
                            <Label>Karşılık Miktar (Opsiyonel)</Label>
                            <Input
                              type="number"
                              value={editingListing.to_amount || ''}
                              onChange={(e) => setEditingListing({...editingListing, to_amount: e.target.value ? parseFloat(e.target.value) : null})}
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Şehir</Label>
                          <Input
                            value={editingListing.city}
                            onChange={(e) => setEditingListing({...editingListing, city: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <Label>Açıklama</Label>
                          <Textarea
                            rows={4}
                            value={editingListing.description}
                            onChange={(e) => setEditingListing({...editingListing, description: e.target.value})}
                            required
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)} className="flex-1">
                            İptal
                          </Button>
                          <Button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-700">
                            Güncelle
                          </Button>
                        </div>
                      </form>
                    )}
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>

          {/* Content Area */}
          <div className="md:col-span-2 space-y-6">
            {/* Listings */}
            <Card className="border-2 border-teal-100 dark:border-teal-800 dark:bg-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-gray-900 dark:text-white">
                    {isOwnProfile ? 'My Listings' : 'User Listings'} ({userListings.length})
                  </CardTitle>
                  {isOwnProfile && (
                    <Button onClick={() => navigate('/create')} className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600" data-testid="create-new-listing-btn">
                      <Plus className="w-4 h-4 mr-2" />
                      New Listing
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {userListings.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">No listings yet</p>
                    {isOwnProfile && (
                      <Button onClick={() => navigate('/create')} variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                        Create Your First Listing
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userListings.map((listing) => (
                      <div
                        key={listing.id}
                        className="border border-teal-200 dark:border-teal-800 rounded-lg p-4 bg-white dark:bg-gray-800 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
                        data-testid={`user-listing-${listing.id}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 
                            className="font-semibold text-lg text-gray-900 dark:text-white cursor-pointer hover:text-teal-600 dark:hover:text-teal-400"
                            onClick={() => navigate(`/listing/${listing.id}`)}
                          >
                            {listing.from_amount.toLocaleString()} {listing.from_currency} → {listing.to_currency}
                          </h3>
                          <Badge className={listing.status === 'active' ? 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}>
                            {listing.status === 'active' ? 'Active' : 'Closed'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{listing.city}, {listing.country}</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-3">{listing.description}</p>
                        
                        {isOwnProfile && (
                          <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/listing/${listing.id}`)}
                              data-testid={`view-listing-${listing.id}`}
                              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditListing(listing)}
                              data-testid={`edit-listing-${listing.id}`}
                              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                              Edit
                            </Button>
                            {listing.status === 'active' && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleCloseListing(listing.id)}
                                data-testid={`close-listing-${listing.id}`}
                              >
                                Close Listing
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ratings */}
            <Card className="border-2 border-teal-100 dark:border-teal-800 dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Reviews ({ratings.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {ratings.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-400 text-center py-8">No reviews yet</p>
                ) : (
                  <div className="space-y-4">
                    {ratings.map((rating) => (
                      <div key={rating.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0" data-testid={`rating-${rating.id}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 dark:text-white">{rating.rater_username}</span>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= rating.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300 dark:text-gray-600'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {format(new Date(rating.created_at), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        {rating.comment && (
                          <p className="text-gray-700 dark:text-gray-300">{rating.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Bottom Navigation - Mobile Only */}
      <BottomNav user={user} unreadCount={unreadCount} />
      <div className="h-20 md:hidden"></div>
    </div>
  );
}