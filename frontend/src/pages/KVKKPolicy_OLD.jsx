import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import KaisLogo from "@/components/KaisLogo";

export default function KVKKPolicy() {
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">KVKK Aydınlatma Metni</h1>
          </div>

          <div className="space-y-6 text-gray-700 dark:text-gray-300">
            <p className="text-sm text-gray-500 dark:text-gray-400">Son Güncelleme: {new Date().toLocaleDateString('tr-TR')}</p>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">6698 Sayılı Kişisel Verilerin Korunması Kanunu Uyarınca Aydınlatma Metni</h2>
              <p>
                KAIS ("Veri Sorumlusu") olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") 
                uyarınca kişisel verilerinizin işlenmesi hakkında sizi bilgilendirmek isteriz.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">1. Veri Sorumlusu</h2>
              <p>
                KVKK kapsamında kişisel verileriniz, veri sorumlusu sıfatıyla KAIS tarafından 
                aşağıda açıklanan kapsamda işlenebilecektir.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">2. İşlenen Kişisel Verileriniz</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Kimlik Bilgileri:</h3>
                  <ul className="list-disc list-inside ml-4 text-gray-700 dark:text-gray-300">
                    <li>Kullanıcı adı</li>
                    <li>E-posta adresi</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">İletişim Bilgileri:</h3>
                  <ul className="list-disc list-inside ml-4 text-gray-700 dark:text-gray-300">
                    <li>E-posta adresi</li>
                    <li>Platform içi mesajlar</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Lokasyon Bilgileri:</h3>
                  <ul className="list-disc list-inside ml-4 text-gray-700 dark:text-gray-300">
                    <li>Ülke</li>
                    <li>Şehir (ilan bazında)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">İşlem Güvenliği Bilgileri:</h3>
                  <ul className="list-disc list-inside ml-4 text-gray-700 dark:text-gray-300">
                    <li>Şifre (şifrelenmiş halde)</li>
                    <li>IP adresi</li>
                    <li>Çerez bilgileri</li>
                    <li>Oturum bilgileri</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Kullanıcı İşlem Bilgileri:</h3>
                  <ul className="list-disc list-inside ml-4 text-gray-700 dark:text-gray-300">
                    <li>İlan bilgileri</li>
                    <li>Mesajlaşma kayıtları</li>
                    <li>Değerlendirme ve yorumlar</li>
                    <li>Platform kullanım kayıtları</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Görsel ve İşitsel Kayıtlar:</h3>
                  <ul className="list-disc list-inside ml-4 text-gray-700 dark:text-gray-300">
                    <li>İlan fotoğrafları</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">3. Kişisel Verilerin İşlenme Amaçları</h2>
              <p className="mb-2">Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Platform hizmetlerinin sunulması ve geliştirilmesi</li>
                <li>Kullanıcı hesabının oluşturulması ve yönetilmesi</li>
                <li>Kullanıcılar arası iletişimin sağlanması</li>
                <li>İlan yayınlama ve eşleştirme hizmetlerinin sunulması</li>
                <li>Platform güvenliğinin sağlanması</li>
                <li>Dolandırıcılık ve kötüye kullanımın önlenmesi</li>
                <li>Kullanıcı memnuniyetinin artırılması</li>
                <li>İstatistiksel analizler ve raporlamalar</li>
                <li>Yasal yükümlülüklerin yerine getirilmesi</li>
                <li>Yetkili resmi makamlara bilgi verilmesi (yasal zorunluluk halinde)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">4. Kişisel Verilerin Aktarılması</h2>
              <div className="bg-blue-50 border-2 border-blue-500 p-6 rounded-lg">
                <p className="mb-4 text-blue-900">
                  Kişisel verileriniz KVKK'nın 8. ve 9. maddelerinde belirtilen şartlar çerçevesinde 
                  aşağıdaki durumlarda aktarılabilir:
                </p>
                <ul className="list-disc list-inside space-y-2 text-blue-900">
                  <li><strong>Yasal Yükümlülükler:</strong> Mahkeme kararları, yasal düzenlemeler gereği yetkili kamu kurumlarına (kolluk kuvvetleri, MASAK, vergi daireleri vb.)</li>
                  <li><strong>Hizmet Sağlayıcılar:</strong> Platform altyapısını sağlayan teknik hizmet sağlayıcılarına (sunucu hizmetleri, bulut depolama vb.)</li>
                  <li><strong>Hukuki Süreçler:</strong> Hukuki haklarımızın korunması için avukatlar ve hukuki danışmanlara</li>
                  <li><strong>Güvenlik:</strong> Platform güvenliğini sağlamak için güvenlik firmalarına</li>
                  <li><strong>Açık Rıza:</strong> Açık rızanızın bulunduğu durumlarda üçüncü kişilere</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">5. Kişisel Verilerin Toplanma Yöntemi</h2>
              <p className="mb-2">Kişisel verileriniz aşağıdaki yöntemlerle toplanmaktadır:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Web platformu üzerinden kayıt formları</li>
                <li>Platform kullanımı sırasında otomatik olarak</li>
                <li>Kullanıcı profili ve ilan oluşturma işlemleri</li>
                <li>Mesajlaşma ve iletişim sistemi</li>
                <li>Destek talepleri ve şikayetler</li>
                <li>Çerezler ve benzeri teknolojiler</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">6. Kişisel Verilerin İşlenme Hukuki Sebepleri</h2>
              <p className="mb-2">Kişisel verileriniz KVKK'nın 5. ve 6. maddelerinde belirtilen aşağıdaki hukuki sebeplere dayanılarak işlenmektedir:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Açık rızanızın bulunması</li>
                <li>Bir sözleşmenin kurulması veya ifası için gerekli olması</li>
                <li>Yasal yükümlülüklerin yerine getirilmesi</li>
                <li>Meşru menfaatlerimizin gerektirmesi</li>
                <li>Bir hakkın tesisi, kullanılması veya korunması için veri işlemenin zorunlu olması</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">7. KVKK Kapsamındaki Haklarınız</h2>
              <p className="mb-4">KVKK'nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:</p>
              <div className="space-y-3">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold text-gray-900 dark:text-white mb-2">a) Kişisel verilerinizin işlenip işlenmediğini öğrenme</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">Platform üzerinde hangi verilerinizin tutulduğunu öğrenme hakkınız bulunmaktadır.</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold text-gray-900 dark:text-white mb-2">b) İşlenmişse bilgi talep etme</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">Verilerinizin nasıl, neden ve ne zaman işlendiği hakkında bilgi talep edebilirsiniz.</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold text-gray-900 dark:text-white mb-2">c) İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">Verilerinizin toplanma ve kullanılma amaçlarını öğrenme hakkınız vardır.</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold text-gray-900 dark:text-white mb-2">d) Yurt içinde veya yurt dışında aktarılan üçüncü kişileri bilme</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">Verilerinizin kimlere aktarıldığını öğrenme hakkınız bulunmaktadır.</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold text-gray-900 dark:text-white mb-2">e) Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">Hatalı bilgilerinizin düzeltilmesini talep edebilirsiniz.</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold text-gray-900 dark:text-white mb-2">f) KVKK'nın 7. maddesinde öngörülen şartlar çerçevesinde silinmesini veya yok edilmesini isteme</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">Yasal saklama süreleri dışında verilerinizin silinmesini isteyebilirsiniz.</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold text-gray-900 dark:text-white mb-2">g) Düzeltme, silme veya yok edilme işlemlerinin kişisel verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">Yapılan değişikliklerin ilgili taraflara iletilmesini talep edebilirsiniz.</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold text-gray-900 dark:text-white mb-2">h) İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">Otomatik profilleme gibi işlemlere itiraz etme hakkınız vardır.</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold text-gray-900 dark:text-white mb-2">ı) Kişisel verilerin kanuna aykırı olarak işlenmesi sebebiyle zarara uğramanız halinde zararın giderilmesini talep etme</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">Hukuka aykırı veri işleme nedeniyle oluşan zararlarınızın tazminini isteyebilirsiniz.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">8. Haklarınızı Kullanma Yöntemi</h2>
              <div className="bg-teal-50 border-2 border-teal-500 p-6 rounded-lg">
                <p className="mb-4 text-teal-900">
                  KVKK'nın 13. maddesi uyarınca yukarıda belirtilen haklarınıza ilişkin taleplerini 
                  aşağıdaki yöntemlerle iletebilirsiniz:
                </p>
                <ul className="list-disc list-inside space-y-2 text-teal-900">
                  <li>Platform üzerindeki destek sistemi üzerinden</li>
                  <li>E-posta yoluyla (hesabınıza kayıtlı e-posta adresinizden)</li>
                  <li>Kimliğinizi tespit edici belgelerle birlikte yazılı olarak</li>
                </ul>
                <p className="mt-4 text-sm text-teal-800">
                  Başvurularınız kimliğiniz tespit edildikten sonra, talebinizin niteliğine göre 
                  en kısa sürede ve en geç 30 (otuz) gün içinde ücretsiz olarak yanıtlandırılacaktır.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">9. Veri Güvenliği</h2>
              <p>
                KAIS olarak kişisel verilerinizin güvenliğini sağlamak için gerekli teknik ve idari 
                tedbirleri almaktayız. Verileriniz şifreli olarak saklanmakta ve yetkisiz erişimlere 
                karşı korunmaktadır.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">10. Özel Nitelikli Kişisel Veriler</h2>
              <div className="bg-red-50 border-2 border-red-500 p-6 rounded-lg">
                <p className="text-red-900">
                  <strong>UYARI:</strong> KAIS platformu, KVKK'nın 6. maddesinde belirtilen özel nitelikli 
                  kişisel verileri (ırk, etnik köken, siyasi düşünce, felsefi inanç, din, mezhep veya 
                  diğer inançlar, kılık ve kıyafet, dernek, vakıf ya da sendika üyeliği, sağlık, 
                  cinsel hayat, ceza mahkûmiyeti ve güvenlik tedbirleriyle ilgili veriler ile biyometrik 
                  ve genetik veriler) işlememektedir. Kullanıcılarımızın bu tür bilgileri platform 
                  üzerinde paylaşmamaları gerekmektedir.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">11. Çocukların Kişisel Verilerinin Korunması</h2>
              <p>
                KAIS platformu 18 yaş altı çocuklara yönelik değildir. 18 yaş altı bireylerin 
                ebeveyn/vasi izni olmaksızın platforma kayıt olmaları ve kişisel veri paylaşmaları yasaktır.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">12. Kişisel Verilerin Saklanma Süresi</h2>
              <p>
                Kişisel verileriniz, işleme amacının gerektirdiği süre boyunca ve yasal saklama 
                yükümlülüklerimiz doğrultusunda saklanacaktır. Hesabınızı sildiğinizde, yasal saklama 
                gereklilikleri hariç olmak üzere verileriniz sistemden silinecektir.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">13. Yetkili Makamlara Bildirim</h2>
              <div className="bg-yellow-50 border-2 border-yellow-500 p-6 rounded-lg">
                <p className="mb-2 font-semibold text-yellow-900">ÖNEMLİ UYARI:</p>
                <p className="text-yellow-900">
                  Platform üzerinde dolandırıcılık, kara para aklama, terörizmin finansmanı veya 
                  diğer suç teşkil eden faaliyetler tespit edildiğinde veya resmi makamlardan (kolluk 
                  kuvvetleri, MASAK, mahkeme vb.) bilgi talebi geldiğinde, KVKK'nın 5. ve 8. 
                  maddelerinde belirtilen istisnalar çerçevesinde kişisel verileriniz ilgili yetkili 
                  makamlara aktarılacaktır. Bu durumda KVKK'nın öngördüğü açık rıza şartı aranmayacaktır.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">14. Veri Sorumlusuna Başvuru</h2>
              <p>
                KVKK kapsamındaki taleplerinizi platform üzerindeki destek sistemi üzerinden 
                iletebilirsiniz. Başvurularınız en geç 30 gün içinde değerlendirilecektir.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">15. Aydınlatma Metninin Güncellenmesi</h2>
              <p>
                Bu aydınlatma metni, yasal düzenlemeler veya platform hizmetlerindeki değişiklikler 
                doğrultusunda güncellenebilir. Güncellemeler platform üzerinden duyurulacaktır.
              </p>
            </section>

            <div className="bg-gray-100 p-6 rounded-lg mt-8">
              <p className="font-semibold text-gray-900 dark:text-white mb-2">
                KVKK Uyarınca Onay
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Bu platformu kullanarak, kişisel verilerinizin yukarıda belirtilen şekilde işlenmesini, 
                saklanmasını ve aktarılmasını KVKK kapsamında kabul etmiş sayılırsınız. KVKK 
                kapsamındaki haklarınızı kullanma hakkınız saklıdır.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
