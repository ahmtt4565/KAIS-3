import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import KaisLogo from "@/components/KaisLogo";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 dark:from-gray-900 to-orange-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Button
          variant="ghost"
          onClick={() => window.history.back()}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Geri Dön
        </Button>

        <Card className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <KaisLogo className="w-12 h-12" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Kullanım Koşulları ve Şartları</h1>
          </div>

          <div className="space-y-6 text-gray-700 dark:text-gray-300">
            <p className="text-sm text-gray-500 dark:text-gray-400">Son Güncelleme: {new Date().toLocaleDateString('tr-TR')}</p>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">1. Genel Hükümler</h2>
              <p>
                KAIS platformu ("Platform") kullanıcılar arasında döviz alışverişi için bir iletişim ve ilan platformu sağlamaktadır. 
                Bu platformu kullanarak aşağıdaki şartları ve koşulları kabul etmiş sayılırsınız.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">2. Platform Hizmetleri</h2>
              <p className="mb-2">KAIS platformu:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Kullanıcılar arasında döviz değişimi için ilan paylaşım hizmeti sunmaktadır</li>
                <li>Kullanıcılar arası mesajlaşma ve iletişim imkanı sağlamaktadır</li>
                <li>Kullanıcı değerlendirme ve puanlama sistemi sunmaktadır</li>
                <li><strong className="text-red-600">HİÇBİR ŞEKİLDE FİNANSAL İŞLEM, PARA TRANSFERİ VEYA ÖDEME HİZMETİ SUNMAMAKTADIR</strong></li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">3. SORUMLULUK REDDİ</h2>
              <div className="bg-red-50 border-2 border-red-500 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-red-900 mb-4">ÖNEMLİ UYARI</h3>
                <p className="mb-4 font-semibold text-red-900">
                  KAIS platformu, kullanıcılar arasında gerçekleşen döviz değişim işlemlerinden, 
                  buluşmalardan ve anlaşmalardan KESINLIKLE SORUMLU DEĞİLDİR.
                </p>
                <ul className="list-disc list-inside space-y-2 text-red-900">
                  <li><strong>Dolandırıcılık ve Sahtecilik:</strong> Platform üzerinden tanışan kullanıcılar arasında gerçekleşen dolandırıcılık, sahte para kullanımı, kimlik hırsızlığı ve benzeri suç faaliyetlerinden KAIS sorumlu tutulamaz.</li>
                  <li><strong>Kara Para Aklama:</strong> Kullanıcıların yasa dışı para aklama, vergi kaçırma veya illegal fonların transferi gibi eylemlerinden KAIS hiçbir şekilde sorumlu değildir.</li>
                  <li><strong>Finansal Kayıplar:</strong> Kullanıcıların birbirleriyle yaptığı döviz değişiminde yaşanabilecek kur farklılıkları, finansal kayıplar veya zararlarda KAIS'in hiçbir sorumluluğu yoktur.</li>
                  <li><strong>Fiziksel Güvenlik:</strong> Kullanıcıların buluşma anında yaşayabilecekleri fiziksel tehlike, hırsızlık, şiddet veya herhangi bir güvenlik sorunundan KAIS sorumlu tutulamaz.</li>
                  <li><strong>Yasal Sorumluluklar:</strong> Kullanıcıların gerçekleştirdiği işlemlerin yasalara uygunluğu tamamen kullanıcıların kendi sorumluluğundadır.</li>
                  <li><strong>Vergi ve Yasal Bildirimler:</strong> Döviz değişimi sonucu oluşan vergi yükümlülükleri ve yasal bildirimler kullanıcıların kendi sorumluluğundadır.</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">4. Kullanıcı Sorumlulukları</h2>
              <p className="mb-2">Kullanıcı olarak:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Platformda gerçek ve doğru bilgiler paylaşmakla yükümlüsünüz</li>
                <li>Yasal düzenlemelere uygun hareket etmekle sorumlusunuz</li>
                <li>Diğer kullanıcılarla yapacağınız tüm işlemlerin sorumluluğu size aittir</li>
                <li>Güvenlik önlemlerini almak ve dikkatli davranmak sizin sorumluluğunuzdadır</li>
                <li>Şüpheli durumlarda yetkili makamlara başvurmak sizin sorumluluğunuzdadır</li>
                <li>Döviz alışverişinde uygulanabilecek vergi ve yasal yükümlülükler size aittir</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">5. Yasaklanan Faaliyetler</h2>
              <p className="mb-2">Platform üzerinde aşağıdaki faaliyetler kesinlikle yasaktır:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Dolandırıcılık amacıyla ilan veya mesaj paylaşmak</li>
                <li>Sahte kimlik veya sahte belgelerle işlem yapmak</li>
                <li>Kara para aklama veya yasadışı fon transferi yapmak</li>
                <li>Terörizmin finansmanı veya illegal faaliyetler için kullanım</li>
                <li>Sahte para veya yasadışı döviz kullanmak</li>
                <li>Platform üzerinden üçüncü şahısları dolandırmak</li>
                <li>Başkalarının kişisel bilgilerini çalmak veya kötüye kullanmak</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">6. Güvenlik Önerileri</h2>
              <div className="bg-yellow-50 border-2 border-yellow-500 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-yellow-900 mb-4">GÜVENLİĞİNİZ İÇİN:</h3>
                <ul className="list-disc list-inside space-y-2 text-yellow-900">
                  <li>Sadece güvenilir ve yüksek puanlı kullanıcılarla işlem yapın</li>
                  <li>İlk buluşmayı mutlaka kalabalık ve güvenli bir yerde yapın</li>
                  <li>Büyük miktarlarda döviz değişimi yapmadan önce küçük testler yapın</li>
                  <li>Şüpheli durumları derhal bildirin</li>
                  <li>Kişisel bilgilerinizi paylaşmaktan kaçının</li>
                  <li>Buluşma öncesi karşı tarafın kimliğini doğrulayın</li>
                  <li>Yanınızda güvenilir bir arkadaş bulundurun</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">7. Platform Kullanım Kuralları</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Her kullanıcı sadece bir hesap açabilir</li>
                <li>Hesap bilgileri başkalarıyla paylaşılamaz</li>
                <li>İlanlar gerçek ve doğru bilgiler içermelidir</li>
                <li>Hakaret, tehdit veya uygunsuz içerik paylaşmak yasaktır</li>
                <li>Platform kurallarına uymayanların hesapları kapatılabilir</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">8. Fikri Mülkiyet Hakları</h2>
              <p>
                KAIS platformu, logo, tasarım ve tüm içerik KAIS'e aittir. İzinsiz kullanım yasaktır.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">9. Hesap Askıya Alma ve Sonlandırma</h2>
              <p>
                KAIS, kullanım koşullarını ihlal eden, şüpheli veya yasadışı faaliyetlerde bulunan 
                kullanıcıların hesaplarını önceden bildirimde bulunmaksızın askıya alma veya 
                sonlandırma hakkını saklı tutar.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">10. Değişiklikler</h2>
              <p>
                KAIS bu kullanım koşullarını istediği zaman değiştirme hakkını saklı tutar. 
                Değişiklikler platform üzerinden duyurulacaktır.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">11. Uygulanacak Hukuk</h2>
              <p>
                Bu sözleşme Türkiye Cumhuriyeti yasalarına tabidir. Uyuşmazlıklar Türkiye mahkemelerinde çözümlenir.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">12. İletişim</h2>
              <p>
                Sorularınız için platform üzerindeki destek sistemi üzerinden bizimle iletişime geçebilirsiniz.
              </p>
            </section>

            <div className="bg-gray-100 p-6 rounded-lg mt-8">
              <p className="font-semibold text-gray-900 dark:text-white mb-2">
                Bu platformu kullanarak yukarıdaki tüm koşulları okuduğunuzu, anladığınızı ve kabul ettiğinizi beyan edersiniz.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                KAIS platformu sadece bir ilan ve iletişim platformudur. Kullanıcılar arasında gerçekleşen 
                tüm işlemler ve sonuçları tamamen kullanıcıların kendi sorumluluğundadır.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
