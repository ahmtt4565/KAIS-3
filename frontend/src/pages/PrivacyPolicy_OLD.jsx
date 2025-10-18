import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import KaisLogo from "@/components/KaisLogo";

export default function PrivacyPolicy() {
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gizlilik Politikası</h1>
          </div>

          <div className="space-y-6 text-gray-700 dark:text-gray-300">
            <p className="text-sm text-gray-500 dark:text-gray-400">Son Güncelleme: {new Date().toLocaleDateString('tr-TR')}</p>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">1. Giriş</h2>
              <p>
                KAIS ("biz", "bizim") olarak kullanıcılarımızın gizliliğine önem veririz. 
                Bu Gizlilik Politikası, platformumuz üzerinden topladığımız kişisel verilerin nasıl 
                işlendiğini, saklandığını ve korunduğunu açıklamaktadır.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">2. Toplanan Bilgiler</h2>
              <p className="mb-2">Platform üzerinde aşağıdaki bilgileri topluyoruz:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Hesap Bilgileri:</strong> Kullanıcı adı, e-posta adresi, şifre (şifrelenmiş)</li>
                <li><strong>Profil Bilgileri:</strong> Ülke, konuşulan diller</li>
                <li><strong>İlan Bilgileri:</strong> Döviz türü, miktar, şehir, açıklama, fotoğraflar</li>
                <li><strong>İletişim Bilgileri:</strong> Platform içi mesajlar, destek talepleri</li>
                <li><strong>Kullanım Bilgileri:</strong> Platform kullanım istatistikleri, çevrimiçi durumu</li>
                <li><strong>Değerlendirme Bilgileri:</strong> Kullanıcı puanlamaları ve yorumları</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">3. Bilgilerin Kullanım Amaçları</h2>
              <p className="mb-2">Topladığımız bilgileri şu amaçlarla kullanırız:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Platform hizmetlerini sağlamak ve geliştirmek</li>
                <li>Kullanıcılar arasında iletişimi kolaylaştırmak</li>
                <li>Güvenlik ve dolandırıcılık önleme</li>
                <li>Kullanıcı deneyimini iyileştirmek</li>
                <li>Teknik destek sağlamak</li>
                <li>Yasal yükümlülükleri yerine getirmek</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">4. Bilgi Paylaşımı</h2>
              <div className="bg-blue-50 border-2 border-blue-500 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-blue-900 mb-4">BİLGİ PAYLAŞIMI</h3>
                <p className="mb-4 text-blue-900">
                  KAIS, kullanıcı bilgilerini üçüncü şahıslarla paylaşmaz, satmaz veya kiralamaz.
                </p>
                <p className="text-blue-900 mb-2">Bilgiler sadece şu durumlarda paylaşılabilir:</p>
                <ul className="list-disc list-inside space-y-2 text-blue-900">
                  <li>Yasal bir zorunluluk olduğunda (mahkeme kararı, resmi talep)</li>
                  <li>Platform güvenliğini sağlamak için gerektiğinde</li>
                  <li>Dolandırıcılık veya illegal faaliyetlerin önlenmesi için</li>
                  <li>Kullanıcının açık rızası olduğunda</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">5. Platform İçi Görünürlük</h2>
              <p className="mb-2">Aşağıdaki bilgiler platform üzerinde diğer kullanıcılar tarafından görülebilir:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Kullanıcı adı</li>
                <li>Ülke</li>
                <li>Konuşulan diller</li>
                <li>Kullanıcı puanı ve yorumlar</li>
                <li>İlan bilgileri (döviz türü, miktar, şehir, açıklama, fotoğraflar)</li>
                <li>Çevrimiçi/çevrimdışı durumu</li>
              </ul>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                E-posta adresiniz ve şifreniz hiçbir zaman diğer kullanıcılara gösterilmez.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">6. Veri Güvenliği</h2>
              <p className="mb-2">Kullanıcı verilerinin güvenliği için aşağıdaki önlemleri alıyoruz:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Şifrelerin güvenli şekilde şifrelenmesi (bcrypt)</li>
                <li>HTTPS ile şifreli veri iletimi</li>
                <li>JWT token tabanlı güvenli kimlik doğrulama</li>
                <li>Düzenli güvenlik güncellemeleri</li>
                <li>Yetkisiz erişimlere karşı koruma</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">7. Çerezler (Cookies)</h2>
              <p>
                Platform, kullanıcı deneyimini iyileştirmek için çerezler kullanabilir. 
                Tarayıcı ayarlarınızdan çerezleri yönetebilir veya devre dışı bırakabilirsiniz.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">8. Kullanıcı Hakları</h2>
              <p className="mb-2">Kullanıcılarımız aşağıdaki haklara sahiptir:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Erişim Hakkı:</strong> Kişisel verilerinize erişim talep edebilirsiniz</li>
                <li><strong>Düzeltme Hakkı:</strong> Yanlış veya eksik bilgilerinizi düzeltebilirsiniz</li>
                <li><strong>Silme Hakkı:</strong> Hesabınızı ve verilerinizi silebilirsiniz</li>
                <li><strong>İtiraz Hakkı:</strong> Veri işleme faaliyetlerine itiraz edebilirsiniz</li>
                <li><strong>Taşınabilirlik Hakkı:</strong> Verilerinizi taşınabilir formatta talep edebilirsiniz</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">9. Veri Saklama Süresi</h2>
              <p>
                Kişisel verileriniz, hesabınız aktif olduğu sürece saklanır. Hesabınızı sildiğinizde, 
                verileriniz yasal yükümlülükler ve güvenlik nedenleriyle gerekli olan süreler hariç 
                sistemden silinir.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">10. Çocukların Gizliliği</h2>
              <p>
                KAIS platformu 18 yaş altı bireyler için tasarlanmamıştır. 18 yaş altı kullanıcılardan 
                bilerek kişisel bilgi toplamıyoruz.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">11. Üçüncü Taraf Bağlantılar</h2>
              <p>
                Platform üzerinde üçüncü taraf web sitelerine bağlantılar bulunabilir. 
                Bu sitelerin gizlilik politikalarından sorumlu değiliz.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">12. Politika Değişiklikleri</h2>
              <p>
                Bu Gizlilik Politikası zaman zaman güncellenebilir. Önemli değişiklikler 
                platform üzerinden duyurulacaktır.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">13. Yetkili Makamlarla İşbirliği</h2>
              <div className="bg-yellow-50 border-2 border-yellow-500 p-6 rounded-lg">
                <p className="text-yellow-900">
                  <strong>ÖNEMLİ:</strong> Dolandırıcılık, kara para aklama veya diğer illegal faaliyetler 
                  tespit edildiğinde veya resmi makamlardan talep geldiğinde, kullanıcı bilgileri 
                  ilgili yetkili makamlara (kolluk kuvvetleri, mahkeme, MASAK vb.) aktarılabilir.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">14. İletişim</h2>
              <p>
                Gizlilik politikamız hakkında sorularınız için platform üzerindeki destek sistemi 
                üzerinden bizimle iletişime geçebilirsiniz.
              </p>
            </section>

            <div className="bg-gray-100 p-6 rounded-lg mt-8">
              <p className="font-semibold text-gray-900 dark:text-white">
                Bu platformu kullanarak Gizlilik Politikamızı okuduğunuzu ve kabul ettiğinizi beyan edersiniz.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
