import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Flag, AlertTriangle, Eye, Trash2, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import KaisLogo from "@/components/KaisLogo";
import BottomNav from "@/components/BottomNav";

export default function AdminReports({ user, logout, unreadCount = 0 }) {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, pending, resolved

  useEffect(() => {
    // Check if user is admin
    if (user?.role !== "admin") {
      navigate("/dashboard");
      return;
    }
    fetchReports();
  }, [user]);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(response.data);
      console.log("📋 Reports loaded:", response.data);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewListing = (listingId) => {
    navigate(`/listing/${listingId}`);
  };

  const getReasonLabel = (reason) => {
    const labels = {
      spam: "Spam or misleading",
      inappropriate: "Inappropriate content",
      scam: "Scam or fraud",
      duplicate: "Duplicate listing",
      other: "Other"
    };
    return labels[reason] || reason;
  };

  const getReasonColor = (reason) => {
    const colors = {
      spam: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      inappropriate: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      scam: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      duplicate: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      other: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
    };
    return colors[reason] || colors.other;
  };

  const filteredReports = reports.filter(report => {
    if (filter === "all") return true;
    return report.status === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 dark:from-gray-900 via-white dark:via-gray-800 to-orange-50 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-teal-100 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <KaisLogo onClick={() => navigate('/dashboard')} />
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                Admin
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with stats */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30">
              <Flag className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reported Listings</h1>
              <p className="text-gray-600 dark:text-gray-400">Manage user reports and take action</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Reports</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{reports.length}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                    <p className="text-2xl font-bold text-red-600">{reports.filter(r => r.status === 'pending').length}</p>
                  </div>
                  <Flag className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Resolved</p>
                    <p className="text-2xl font-bold text-green-600">{reports.filter(r => r.status === 'resolved').length}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
              size="sm"
            >
              All Reports
            </Button>
            <Button
              variant={filter === "pending" ? "default" : "outline"}
              onClick={() => setFilter("pending")}
              size="sm"
            >
              Pending
            </Button>
            <Button
              variant={filter === "resolved" ? "default" : "outline"}
              onClick={() => setFilter("resolved")}
              size="sm"
            >
              Resolved
            </Button>
          </div>
        </div>

        {/* Reports List */}
        {filteredReports.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Flag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No reports found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {filter === "all" ? "No reports have been submitted yet." : `No ${filter} reports.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <Card key={report.id} className="border-2 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    {/* Report Info */}
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                          <Flag className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getReasonColor(report.reason)}>
                              {getReasonLabel(report.reason)}
                            </Badge>
                            <Badge variant={report.status === 'pending' ? 'destructive' : 'default'}>
                              {report.status}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Listing ID:</p>
                              <p className="font-mono text-sm text-gray-900 dark:text-white">{report.listing_id}</p>
                            </div>
                            
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Reported by:</p>
                              <p className="font-semibold text-gray-900 dark:text-white">@{report.reporter_username}</p>
                            </div>

                            {report.description && (
                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Description:</p>
                                <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                  {report.description}
                                </p>
                              </div>
                            )}

                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Reported: {format(new Date(report.created_at), "PPp")}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex md:flex-col gap-2">
                      <Button
                        onClick={() => handleViewListing(report.listing_id)}
                        className="bg-teal-600 hover:bg-teal-700 flex-1 md:flex-none"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Listing
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <BottomNav user={user} unreadCount={unreadCount} />
      <div className="h-20 md:hidden"></div>
    </div>
  );
}
