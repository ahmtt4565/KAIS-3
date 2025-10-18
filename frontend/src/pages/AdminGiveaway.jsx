import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, X, Users, Gift, Instagram, Calendar, Clock } from "lucide-react";

export default function AdminGiveaway({ user }) {
  const navigate = useNavigate();
  const [participations, setParticipations] = useState([]);
  const [giveaway, setGiveaway] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, pending, approved

  useEffect(() => {
    if (user?.role !== "admin") {
      navigate("/dashboard");
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const [participationsRes, giveawayRes] = await Promise.all([
        axios.get(`${API}/giveaway/admin/participations`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        }),
        axios.get(`${API}/giveaway/active`)
      ]);
      setParticipations(participationsRes.data);
      setGiveaway(giveawayRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (participationId) => {
    try {
      await axios.put(`${API}/giveaway/admin/approve/${participationId}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      fetchData(); // Refresh
    } catch (error) {
      console.error("Error approving:", error);
      alert("Onaylama hatası: " + (error.response?.data?.detail || "Bilinmeyen hata"));
    }
  };

  const handleReject = async (participationId) => {
    if (!window.confirm("Bu katılımı reddetmek istediğinize emin misiniz?")) return;
    
    try {
      await axios.put(`${API}/giveaway/admin/reject/${participationId}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      fetchData(); // Refresh
    } catch (error) {
      console.error("Error rejecting:", error);
      alert("Reddetme hatası: " + (error.response?.data?.detail || "Bilinmeyen hata"));
    }
  };

  const filteredParticipations = participations.filter((p) => {
    if (filter === "pending") return !p.admin_approved;
    if (filter === "approved") return p.admin_approved;
    return true;
  });

  const pendingCount = participations.filter(p => !p.admin_approved).length;
  const approvedCount = participations.filter(p => p.admin_approved).length;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/admin")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Çekiliş Yönetimi</h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">Katılımları onayla veya reddet</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        {giveaway && (
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Card className="dark:bg-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <Gift className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Toplam Katılımcı</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{giveaway.total_participants}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Bekleyen</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Onaylı</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{approvedCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Kalan Gün</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {Math.ceil((new Date(giveaway.end_date) - new Date()) / (1000 * 60 * 60 * 24))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            className="dark:bg-gray-800 dark:text-white"
          >
            Tümü ({participations.length})
          </Button>
          <Button
            variant={filter === "pending" ? "default" : "outline"}
            onClick={() => setFilter("pending")}
            className="dark:bg-gray-800 dark:text-white"
          >
            Bekleyen ({pendingCount})
          </Button>
          <Button
            variant={filter === "approved" ? "default" : "outline"}
            onClick={() => setFilter("approved")}
            className="dark:bg-gray-800 dark:text-white"
          >
            Onaylı ({approvedCount})
          </Button>
        </div>

        {/* Participations List */}
        <div className="space-y-4">
          {filteredParticipations.length === 0 ? (
            <Card className="dark:bg-gray-800">
              <CardContent className="p-12 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Henüz katılım yok</p>
              </CardContent>
            </Card>
          ) : (
            filteredParticipations.map((participation) => (
              <Card key={participation.id} className="dark:bg-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                          {participation.username}
                        </h3>
                        <Badge variant={participation.admin_approved ? "default" : "secondary"}>
                          {participation.member_number}
                        </Badge>
                        {participation.admin_approved ? (
                          <Badge className="bg-green-500">Onaylı</Badge>
                        ) : (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                            Bekliyor
                          </Badge>
                        )}
                      </div>

                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400 mb-1">Instagram</p>
                          <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                            <Instagram className="w-4 h-4 text-pink-600" />
                            @{participation.instagram_username}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400 mb-1">Davet 1</p>
                          <p className="font-medium text-gray-900 dark:text-white">{participation.invited_member1}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400 mb-1">Davet 2</p>
                          <p className="font-medium text-gray-900 dark:text-white">{participation.invited_member2}</p>
                        </div>
                      </div>

                      <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                        <p>
                          Katılım: {new Date(participation.participated_at).toLocaleString("tr-TR")}
                        </p>
                        {participation.invited_verified && (
                          <p className="text-green-600 dark:text-green-400">✓ Davetler otomatik doğrulandı (aynı gün kayıt)</p>
                        )}
                      </div>
                    </div>

                    {!participation.admin_approved && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(participation.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Onayla
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(participation.id)}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Reddet
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
