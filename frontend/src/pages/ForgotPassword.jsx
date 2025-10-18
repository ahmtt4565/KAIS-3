import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, DollarSign, Mail } from "lucide-react";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [resetLink, setResetLink] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/forgot-password`, { email });
      setSuccess(true);
      
      // Development mode: show the reset link
      if (response.data.reset_link) {
        setResetLink(response.data.reset_link);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <DollarSign className="w-12 h-12 text-teal-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-orange-500 bg-clip-text text-transparent">
              KAIS
            </h1>
          </div>
        </div>

        <Card className="border-2 border-teal-100 shadow-xl">
          <CardHeader>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="w-fit mb-2"
              data-testid="back-to-login-btn"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Giriş Sayfasına Dön
            </Button>
            <CardTitle className="text-2xl">Şifremi Unuttum</CardTitle>
            <CardDescription>
              E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!success ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">E-posta Adresi</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="ornek@eposta.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                      data-testid="forgot-password-email-input"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-red-500 text-sm" data-testid="error-message">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full bg-teal-600 hover:bg-teal-700"
                  disabled={loading}
                  data-testid="send-reset-link-btn"
                >
                  {loading ? "Gönderiliyor..." : "Şifre Sıfırlama Bağlantısı Gönder"}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Mail className="w-6 h-6 text-teal-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-teal-900 mb-2">
                        E-posta Gönderildi!
                      </h3>
                      <p className="text-sm text-teal-800">
                        Şifre sıfırlama bağlantısı <strong>{email}</strong> adresine gönderildi.
                        Lütfen e-posta kutunuzu kontrol edin.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Development mode: Show reset link */}
                {resetLink && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-orange-900 mb-2">
                      🔧 Development Mode - Direkt Link:
                    </p>
                    <a
                      href={resetLink}
                      className="text-sm text-orange-700 underline break-all hover:text-orange-900"
                      data-testid="dev-reset-link"
                    >
                      {resetLink}
                    </a>
                  </div>
                )}

                <div className="text-center space-y-2">
                  <p className="text-sm text-gray-600">
                    E-posta gelmediyse spam/gereksiz klasörünü kontrol edin.
                  </p>
                  <Button
                    variant="link"
                    onClick={() => setSuccess(false)}
                    className="text-teal-600"
                  >
                    Tekrar Gönder
                  </Button>
                </div>

                <Button
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="w-full"
                >
                  Giriş Sayfasına Dön
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
