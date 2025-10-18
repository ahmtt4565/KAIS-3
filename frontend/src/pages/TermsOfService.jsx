import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import KaisLogo from "@/components/KaisLogo";
import { useNavigate } from "react-router-dom";

export default function TermsOfService() {
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Terms and Conditions</h1>
          </div>

          <div className="space-y-6 text-gray-700 dark:text-gray-300">
            <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated: {new Date().toLocaleDateString('en-US')}</p>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">1. General Provisions</h2>
              <p>
                The KAIS platform ("Platform") provides a communication and listing platform for currency exchange between users. 
                By using this platform, you agree to the following terms and conditions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">2. Platform Services</h2>
              <p className="mb-2">The KAIS platform:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provides listing sharing services for currency exchange between users</li>
                <li>Enables messaging and communication between users</li>
                <li>Offers a user rating and review system</li>
                <li><strong className="text-red-600">DOES NOT PROVIDE ANY FINANCIAL TRANSACTIONS, MONEY TRANSFERS, OR PAYMENT SERVICES</strong></li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">3. DISCLAIMER OF LIABILITY</h2>
              <div className="bg-red-50 border-2 border-red-500 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-red-900 mb-4">IMPORTANT WARNING</h3>
                <p className="mb-4 font-semibold text-red-900">
                  KAIS platform is ABSOLUTELY NOT RESPONSIBLE for currency exchange transactions, meetings, 
                  and agreements between users.
                </p>
                <ul className="list-disc list-inside space-y-2 text-red-900">
                  <li><strong>Fraud and Counterfeiting:</strong> KAIS cannot be held liable for fraud, counterfeit money use, identity theft, and similar criminal activities between users who meet through the platform.</li>
                  <li><strong>Money Laundering:</strong> KAIS is not responsible for users' illegal money laundering, tax evasion, or transfer of illegal funds.</li>
                  <li><strong>Financial Losses:</strong> KAIS has no responsibility for exchange rate differences, financial losses, or damages that may occur in currency exchanges between users.</li>
                  <li><strong>Physical Security:</strong> KAIS cannot be held responsible for physical danger, theft, violence, or any security issues users may experience during meetings.</li>
                  <li><strong>Legal Responsibilities:</strong> Users are solely responsible for the legality of their transactions.</li>
                  <li><strong>Tax and Legal Declarations:</strong> Tax obligations and legal declarations resulting from currency exchange are the users' own responsibility.</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">4. User Responsibilities</h2>
              <p className="mb-2">As a user:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>You are obligated to share true and accurate information on the platform</li>
                <li>You are responsible for acting in accordance with legal regulations</li>
                <li>You are responsible for all transactions with other users</li>
                <li>Taking security measures and acting carefully is your responsibility</li>
                <li>Contacting authorities in suspicious situations is your responsibility</li>
                <li>Tax and legal obligations applicable to currency exchange belong to you</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">5. Prohibited Activities</h2>
              <p className="mb-2">The following activities are strictly prohibited on the platform:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Money laundering and illegal fund transfer</li>
                <li>Fraudulent activities and scams</li>
                <li>Using counterfeit money or fake documents</li>
                <li>Terrorist financing</li>
                <li>Tax evasion</li>
                <li>Sharing false or misleading information</li>
                <li>Harassment or threats against other users</li>
                <li>Violation of intellectual property rights</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">6. Account Termination</h2>
              <p>
                KAIS reserves the right to suspend or permanently terminate accounts of users involved in illegal activities, 
                suspicious transactions, or violations of these terms without prior notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">7. Security Recommendations</h2>
              <p className="mb-2">For your safety:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Meet in public and crowded places</li>
                <li>Carefully verify the authenticity of money</li>
                <li>Check the identity of the other party</li>
                <li>Share your location with trusted individuals</li>
                <li>Contact authorities in case of suspicious situations</li>
                <li>Keep exchange documents for records</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">8. Limitation of Liability</h2>
              <p>
                KAIS is merely an intermediary platform for users to communicate. The platform cannot be held responsible for:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                <li>Accuracy of information shared by users</li>
                <li>Agreements between users and their results</li>
                <li>Physical or financial damages during meetings</li>
                <li>Tax or legal issues related to transactions</li>
                <li>Illegal activities or criminal offenses</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">9. Changes to Terms</h2>
              <p>
                KAIS reserves the right to update these terms at any time. Users are responsible for regularly reviewing the terms. 
                Continued use of the platform after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">10. Contact</h2>
              <p>
                For questions or concerns about these terms, please contact us through the support section of the platform.
              </p>
            </section>

            <div className="bg-yellow-50 border-2 border-yellow-500 p-6 rounded-lg mt-8">
              <p className="font-semibold text-yellow-900">
                By using the KAIS platform, you acknowledge that you have read, understood, and accepted all these terms and conditions. 
                You also acknowledge that you are solely responsible for all transactions and that KAIS cannot be held liable for any issues that may arise.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
