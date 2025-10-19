import { Trophy } from "lucide-react";

const ACHIEVEMENT_ICONS = {
  first_listing: "🎉",
  ten_listings: "⭐",
  popular_seller: "🔥",
  chat_master: "💬",
  giveaway_creator: "🎁",
  exchange_expert: "💱",
  master_user: "👑"
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
    { id: "first_listing", name: "First Listing", description: "Create your first listing", icon: "🎉" },
    { id: "ten_listings", name: "10 Listings", description: "Create 10 listings", icon: "⭐" },
    { id: "popular_seller", name: "Popular User", description: "Get 1000+ views on your listings", icon: "🔥" },
    { id: "chat_master", name: "Chat Master", description: "Send 100+ messages", icon: "💬" },
    { id: "giveaway_creator", name: "Gift Hunter", description: "Join 5 giveaways", icon: "🎁" },
    { id: "exchange_expert", name: "Exchange Expert", description: "Use currency converter 10 times", icon: "💱" },
    { id: "master_user", name: "Master User", description: "Unlock all achievements", icon: "👑" }
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
          
          // Special styling for Master User achievement
          const isMasterUser = achievement.id === 'master_user';

          return (
            <div
              key={achievement.id}
              className={`p-3 rounded-lg border transition-all relative ${
                isUnlocked
                  ? isMasterUser 
                    ? "bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30 border-2 border-yellow-400 dark:border-yellow-600 shadow-lg ring-2 ring-yellow-300 dark:ring-yellow-700"
                    : "bg-white dark:bg-gray-800 border-yellow-300 dark:border-yellow-700 shadow-sm"
                  : "bg-gray-100 dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 opacity-60"
              } ${isMasterUser && isUnlocked ? 'col-span-2 sm:col-span-3' : ''}`}
            >
              {/* Lock icon overlay for locked achievements */}
              {!isUnlocked && (
                <div className="absolute top-2 right-2">
                  <span className="text-lg">🔒</span>
                </div>
              )}
              
              <div className={`${isMasterUser ? 'text-3xl' : 'text-2xl'} mb-1 text-center ${!isUnlocked ? 'opacity-40' : ''}`}>
                {achievement.icon}
              </div>
              <div className={`text-xs font-semibold text-center text-gray-900 dark:text-white mb-1 ${isMasterUser ? 'text-sm' : ''}`}>
                {achievement.name}
              </div>
              <div className="text-xs text-center text-gray-600 dark:text-gray-400 line-clamp-2">
                {achievement.description}
              </div>
              
              {/* Status badge */}
              <div className="text-center mt-2">
                {isUnlocked ? (
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                    isMasterUser 
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' 
                      : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  }`}>
                    ✓ Unlocked
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    🔒 Locked
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getAchievementName(achievementId) {
  const names = {
    first_listing: "First Listing",
    ten_listings: "10 Listings",
    popular_seller: "Popular User",
    chat_master: "Chat Master",
    giveaway_creator: "Gift Hunter",
    exchange_expert: "Exchange Expert",
    master_user: "Master User"
  };
  return names[achievementId] || achievementId;
}
