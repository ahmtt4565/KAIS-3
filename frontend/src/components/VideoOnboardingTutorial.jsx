import { useState } from 'react';
import { X, ArrowRight, ArrowLeft, Play, Book } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { API } from '../App';

const tutorialSteps = [
  {
    title: "Welcome to KAIS! 🎉",
    description: "Welcome to the peer-to-peer currency exchange platform. Let's show you around.",
    image: "🌍",
    videoType: "animation",
    animation: "welcome"
  },
  {
    title: "Create Listing 📝",
    description: "Click the '+' button to specify the currency and amount you want to exchange.",
    image: "➕",
    videoType: "animation",
    animation: "create-listing",
    steps: [
      "1. Click the '+' button on bottom navigation",
      "2. Select your currencies (From & To)",
      "3. Enter amount and exchange rate",
      "4. Add optional description",
      "5. Click 'Create Listing'"
    ]
  },
  {
    title: "Track Exchange Rates 💱",
    description: "View live rates for 150+ currencies and calculate conversions on the Exchange page.",
    image: "💱",
    videoType: "animation",
    animation: "exchange",
    steps: [
      "1. Click 'Exchange' on bottom navigation",
      "2. Enter amount to convert",
      "3. Select currencies from dropdowns",
      "4. See instant conversion results",
      "5. Check 24h trend indicators (↗️↘️)"
    ]
  },
  {
    title: "Chat & Connect 💬",
    description: "Message listing owners directly and discuss exchange details.",
    image: "💬",
    videoType: "animation",
    animation: "chat",
    steps: [
      "1. Click on any listing card",
      "2. Click 'Start Chat' button",
      "3. Send messages in real-time",
      "4. Discuss meeting location & details"
    ]
  },
  {
    title: "Earn Achievement Badges 🏆",
    description: "Complete tasks to unlock badges and become a Master User!",
    image: "🏆",
    videoType: "animation",
    animation: "achievements",
    steps: [
      "🎉 First Listing - Create your first listing",
      "⭐ 10 Listings - Create 10 listings",
      "🔥 Popular User - Get 1000+ views",
      "💬 Chat Master - Send 100+ messages",
      "🎁 Gift Hunter - Join 5 giveaways",
      "💱 Exchange Expert - Use converter 10 times",
      "👑 Master User - Unlock all badges!"
    ]
  },
  {
    title: "Report & Safety 🛡️",
    description: "Keep the community safe by reporting suspicious listings and blocking unwanted users.",
    image: "🚩",
    videoType: "animation",
    animation: "safety",
    steps: [
      "🚩 Report Listing - Click flag icon on suspicious listings",
      "🚫 Block User - Block users from their profile",
      "⭐ Rate Users - Give ratings after exchanges",
      "🔒 Stay Safe - Meet in public places"
    ]
  },
  {
    title: "Ready to Start! 🚀",
    description: "You're all set! Start creating listings, chatting, and exchanging currencies safely.",
    image: "✅",
    videoType: "none"
  }
];

// Animated SVG components for each step
const animations = {
  welcome: () => (
    <div className="relative w-full h-48 flex items-center justify-center">
      <div className="animate-bounce text-8xl">🌍</div>
      <div className="absolute bottom-0 text-4xl animate-pulse">👋</div>
    </div>
  ),
  'create-listing': () => (
    <div className="relative w-full h-48 flex flex-col items-center justify-center gap-4">
      <div className="flex items-center gap-4">
        <div className="text-5xl animate-pulse">💵</div>
        <div className="text-3xl">→</div>
        <div className="text-5xl animate-pulse animation-delay-150">💶</div>
      </div>
      <div className="text-6xl animate-bounce">➕</div>
    </div>
  ),
  exchange: () => (
    <div className="relative w-full h-48 flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-4">
          <div className="text-5xl">💱</div>
          <div className="text-2xl animate-pulse">💰</div>
        </div>
        <div className="flex items-center gap-2 text-2xl">
          <span className="text-green-500 animate-pulse">↗️</span>
          <span className="text-red-500 animate-pulse animation-delay-300">↘️</span>
        </div>
      </div>
    </div>
  ),
  chat: () => (
    <div className="relative w-full h-48 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-8">
          <div className="text-5xl animate-bounce">👤</div>
          <div className="text-4xl animate-pulse">💬</div>
          <div className="text-5xl animate-bounce animation-delay-300">👤</div>
        </div>
        <div className="text-3xl">📱</div>
      </div>
    </div>
  ),
  achievements: () => (
    <div className="relative w-full h-48 flex items-center justify-center">
      <div className="grid grid-cols-3 gap-4">
        <div className="text-4xl animate-bounce">🎉</div>
        <div className="text-4xl animate-bounce animation-delay-100">⭐</div>
        <div className="text-4xl animate-bounce animation-delay-200">🔥</div>
        <div className="text-4xl animate-bounce animation-delay-300">💬</div>
        <div className="text-6xl animate-pulse">👑</div>
        <div className="text-4xl animate-bounce animation-delay-400">🎁</div>
      </div>
    </div>
  ),
  safety: () => (
    <div className="relative w-full h-48 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="text-6xl animate-pulse">🛡️</div>
        <div className="flex items-center gap-4">
          <div className="text-4xl">🚩</div>
          <div className="text-4xl">🚫</div>
          <div className="text-4xl">⭐</div>
        </div>
      </div>
    </div>
  )
};

export default function VideoOnboardingTutorial({ onComplete }) {
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

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await axios.put(
          `${API}/user/tutorial-completed`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (error) {
      console.error('Error updating tutorial status:', error);
    }
    setIsVisible(false);
    if (onComplete) onComplete();
  };

  if (!isVisible) return null;

  const step = tutorialSteps[currentStep];
  const AnimationComponent = step.animation ? animations[step.animation] : null;

  return (
    <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border-2 border-teal-500">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-orange-500 p-6 text-white relative">
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <Book className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Interactive Tutorial</h2>
              <p className="text-white/90 text-sm">Step {currentStep + 1} of {tutorialSteps.length}</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 h-2">
          <div
            className="bg-gradient-to-r from-teal-500 to-orange-500 h-2 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-6 md:p-8">
          {/* Animation/Video Area */}
          <div className="mb-6 bg-gradient-to-br from-teal-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 rounded-xl p-6 border-2 border-teal-200 dark:border-teal-800">
            {AnimationComponent ? (
              <AnimationComponent />
            ) : (
              <div className="flex items-center justify-center h-48">
                <div className="text-8xl">{step.image}</div>
              </div>
            )}
          </div>

          {/* Title & Description */}
          <div className="mb-6 text-center">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {step.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              {step.description}
            </p>
          </div>

          {/* Step-by-Step Instructions */}
          {step.steps && (
            <div className="mb-6 bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="space-y-2">
                {step.steps.map((instruction, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-500 text-white flex items-center justify-center text-xs font-bold">
                      {instruction.startsWith('🎉') || instruction.startsWith('⭐') || instruction.startsWith('🔥') || instruction.startsWith('💬') || instruction.startsWith('🎁') || instruction.startsWith('👑') || instruction.startsWith('💱') ? '✓' : index + 1}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                      {instruction}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={handlePrevious}
            variant="outline"
            disabled={currentStep === 0}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>

          <div className="flex gap-2">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'bg-teal-500 w-4'
                    : index < currentStep
                    ? 'bg-teal-300'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>

          <Button
            onClick={handleNext}
            className="bg-gradient-to-r from-teal-500 to-orange-500 hover:from-teal-600 hover:to-orange-600 text-white flex items-center gap-2"
          >
            {currentStep === tutorialSteps.length - 1 ? 'Get Started!' : 'Next'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Add custom animations */}
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .animation-delay-100 { animation-delay: 100ms; }
        .animation-delay-150 { animation-delay: 150ms; }
        .animation-delay-200 { animation-delay: 200ms; }
        .animation-delay-300 { animation-delay: 300ms; }
        .animation-delay-400 { animation-delay: 400ms; }
      `}</style>
    </div>
  );
}
