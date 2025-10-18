import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe, MessageSquare, Shield, ArrowRight, DollarSign, Eye, EyeOff } from "lucide-react";
import KaisLogo from "@/components/KaisLogo";

import { COUNTRIES, LANGUAGES } from "../data/countries-currencies";

export default function LandingPage({ setUser }) {
  const [activeTab, setActiveTab] = useState("login");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    country: "",
    languages: []
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false,
    kvkk: false
  });

  // Reset agreements when switching tabs
  useEffect(() => {
    setAgreements({
      terms: false,
      privacy: false,
      kvkk: false
    });
    setError("");
  }, [activeTab]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Password confirmation validation for register
    if (activeTab === "register" && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Check agreements for both login and register
    if (!agreements.terms || !agreements.privacy || !agreements.kvkk) {
      setError("You must accept all agreements to continue");
      setLoading(false);
      return;
    }

    try {
      const endpoint = activeTab === "login" ? "/auth/login" : "/auth/register";
      const payload = activeTab === "login" 
        ? { email: formData.email, password: formData.password }
        : { ...formData, confirmPassword: undefined }; // Remove confirmPassword from payload

      const response = await axios.post(`${API}${endpoint}`, payload);
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
    } catch (err) {
      setError(err.response?.data?.detail || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageToggle = (lang) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang]
    }));
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50/30 to-orange-50/30"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center mb-16">
            <div className="mb-6">
              <h1 className="text-6xl font-bold bg-gradient-to-r from-teal-600 to-orange-500 bg-clip-text text-transparent">
                KAIS
              </h1>
            </div>
            <p className="text-3xl text-gray-700 dark:text-gray-300 font-medium mb-4">
              Peer-to-Peer Currency Exchange
            </p>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Connect with people worldwide to exchange currencies directly, safely, and conveniently
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-4 gap-6 mb-16">
            <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-teal-100 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <Globe className="w-10 h-10 text-teal-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Global Network</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Exchange currency safely anytime, anywhere.</p>
            </div>
            
            <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-teal-100 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <MessageSquare className="w-10 h-10 text-teal-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Direct Messaging</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Message directly to meet up</p>
            </div>
            
            <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-teal-100 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <Shield className="w-10 h-10 text-teal-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Trusted Transactions</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Check ratings and reviews for safe exchanges</p>
            </div>
            
            <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-teal-100 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <DollarSign className="w-10 h-10 text-teal-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">All Currencies</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Exchange any amount in any currency you want.</p>
            </div>
          </div>

          {/* Auth Card */}
          <div className="max-w-md mx-auto">
            <Card className="border-2 border-teal-100 dark:border-gray-700 shadow-2xl bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-2xl text-center text-gray-900 dark:text-white">Get Started</CardTitle>
                <CardDescription className="text-center text-gray-600 dark:text-gray-400">Join KAIS and start exchanging currency</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="login" data-testid="login-tab">Login</TabsTrigger>
                    <TabsTrigger value="register" data-testid="register-tab">Register</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          data-testid="login-email-input"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            data-testid="login-password-input"
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            required
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      {/* Terms and Agreements for Login */}
                      <div className="space-y-3 border-t pt-4">
                        <div className="flex items-start space-x-2">
                          <input
                            type="checkbox"
                            id="login-terms-checkbox"
                            data-testid="login-terms-checkbox"
                            checked={agreements.terms}
                            onChange={(e) => setAgreements({...agreements, terms: e.target.checked})}
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                          />
                          <label htmlFor="login-terms-checkbox" className="text-sm text-gray-700 dark:text-gray-300">
                            I have read and accept the 
                            <a 
                              href="/terms-of-service" 
                              target="_blank" 
                              className="text-teal-600 hover:text-teal-700 font-semibold underline mx-1"
                            >
                              Terms and Conditions
                            </a>
                          </label>
                        </div>
                        
                        <div className="flex items-start space-x-2">
                          <input
                            type="checkbox"
                            id="login-privacy-checkbox"
                            data-testid="login-privacy-checkbox"
                            checked={agreements.privacy}
                            onChange={(e) => setAgreements({...agreements, privacy: e.target.checked})}
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                          />
                          <label htmlFor="login-privacy-checkbox" className="text-sm text-gray-700 dark:text-gray-300">
                            I have read and accept the 
                            <a 
                              href="/privacy-policy" 
                              target="_blank" 
                              className="text-teal-600 hover:text-teal-700 font-semibold underline mx-1"
                            >
                              Privacy Policy
                            </a>
                          </label>
                        </div>
                        
                        <div className="flex items-start space-x-2">
                          <input
                            type="checkbox"
                            id="login-kvkk-checkbox"
                            data-testid="login-kvkk-checkbox"
                            checked={agreements.kvkk}
                            onChange={(e) => setAgreements({...agreements, kvkk: e.target.checked})}
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                          />
                          <label htmlFor="login-kvkk-checkbox" className="text-sm text-gray-700 dark:text-gray-300">
                            I have read the 
                            <a 
                              href="/kvkk-policy" 
                              target="_blank" 
                              className="text-teal-600 hover:text-teal-700 font-semibold underline mx-1"
                            >
                              GDPR Privacy Notice
                            </a>
                            and consent to the processing of my personal data
                          </label>
                        </div>
                      </div>

                      {error && <p className="text-red-500 text-sm" data-testid="error-message">{error}</p>}
                      <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={loading} data-testid="login-submit-btn">
                        {loading ? "Logging in..." : "Login"}
                      </Button>
                      
                      {/* OR Separator */}
                      <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">OR</span>
                        </div>
                      </div>
                      
                      {/* Google Sign In Button */}
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium"
                        onClick={() => {
                          const redirectUrl = `${window.location.origin}/dashboard`;
                          window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
                        }}
                      >
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continue with Google
                      </Button>
                      
                      <div className="text-center mt-3">
                        <Button
                          type="button"
                          variant="link"
                          onClick={() => window.location.href = '/forgot-password'}
                          className="text-sm text-teal-600 hover:text-teal-700"
                          data-testid="forgot-password-link"
                        >
                          Forgot Password
                        </Button>
                      </div>
                    </form>
                  </TabsContent>

                  <TabsContent value="register">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="reg-username">Username</Label>
                        <Input
                          id="reg-username"
                          data-testid="register-username-input"
                          value={formData.username}
                          onChange={(e) => setFormData({...formData, username: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="reg-email">Email</Label>
                        <Input
                          id="reg-email"
                          type="email"
                          data-testid="register-email-input"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="reg-password">Password</Label>
                        <div className="relative">
                          <Input
                            id="reg-password"
                            type={showPassword ? "text" : "password"}
                            data-testid="register-password-input"
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            required
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="reg-confirm-password">Confirm Password</Label>
                        <div className="relative">
                          <Input
                            id="reg-confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            data-testid="register-confirm-password-input"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                            required
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="country">Country</Label>
                        <select
                          id="country"
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          data-testid="register-country-select"
                          value={formData.country}
                          onChange={(e) => setFormData({...formData, country: e.target.value})}
                          required
                        >
                          <option value="">Select Country</option>
                          {COUNTRIES.map(country => (
                            <option key={country} value={country}>{country}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label>Languages (select languages you speak)</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {LANGUAGES.map(lang => (
                            <button
                              key={lang}
                              type="button"
                              onClick={() => handleLanguageToggle(lang)}
                              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                                formData.languages.includes(lang)
                                  ? "bg-teal-600 text-white"
                                  : "bg-gray-200 text-gray-700 dark:text-gray-300 hover:bg-gray-300"
                              }`}
                            >
                              {lang}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Terms and Agreements */}
                      <div className="space-y-3 border-t pt-4">
                        <div className="flex items-start space-x-2">
                          <input
                            type="checkbox"
                            id="terms-checkbox"
                            data-testid="terms-checkbox"
                            checked={agreements.terms}
                            onChange={(e) => setAgreements({...agreements, terms: e.target.checked})}
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                          />
                          <label htmlFor="terms-checkbox" className="text-sm text-gray-700 dark:text-gray-300">
                            I have read and accept the 
                            <a 
                              href="/terms-of-service" 
                              target="_blank" 
                              className="text-teal-600 hover:text-teal-700 font-semibold underline mx-1"
                            >
                              Terms and Conditions
                            </a>
                            . I acknowledge that I am responsible for all transactions on the platform and that KAIS cannot be held liable for fraud, money laundering, or other illegal activities.
                          </label>
                        </div>
                        
                        <div className="flex items-start space-x-2">
                          <input
                            type="checkbox"
                            id="privacy-checkbox"
                            data-testid="privacy-checkbox"
                            checked={agreements.privacy}
                            onChange={(e) => setAgreements({...agreements, privacy: e.target.checked})}
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                          />
                          <label htmlFor="privacy-checkbox" className="text-sm text-gray-700 dark:text-gray-300">
                            I have read and accept the 
                            <a 
                              href="/privacy-policy" 
                              target="_blank" 
                              className="text-teal-600 hover:text-teal-700 font-semibold underline mx-1"
                            >
                              Privacy Policy
                            </a>
                          </label>
                        </div>
                        
                        <div className="flex items-start space-x-2">
                          <input
                            type="checkbox"
                            id="kvkk-checkbox"
                            data-testid="kvkk-checkbox"
                            checked={agreements.kvkk}
                            onChange={(e) => setAgreements({...agreements, kvkk: e.target.checked})}
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                          />
                          <label htmlFor="kvkk-checkbox" className="text-sm text-gray-700 dark:text-gray-300">
                            I have read the 
                            <a 
                              href="/kvkk-policy" 
                              target="_blank" 
                              className="text-teal-600 hover:text-teal-700 font-semibold underline mx-1"
                            >
                              GDPR Privacy Notice
                            </a>
                            and consent to the processing of my personal data
                          </label>
                        </div>
                      </div>

                      {error && <p className="text-red-500 text-sm" data-testid="error-message">{error}</p>}
                      <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={loading} data-testid="register-submit-btn">
                        {loading ? "Creating Account..." : "Create Account"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* About Link */}
      <div className="text-center py-8">
        <Button
          variant="link"
          onClick={() => window.location.href = '/about'}
          className="text-teal-600 text-lg"
          data-testid="about-link"
        >
          Learn More About KAIS →
        </Button>
      </div>

      {/* How it Works */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-teal-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Create or Search Listing</h3>
              <p className="text-gray-600">Create a listing for the currency you want to exchange or browse existing offers.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-teal-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Connect & Chat</h3>
              <p className="text-gray-600">Discuss details and message users directly to arrange your meetup.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-teal-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Meet & Exchange</h3>
              <p className="text-gray-600">Meet in person, exchange currency, and rate your experience</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with Legal Links */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">KAIS</h3>
              <p className="text-gray-400">Peer-to-peer secure currency exchange platform</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <a href="/terms-of-service" className="text-gray-400 hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="/privacy-policy" className="text-gray-400 hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/kvkk-policy" className="text-gray-400 hover:text-white transition-colors">
                    GDPR Privacy Notice
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">About</h4>
              <ul className="space-y-2">
                <li>
                  <a href="/about" className="text-gray-400 hover:text-white transition-colors">
                    About KAIS
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-6 text-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} KAIS. All rights reserved.</p>
            <p className="mt-2">Platform only provides listing and communication services. KAIS is not responsible for transactions between users.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}