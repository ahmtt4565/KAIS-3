import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import KaisLogo from "@/components/KaisLogo";
import { useNavigate } from "react-router-dom";

export default function KVKKPolicy() {
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">GDPR Privacy Notice</h1>
          </div>

          <div className="space-y-6 text-gray-700 dark:text-gray-300">
            <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated: {new Date().toLocaleDateString('en-US')}</p>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">1. Data Controller</h2>
              <p>
                KAIS is the data controller responsible for your personal data. We process your data in accordance 
                with the General Data Protection Regulation (GDPR) and applicable data protection laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">2. Legal Basis for Processing</h2>
              <p className="mb-2">We process your personal data based on the following legal grounds:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Consent:</strong> You have given explicit consent for specific processing purposes</li>
                <li><strong>Contractual Necessity:</strong> Processing is necessary to provide our services</li>
                <li><strong>Legal Obligation:</strong> Processing is required to comply with legal requirements</li>
                <li><strong>Legitimate Interest:</strong> Processing is necessary for our legitimate business interests</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">3. Types of Personal Data We Process</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Identity Data:</h3>
                  <ul className="list-disc list-inside ml-4">
                    <li>Username</li>
                    <li>Email address</li>
                    <li>Country</li>
                    <li>Languages spoken</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Location Data:</h3>
                  <ul className="list-disc list-inside ml-4">
                    <li>Geographic coordinates (if location sharing is enabled)</li>
                    <li>IP address</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Usage Data:</h3>
                  <ul className="list-disc list-inside ml-4">
                    <li>Listings created</li>
                    <li>Messages sent</li>
                    <li>User ratings given and received</li>
                    <li>Platform interaction history</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Technical Data:</h3>
                  <ul className="list-disc list-inside ml-4">
                    <li>Device information</li>
                    <li>Browser type and version</li>
                    <li>Operating system</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">4. Your GDPR Rights</h2>
              <p className="mb-2">Under GDPR, you have the following rights regarding your personal data:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
                <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete data</li>
                <li><strong>Right to Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
                <li><strong>Right to Restrict Processing:</strong> Limit how we use your data</li>
                <li><strong>Right to Data Portability:</strong> Receive your data in a structured, machine-readable format</li>
                <li><strong>Right to Object:</strong> Object to processing based on legitimate interests</li>
                <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time</li>
                <li><strong>Right to Lodge a Complaint:</strong> File a complaint with a supervisory authority</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">5. Data Retention Periods</h2>
              <p className="mb-2">We retain your data for the following periods:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Active Account Data:</strong> Retained while your account is active</li>
                <li><strong>Deleted Account Data:</strong> Permanently deleted within 30 days of account deletion</li>
                <li><strong>Legal Requirements:</strong> Some data may be retained longer if required by law</li>
                <li><strong>Messages:</strong> Support messages are automatically deleted after 5 minutes</li>
                <li><strong>Listings:</strong> Expired listings are marked as inactive but not immediately deleted</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">6. International Data Transfers</h2>
              <p>
                Your data may be transferred to and processed in countries outside your country of residence. 
                We ensure appropriate safeguards are in place to protect your data in accordance with GDPR requirements, 
                including:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                <li>Standard contractual clauses approved by the European Commission</li>
                <li>Adequacy decisions where applicable</li>
                <li>Other legally approved transfer mechanisms</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">7. Automated Decision-Making</h2>
              <p>
                We do not use automated decision-making or profiling that produces legal effects or similarly 
                significant effects on you.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">8. Data Security Measures</h2>
              <p className="mb-2">We implement appropriate technical and organizational measures to protect your data:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Encryption of data in transit (HTTPS/TLS)</li>
                <li>Secure password hashing</li>
                <li>Regular security assessments</li>
                <li>Access controls and authentication</li>
                <li>Employee training on data protection</li>
                <li>Incident response procedures</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">9. Data Breach Notification</h2>
              <p>
                In the event of a data breach that may result in a risk to your rights and freedoms, we will:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                <li>Notify the relevant supervisory authority within 72 hours</li>
                <li>Notify affected users without undue delay</li>
                <li>Provide information about the nature of the breach and mitigation measures</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">10. Third-Party Processors</h2>
              <p>
                We may engage third-party service providers to process data on our behalf. All processors are:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                <li>Contractually bound to protect your data</li>
                <li>Required to implement appropriate security measures</li>
                <li>Prohibited from using your data for their own purposes</li>
                <li>Subject to audit and oversight</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">11. How to Exercise Your Rights</h2>
              <p>
                To exercise any of your GDPR rights, please:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                <li>Contact us through the support section of the platform</li>
                <li>Clearly state which right you wish to exercise</li>
                <li>Provide sufficient information to verify your identity</li>
              </ul>
              <p className="mt-2">
                We will respond to your request within one month. In complex cases, we may extend this period 
                by two additional months and will inform you of the extension.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">12. Updates to This Notice</h2>
              <p>
                We may update this GDPR Privacy Notice to reflect changes in our practices or legal requirements. 
                We will notify you of significant changes through the platform or by email.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">13. Supervisory Authority</h2>
              <p>
                If you believe we have not handled your personal data appropriately, you have the right to 
                lodge a complaint with your local data protection supervisory authority.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">14. Contact Information</h2>
              <p>
                For questions about this GDPR Privacy Notice or to exercise your rights, please contact us 
                through the support section of the platform.
              </p>
            </section>

            <div className="bg-blue-50 border-2 border-blue-500 p-6 rounded-lg mt-8">
              <p className="font-semibold text-blue-900">
                By using KAIS, you acknowledge that you have read and understood this GDPR Privacy Notice and 
                consent to the processing of your personal data as described herein.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
