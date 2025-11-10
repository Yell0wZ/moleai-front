import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Tag, Heart, Brain } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/components/common/LanguageProvider';

export default function BrandAnalysis({ prompts, businessProfile, businessId }) {
  const { t, isRTL, isHebrew } = useLanguage();

  // Extract brandAnalysis data from prompts
  const brandAnalysisData = [];

  prompts.forEach((prompt) => {
    // Check for brandAnalysis directly on the prompt
    if (prompt.brandAnalysis) {
      brandAnalysisData.push(prompt.brandAnalysis);
    }
    // Check for the correct structure: prompts[1].brandAnalysis
    else if (prompt[1] && prompt[1].brandAnalysis) {
      brandAnalysisData.push(prompt[1].brandAnalysis);
    }
    // Fallback to prompts[0] structure
    else if (prompt[0] && prompt[0].brandAnalysis) {
      brandAnalysisData.push(prompt[0].brandAnalysis);
    }
  });

  // If no brand analysis data, show message
  if (brandAnalysisData.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Tag className="w-5 h-5 text-blue-600" />
              {isHebrew ? "ניתוח מותג" : "Brand Analysis"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900 mb-2">
                {isHebrew ? "אין נתוני ניתוח זמינים" : "No Brand Analysis Data Available"}
              </h3>
              <p className="text-sm text-gray-600">
                {isHebrew 
                  ? "נתוני ניתוח המותג יופיעו כאן לאחר ביצוע פרומפטים עם ניתוח מותג."
                  : "Brand analysis data will appear here after running prompts with brand analysis."
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Get the most recent brand analysis (assuming the first one is the latest)
  const latestBrandAnalysis = brandAnalysisData[0];

  // Extract keywords and sentiment
  const keywords = latestBrandAnalysis.keywords || [];
  const sentiment = latestBrandAnalysis.sentiment || 'Neutral';

  // Extract counts data from all prompts
  const countsData = [];
  
  prompts.forEach((prompt, index) => {
    // Check for counts directly on the prompt
    if (prompt.counts) {
      countsData.push(prompt.counts);
    }
    // Check for the correct structure: prompts[1].counts
    else if (prompt[1] && prompt[1].counts) {
      countsData.push(prompt[1].counts);
    }
    // Fallback to prompts[0] structure
    else if (prompt[0] && prompt[0].counts) {
      countsData.push(prompt[0].counts);
    }
  });

  // Calculate total counts from all prompts (not just the latest)
  const totalCounts = countsData.reduce((acc, counts) => {
    return {
      businessNameMentions: (acc.businessNameMentions || 0) + (counts.businessNameMentions || 0),
      competitorsMentions: (acc.competitorsMentions || 0) + (counts.competitorsMentions || 0),
      industryMentions: (acc.industryMentions || 0) + (counts.industryMentions || 0),
      productsServicesMentions: (acc.productsServicesMentions || 0) + (counts.productsServicesMentions || 0),
    };
  }, {});

  // Use total counts from all prompts
  const displayCounts = Object.keys(totalCounts).length > 0 ? totalCounts : {};

  // Get sentiment color and icon
  const getSentimentConfig = (sentiment) => {
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: <Heart className="w-4 h-4 text-green-600" />,
          bgColor: 'bg-green-50'
        };
      case 'negative':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />,
          bgColor: 'bg-red-50'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <Brain className="w-4 h-4 text-gray-600" />,
          bgColor: 'bg-gray-50'
        };
    }
  };

  const sentimentConfig = getSentimentConfig(sentiment);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm h-full flex flex-col min-h-[800px]">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Tag className="w-5 h-5 text-blue-600" />
            {isHebrew ? "ניתוח מותג" : "Brand Analysis"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 flex-1 flex flex-col">

          <div className={`p-4 rounded-lg border ${sentimentConfig.bgColor} ${sentimentConfig.color} relative`}>
            <div className="flex items-center gap-3">
              {sentimentConfig.icon}
              <div>
                <h3 className="font-medium">
                  {isHebrew ? "רגש כללי" : "Overall Sentiment"}
                </h3>
                <p className="text-sm opacity-80">
                  {isHebrew ? "הרגש הכללי של המותג" : "The overall sentiment of your brand"}
                </p>
              </div>
            </div>

            <div className={`absolute top-3 ${isHebrew ? 'left-3' : 'right-3'}`}>
              <Badge 
                variant="outline" 
                className={`${sentimentConfig.color} font-medium`}
              >
                {sentiment}
              </Badge>
            </div>
          </div>



          {Object.keys(displayCounts).length > 0 && (
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                {isHebrew ? "סטטיסטיקות אזכורים" : "Mention Statistics"}
              </h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1 whitespace-nowrap">
                  <span className="font-bold">{displayCounts.businessNameMentions || 0}</span>
                  <span>{isHebrew ? "שם עסק" : "Business"}</span>
                </Badge>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1 whitespace-nowrap">
                  <span className="font-bold">{displayCounts.competitorsMentions || 0}</span>
                  <span>{isHebrew ? "מתחרים" : "Competitors"}</span>
                </Badge>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1 whitespace-nowrap">
                  <span className="font-bold">{displayCounts.industryMentions || 0}</span>
                  <span>{isHebrew ? "תעשייה" : "Industry"}</span>
                </Badge>
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 flex items-center gap-1 whitespace-nowrap">
                  <span className="font-bold">{displayCounts.productsServicesMentions || 0}</span>
                  <span>{isHebrew ? "מוצרים" : "Products"}</span>
                </Badge>
              </div>
            </div>
          )}


          {keywords.length > 0 && (
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Brain className="w-4 h-4 text-blue-600" />
                {isHebrew ? "מילות מפתח עיקריות" : "Key Keywords"}
              </h3>
              <div className="flex flex-wrap gap-2">
                {keywords.slice(0, 8).map((keyword, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <Badge 
                      variant="secondary" 
                      className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors"
                    >
                      {keyword}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </div>
          )}



          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-600" />
              {isHebrew ? "המלצות לפעולה" : "Action Recommendations"}
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      {isHebrew ? "הגבר נוכחות דיגיטלית" : "Increase Digital Presence"}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      {isHebrew ? "השתמש במילות המפתח העיקריות בתוכן שלך" : "Use key keywords in your content strategy"}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      {isHebrew ? "שפר את הרגש החיובי" : "Enhance Positive Sentiment"}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      {isHebrew ? "התמקד בהיבטים החיוביים של המותג" : "Focus on positive brand aspects in communications"}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-orange-800">
                      {isHebrew ? "מעקב מתחרים" : "Monitor Competitors"}
                    </p>
                    <p className="text-xs text-orange-600 mt-1">
                      {isHebrew ? "עקוב אחר אזכורי המתחרים ונתח את האסטרטגיה שלהם" : "Track competitor mentions and analyze their strategy"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>


          <div className="-mb-[-10px] border-t border-gray-100">
            <h3 className="font-medium mb-2">
              {isHebrew ? "סיכום הניתוח" : "Analysis Summary"}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {isHebrew 
                ? `הניתוח מציג ${sentiment.toLowerCase() === 'positive' ? 'רגש חיובי' : sentiment.toLowerCase() === 'negative' ? 'רגש שלילי' : 'רגש ניטרלי'} עם ${keywords.length} מילות מפתח עיקריות. המותג מציג ביצועים טובים עם מגמה חיובית באזכורים ובתפיסה הכללית.`
                : `The analysis shows a ${sentiment.toLowerCase()} sentiment with ${keywords.length} key keywords identified. The brand demonstrates strong performance with positive trends in mentions and overall perception.`
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
