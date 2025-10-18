import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Download, MessageSquare, Calendar, User, CheckCircle, Clock } from "lucide-react";

export default function AdminMessages({ user }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate('/');
      return;
    }
    fetchMessages();
  }, [user, navigate]);

  useEffect(() => {
    if (search) {
      setFilteredMessages(messages.filter(m => 
        m.sender_username?.toLowerCase().includes(search.toLowerCase()) ||
        m.recipient_username?.toLowerCase().includes(search.toLowerCase()) ||
        m.content?.toLowerCase().includes(search.toLowerCase()) ||
        m.listing_id?.toLowerCase().includes(search.toLowerCase())
      ));
    } else {
      setFilteredMessages(messages);
    }
  }, [search, messages]);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API}/admin/messages`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setMessages(response.data);
      setFilteredMessages(response.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
      if (error.response?.status === 403) {
        alert("Bu sayfaya erişim yetkiniz bulunmamaktadır");
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const exportMessages = async () => {
    try {
      if (filteredMessages.length === 0) {
        alert("İndirilebilecek mesaj bulunamadı");
        return;
      }

      // Create CSV with Turkish headers and formatted data  
      let csvContent = "\uFEFF"; // UTF-8 BOM
      const turkishHeaders = ["Gönderen", "Alıcı", "Mesaj İçeriği", "İlan ID", "Durum", "Gönderilme Tarihi", "Gönderilme Saati"];
      csvContent += turkishHeaders.map(h => `"${h}"`).join(",") + "\n";
      
      filteredMessages.forEach(message => {
        const messageDate = message.created_at ? new Date(message.created_at) : null;
        const row = [
          message.sender_username || "Belirtilmemiş",
          message.recipient_username || "Belirtilmemiş", 
          message.content || "İçerik bulunmuyor",
          message.listing_id || "Belirtilmemiş",
          message.read ? "Okundu" : "Okunmamış",
          messageDate ? messageDate.toLocaleDateString('tr-TR') : "Belirtilmemiş",
          messageDate ? messageDate.toLocaleTimeString('tr-TR') : "Belirtilmemiş"
        ];
        
        const formattedRow = row.map(value => `"${String(value).replace(/"/g, '""')}"`);
        csvContent += formattedRow.join(",") + "\n";
      });

      // Try download with multiple methods
      const filename = `kais_messages_${new Date().toISOString().split('T')[0]}.csv`;
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
      
      alert("Mesaj verileri başarıyla indirildi!");
    } catch (error) {
      console.error("Error exporting messages:", error);
      alert("Veri dışa aktarılırken hata: " + error.message);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Mesajlar yükleniyor...</div>;
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
            <h1 className="text-3xl font-bold">Mesaj İzleme</h1>
          </div>
          
          <Button
            onClick={exportMessages}
            className="bg-green-600 hover:bg-green-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Mesajları İndir (CSV)
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Mesaj ara (gönderen, alıcı, içerik, ilan ID...)"
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
              <div className="text-2xl font-bold">{messages.length}</div>
              <p className="text-sm text-muted-foreground">Toplam Mesaj</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{messages.filter(m => m.read).length}</div>
              <p className="text-sm text-muted-foreground">Okunmuş Mesaj</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{messages.filter(m => !m.read).length}</div>
              <p className="text-sm text-muted-foreground">Okunmamış Mesaj</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{filteredMessages.length}</div>
              <p className="text-sm text-muted-foreground">Görüntülenen</p>
            </CardContent>
          </Card>
        </div>

        {/* Messages List */}
        <div className="space-y-4">
          {filteredMessages
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .map((message) => (
              <Card key={message.id} className={`${message.read ? 'bg-white' : 'bg-yellow-50 border-yellow-200'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="font-semibold text-teal-700">{message.sender_username}</span>
                        </div>
                        <span className="text-gray-400">→</span>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="font-semibold text-orange-700">{message.recipient_username}</span>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-lg mb-3">
                        <p className="text-gray-800">{message.content}</p>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          <span>İlan ID: {message.listing_id}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(message.created_at).toLocaleString('tr-TR')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                        message.read 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {message.read ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Okundu
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            Okunmadı
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>

        {filteredMessages.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">Arama kriterlerine uygun mesaj bulunamadı.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}