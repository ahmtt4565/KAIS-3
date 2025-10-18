import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import AdminLayout from "../components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, FileText, MessageSquare, BarChart3, LogOut, Download, Gift, TrendingUp, Activity, Clock } from "lucide-react";

export default function AdminDashboard({ user, logout }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate('/');
      return;
    }
    fetchStats();
  }, [user, navigate]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      if (error.response?.status === 403) {
        alert("Bu sayfaya erişim yetkiniz bulunmamaktadır");
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (dataType) => {
    try {
      const response = await axios.get(`${API}/admin/${dataType}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!response.data || response.data.length === 0) {
        alert("İndirilebilecek veri bulunamadı");
        return;
      }

      // Convert to CSV with proper formatting
      const data = response.data;
      let csvContent = "\uFEFF"; // UTF-8 BOM for proper encoding
      let headers = [];
      let formattedData = [];

      // Format data based on type
      if (dataType === 'users') {
        headers = ["Kullanıcı Adı", "E-posta", "Ülke", "Rol", "Toplam İlan", "Gönderilen Mesaj", "Kayıt Tarihi", "Diller"];
        formattedData = data.map(item => [
          item.username || "Belirtilmemiş",
          item.email || "Belirtilmemiş", 
          item.country || "Belirtilmemiş",
          item.role === "admin" ? "Yönetici" : "Kullanıcı",
          item.total_listings || "0",
          item.total_messages_sent || "0",
          item.created_at ? new Date(item.created_at).toLocaleDateString('tr-TR') : "Belirtilmemiş",
          Array.isArray(item.languages) ? item.languages.join(", ") : "Belirtilmemiş"
        ]);
      } else if (dataType === 'listings') {
        headers = ["Kullanıcı", "Verilecek Miktar", "Verilecek Para", "İstenilen Miktar", "İstenilen Para", "Ülke", "Şehir", "Durum", "Açıklama", "Fotoğraf Sayısı", "Oluşturulma Tarihi"];
        formattedData = data.map(item => [
          item.username || "Belirtilmemiş",
          item.from_amount || "0",
          item.from_currency || "Belirtilmemiş",
          item.to_amount || "Belirtilmemiş", 
          item.to_currency || "Belirtilmemiş",
          item.country || "Belirtilmemiş",
          item.city || "Belirtilmemiş",
          item.status === "active" ? "Aktif" : "Pasif",
          item.description || "Açıklama yok",
          Array.isArray(item.photos) ? item.photos.length : "0",
          item.created_at ? new Date(item.created_at).toLocaleDateString('tr-TR') : "Belirtilmemiş"
        ]);
      } else if (dataType === 'messages') {
        headers = ["Gönderen", "Alıcı", "Mesaj İçeriği", "İlan ID", "Okundu mu?", "Gönderilme Tarihi"];
        formattedData = data.map(item => [
          item.sender_username || "Belirtilmemiş",
          item.recipient_username || "Belirtilmemiş",
          item.content || "İçerik yok",
          item.listing_id || "Belirtilmemiş",
          item.read ? "Evet" : "Hayır",
          item.created_at ? new Date(item.created_at).toLocaleString('tr-TR') : "Belirtilmemiş"
        ]);
      }

      // Create CSV content with Turkish headers
      csvContent += headers.map(h => `"${h}"`).join(",") + "\n";
      
      formattedData.forEach(row => {
        const formattedRow = row.map(value => {
          return `"${String(value || "").replace(/"/g, '""')}"`;
        });
        csvContent += formattedRow.join(",") + "\n";
      });

      // Try multiple download methods
      try {
        // Method 1: Modern Blob download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        
        // Check if we can use the File System Access API
        if ('showSaveFilePicker' in window) {
          const fileHandle = await window.showSaveFilePicker({
            suggestedName: `kais_${dataType}_${new Date().toISOString().split('T')[0]}.csv`,
            types: [{
              description: 'CSV files',
              accept: { 'text/csv': ['.csv'] }
            }]
          });
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
          alert(`${dataType} verileri başarıyla indirildi!`);
          return;
        }
        
        // Method 2: Traditional download
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `kais_${dataType}_${new Date().toISOString().split('T')[0]}.csv`;
        
        // Force click by adding to DOM
        document.body.appendChild(link);
        link.click();
        
        // Cleanup after delay
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 100);
        
        alert(`${dataType} verileri başarıyla indirildi!`);
      } catch (downloadError) {
        // Method 3: Fallback - open in new window for copy-paste
        console.warn("Download failed, opening in new window:", downloadError);
        const newWindow = window.open();
        newWindow.document.write(`<pre>${csvContent}</pre>`);
        newWindow.document.write(`<p>Yukarıdaki veriyi kopyalayıp .csv dosyası olarak kaydedin</p>`);
        alert("İndirme başarısız! Yeni pencerede açılan veriyi kopyalayın");
      }
      
    } catch (error) {
      console.error(`Error exporting ${dataType}:`, error);
      alert(`Veri dışa aktarılırken hata: ${error.response?.data?.detail || error.message}`);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-orange-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">KAIS Admin Panel</h1>
              <p className="text-sm text-gray-600">Hoşgeldin, {user?.username}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
              >
                Ana Sayfaya Dön
              </Button>
              <Button
                variant="outline"
                onClick={logout}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Çıkış Yap
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Kullanıcı</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_users || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam İlan</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_listings || 0}</div>
              <p className="text-xs text-muted-foreground">
                Aktif: {stats?.active_listings || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Mesaj</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_messages || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Son Güncelleme</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm">{stats?.generated_at ? new Date(stats.generated_at).toLocaleString('tr-TR') : 'Bilinmiyor'}</div>
            </CardContent>
          </Card>
        </div>

        {/* Management Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Kullanıcı Yönetimi
              </CardTitle>
              <CardDescription>
                Tüm kullanıcıları görüntüle, düzenle ve yönet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full" 
                onClick={() => navigate('/admin/users')}
              >
                Kullanıcıları Görüntüle
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => exportData('users')}
              >
                <Download className="w-4 h-4 mr-2" />
                Kullanıcı Verilerini İndir
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                İlan Yönetimi
              </CardTitle>
              <CardDescription>
                Tüm ilanları görüntüle ve yönet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full" 
                onClick={() => navigate('/admin/listings')}
              >
                İlanları Görüntüle
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => exportData('listings')}
              >
                <Download className="w-4 h-4 mr-2" />
                İlan Verilerini İndir
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Mesaj İzleme
              </CardTitle>
              <CardDescription>
                Kullanıcı mesajlarını görüntüle ve izle
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full" 
                onClick={() => navigate('/admin/messages')}
              >
                Mesajları Görüntüle
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => exportData('messages')}
              >
                <Download className="w-4 h-4 mr-2" />
                Mesaj Verilerini İndir
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-pink-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <Gift className="w-5 h-5" />
                Çekiliş Yönetimi
              </CardTitle>
              <CardDescription>
                Çekiliş katılımlarını onayla ve yönet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700" 
                onClick={() => navigate('/admin/giveaway')}
              >
                Çekilişi Yönet
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-teal-700">
                <MessageSquare className="w-5 h-5" />
                Customer Service
              </CardTitle>
              <CardDescription>
                Kullanıcı destek taleplerini yönet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full bg-teal-600 hover:bg-teal-700" 
                onClick={() => navigate('/admin/support')}
              >
                Destek Taleplerini Görüntüle
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}