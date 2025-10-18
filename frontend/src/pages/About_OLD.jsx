import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Globe, MessageSquare, Shield, Users, User } from "lucide-react";
import KaisLogo from "@/components/KaisLogo";

export default function About({ user, logout }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-purple-900 dark:via-gray-900 dark:to-blue-900">
      <header className="bg-white dark:bg-gradient-to-r dark:from-purple-900/90 dark:via-gray-900/90 dark:to-blue-900/90 backdrop-blur-md border-b border-gray-200 dark:border-purple-500/30 sticky top-0 z-50 dark:shadow-lg dark:shadow-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity select-none"
                onClick={() => navigate('/dashboard')}
                style={{ cursor: 'pointer' }}
              >
                <KaisLogo className="h-14 w-auto" />
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/about')}
                className="font-semibold"
              >
                About
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/listings')}
              >
                Listings
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
                <Shield className="w-5 h-5" />
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
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold italic mb-4 bg-gradient-to-r from-teal-600 to-orange-500 bg-clip-text text-transparent">
            About KAIS
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Peer-to-Peer Currency Exchange
          </p>
        </div>

        <div className="space-y-6">
          <Card className="border-2 border-teal-100 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Globe className="w-8 h-8 text-teal-600 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-2 dark:text-white">Global Network</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Make secure currency exchanges anytime, anywhere. Connect with users worldwide and find the best rates.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-teal-100 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <MessageSquare className="w-8 h-8 text-teal-600 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-2 dark:text-white">Direct Messaging</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Communicate directly with users. Arrange details and set up meetings. Secure and fast communication.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-teal-100 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Shield className="w-8 h-8 text-teal-600 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-2 dark:text-white">Trusted Transactions</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Trade with trusted users through ratings and reviews. Community safety is our priority.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-teal-100 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Users className="w-8 h-8 text-teal-600 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-2 dark:text-white">All Currencies</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Exchange with any currency in any amount you want. No limits, solutions suitable for everyone's needs.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <Button
            size="lg"
            onClick={() => navigate('/dashboard')}
            className="bg-gradient-to-r from-teal-600 to-orange-500 hover:from-teal-700 hover:to-orange-600"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}