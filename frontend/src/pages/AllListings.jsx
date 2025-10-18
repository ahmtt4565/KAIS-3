import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, DollarSign, MapPin, Star, Search, X, MessageSquare, Headphones, User, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import BottomNav from "@/components/BottomNav";
import KaisLogo from "@/components/KaisLogo";
import { CURRENCIES, COUNTRIES } from "../data/countries-currencies";
import { getCountryShortName } from "../data/countries-currencies";

export default function AllListings({ user, logout, unreadCount = 0 }) {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [filters, setFilters] = useState({
    country: "",
    from_currency: "",
    to_currency: "",
    search: ""
  });
  const [loading, setLoading] = useState(true);
  
  // Scroll behavior states
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowHeader(false);
      } else {
        setShowHeader(true);
      }
      
      setShowScrollTop(currentScrollY > 300);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, listings]);

  const fetchListings = async () => {
    try {
      const response = await axios.get(`${API}/listings`);
      setListings(response.data);
      setFilteredListings(response.data);
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...listings];

    if (filters.country) {
      filtered = filtered.filter(l => l.country === filters.country);
    }

    if (filters.from_currency) {
      filtered = filtered.filter(l => l.from_currency === filters.from_currency);
    }

    if (filters.to_currency) {
      filtered = filtered.filter(l => l.to_currency === filters.to_currency);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(l =>
        l.description?.toLowerCase().includes(searchLower) ||
        l.city?.toLowerCase().includes(searchLower) ||
        l.country?.toLowerCase().includes(searchLower) ||
        l.username?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredListings(filtered);
  };

  const clearFilters = () => {
    setFilters({
      country: "",
      from_currency: "",
      to_currency: "",
      search: ""
    });
  };

  const hasActiveFilters = filters.country || filters.from_currency || filters.to_currency || filters.search;

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <p className="text-xl text-gray-600 dark:text-gray-400">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pb-20 md:pb-8">
      {/* Header - Hide on scroll down */}
      <header className={`bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-transform duration-300 ${
        showHeader ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col items-center gap-3">
            {/* Top Row: Logo and Navigation */}
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => navigate('/dashboard')}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <KaisLogo className="h-16 w-auto cursor-pointer" onClick={() => navigate('/dashboard')} />
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-4">
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate('/create')}
                className="bg-gradient-to-r from-teal-600 to-orange-500 hover:from-teal-700 hover:to-orange-600 text-white font-semibold"
              >
                Create Listing
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/about')}
              >
                About
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => navigate('/chat')}
              >
                <MessageSquare className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/support')}
                title="Support"
              >
                <Headphones className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/profile/${user?.id || ''}`)}
              >
                <User className="w-5 h-5" />
              </Button>
              </div>
            </div>
          
            {/* Centered Page Title - Bold & Italic */}
            <div className="w-full text-center mt-3">
              <h1 className="text-2xl font-bold italic text-gray-800 dark:text-white">All Listings</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Sahibinden Style Filter Section - Orange */}
        <Card className="mb-6 border-2 border-orange-400 dark:border-orange-600 shadow-lg bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500 shadow-md">
                  <Search className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-orange-800 dark:text-orange-400 text-lg">Filters</h3>
                  <span className="text-sm text-orange-700 dark:text-orange-500 font-medium">
                    {filteredListings.length} listings found
                  </span>
                </div>
              </div>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="text-orange-600 border-orange-500 hover:bg-orange-100 dark:hover:bg-orange-900/30 font-semibold"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Search Input */}
              <Input
                placeholder="Search..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="h-10 border-orange-300 dark:border-orange-600 focus:border-orange-500 focus:ring-orange-500 bg-white dark:bg-gray-800"
              />

              {/* Country Select */}
              <select
                value={filters.country}
                onChange={(e) => setFilters({...filters, country: e.target.value})}
                className="h-10 px-3 text-sm border-2 border-orange-300 dark:border-orange-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">All Countries</option>
                {COUNTRIES.map(country => (
                  <option key={country} value={country}>
                    {getCountryShortName(country)}
                  </option>
                ))}
              </select>

              {/* From Currency */}
              <select
                value={filters.from_currency}
                onChange={(e) => setFilters({...filters, from_currency: e.target.value})}
                className="h-10 px-3 text-sm border-2 border-orange-300 dark:border-orange-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">Sending Currency</option>
                {CURRENCIES.map(curr => (
                  <option key={curr} value={curr}>{curr}</option>
                ))}
              </select>

              {/* To Currency */}
              <select
                value={filters.to_currency}
                onChange={(e) => setFilters({...filters, to_currency: e.target.value})}
                className="h-10 px-3 text-sm border-2 border-orange-300 dark:border-orange-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">Receiving Currency</option>
                {CURRENCIES.map(curr => (
                  <option key={curr} value={curr}>{curr}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Listings Grid - Sahibinden Style */}
        {filteredListings.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Listings Found</h3>
            <p className="text-gray-600 dark:text-gray-400">Try again by changing your search criteria</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredListings.map(listing => (
              <div
                key={listing.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow cursor-pointer overflow-hidden group"
                onClick={() => navigate(`/listing/${listing.id}`)}
              >
                <div className="flex flex-col sm:flex-row items-stretch">
                  {/* Left colored stripe */}
                  <div className="h-1 sm:h-auto sm:w-1 bg-gradient-to-r sm:bg-gradient-to-b from-yellow-400 to-orange-500 group-hover:h-2 sm:group-hover:h-auto sm:group-hover:w-2 transition-all"></div>
                  
                  {/* Content */}
                  <div className="flex-1 p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                      {/* Main Info */}
                      <div className="flex-1 min-w-0 w-full">
                        {/* Title Row */}
                        <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                            {getCountryShortName(listing.country)}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {format(new Date(listing.created_at), "dd MMM yyyy")}
                          </span>
                        </div>

                        {/* Exchange Info */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Sending:</span>
                            <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                              {listing.from_amount.toLocaleString()} {listing.from_currency}
                            </span>
                          </div>
                          <svg className="hidden sm:block w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Receiving:</span>
                            <span className="text-base sm:text-lg font-bold text-orange-600 dark:text-orange-400">
                              {listing.to_amount ? `${listing.to_amount.toLocaleString()} ${listing.to_currency}` : "Negotiable"}
                            </span>
                          </div>
                        </div>

                        {/* Location & Description */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>{listing.city}</span>
                          </div>
                          <span className="hidden sm:inline text-gray-500 dark:text-gray-500">•</span>
                          <p className="text-gray-600 dark:text-gray-400 line-clamp-2 sm:line-clamp-1 flex-1">
                            {listing.description}
                          </p>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center gap-3 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100 dark:border-gray-700">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            @{listing.username}
                          </span>
                        </div>
                      </div>

                      {/* Right Action */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-between gap-2 w-full sm:w-auto">
                        <Button
                          size="sm"
                          className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold flex-1 sm:flex-none"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/listing/${listing.id}`);
                          }}
                        >
                          Detail
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scroll to Top Button - Teal Theme */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className={`fixed bottom-24 right-6 md:bottom-8 md:right-8 z-40 p-3 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-2xl hover:shadow-teal-500/50 hover:scale-110 transition-all duration-300 ${
            showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
          aria-label="Yukarı Çık"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
      )}

      <BottomNav user={user} unreadCount={unreadCount} />
    </div>
  );
}
