import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, MessageSquare, Star, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";
import OnlineStatus from "@/components/OnlineStatus";
import BottomNav from "@/components/BottomNav";

export default function ListingDetail({ user, logout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [listingUser, setListingUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    try {
      const response = await axios.get(`${API}/listings/${id}`);
      setListing(response.data);
      
      // Fetch listing owner's details
      const userResponse = await axios.get(`${API}/auth/me`);
      // In real app, would fetch the listing owner, but for now using current user structure
      setListingUser(response.data);
    } catch (error) {
      console.error("Error fetching listing:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async () => {
    if (listing) {
      navigate(`/chat/${listing.id}/${listing.user_id}`);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this listing?")) {
      try {
        await axios.delete(`${API}/listings/${id}`);
        navigate('/dashboard');
      } catch (error) {
        console.error("Error deleting listing:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 dark:from-gray-900 via-white dark:via-gray-800 to-orange-50 flex items-center justify-center">
        <p className="text-xl text-gray-600 dark:text-gray-300">Loading...</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 dark:from-gray-900 via-white dark:via-gray-800 to-orange-50 flex items-center justify-center">
        <p className="text-xl text-gray-600 dark:text-gray-300">Listing not found</p>
      </div>
    );
  }

  const isOwnListing = listing.user_id === user.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 dark:from-gray-900 via-white dark:via-gray-800 to-orange-50 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-teal-100 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} data-testid="back-to-dashboard-btn">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div 
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity select-none"
              onClick={() => navigate('/dashboard')}
              style={{ cursor: 'pointer' }}
            >
              <DollarSign className="w-8 h-8 text-teal-600" onClick={() => navigate('/dashboard')} />
              <h1 
                className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-orange-500 bg-clip-text text-transparent cursor-pointer"
                onClick={() => navigate('/dashboard')}
                style={{ cursor: 'pointer' }}
              >
                KAIS
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="border-2 border-teal-100 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-start justify-between mb-4">
              <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100">
                {listing.country}
              </Badge>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {format(new Date(listing.created_at), 'MMM dd, yyyy')}
                </span>
              </div>
            </div>
            <CardTitle className="text-4xl mb-2">
              {listing.from_amount.toLocaleString()} {listing.from_currency}
              {" "}→{" "}
              {listing.to_amount ? `${listing.to_amount.toLocaleString()} ` : ""}
              {listing.to_currency}
            </CardTitle>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <MapPin className="w-5 h-5" />
              <span className="text-lg">{listing.city}, {listing.country}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Photos */}
            {listing.photos && listing.photos.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-3">Fotoğraflar</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {listing.photos.map((photo, index) => (
                    <img
                      key={index}
                      src={`${API}/uploads/${photo}`}
                      alt={`Listing photo ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <h3 className="text-xl font-semibold mb-3">Description</h3>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{listing.description}</p>
            </div>

            {/* User Info */}
            <div className="border-t pt-6">
              <h3 className="text-xl font-semibold mb-4">Posted By</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                    <span className="text-xl font-bold text-teal-600">
                      {listing.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-lg">{listing.username}</p>
                      <OnlineStatus userId={listing.user_id} size="md" showLabel={false} />
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>View Profile</span>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => navigate(`/profile/${listing.user_id}`)}
                  variant="outline"
                  data-testid="view-profile-btn"
                >
                  View Profile
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t pt-6">
              {isOwnListing ? (
                <div className="flex gap-4">
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    className="flex-1"
                    data-testid="delete-listing-btn"
                  >
                    Delete Listing
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleStartChat}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-lg py-6"
                  data-testid="start-chat-btn"
                >
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Start Chat with {listing.username}
                </Button>
              )}
            </div>

            {/* Exchange Tips */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-semibold text-orange-900 mb-2">Safety Tips</h4>
              <ul className="text-sm text-orange-800 space-y-1">
                <li>• Meet in a public, safe location</li>
                <li>• Verify currency authenticity before exchange</li>
                <li>• Consider bringing a friend</li>
                <li>• Count money carefully before completing the exchange</li>
                <li>• Rate your experience after the exchange</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Bottom Navigation - Mobile Only */}
      <BottomNav user={user} />
      <div className="h-20 md:hidden"></div>
    </div>
  );
}