import KaisLogo from "@/components/KaisLogo";

export default function LogoPreview() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-orange-50 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-center mb-12">KAIS Logo Önizleme</h1>
        
        <div className="grid md:grid-cols-2 gap-12">
          {/* Beyaz Arka Plan */}
          <div className="bg-white rounded-2xl p-12 shadow-xl border-2 border-teal-100">
            <h2 className="text-xl font-semibold mb-6 text-center text-gray-700">Beyaz Arka Plan</h2>
            <div className="flex flex-col items-center gap-8">
              <KaisLogo className="w-32 h-32" color="teal" />
              <div className="flex items-center gap-4">
                <KaisLogo className="w-16 h-16" color="teal" />
                <span className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-orange-500 bg-clip-text text-transparent">
                  KAIS
                </span>
              </div>
            </div>
          </div>

          {/* Koyu Arka Plan */}
          <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-2xl p-12 shadow-xl">
            <h2 className="text-xl font-semibold mb-6 text-center text-white">Koyu Arka Plan</h2>
            <div className="flex flex-col items-center gap-8">
              <KaisLogo className="w-32 h-32" color="white" />
              <div className="flex items-center gap-4">
                <KaisLogo className="w-16 h-16" color="white" />
                <span className="text-4xl font-bold text-white">
                  KAIS
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Farklı Boyutlar */}
        <div className="bg-white rounded-2xl p-12 shadow-xl border-2 border-teal-100 mt-12">
          <h2 className="text-xl font-semibold mb-8 text-center text-gray-700">Farklı Boyutlar</h2>
          <div className="flex items-end justify-center gap-8">
            <div className="text-center">
              <KaisLogo className="w-12 h-12 mx-auto mb-2" />
              <p className="text-xs text-gray-600">Küçük</p>
            </div>
            <div className="text-center">
              <KaisLogo className="w-20 h-20 mx-auto mb-2" />
              <p className="text-xs text-gray-600">Orta</p>
            </div>
            <div className="text-center">
              <KaisLogo className="w-32 h-32 mx-auto mb-2" />
              <p className="text-xs text-gray-600">Büyük</p>
            </div>
            <div className="text-center">
              <KaisLogo className="w-48 h-48 mx-auto mb-2" />
              <p className="text-xs text-gray-600">Çok Büyük</p>
            </div>
          </div>
        </div>

        {/* Logo Detayları */}
        <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-teal-100 mt-12">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Logo Açıklaması:</h2>
          <ul className="space-y-2 text-gray-600">
            <li>✅ <strong>Sol:</strong> Stilize "K" harfi (KAIS'i temsil eder)</li>
            <li>✅ <strong>Orta:</strong> Çift yönlü oklar (para değişimini simgeler)</li>
            <li>✅ <strong>Sağ:</strong> Para simgesi</li>
            <li>✅ <strong>Renk:</strong> Teal (ana) + Orange (vurgu)</li>
            <li>✅ <strong>Tasarım:</strong> Modern, circular, minimal</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
