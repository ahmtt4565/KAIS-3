import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, DollarSign, Upload, X } from "lucide-react";
import KaisLogo from "@/components/KaisLogo";
import AdvancedImageUpload from "@/components/AdvancedImageUpload";

import { CURRENCIES, COUNTRIES } from "../data/countries-currencies";
import { getCountryShortName } from "../data/countries-currencies";
import BottomNav from "@/components/BottomNav";

export default function CreateListing({ user, logout }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    from_currency: "",
    from_amount: "",
    to_currency: "",
    to_amount: "",
    country: user.country || "",
    city: "",
    description: ""
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];
    
    for (let file of files) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError(`File ${file.name} is too large. Maximum 5MB allowed.`);
        continue;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        setError(`File ${file.name} is not a valid image format.`);
        continue;
      }
      
      validFiles.push(file);
    }
    
    setSelectedFiles(prev => [...prev, ...validFiles].slice(0, 3)); // Max 3 files
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        ...formData,
        from_amount: parseFloat(formData.from_amount),
        to_amount: formData.to_amount ? parseFloat(formData.to_amount) : null
      };

      const response = await axios.post(`${API}/listings`, payload, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const listingId = response.data.id;
      
      // Upload files if any
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        selectedFiles.forEach(file => {
          formData.append('files', file);
        });
        
        await axios.post(`${API}/listings/${listingId}/upload-photos`, formData, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create listing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} data-testid="back-btn">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div 
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity select-none"
              onClick={() => navigate('/dashboard')}
              style={{ cursor: 'pointer' }}
            >
              <KaisLogo className="h-12 w-auto" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="border-2 border-teal-100 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-3xl">Döviz Değişim İlanı Oluştur</CardTitle>
            <CardDescription>Fill in the details about the currency you want to exchange</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Currency From */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="from_currency">Currency You Have</Label>
                  <select
                    id="from_currency"
                    className="w-full h-9 border border-input bg-background rounded-md px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring dark:bg-gray-800 dark:border-gray-700 dark:text-white transition-colors"
                    value={formData.from_currency}
                    onChange={(e) => setFormData({...formData, from_currency: e.target.value})}
                    required
                    data-testid="from-currency-select"
                  >
                    <option value="">Select Currency</option>
                    {CURRENCIES.map(curr => (
                      <option key={curr} value={curr}>{curr}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="from_amount">Amount</Label>
                  <Input
                    id="from_amount"
                    type="number"
                    step="0.01"
                    placeholder="1000"
                    value={formData.from_amount}
                    onChange={(e) => setFormData({...formData, from_amount: e.target.value})}
                    required
                    data-testid="from-amount-input"
                  />
                </div>
              </div>

              {/* Currency To */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="to_currency">Currency You Need</Label>
                  <select
                    id="to_currency"
                    className="w-full h-9 border border-input bg-background rounded-md px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring dark:bg-gray-800 dark:border-gray-700 dark:text-white transition-colors"
                    value={formData.to_currency}
                    onChange={(e) => setFormData({...formData, to_currency: e.target.value})}
                    required
                    data-testid="to-currency-select"
                  >
                    <option value="">Select Currency</option>
                    {CURRENCIES.map(curr => (
                      <option key={curr} value={curr}>{curr}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="to_amount">Expected Amount (Optional)</Label>
                  <Input
                    id="to_amount"
                    type="number"
                    step="0.01"
                    placeholder="Optional"
                    value={formData.to_amount}
                    onChange={(e) => setFormData({...formData, to_amount: e.target.value})}
                    data-testid="to-amount-input"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="country">Country</Label>
                  <select
                    id="country"
                    className="w-full h-9 border border-input bg-background rounded-md px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring dark:bg-gray-800 dark:border-gray-700 dark:text-white transition-colors"
                    value={formData.country}
                    onChange={(e) => setFormData({...formData, country: e.target.value})}
                    required
                    data-testid="country-select"
                  >
                    <option value="">Select Country</option>
                    {COUNTRIES.map(country => (
                      <option key={country} value={country}>
                        {getCountryShortName(country)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="Dubai, Istanbul, etc."
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    required
                    data-testid="city-input"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Provide details about your exchange needs, preferred meeting location, etc."
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                  data-testid="description-input"
                />
              </div>

              {/* Photo Upload - Advanced */}
              <div>
                <Label>Fotoğraflar (Opsiyonel - Maksimum 3 adet)</Label>
                <div className="mt-2">
                  <AdvancedImageUpload 
                    onImageSelect={(images) => {
                      const files = images.map(img => img.file).filter(f => f);
                      setSelectedFiles(files.slice(0, 3)); // Max 3 photos
                    }}
                  />
                </div>
              </div>

              {error && <p className="text-red-500 text-sm" data-testid="error-message">{error}</p>}

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-teal-600 hover:bg-teal-700"
                  disabled={loading}
                  data-testid="submit-listing-btn"
                >
                  {loading ? "Oluşturuluyor..." : "Create Listing"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      
      {/* Bottom Navigation - Mobile Only */}
      <BottomNav user={user} />
      <div className="h-20 md:hidden"></div>
    </div>
  );
}