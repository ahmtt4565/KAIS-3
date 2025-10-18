import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeftRight, TrendingUp, DollarSign, MessageSquare, User, LogOut, Bell } from "lucide-react";
import { CURRENCIES } from "../data/countries-currencies";
import KaisLogo from "@/components/KaisLogo";
import BottomNav from "@/components/BottomNav";

export default function ExchangeCalculator({ user, logout, unreadCount = 0 }) {
  const navigate = useNavigate();
  const [amount, setAmount] = useState(100);
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("TRY");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exchangeRates, setExchangeRates] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch all exchange rates on mount
  useEffect(() => {
    fetchExchangeRates();
  }, []);

  // Auto-calculate when inputs change
  useEffect(() => {
    if (amount > 0 && fromCurrency && toCurrency) {
      calculateExchange();
    }
  }, [amount, fromCurrency, toCurrency]);

  const fetchExchangeRates = async () => {
    try {
      const response = await axios.get(`${API}/exchange-rates`);
      setExchangeRates(response.data);
      setLastUpdated(response.data.last_updated);
    } catch (error) {
      console.error("Error fetching exchange rates:", error);
    }
  };

  const calculateExchange = async () => {
    if (!amount || amount <= 0) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`${API}/exchange-rates/convert`, {
        params: {
          amount: parseFloat(amount),
          from_currency: fromCurrency,
          to_currency: toCurrency
        }
      });
      setResult(response.data);
    } catch (error) {
      console.error("Error calculating exchange:", error);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const swapCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  const getCurrencySymbol = (currency) => {
    const symbols = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      TRY: '₺',
      JPY: '¥',
      CNY: '¥',
      AED: 'د.إ',
      SAR: '﷼',
      CHF: 'CHF',
      CAD: 'C$',
      AUD: 'A$',
    };
    return symbols[currency] || '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header - Same as Dashboard */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity select-none"
              onClick={() => navigate('/dashboard')}
              style={{ cursor: 'pointer' }}
            >
              <KaisLogo className="h-14 w-auto cursor-pointer" />
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/about')}
                  className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-all"
                >
                  About
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/listings')}
                  className="rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                >
                  Listings
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/exchange')}
                  className="rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 transition-all"
                >
                  💱 Exchange
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="relative rounded-full hover:bg-pink-50 dark:hover:bg-pink-900/30 hover:text-pink-600 dark:hover:text-pink-400 transition-all"
                  onClick={() => navigate('/chat')}
                >
                  <MessageSquare className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg animate-pulse">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Button>
              </div>

              {/* Profile & Logout */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(`/profile/${user?.id}`)}
                  className="rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                >
                  <User className="w-5 h-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all shadow-sm"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 md:py-8 pb-24 md:pb-8">
        {/* Main Calculator Card */}
        <Card className="shadow-2xl border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl mb-6 overflow-hidden">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 text-white relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-r from-teal-400/20 via-cyan-400/20 to-blue-400/20 animate-pulse"></div>
            
            <div className="flex items-center gap-3 relative z-10">
              <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm shadow-xl">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-3xl font-black text-white drop-shadow-lg">
                  Currency Converter
                </CardTitle>
                {lastUpdated && (
                  <p className="text-sm text-white/90 mt-1 font-medium">
                    Last updated: {new Date(lastUpdated).toLocaleString('en-US')}
                  </p>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 md:p-8 space-y-6">
            {/* From Currency */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
                <span className="text-xl">💰</span> Amount to Convert
              </label>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="h-16 text-2xl font-bold border-3 border-teal-300 dark:border-teal-700 focus:border-teal-500 rounded-xl shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-white to-gray-50 dark:from-gray-700 dark:to-gray-800"
                  />
                </div>
                <select
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
                  className="h-16 px-5 text-lg font-bold border-3 border-teal-300 dark:border-teal-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-4 focus:ring-teal-500/50 focus:border-teal-500 min-w-[140px] shadow-lg hover:shadow-xl transition-all cursor-pointer"
                >
                  {CURRENCIES.map(currency => (
                    <option key={currency} value={currency}>
                      {getCurrencySymbol(currency)} {currency}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Swap Button - Ultra Modern */}
            <div className="flex justify-center relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-1 bg-gradient-to-r from-transparent via-teal-300 to-transparent"></div>
              </div>
              <Button
                onClick={swapCurrencies}
                variant="outline"
                size="lg"
                className="relative z-10 rounded-2xl border-3 border-teal-500 bg-gradient-to-br from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600 shadow-2xl hover:shadow-teal-500/50 hover:scale-110 transition-all duration-300 p-4"
              >
                <ArrowLeftRight className="w-7 h-7 animate-pulse" />
              </Button>
            </div>

            {/* To Currency */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
                <span className="text-xl">🎯</span> To Currency
              </label>
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className="w-full h-16 px-5 text-lg font-bold border-3 border-teal-300 dark:border-teal-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-4 focus:ring-teal-500/50 focus:border-teal-500 shadow-lg hover:shadow-xl transition-all cursor-pointer"
              >
                {CURRENCIES.map(currency => (
                  <option key={currency} value={currency}>
                    {getCurrencySymbol(currency)} {currency}
                  </option>
                ))}
              </select>
            </div>

            {/* Result Display - Ultra Modern with Animation */}
            {result && (
              <div className="mt-8 relative">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 rounded-3xl blur-xl opacity-60 animate-pulse"></div>
                
                <div className="relative p-8 rounded-3xl bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-500 text-white shadow-2xl transform hover:scale-105 transition-all duration-300">
                  <div className="text-center space-y-6">
                    <div>
                      <p className="text-base opacity-90 font-semibold mb-2 flex items-center justify-center gap-2">
                        <span className="text-2xl">💵</span>
                        {amount} {fromCurrency} =
                      </p>
                      <div className="flex items-center justify-center gap-3">
                        <span className="text-5xl md:text-6xl">
                          {getCurrencySymbol(toCurrency)}
                        </span>
                        <p className="text-5xl md:text-7xl font-black tracking-tight">
                          {result.converted_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <span className="text-3xl font-bold opacity-90">
                          {toCurrency}
                        </span>
                      </div>
                    </div>
                    <div className="pt-6 border-t-2 border-white/30">
                      <p className="text-base opacity-95 font-semibold flex items-center justify-center gap-2">
                        <span>📊</span>
                        Exchange Rate: 1 {fromCurrency} = {result.rate.toFixed(6)} {toCurrency}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {loading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent shadow-lg"></div>
                <p className="mt-4 text-teal-600 font-semibold">Calculating...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Popular Currency Pairs */}
        {exchangeRates && exchangeRates.rates && (
          <Card className="shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <CardHeader className="border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-teal-600" />
                <CardTitle className="text-lg font-bold">Popular Exchange Rates</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* USD to TRY */}
                {exchangeRates.rates.TRY && (
                  <div 
                    className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer border border-gray-200 dark:border-gray-600"
                    onClick={() => {
                      setFromCurrency('USD');
                      setToCurrency('TRY');
                      setAmount(1);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">USD → TRY</p>
                        <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                          ₺{exchangeRates.rates.TRY.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-3xl">💵➜₺</div>
                    </div>
                  </div>
                )}

                {/* USD to EUR */}
                {exchangeRates.rates.EUR && (
                  <div 
                    className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer border border-gray-200 dark:border-gray-600"
                    onClick={() => {
                      setFromCurrency('USD');
                      setToCurrency('EUR');
                      setAmount(1);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">USD → EUR</p>
                        <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                          €{exchangeRates.rates.EUR.toFixed(4)}
                        </p>
                      </div>
                      <div className="text-3xl">💵➜€</div>
                    </div>
                  </div>
                )}

                {/* EUR to TRY */}
                {exchangeRates.rates.EUR && exchangeRates.rates.TRY && (
                  <div 
                    className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer border border-gray-200 dark:border-gray-600"
                    onClick={() => {
                      setFromCurrency('EUR');
                      setToCurrency('TRY');
                      setAmount(1);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">EUR → TRY</p>
                        <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                          ₺{(exchangeRates.rates.TRY / exchangeRates.rates.EUR).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-3xl">€➜₺</div>
                    </div>
                  </div>
                )}

                {/* GBP to TRY */}
                {exchangeRates.rates.GBP && exchangeRates.rates.TRY && (
                  <div 
                    className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer border border-gray-200 dark:border-gray-600"
                    onClick={() => {
                      setFromCurrency('GBP');
                      setToCurrency('TRY');
                      setAmount(1);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">GBP → TRY</p>
                        <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                          ₺{(exchangeRates.rates.TRY / exchangeRates.rates.GBP).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-3xl">£➜₺</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info */}
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>💱 Rates are updated daily</p>
          <p className="mt-1">Base currency: USD</p>
        </div>
      </div>

      {/* Bottom Navigation for Mobile */}
      <BottomNav user={user} unreadCount={unreadCount} />
    </div>
  );
}
