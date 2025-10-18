import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const translations = {
  en: {
    // Landing Page
    appTitle: "KAIS",
    appSubtitle: "Peer-to-Peer Currency Exchange",
    appDescription: "Connect with people worldwide to exchange currencies directly, safely, and conveniently",
    
    // Features
    globalNetwork: "Global Network",
    globalNetworkDesc: "Exchange currencies securely anytime, anywhere.",
    directChat: "Direct Messaging",
    directChatDesc: "Message directly to meet up.",
    trustedTransactions: "Trusted Transactions",
    trustedTransactionsDesc: "Check ratings and reviews for safe exchanges.",
    allCurrencies: "All Currencies",
    allCurrenciesDesc: "Exchange any currency in any amount you want.",
    
    // How it works
    howItWorks: "How It Works",
    step1Title: "Post or Browse",
    step1Desc: "Create a listing for currency you want to exchange or browse existing offers.",
    step2Title: "Connect & Chat",
    step2Desc: "Discuss details and arrange meetings by messaging users directly.",
    step3Title: "Meet & Exchange",
    step3Desc: "Meet in person, exchange currencies, and rate your experience.",
    
    // Auth
    getStarted: "Get Started",
    joinKais: "Join KAIS and start exchanging",
    login: "Login",
    register: "Register",
    email: "Email",
    password: "Password",
    username: "Username",
    country: "Country",
    selectCountry: "Select Country",
    languages: "Languages (select all you speak)",
    loggingIn: "Logging in...",
    creatingAccount: "Creating Account...",
    createAccount: "Create Account",
    forgotPassword: "Forgot Password",
    
    // Dashboard
    welcome: "Welcome",
    logout: "Logout",
    findOpportunities: "Find currency exchange opportunities near you",
    needExchange: "Need to Exchange Currency?",
    createListingCTA: "Create a listing and connect with others in your area",
    createListing: "Create Listing",
    filterListings: "Filter Listings",
    search: "Search",
    searchPlaceholder: "City, description...",
    allCountries: "All Countries",
    fromCurrency: "From Currency",
    toCurrency: "To Currency",
    all: "All",
    clearFilters: "Clear Filters",
    availableListings: "Available Listings",
    noListingsFound: "No listings found matching your filters",
    viewDetails: "View Details",
    by: "by",
    
    // Notifications
    notifications: "Notifications",
    markAllRead: "Mark All as Read",
    noNotifications: "No notifications yet",
    deleteNotification: "Delete Notification",
    
    // Misc
    aboutLink: "Learn More About KAIS →",
  },
  
  tr: {
    // Landing Page
    appTitle: "KAIS",
    appSubtitle: "Kullanıcılar Arası Döviz Değişimi",
    appDescription: "Dünya çapında insanlarla doğrudan, güvenli ve kolay şekilde döviz değişimi yapın",
    
    // Features
    globalNetwork: "Global Ağ",
    globalNetworkDesc: "Her zaman her yerde güvenli döviz değişimi yapın.",
    directChat: "Direkt Mesajlaşma",
    directChatDesc: "Buluşmak için doğrudan mesajlaşın.",
    trustedTransactions: "Güvenilir İşlemler",
    trustedTransactionsDesc: "Puanları ve yorumları kontrol ederek güvenli değişim yapın.",
    allCurrencies: "Tüm Para Birimleri",
    allCurrenciesDesc: "İstediğiniz birimleri istediğiniz miktarda değiştirebilirsiniz.",
    
    // How it works
    howItWorks: "Nasıl Çalışır",
    step1Title: "İlan Oluştur veya Ara",
    step1Desc: "Değiştirmek istediğiniz para birimi için ilan oluşturun veya mevcut tekliflere göz atın.",
    step2Title: "Bağlan & Sohbet Et",
    step2Desc: "Detayları belirleyin ve buluşmayı ayarlamak için kullanıcılarla doğrudan mesajlaşın.",
    step3Title: "Tanışma & Değişim",
    step3Desc: "Yüz yüze buluşun, döviz değişin ve deneyiminizi değerlendirin.",
    
    // Auth
    getStarted: "Başlayın",
    joinKais: "KAIS'e katılın ve para değişimine başlayın",
    login: "Giriş Yap",
    register: "Kayıt Ol",
    email: "E-posta",
    password: "Şifre",
    username: "Kullanıcı Adı",
    country: "Ülke",
    selectCountry: "Ülke Seçin",
    languages: "Diller (konuştuğunuz dilleri seçin)",
    loggingIn: "Giriş Yapılıyor...",
    creatingAccount: "Hesap Oluşturuluyor...",
    createAccount: "Hesap Oluştur",
    forgotPassword: "Şifremi Unuttum",
    
    // Dashboard
    welcome: "Hoş geldiniz",
    logout: "Çıkış Yap",
    findOpportunities: "Yakınınızda döviz değişimi fırsatları bulun",
    needExchange: "Döviz Değişimi mi Gerekiyor?",
    createListingCTA: "Bir ilan oluşturun ve bölgenizdeki diğer kişilerle bağlantı kurun",
    createListing: "İlan Oluştur",
    filterListings: "İlanları Filtrele",
    search: "Ara",
    searchPlaceholder: "Şehir, açıklama...",
    allCountries: "Tüm Ülkeler",
    fromCurrency: "Sahip Olduğum Para",
    toCurrency: "İstediğim Para",
    all: "Hepsi",
    clearFilters: "Filtreleri Temizle",
    availableListings: "Mevcut İlanlar",
    noListingsFound: "Filtrelerinizle eşleşen ilan bulunamadı",
    viewDetails: "Detayları Gör",
    by: "tarafından",
    
    // Notifications
    notifications: "Bildirimler",
    markAllRead: "Tümünü Okundu İşaretle",
    noNotifications: "Henüz bildirim yok",
    deleteNotification: "Bildirimi Sil",
    
    // Misc
    aboutLink: "KAIS Hakkında Daha Fazla Bilgi →",
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    // Check localStorage first, default to English
    return localStorage.getItem('language') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key) => {
    return translations[language][key] || key;
  };

  const switchLanguage = (lang) => {
    setLanguage(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, switchLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
