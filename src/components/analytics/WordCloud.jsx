import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud } from "lucide-react";
import { useLanguage } from "@/components/common/LanguageProvider";

export default function WordCloud({ prompts, businessId }) {
  const { t, isRTL, isHebrew } = useLanguage();
  
  const getKeywords = () => {
    // Extract keywords from brandAnalysis data - only from the latest prompt
    const allKeywords = [];
    
    // Debug: Log prompts structure
    
    // Get only the latest prompt (most recent)
    if (prompts.length > 0) {
      const latestPrompt = prompts[0]; // Assuming prompts are sorted by date (newest first)
      
      // Check for brandAnalysis directly on the latest prompt
      if (latestPrompt.brandAnalysis?.keywords) {
        allKeywords.push(...latestPrompt.brandAnalysis.keywords);
      }
      // Check for the correct structure: prompts[1].brandAnalysis.keywords
      else if (latestPrompt[1]?.brandAnalysis?.keywords) {
        allKeywords.push(...latestPrompt[1].brandAnalysis.keywords);
      }
      // Fallback to prompts[0] structure
      else if (latestPrompt[0]?.brandAnalysis?.keywords) {
        allKeywords.push(...latestPrompt[0].brandAnalysis.keywords);
      }
      // Fallback to old structure
      else if (latestPrompt.responses?.brandAnalysis?.keywords) {
        allKeywords.push(...latestPrompt.responses.brandAnalysis.keywords);
      }
    }
    
    // Debug: Log keywords found
    
    // If no keywords from latest prompt, show message
    if (allKeywords.length === 0) {
      return [];
    }
    
    // Count keyword frequency and create word cloud data
    const keywordCounts = {};
    allKeywords.forEach(keyword => {
      keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
    });
    
    // Convert to word cloud format with size based on frequency
    const colors = [
      'bg-blue-100 text-blue-700 border-blue-200',
      'bg-green-100 text-green-700 border-green-200', 
      'bg-purple-100 text-purple-700 border-purple-200',
      'bg-pink-100 text-pink-700 border-pink-200',
      'bg-indigo-100 text-indigo-700 border-indigo-200',
      'bg-teal-100 text-teal-700 border-teal-200',
      'bg-orange-100 text-orange-700 border-orange-200',
      'bg-cyan-100 text-cyan-700 border-cyan-200',
      'bg-rose-100 text-rose-700 border-rose-200',
      'bg-emerald-100 text-emerald-700 border-emerald-200'
    ];
    
    return Object.entries(keywordCounts).map(([keyword, count], index) => ({
      text: keyword,
      size: Math.random() * 20 + 10, // Random size between 10-30
      colorClass: colors[index % colors.length] // Cycle through colors
    }));
  };

  const keywords = getKeywords();

  return (
    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse text-right' : ''} ${isHebrew ? 'justify-end' : ''}`}>
          {isHebrew ? (
            <>
              {t('analytics.keyThemes')}
              <Cloud className="w-5 h-5 text-blue-600" />
            </>
          ) : (
            <>
              <Cloud className="w-5 h-5 text-blue-600" />
              {t('analytics.keyThemes')}
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {keywords.length > 0 ? (
          <div className="relative">
            <div 
              className={`overflow-y-auto p-4 ${isRTL ? 'text-right' : ''}`}
              style={{
                scrollbarWidth: 'none', /* Firefox */
                msOverflowStyle: 'none', /* Internet Explorer 10+ */
              }}
            >
              <style jsx>{`
                div::-webkit-scrollbar {
                  display: none; /* Chrome, Safari, Opera */
                }
              `}</style>
              <div className={`flex flex-wrap gap-2 justify-center items-start ${isRTL ? 'text-right' : ''}`}>
              {keywords.map((keyword, index) => (
                <span
                  key={index}
                  className={`inline-flex items-center justify-center px-3 py-2 rounded-full font-normal hover:shadow-md transition-all duration-200 cursor-default whitespace-nowrap ${keyword.colorClass}`}
                  style={{ 
                    fontSize: `${Math.min(18, Math.max(10, keyword.size * 0.8))}px`,
                    fontFamily: isHebrew ? "'Segoe UI', Tahoma, Arial, 'Noto Sans Hebrew', sans-serif" : 'inherit'
                  }}
                >
                  {keyword.text}
                </span>
              ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Cloud className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-2">
              {isHebrew ? "אין מילות מפתח זמינות" : "No Keywords Available"}
            </h3>
            <p className="text-sm text-gray-600">
              {isHebrew 
                ? "מילות מפתח יופיעו כאן לאחר ביצוע פרומפטים עם ניתוח מותג."
                : "Keywords will appear here after running prompts with brand analysis."
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
