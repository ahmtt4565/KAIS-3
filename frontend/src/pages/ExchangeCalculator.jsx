import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeftRight, TrendingUp, DollarSign, ArrowLeft } from "lucide-react";
import { CURRENCIES } from "../data/countries-currencies";

export default function ExchangeCalculator({ user }) {
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
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard')}
                className="rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Currency Converter
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Real-time exchange rates
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs font-semibold">
                Live
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
        {/* Main Calculator Card */}
        <Card className="shadow-xl border-2 border-teal-200 dark:border-teal-800 bg-white dark:bg-gray-800 mb-6">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-gray-700 dark:to-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 shadow-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                  Currency Converter
                </CardTitle>
                {lastUpdated && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
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
                    className="h-14 text-lg font-semibold border-2 border-teal-300 dark:border-teal-700 focus:border-teal-500"
                  />
                </div>
                <select
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
                  className="h-14 px-4 text-base font-semibold border-2 border-teal-300 dark:border-teal-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 min-w-[120px]"
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
                size="lg"
                className="rounded-full border-2 border-teal-500 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 shadow-md hover:shadow-lg transition-all"
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
                className="w-full h-14 px-4 text-base font-semibold border-2 border-teal-300 dark:border-teal-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
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
              <div className="mt-6 p-6 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-xl">
                <div className="text-center space-y-4">
                  <div>
                    <p className="text-sm opacity-90">
                      {amount} {fromCurrency} =
                    </p>
                    <p className="text-4xl font-bold mt-2">
                      {getCurrencySymbol(toCurrency)} {result.converted_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {toCurrency}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-white/20">
                    <p className="text-sm opacity-90">
                      1 {fromCurrency} = {result.rate.toFixed(6)} {toCurrency}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {loading && (
              <div className="text-center py-4">
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
                <CardTitle className="text-lg font-bold">Popüler Döviz Kurları</CardTitle>
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
          <p>💱 Kurlar günlük olarak güncellenmektedir</p>
          <p className="mt-1">Baz para birimi: USD</p>
        </div>
      </div>
    </div>
  );
}
