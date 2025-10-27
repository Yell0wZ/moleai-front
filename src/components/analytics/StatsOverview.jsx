import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, MessageSquare, Target, Award } from "lucide-react";
import { useLanguage } from "@/components/common/LanguageProvider";
import { motion } from "framer-motion";

export default function StatsOverview({ prompts = [], businessProfile, businessId }) {
  const { t, isRTL, isHebrew } = useLanguage();

  // Make sure prompts is an array
  const safePrompts = Array.isArray(prompts) ? prompts : [];

  const totalMentions = safePrompts.reduce((sum, p) => {
    const mentions = p.counts?.businessNameMentions || p.businessNameMentions || 0;
    return sum + mentions;
  }, 0);

  const totalCompetitorMentions = safePrompts.reduce((sum, p) => {
    const mentions = p.counts?.competitorsMentions || p.competitorsMentions || 0;
    return sum + mentions;
  }, 0);

  const averageMentionsPerPrompt = safePrompts.length > 0 ? (totalMentions / safePrompts.length).toFixed(1) : '0';
  
  const mentionShare = totalMentions + totalCompetitorMentions > 0 
    ? ((totalMentions / (totalMentions + totalCompetitorMentions)) * 100).toFixed(1)
    : '0';


  const stats = [
    {
      title: t('analytics.totalMentions'),
      value: totalMentions,
      icon: MessageSquare,
      gradient: "from-blue-500 via-sky-500 to-blue-600",
      accent: "text-white",
      iconBg: "bg-white/20",
      change: t('analytics.vsLastWeek')
    },
    {
      title: t('analytics.mentionShare'),
      value: `${mentionShare}%`,
      icon: Target,
      gradient: "from-emerald-500 via-green-500 to-teal-600",
      accent: "text-white",
      iconBg: "bg-white/20",
      change: t('analytics.vsCompetitors')
    },
    {
      title: t('analytics.avgQuery'),
      value: averageMentionsPerPrompt,
      icon: TrendingUp,
      gradient: "from-purple-500 via-violet-500 to-purple-600",
      accent: "text-white",
      iconBg: "bg-white/20",
      change: t('analytics.mentionsPerPrompt')
    },
    {
      title: t('analytics.brandScore'),
      value: Math.min(100, Math.round(totalMentions * 2.5)).toString(),
      icon: Award,
      gradient: "from-orange-500 via-amber-500 to-orange-600",
      accent: "text-white",
      iconBg: "bg-white/20",
      change: t('analytics.outOf100')
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className={`relative overflow-hidden bg-gradient-to-br ${stat.gradient} text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-500 group`}>
          <CardContent className="p-4 relative">
            <div className={`flex items-start justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              {isHebrew ? (
                <>
                  <div className="text-right">
                    <p className="text-xs font-medium text-white/80 uppercase tracking-wider">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {stat.value}
                    </p>
                    {stat.change && (
                      <p className="text-xs text-white/70 mt-1">
                        {stat.change}
                      </p>
                    )}
                  </div>
                  <div className={`w-10 h-10 ${stat.iconBg} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className={`w-5 h-5 ${stat.accent}`} strokeWidth={2.5} />
                  </div>
                </>
              ) : (
                <>
                  <div className={isRTL ? 'text-right' : ''}>
                    <p className="text-xs font-medium text-white/80 uppercase tracking-wider">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {stat.value}
                    </p>
                    {stat.change && (
                      <p className="text-xs text-white/70 mt-1">
                        {stat.change}
                      </p>
                    )}
                  </div>
                  <div className={`w-10 h-10 ${stat.iconBg} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className={`w-5 h-5 ${stat.accent}`} strokeWidth={2.5} />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        </motion.div>
      ))}
    </div>
  );
}
