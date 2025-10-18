import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Download, MapPin, Calendar, DollarSign, Trash2 } from "lucide-react";

export default function AdminListings({ user }) {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate('/');
      return;
    }
    fetchListings();
  }, [user, navigate]);

  useEffect(() => {
    if (search) {
      setFilteredListings(listings.filter(l => 
        l.username?.toLowerCase().includes(search.toLowerCase()) ||
        l.from_currency?.toLowerCase().includes(search.toLowerCase()) ||
        l.to_currency?.toLowerCase().includes(search.toLowerCase()) ||
        l.country?.toLowerCase().includes(search.toLowerCase()) ||
        l.city?.toLowerCase().includes(search.toLowerCase()) ||
        l.description?.toLowerCase().includes(search.toLowerCase())
      ));
    } else {
      setFilteredListings(listings);
    }
  }, [search, listings]);

  const fetchListings = async () => {
    try {
      const response = await axios.get(`${API}/admin/listings`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setListings(response.data);
      setFilteredListings(response.data);
    } catch (error) {
      console.error("Error fetching listings:", error);
      if (error.response?.status === 403) {
        alert("Bu sayfaya erişim yetkiniz bulunmamaktadır");
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteListing = async (listing) => {
    const reason = prompt(
      `${listing.username} kullanıcısının ilanını kaldırmak üzeresiniz.\n\n` +
      `İlan: ${listing.from_amount} ${listing.from_currency} → ${listing.to_amount || '?'} ${listing.to_currency}\n\n` +
      `Lütfen kaldırma sebebini girin (kullanıcıya gönderilecek):`
    );
    
    if (!reason || !reason.trim()) {
      return; // User cancelled or entered empty reason
    }

    const listingIdToDelete = listing.id;
    
    try {
      // Optimistic update: remove from UI immediately
      setListings(prev => prev.filter(l => l.id !== listingIdToDelete));
      setFilteredListings(prev => prev.filter(l => l.id !== listingIdToDelete));
      
      // Then make API call
      await axios.delete(`${API}/admin/listings/${listingIdToDelete}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        data: { reason: reason.trim() }
      });
      
      // Success - listing already removed from UI
      alert("✅ İlan başarıyla silindi ve kullanıcıya bildirim gönderildi");
    } catch (error) {
      console.error("Error deleting listing:", error);
      alert("❌ İlan silinirken hata: " + (error.response?.data?.detail || error.message));
      // Refresh list on error to restore correct state
      fetchListings();
    }
  };

  const exportListings = async () => {
    try {
      if (filteredListings.length === 0) {
        alert("İndirilebilecek ilan bulunamadı");
        return;
      }

      // Create CSV with Turkish headers and formatted data
      let csvContent = "\uFEFF"; // UTF-8 BOM
      const turkishHeaders = ["Kullanıcı", "Verilecek Miktar", "Verilecek Para Birimi", "İstenilen Miktar", "İstenilen Para Birimi", "Ülke", "Şehir", "Durum", "Açıklama", "Fotoğraf Sayısı", "Oluşturulma Tarihi"];
      csvContent += turkishHeaders.map(h => `"${h}"`).join(",") + "\n";
      
      filteredListings.forEach(listing => {
        const row = [
          listing.username || "Belirtilmemiş",
          listing.from_amount || "0",
          listing.from_currency || "Belirtilmemiş",
          listing.to_amount || "Belirtilmemiş",
          listing.to_currency || "Belirtilmemiş",
          listing.country || "Belirtilmemiş",
          listing.city || "Belirtilmemiş",
          listing.status === "active" ? "Aktif" : "Pasif",
          listing.description || "Açıklama bulunmuyor",
          Array.isArray(listing.photos) ? listing.photos.length.toString() : "0",
          listing.created_at ? new Date(listing.created_at).toLocaleDateString('tr-TR') : "Belirtilmemiş"
        ];
        
        const formattedRow = row.map(value => `"${String(value).replace(/"/g, '""')}"`);
        csvContent += formattedRow.join(",") + "\n";
      });

      // Try download with multiple methods
      const filename = `kais_listings_${new Date().toISOString().split('T')[0]}.csv`;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Traditional download with better browser support
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      
      // Force download by simulating click
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      alert("İlan verileri başarıyla indirildi!");
    } catch (error) {
      console.error("Error exporting listings:", error);
      alert("Veri dışa aktarılırken hata: " + error.message);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">İlanlar yükleniyor...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-orange-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/admin')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Admin Panel
            </Button>
            <h1 className="text-3xl font-bold">İlan Yönetimi</h1>
          </div>
          
          <Button
            onClick={exportListings}
            className="bg-green-600 hover:bg-green-700"
          >
            <Download className="w-4 h-4 mr-2" />
            İlanları İndir (CSV)
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="İlan ara (kullanıcı, para birimi, ülke, şehir, açıklama...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{listings.length}</div>
              <p className="text-sm text-muted-foreground">Toplam İlan</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{listings.filter(l => l.status === "active").length}</div>
              <p className="text-sm text-muted-foreground">Aktif İlan</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{listings.filter(l => l.photos && l.photos.length > 0).length}</div>
              <p className="text-sm text-muted-foreground">Fotoğraflı İlan</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{filteredListings.length}</div>
              <p className="text-sm text-muted-foreground">Görüntülenen</p>
            </CardContent>
          </Card>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <Card key={listing.id}>
              <CardHeader>
                <CardTitle className="text-lg">{listing.username}</CardTitle>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    listing.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                  }`}>
                    {listing.status.toUpperCase()}
                  </span>
                  {listing.photos && listing.photos.length > 0 && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                      {listing.photos.length} FOTO
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-teal-50 to-orange-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-bold text-teal-700">{listing.from_amount} {listing.from_currency}</div>
                    <div className="text-xs text-gray-500">Verilecek</div>
                  </div>
                  <DollarSign className="w-6 h-6 text-orange-600" />
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-700">{listing.to_amount || "?"} {listing.to_currency}</div>
                    <div className="text-xs text-gray-500">İstenilen</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  {listing.city}, {listing.country}
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  {new Date(listing.created_at).toLocaleDateString('tr-TR')}
                </div>

                <div className="pt-3 border-t">
                  <p className="text-sm text-gray-700 line-clamp-2 mb-3">{listing.description}</p>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={() => handleDeleteListing(listing)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    İlanı Kaldır
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredListings.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">Arama kriterlerine uygun ilan bulunamadı.</p>
            </CardContent>
          </Card>
        )}
      </div>

    </div>
  );
}