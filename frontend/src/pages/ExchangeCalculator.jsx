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
        <Card className="shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 mb-6">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-teal-500">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                  Currency Converter
                </CardTitle>
                {lastUpdated && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Last updated: {new Date(lastUpdated).toLocaleString('en-US')}
                  </p>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* From Currency */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Amount to Convert
              </label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="h-12 text-lg font-semibold"
                  />
                </div>
                <select
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
                  className="h-12 px-4 text-base font-semibold border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 min-w-[130px]"
                >
                  {CURRENCIES.map(currency => (
                    <option key={currency} value={currency}>
                      {getCurrencySymbol(currency)} {currency}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <Button
                onClick={swapCurrencies}
                variant="outline"
                size="icon"
                className="rounded-full border-2 border-teal-500 text-teal-600 hover:bg-teal-50"
              >
                <ArrowLeftRight className="w-5 h-5" />
              </Button>
            </div>

            {/* To Currency */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                To Currency
              </label>
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className="w-full h-12 px-4 text-base font-semibold border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {CURRENCIES.map(currency => (
                  <option key={currency} value={currency}>
                    {getCurrencySymbol(currency)} {currency}
                  </option>
                ))}
              </select>
            </div>

            {/* Result Display */}
            {result && (
              <div className="mt-6 p-6 rounded-lg bg-teal-50 dark:bg-teal-900/20 border-2 border-teal-500">
                <div className="text-center space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {amount} {fromCurrency} =
                    </p>
                    <p className="text-4xl font-bold text-teal-600 dark:text-teal-400 mt-2">
                      {getCurrencySymbol(toCurrency)} {result.converted_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {toCurrency}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-teal-200 dark:border-teal-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      1 {fromCurrency} = {result.rate.toFixed(6)} {toCurrency}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {loading && (
              <div className="text-center py-6">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-teal-500 border-t-transparent"></div>
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* USD to AED */}
                {exchangeRates.rates.AED && (
                  <div 
                    className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer border border-gray-200 dark:border-gray-600"
                    onClick={() => {
                      setFromCurrency('USD');
                      setToCurrency('AED');
                      setAmount(1);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">USD → AED</p>
                        <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                          {exchangeRates.rates.AED.toFixed(2)} د.إ
                        </p>
                      </div>
                      <div className="text-3xl">💵</div>
                    </div>
                  </div>
                )}

                {/* TRY to AED */}
                {exchangeRates.rates.AED && exchangeRates.rates.TRY && (
                  <div 
                    className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer border border-gray-200 dark:border-gray-600"
                    onClick={() => {
                      setFromCurrency('TRY');
                      setToCurrency('AED');
                      setAmount(1);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">TRY → AED</p>
                        <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                          {(exchangeRates.rates.AED / exchangeRates.rates.TRY).toFixed(4)} د.إ
                        </p>
                      </div>
                      <div className="text-3xl">₺</div>
                    </div>
                  </div>
                )}

                {/* EUR to USD */}
                {exchangeRates.rates.EUR && (
                  <div 
                    className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer border border-gray-200 dark:border-gray-600"
                    onClick={() => {
                      setFromCurrency('EUR');
                      setToCurrency('USD');
                      setAmount(1);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">EUR → USD</p>
                        <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                          ${(1 / exchangeRates.rates.EUR).toFixed(4)}
                        </p>
                      </div>
                      <div className="text-3xl">💶</div>
                    </div>
                  </div>
                )}

                {/* USD to GBP */}
                {exchangeRates.rates.GBP && (
                  <div 
                    className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer border border-gray-200 dark:border-gray-600"
                    onClick={() => {
                      setFromCurrency('USD');
                      setToCurrency('GBP');
                      setAmount(1);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">USD → GBP</p>
                        <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                          £{exchangeRates.rates.GBP.toFixed(4)}
                        </p>
                      </div>
                      <div className="text-3xl">💷</div>
                    </div>
                  </div>
                )}

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
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">USD → TRY</p>
                        <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                          ₺{exchangeRates.rates.TRY.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-3xl">💵</div>
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
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">USD → EUR</p>
                        <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                          €{exchangeRates.rates.EUR.toFixed(4)}
                        </p>
                      </div>
                      <div className="text-3xl">💶</div>
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
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">EUR → TRY</p>
                        <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                          ₺{(exchangeRates.rates.TRY / exchangeRates.rates.EUR).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-3xl">💶</div>
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
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">GBP → TRY</p>
                        <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                          ₺{(exchangeRates.rates.TRY / exchangeRates.rates.GBP).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-3xl">💷</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info */}
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <p>Rates are updated daily at midnight UTC</p>
          <p>Base currency: USD • 150+ currencies available</p>
        </div>
      </div>

      {/* Bottom Navigation for Mobile */}
      <BottomNav user={user} unreadCount={unreadCount} />
    </div>
  );
}
