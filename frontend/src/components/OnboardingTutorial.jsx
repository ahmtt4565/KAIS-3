import { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { API } from '../App';

const tutorialSteps = [
  {
    title: "KAIS'e Hoş Geldiniz! 🎉",
    description: "Peer-to-peer döviz takası platformuna hoş geldiniz. Size uygulamayı tanıtalım.",
    image: "🌍"
  },
  {
    title: "İlan Oluştur 📝",
    description: "'+' butonuna tıklayarak takas etmek istediğiniz dövizi ve miktarını belirtin.",
    image: "➕"
  },
  {
    title: "Yakındaki İlanları Gör 📍",
    description: "Konumunuza yakın takasları haritada görüntüleyin ve uygun olanları bulun.",
    image: "🗺️"
  },
  {
    title: "Mesajlaş 💬",
    description: "İlan sahipleriyle direkt mesajlaşın ve takas detaylarını konuşun.",
    image: "💬"
  },
  {
    title: "Güvenli Takas Yap 🤝",
    description: "Değerlendirmeler ve güvenlik önlemleriyle güvenli takas yapın. Başarılar!",
    image: "✅"
  }
];

export default function OnboardingTutorial({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    await markAsSeen();
    setIsVisible(false);
    if (onComplete) onComplete();
  };

  const handleComplete = async () => {
    await markAsSeen();
    setIsVisible(false);
    if (onComplete) onComplete();
  };

  const markAsSeen = async () => {
    try {
      await axios.post(`${API}/auth/mark-tutorial-seen`);
    } catch (error) {
      console.error('Error marking tutorial as seen:', error);
    }
  };

  if (!isVisible) return null;

  const step = tutorialSteps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-in fade-in zoom-in duration-300">
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step indicator */}
        <div className="flex justify-center gap-2 mb-4 sm:mb-6">
          {tutorialSteps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentStep
                  ? 'w-8 bg-gradient-to-r from-teal-500 to-orange-500'
                  : index < currentStep
                  ? 'w-2 bg-teal-500'
                  : 'w-2 bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 animate-bounce">{step.image}</div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
            {step.title}
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed px-2">
            {step.description}
          </p>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between gap-3">
          {currentStep > 0 ? (
            <Button
              variant="outline"
              onClick={handlePrevious}
              className="flex items-center gap-2 text-sm sm:text-base"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Geri</span>
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="text-gray-500 dark:text-gray-400 text-sm sm:text-base"
            >
              Atla
            </Button>
          )}

          <Button
            onClick={handleNext}
            className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-orange-500 hover:from-teal-600 hover:to-orange-600 text-white text-sm sm:text-base"
          >
            {currentStep === tutorialSteps.length - 1 ? 'Başlayalım' : 'İleri'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Step counter */}
        <div className="text-center mt-3 sm:mt-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          {currentStep + 1} / {tutorialSteps.length}
        </div>
      </div>
    </div>
  );
}
