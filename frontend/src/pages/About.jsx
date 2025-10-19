import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Globe, MessageSquare, Shield, Users, User, Zap, Lock, TrendingUp, Award, Clock, MapPin, DollarSign, Star, Heart, CheckCircle, Headphones, PlayCircle } from "lucide-react";
import KaisLogo from "@/components/KaisLogo";
import VideoOnboardingTutorial from "@/components/VideoOnboardingTutorial";

export default function About({ user, logout }) {
  const navigate = useNavigate();
  const [showTutorial, setShowTutorial] = useState(false);

  const features = [
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Global Currency Exchange",
      description: "Connect with people worldwide to exchange currencies at fair rates"
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: "Direct Communication",
      description: "Chat directly with other users to arrange exchanges safely"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Secure Platform",
      description: "Your data and privacy are protected with industry-standard security"
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: "Rating System",
      description: "Build trust with our user rating and review system"
    },
    {
      icon: <MapPin className="w-8 h-8" />,
      title: "Location Sharing",
      description: "Optional location sharing to find nearby exchange partners"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Instant Matching",
      description: "Find the perfect exchange match with our smart filtering"
    }
  ];

  const stats = [
    { number: "50+", label: "Countries", icon: <Globe className="w-6 h-6" /> },
    { number: "1000+", label: "Active Users", icon: <Users className="w-6 h-6" /> },
    { number: "100+", label: "Currencies", icon: <DollarSign className="w-6 h-6" /> },
    { number: "4.8★", label: "User Rating", icon: <Star className="w-6 h-6" /> }
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Create Your Listing",
      description: "Post what currency you have and what you need"
    },
    {
      step: "2",
      title: "Find a Match",
      description: "Browse listings or wait for someone to contact you"
    },
    {
      step: "3",
      title: "Chat & Arrange",
      description: "Communicate safely through our platform"
    },
    {
      step: "4",
      title: "Meet & Exchange",
      description: "Meet in a public place and complete your exchange"
    },
    {
      step: "5",
      title: "Rate & Review",
      description: "Leave feedback to help the community grow"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate('/dashboard')}
              >
                <KaisLogo className="h-12 w-auto" />
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/listings')}>
                Listings
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate('/chat')}>
                <MessageSquare className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate('/support')} title="Support">
                <Headphones className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate(`/profile/${user?.id || ''}`)}>
                <User className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-teal-100 dark:bg-teal-900/30 px-4 py-2 rounded-full mb-6">
            <Heart className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span className="text-sm font-medium text-teal-700 dark:text-teal-300">Trusted by thousands worldwide</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-teal-600 via-purple-600 to-orange-600 bg-clip-text text-transparent">
            About KAIS
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed mb-8">
            The peer-to-peer currency exchange platform connecting people across the globe. 
            Exchange currencies directly, safely, and at fair rates.
          </p>
          
          {/* Video Tutorial Button */}
          <div className="flex justify-center">
            <Button
              onClick={() => setShowTutorial(true)}
              className="bg-gradient-to-r from-teal-500 to-orange-500 hover:from-teal-600 hover:to-orange-600 text-white text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <PlayCircle className="w-6 h-6 mr-2" />
              Watch Interactive Tutorial
            </Button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <Card key={index} className="border-2 hover:border-teal-500 transition-all duration-300 hover:shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-teal-500 to-orange-500 rounded-full mb-3 text-white">
                  {stat.icon}
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stat.number}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Why Choose KAIS?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-orange-500 rounded-2xl flex items-center justify-center text-white mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            How It Works
          </h2>
          <div className="relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-12 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-purple-500 to-orange-500 opacity-20"></div>
            
            <div className="grid md:grid-cols-5 gap-8 relative">
              {howItWorks.map((item, index) => (
                <div key={index} className="text-center">
                  <div className="relative inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-teal-500 to-orange-500 rounded-full mb-4 text-white font-bold text-3xl shadow-lg">
                    {item.step}
                    <CheckCircle className="absolute -bottom-2 -right-2 w-8 h-8 bg-white dark:bg-gray-900 rounded-full p-1 text-green-500" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">{item.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mission Statement */}
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-teal-500 to-orange-500 text-white mb-16">
          <CardContent className="p-12 text-center">
            <Award className="w-16 h-16 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
            <p className="text-lg leading-relaxed max-w-3xl mx-auto opacity-95">
              To create a transparent, accessible, and secure platform where people can exchange currencies 
              peer-to-peer, avoiding high bank fees and unfavorable exchange rates. We believe in empowering 
              individuals to take control of their currency exchanges while building a trustworthy community.
            </p>
          </CardContent>
        </Card>

        {/* Safety Tips */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Safety First
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-2 border-green-200 dark:border-green-900">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Do's</h3>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                      <li>• Meet in public, well-lit places</li>
                      <li>• Verify the other person's identity</li>
                      <li>• Check currency authenticity</li>
                      <li>• Use the rating system</li>
                      <li>• Report suspicious activity</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-red-200 dark:border-red-900">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Don'ts</h3>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                      <li>• Never meet in private locations</li>
                      <li>• Don't share personal financial details</li>
                      <li>• Avoid exchanges without communication</li>
                      <li>• Don't ignore red flags</li>
                      <li>• Never rush the exchange process</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="border-0 shadow-xl bg-gray-50 dark:bg-gray-800">
            <CardContent className="p-12">
              <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                Ready to Start Exchanging?
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                Join thousands of users who trust KAIS for their currency exchange needs. 
                Create your first listing today!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={() => navigate('/create')}
                  className="bg-gradient-to-r from-teal-600 to-orange-500 hover:from-teal-700 hover:to-orange-600 text-white font-semibold px-8"
                >
                  Create Listing
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/listings')}
                  className="border-2 font-semibold"
                >
                  View Listings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600 dark:text-gray-400">
          <p className="mb-2">© 2025 KAIS. All rights reserved.</p>
          <div className="flex justify-center gap-6 text-sm">
            <a href="/terms-of-service" className="hover:text-teal-600 transition-colors">Terms of Service</a>
            <a href="/privacy-policy" className="hover:text-teal-600 transition-colors">Privacy Policy</a>
            <a href="/kvkk-policy" className="hover:text-teal-600 transition-colors">GDPR Notice</a>
          </div>
        </div>
      </footer>

      {/* Video Tutorial Modal */}
      {showTutorial && (
        <VideoOnboardingTutorial
          onComplete={() => setShowTutorial(false)}
        />
      )}
    </div>
  );
}
