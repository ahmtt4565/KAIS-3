import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Gift, Users, Calendar, Instagram, Check, Clock, Sparkles } from "lucide-react";
import axios from "axios";
import { API } from "../App";

export default function GiveawayCard({ giveaway, myParticipation, user, onParticipated }) {
  const [showParticipateDialog, setShowParticipateDialog] = useState(false);
  const [formData, setFormData] = useState({
    instagram_username: "",
    invited_member1: "",
    invited_member2: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Real-time countdown
  useEffect(() => {
    if (!giveaway) return;

    const updateCountdown = () => {
      const endDate = new Date(giveaway.end_date);
      const now = new Date();
      const diff = endDate - now;

      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setCountdown({ days, hours, minutes, seconds });
      } else {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    // Initial update
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [giveaway]);

  if (!giveaway) return null;

  const handleParticipate = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    // Validation
    if (!formData.instagram_username.trim()) {
      setError("Please enter your Instagram username");
      setLoading(false);
      return;
    }

    if (!formData.invited_member1.trim() || !formData.invited_member2.trim()) {
      setError("You must enter 2 friends' member numbers");
      setLoading(false);
      return;
    }

    if (formData.invited_member1 === formData.invited_member2) {
      setError("You must enter different member numbers");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API}/giveaway/participate`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });

      setSuccess(response.data.message);
      setTimeout(() => {
        setShowParticipateDialog(false);
        if (onParticipated) onParticipated();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || "Error occurred during participation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-3 overflow-hidden border-0 shadow-lg">
      {/* Modern Gradient Header with Glassmorphism - Compact */}
      <div className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 p-2 text-white relative overflow-hidden">
        {/* Subtle animated background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-24 h-24 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-28 h-28 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
        </div>
        
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2 flex-1">
            <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">GIVEAWAY!</h3>
              <p className="text-xs font-bold opacity-95">{giveaway.prize}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Countdown with modern glass effect */}
            <div className="text-[10px] flex items-center gap-1 bg-white/25 backdrop-blur-md rounded-lg px-2 py-1 shadow-lg border border-white/20">
              <Clock className="w-3 h-3" />
              {countdown.days > 0 ? (
                <span className="font-bold">
                  {countdown.days}d {countdown.hours}h {countdown.minutes}m {countdown.seconds}s
                </span>
              ) : countdown.hours > 0 ? (
                <span className="font-bold">
                  {countdown.hours}h {countdown.minutes}m {countdown.seconds}s
                </span>
              ) : (
                <span className="font-bold">
                  {countdown.minutes}m {countdown.seconds}s
                </span>
              )}
            </div>
            {/* Participants count with glass effect */}
            <div className="bg-white/25 backdrop-blur-md rounded-lg px-2 py-1 shadow-lg border border-white/20">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span className="text-sm font-bold">{giveaway.total_participants}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Content with subtle background - Compact */}
      <CardContent className="p-3 dark:bg-gray-800 relative overflow-hidden bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
        {/* Dekoratif Hediye Paketleri ve Balonlar - Daha Küçük */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          {/* Sol üst köşe */}
          <div className="absolute top-1 left-1 text-pink-500">
            <Gift className="w-6 h-6 animate-bounce" style={{ animationDelay: "0s", animationDuration: "3s" }} />
          </div>
          <div className="absolute top-4 left-8 text-purple-500">
            <Sparkles className="w-5 h-5 animate-pulse" style={{ animationDelay: "0.5s" }} />
          </div>
          
          {/* Sağ üst köşe */}
          <div className="absolute top-2 right-2 text-orange-500">
            <Gift className="w-7 h-7 animate-bounce" style={{ animationDelay: "0.3s", animationDuration: "2.5s" }} />
          </div>
          <div className="absolute top-6 right-10 text-yellow-500">
            <Sparkles className="w-4 h-4 animate-pulse" style={{ animationDelay: "0.8s" }} />
          </div>
          
          {/* Sol alt köşe */}
          <div className="absolute bottom-2 left-4 text-teal-500">
            <Gift className="w-6 h-6 animate-bounce" style={{ animationDelay: "0.6s", animationDuration: "3.5s" }} />
          </div>
          <div className="absolute bottom-6 left-12 text-blue-500">
            <Sparkles className="w-5 h-5 animate-pulse" style={{ animationDelay: "1s" }} />
          </div>
          
          {/* Sağ alt köşe */}
          <div className="absolute bottom-3 right-3 text-red-500">
            <Gift className="w-6 h-6 animate-bounce" style={{ animationDelay: "0.9s", animationDuration: "2.8s" }} />
          </div>
          <div className="absolute bottom-8 right-8 text-green-500">
            <Sparkles className="w-5 h-5 animate-pulse" style={{ animationDelay: "0.2s" }} />
          </div>
          
          {/* Orta kısım dekorasyonlar */}
          <div className="absolute top-20 left-1/4 text-indigo-500">
            <Gift className="w-9 h-9 animate-bounce" style={{ animationDelay: "0.4s", animationDuration: "3.2s" }} />
          </div>
          <div className="absolute top-32 right-1/3 text-pink-400">
            <Sparkles className="w-10 h-10 animate-pulse" style={{ animationDelay: "0.7s" }} />
          </div>
          <div className="absolute bottom-24 left-1/3 text-orange-400">
            <Gift className="w-8 h-8 animate-bounce" style={{ animationDelay: "1.2s", animationDuration: "3.8s" }} />
          </div>
        </div>

        <div className="space-y-2 relative z-10">
          {/* Modern User Info Badge - Compact */}
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-gray-700 dark:to-gray-600 backdrop-blur-sm rounded-lg p-2 inline-flex items-center gap-2 shadow-sm border border-teal-100 dark:border-gray-600">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-600 dark:text-gray-300 font-medium">Member:</span>
              <span className="font-bold text-teal-600 dark:text-teal-400 text-sm">{user.member_number || "?"}</span>
              {myParticipation && (
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded-lg shadow-sm">
                  <Check className="w-3 h-3" />
                  <span className="text-[10px] font-semibold">Joined</span>
                </div>
              )}
            </div>
          </div>

          {/* Modern Requirements - Compact */}
          <div className="text-xs space-y-1.5 p-2">
            <div className="flex items-start gap-1.5">
              <div className="p-1 bg-pink-100 dark:bg-pink-900/30 rounded">
                <Instagram className="w-3 h-3 text-pink-600 dark:text-pink-400" />
              </div>
              <p className="text-gray-700 dark:text-gray-300">
                <a 
                  href="https://instagram.com/kaissocial" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-semibold text-pink-600 hover:text-pink-700 dark:text-pink-500 hover:underline transition-all"
                >
                  {giveaway.instagram_account}
                </a> follow
              </p>
            </div>
            <div className="flex items-start gap-1.5">
              <div className="p-1 bg-teal-100 dark:bg-teal-900/30 rounded">
                <Users className="w-3 h-3 text-teal-600 dark:text-teal-400" />
              </div>
              <p className="text-gray-700 dark:text-gray-300 font-medium">Invite 2 friends</p>
            </div>
          </div>

          {/* Modern Participation Status - Compact */}
          <div className="flex justify-center">
            {myParticipation ? (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 backdrop-blur-sm border border-green-200 dark:border-green-700 rounded-lg p-2 w-full shadow-sm">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="p-0.5 bg-green-100 dark:bg-green-800/50 rounded">
                    <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="font-bold text-green-900 dark:text-green-400 text-xs">You've Joined!</p>
                </div>
                <div className="space-y-0.5 text-[10px] text-gray-700 dark:text-gray-300 pl-6">
                  <p className="font-medium">IG: @{myParticipation.instagram_username}</p>
                  <p>Invites: {myParticipation.invited_member1}, {myParticipation.invited_member2}</p>
                  {myParticipation.admin_approved ? (
                    <span className="inline-flex items-center gap-0.5 text-green-600 dark:text-green-400 font-semibold bg-green-100 dark:bg-green-800/50 px-1.5 py-0.5 rounded text-[9px]">
                      <Check className="w-2.5 h-2.5" /> Approved
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 text-orange-600 dark:text-orange-400 font-semibold bg-orange-100 dark:bg-orange-800/50 px-1.5 py-0.5 rounded text-[9px]">
                      <Clock className="w-2.5 h-2.5" /> Pending Approval
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <Dialog open={showParticipateDialog} onOpenChange={setShowParticipateDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white font-bold py-2 px-4 text-xs rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105">
                    <Gift className="w-3 h-3 mr-1.5" />
                    Join
                  </Button>
                </DialogTrigger>
              <DialogContent className="dark:bg-gray-800">
                <DialogHeader>
                  <DialogTitle className="dark:text-white">Join Giveaway</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label htmlFor="instagram" className="dark:text-gray-300">Your Instagram Username</Label>
                    <Input
                      id="instagram"
                      placeholder="example_user"
                      value={formData.instagram_username}
                      onChange={(e) => setFormData({ ...formData, instagram_username: e.target.value })}
                      className="dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="invite1" className="dark:text-gray-300">1st Friend's Member Number</Label>
                    <Input
                      id="invite1"
                      placeholder="#K00001"
                      value={formData.invited_member1}
                      onChange={(e) => setFormData({ ...formData, invited_member1: e.target.value })}
                      className="dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="invite2" className="dark:text-gray-300">2nd Friend's Member Number</Label>
                    <Input
                      id="invite2"
                      placeholder="#K00002"
                      value={formData.invited_member2}
                      onChange={(e) => setFormData({ ...formData, invited_member2: e.target.value })}
                      className="dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 p-3 rounded">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-600 dark:text-green-400 p-3 rounded">
                      {success}
                    </div>
                  )}

                  <Button
                    onClick={handleParticipate}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-orange-500 to-pink-600"
                  >
                    {loading ? "Joining..." : "Join"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            )}
          </div>

          {/* Modern Footer - Compact */}
          <p className="text-[10px] text-center text-gray-600 dark:text-gray-400 mt-1.5 px-2 py-1">
            Result will be announced on{" "}
            <a 
              href="https://instagram.com/kaissocial" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-bold text-pink-600 hover:text-pink-700 dark:text-pink-500 dark:hover:text-pink-400 hover:underline cursor-pointer transition-all"
            >
              {giveaway.instagram_account}
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
