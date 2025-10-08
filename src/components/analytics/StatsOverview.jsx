import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, MessageSquare, Target, Award } from "lucide-react";
import { useLanguage } from "@/components/common/LanguageProvider";

export default function StatsOverview({ prompts, businessProfile, businessId }) {
  const { t, isRTL, isHebrew } = useLanguage();
  
  const totalMentions = prompts.reduce((sum, p) => {
    // Try the correct structure: prompts[1].counts.businessNameMentions
    if (p[1]?.counts?.businessNameMentions) {
      return sum + p[1].counts.businessNameMentions;
    }
    // Fallback to prompts[0] structure
    else if (p[0]?.counts?.businessNameMentions) {
      return sum + p[0].counts.businessNameMentions;
    }
    // Fallback to old structure
    else if (p.counts?.businessNameMentions) {
      return sum + p.counts.businessNameMentions;
    }
    // Fallback to direct structure
    return sum + (p.businessNameMentions || 0);
  }, 0);
  
  const totalCompetitorMentions = prompts.reduce((sum, p) => {
    // Try the correct structure: prompts[1].counts.competitorsMentions
    if (p[1]?.counts?.competitorsMentions) {
      return sum + p[1].counts.competitorsMentions;
    }
    // Fallback to prompts[0] structure
    else if (p[0]?.counts?.competitorsMentions) {
      return sum + p[0].counts.competitorsMentions;
    }
    // Fallback to old structure
    else if (p.counts?.competitorsMentions) {
      return sum + p.counts.competitorsMentions;
    }
    // Fallback to direct structure
    return sum + (p.competitorsMentions || 0);
  }, 0);

  const averageMentionsPerPrompt = prompts.length > 0 ? (totalMentions / prompts.length).toFixed(1) : '0';
  
  const mentionShare = totalMentions + totalCompetitorMentions > 0 
    ? ((totalMentions / (totalMentions + totalCompetitorMentions)) * 100).toFixed(1)
    : '0';


  const stats = [
    {
      title: t('analytics.totalMentions'),
      value: totalMentions,
      icon: MessageSquare,
      gradient: "from-sky-400 to-blue-500",
      accent: "text-sky-600",
      iconBg: "bg-sky-50",
      change: t('analytics.vsLastWeek')
    },
    {
      title: t('analytics.mentionShare'),
      value: `${mentionShare}%`,
      icon: Target,
      gradient: "from-sky-300 to-sky-500",
      accent: "text-sky-600",
      iconBg: "bg-sky-50",
      change: t('analytics.vsCompetitors')
    },
    {
      title: t('analytics.avgQuery'),
      value: averageMentionsPerPrompt,
      icon: TrendingUp,
      gradient: "from-sky-200 to-sky-400",
      accent: "text-sky-500",
      iconBg: "bg-sky-50",
      change: t('analytics.mentionsPerPrompt')
    },
    {
      title: t('analytics.brandScore'),
      value: Math.min(100, Math.round(totalMentions * 2.5)).toString(),
      icon: Award,
      gradient: "from-sky-500 to-blue-600",
      accent: "text-sky-700",
      iconBg: "bg-sky-100",
      change: t('analytics.outOf100')
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="relative overflow-hidden shadow-lg border-0 bg-white/90 backdrop-blur-sm">
          <div className={`absolute ${isRTL ? 'left' : 'right'}-0 top-0 w-24 h-24 bg-gradient-to-br ${stat.gradient} opacity-10 rounded-full transform ${isRTL ? '-translate-x-6' : 'translate-x-6'} -translate-y-6`}></div>
          <CardContent className="p-4 relative">
            <div className={`flex items-start justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              {isHebrew ? (
                <>
                  <div className={`p-2 rounded-lg ${stat.iconBg}`}>
                    <stat.icon className={`w-4 h-4 ${stat.accent}`} />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stat.value}
                    </p>
                    {stat.change && (
                      <p className="text-xs text-gray-500 mt-1">
                        {stat.change}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className={isRTL ? 'text-right' : ''}>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stat.value}
                    </p>
                    {stat.change && (
                      <p className="text-xs text-gray-500 mt-1">
                        {stat.change}
                      </p>
                    )}
                  </div>
                  <div className={`p-2 rounded-lg ${stat.iconBg}`}>
                    <stat.icon className={`w-4 h-4 ${stat.accent}`} />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
