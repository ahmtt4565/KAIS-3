import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import KaisLogo from "@/components/KaisLogo";
import { useNavigate } from "react-router-dom";

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 dark:from-gray-900 to-orange-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>

        <Card className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <KaisLogo className="w-12 h-12" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Privacy Policy</h1>
          </div>

          <div className="space-y-6 text-gray-700 dark:text-gray-300">
            <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated: {new Date().toLocaleDateString('en-US')}</p>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">1. Introduction</h2>
              <p>
                KAIS ("we", "our", "us") respects your privacy and is committed to protecting your personal data. 
                This privacy policy explains how we collect, use, and protect your information when you use our platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">2. Information We Collect</h2>
              <p className="mb-2">We collect the following types of information:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Account Information:</strong> Username, email address, password, country, and languages</li>
                <li><strong>Profile Information:</strong> Optional profile details and preferences</li>
                <li><strong>Location Data:</strong> If you enable location sharing, we collect your geographic coordinates</li>
                <li><strong>Listing Information:</strong> Currency exchange listings you create</li>
                <li><strong>Messages:</strong> Communications between users on the platform</li>
                <li><strong>Usage Data:</strong> How you interact with our platform, including pages visited and features used</li>
                <li><strong>Device Information:</strong> Device type, browser, IP address, and operating system</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">3. How We Use Your Information</h2>
              <p className="mb-2">We use your information to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide and maintain our services</li>
                <li>Enable communication between users</li>
                <li>Match users for currency exchanges</li>
                <li>Improve user experience and platform functionality</li>
                <li>Send important notifications about your account</li>
                <li>Prevent fraud and ensure platform security</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">4. Information Sharing</h2>
              <p className="mb-2">We share your information only in the following circumstances:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>With Other Users:</strong> Your username, rating, and listing details are visible to other users</li>
                <li><strong>Location Sharing:</strong> If enabled, your location is shared only with users you're actively chatting with</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>Service Providers:</strong> With trusted third parties who help us operate the platform</li>
              </ul>
              <p className="mt-2 font-semibold">We DO NOT sell your personal data to third parties.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">5. Location Data</h2>
              <p>
                Location sharing is entirely optional. When enabled:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                <li>Your location is stored securely on our servers</li>
                <li>Only users you're actively messaging can see your location</li>
                <li>You can disable location sharing at any time in your profile settings</li>
                <li>Disabling location sharing immediately removes your location from our servers</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">6. Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your data, including:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                <li>Encrypted data transmission (HTTPS)</li>
                <li>Secure password storage with hashing</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication</li>
              </ul>
              <p className="mt-2">
                However, no system is 100% secure. We cannot guarantee absolute security of your data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">7. Your Rights</h2>
              <p className="mb-2">You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to processing of your data</li>
                <li>Export your data in a portable format</li>
                <li>Withdraw consent at any time</li>
              </ul>
              <p className="mt-2">
                To exercise these rights, please contact us through the support section.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">8. Data Retention</h2>
              <p>
                We retain your data for as long as your account is active or as needed to provide services. 
                When you delete your account, we permanently delete your personal data within 30 days, 
                except where retention is required by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">9. Cookies</h2>
              <p>
                We use essential cookies to maintain your session and remember your preferences. 
                These cookies are necessary for the platform to function properly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">10. Children's Privacy</h2>
              <p>
                Our platform is not intended for users under 18 years of age. We do not knowingly collect 
                information from children. If we discover we have collected data from a child, we will delete it immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">11. Changes to This Policy</h2>
              <p>
                We may update this privacy policy from time to time. We will notify you of significant changes 
                by posting a notice on the platform or sending you an email.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">12. Contact Us</h2>
              <p>
                If you have questions about this privacy policy or our data practices, please contact us 
                through the support section of the platform.
              </p>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}
