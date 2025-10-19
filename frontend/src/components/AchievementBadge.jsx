import { Trophy } from "lucide-react";

const ACHIEVEMENT_ICONS = {
  first_listing: "🎉",
  ten_listings: "⭐",
  popular_seller: "🔥",
  chat_master: "💬",
  giveaway_creator: "🎁",
  exchange_expert: "💱"
};

export default function AchievementBadge({ achievementId, size = "sm", showTooltip = true }) {
  const icon = ACHIEVEMENT_ICONS[achievementId];
  
  if (!icon) return null;

  const sizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  };

  return (
    <span 
      className={`inline-flex items-center justify-center ${sizeClasses[size]}`}
      title={showTooltip ? getAchievementName(achievementId) : ""}
    >
      {icon}
    </span>
  );
}

export function AchievementsList({ achievements }) {
  if (!achievements || achievements.length === 0) return null;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {achievements.map((achievement) => (
        <AchievementBadge key={achievement} achievementId={achievement} size="sm" />
      ))}
    </div>
  );
}

export function AchievementsCard({ achievements, totalUnlocked }) {
  const allAchievements = [
    { id: "first_listing", name: "İlk İlan", description: "İlk ilanını oluştur", icon: "🎉" },
    { id: "ten_listings", name: "10 İlan", description: "10 ilan oluştur", icon: "⭐" },
    { id: "popular_seller", name: "Popüler Satıcı", description: "İlanların 1000+ görüntülenme alsın", icon: "🔥" },
    { id: "chat_master", name: "Sohbet Ustası", description: "100+ mesaj gönder", icon: "💬" },
    { id: "giveaway_creator", name: "Hediye Veren", description: "Çekilişe katıl", icon: "🎁" },
    { id: "exchange_expert", name: "Döviz Uzmanı", description: "Döviz çeviricisini 10 kez kullan", icon: "💱" }
  ];

  return (
    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Achievements
        </h3>
        <span className="ml-auto text-sm text-gray-600 dark:text-gray-400">
          {totalUnlocked || 0}/{allAchievements.length}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {allAchievements.map((achievement) => {
          const isUnlocked = achievements?.some(a => 
            typeof a === 'string' ? a === achievement.id : a.id === achievement.id
          );

          return (
            <div
              key={achievement.id}
              className={`p-3 rounded-lg border transition-all ${
                isUnlocked
                  ? "bg-white dark:bg-gray-800 border-yellow-300 dark:border-yellow-700 shadow-sm"
                  : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 opacity-50"
              }`}
            >
              <div className="text-2xl mb-1 text-center">{achievement.icon}</div>
              <div className="text-xs font-semibold text-center text-gray-900 dark:text-white mb-1">
                {achievement.name}
              </div>
              <div className="text-xs text-center text-gray-600 dark:text-gray-400 line-clamp-2">
                {achievement.description}
              </div>
              {isUnlocked && (
                <div className="text-center mt-1">
                  <span className="text-xs text-green-600 dark:text-green-400 font-semibold">✓ Unlocked</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getAchievementName(achievementId) {
  const names = {
    first_listing: "İlk İlan",
    ten_listings: "10 İlan",
    popular_seller: "Popüler Satıcı",
    chat_master: "Sohbet Ustası",
    giveaway_creator: "Hediye Veren",
    exchange_expert: "Döviz Uzmanı"
  };
  return names[achievementId] || achievementId;
}
