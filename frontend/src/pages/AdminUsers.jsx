import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Trash2, Mail, MapPin, Calendar, Download } from "lucide-react";

export default function AdminUsers({ user }) {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate('/');
      return;
    }
    fetchUsers();
  }, [user, navigate]);

  useEffect(() => {
    if (search) {
      setFilteredUsers(users.filter(u => 
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.country.toLowerCase().includes(search.toLowerCase())
      ));
    } else {
      setFilteredUsers(users);
    }
  }, [search, users]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/admin/users`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setUsers(response.data);
      setFilteredUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      if (error.response?.status === 403) {
        alert("Bu sayfaya erişim yetkiniz bulunmamaktadır");
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId, userName) => {
    if (!confirm(`${userName} kullanıcısını ve tüm verilerini silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      await axios.delete(`${API}/admin/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      alert("Kullanıcı başarıyla silindi");
      fetchUsers(); // Refresh list
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Kullanıcı silinirken hata: " + (error.response?.data?.detail || error.message));
    }
  };

  const exportUsers = async () => {
    try {
      if (filteredUsers.length === 0) {
        alert("İndirilebilecek kullanıcı bulunamadı");
        return;
      }

      // Create CSV content with Turkish headers
      let csvContent = "\uFEFF"; // UTF-8 BOM
      const turkishHeaders = ["Kullanıcı Adı", "E-posta", "Ülke", "Rol", "Toplam İlan", "Gönderilen Mesaj", "Alınan Mesaj", "Kayıt Tarihi", "Diller"];
      csvContent += turkishHeaders.map(h => `"${h}"`).join(",") + "\n";
      
      filteredUsers.forEach(user => {
        const row = [
          user.username || "Belirtilmemiş",
          user.email || "Belirtilmemiş",
          user.country || "Belirtilmemiş", 
          user.role === "admin" ? "Yönetici" : "Kullanıcı",
          user.total_listings || "0",
          user.total_messages_sent || "0",
          user.total_messages_received || "0",
          user.created_at ? new Date(user.created_at).toLocaleDateString('tr-TR') : "Belirtilmemiş",
          Array.isArray(user.languages) ? user.languages.join(", ") : "Belirtilmemiş"
        ];
        
        const formattedRow = row.map(value => `"${String(value).replace(/"/g, '""')}"`);
        csvContent += formattedRow.join(",") + "\n";
      });

      // Try multiple download methods
      const filename = `kais_users_${new Date().toISOString().split('T')[0]}.csv`;
      
      try {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        
        // Modern browsers - File System Access API
        if ('showSaveFilePicker' in window) {
          const fileHandle = await window.showSaveFilePicker({
            suggestedName: filename,
            types: [{ description: 'CSV files', accept: { 'text/csv': ['.csv'] } }]
          });
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
          alert("Kullanıcı verileri başarıyla kaydedildi!");
          return;
        }
        
        // Traditional download
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 100);
        
        alert("Kullanıcı verileri başarıyla indirildi!");
        
      } catch (downloadError) {
        // Fallback method
        console.warn("Download failed, trying fallback:", downloadError);
        const dataUrl = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = filename;
        link.click();
        alert("Kullanıcı verileri indirildi! (Fallback method)");
      }
      
    } catch (error) {
      console.error("Error exporting users:", error);
      alert("Veri dışa aktarılırken hata: " + error.message);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Kullanıcılar yükleniyor...</div>;
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
            <h1 className="text-3xl font-bold">Kullanıcı Yönetimi</h1>
          </div>
          
          <Button
            onClick={exportUsers}
            className="bg-green-600 hover:bg-green-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Kullanıcıları İndir (CSV)
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Kullanıcı ara (isim, email, ülke...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-sm text-muted-foreground">Toplam Kullanıcı</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{users.filter(u => u.role === "admin").length}</div>
              <p className="text-sm text-muted-foreground">Admin Kullanıcı</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{filteredUsers.length}</div>
              <p className="text-sm text-muted-foreground">Görüntülenen</p>
            </CardContent>
          </Card>
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((userData) => (
            <Card key={userData.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{userData.username}</CardTitle>
                  {userData.role === "admin" && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                      ADMIN
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  {userData.email}
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  {userData.country}
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  {new Date(userData.created_at).toLocaleDateString('tr-TR')}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-teal-600">{userData.total_listings || 0}</div>
                    <div className="text-xs text-gray-500">İlan</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-orange-600">{userData.total_messages_sent || 0}</div>
                    <div className="text-xs text-gray-500">Mesaj</div>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <p className="text-xs text-gray-500 mb-2">Diller: {userData.languages?.join(", ") || "Belirtilmemiş"}</p>
                  
                  {userData.role !== "admin" && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      onClick={() => deleteUser(userData.id, userData.username)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Kullanıcıyı Sil
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">Arama kriterlerine uygun kullanıcı bulunamadı.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}