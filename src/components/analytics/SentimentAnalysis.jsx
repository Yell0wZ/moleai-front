import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Meh, Frown } from "lucide-react";
import { useLanguage } from "@/components/common/LanguageProvider";

export default function SentimentAnalysis({ prompts, businessProfile, businessId }) {
  const { t, isRTL, isHebrew } = useLanguage();
  
  const getSentimentData = () => {
    const sentiments = { positive: 0, neutral: 0, negative: 0 };
    
    // Debug: Log prompts structure
    console.log('SentimentAnalysis - prompts:', prompts);
    console.log('SentimentAnalysis - prompts length:', prompts.length);
    if (prompts.length > 0) {
      console.log('SentimentAnalysis - first prompt:', prompts[0]);
      console.log('SentimentAnalysis - first prompt keys:', Object.keys(prompts[0]));
      
      // Check if brandAnalysis exists in different locations
      console.log('Checking for brandAnalysis in different locations:');
      console.log('prompts[0][1]:', prompts[0][1]);
      console.log('prompts[0].brandAnalysis:', prompts[0].brandAnalysis);
      console.log('prompts[0].responses:', prompts[0].responses);
      console.log('prompts[0].responses.brandAnalysis:', prompts[0].responses?.brandAnalysis);
    }
    
    prompts.forEach((prompt, index) => {
      console.log(`Checking prompt ${index}:`);
      
      // Check for the correct structure: prompts[1].brandAnalysis.sentiment
      if (prompt[1]?.brandAnalysis?.sentiment) {
        const sentiment = prompt[1].brandAnalysis.sentiment.toLowerCase();
        console.log('Found sentiment in prompts[1]:', sentiment);
        if (sentiment === 'positive') {
          sentiments.positive++;
        } else if (sentiment === 'negative') {
          sentiments.negative++;
        } else {
          sentiments.neutral++;
        }
      }
      // Check if brandAnalysis is directly on the prompt
      else if (prompt.brandAnalysis?.sentiment) {
        const sentiment = prompt.brandAnalysis.sentiment.toLowerCase();
        console.log('Found sentiment in prompt.brandAnalysis:', sentiment);
        if (sentiment === 'positive') {
          sentiments.positive++;
        } else if (sentiment === 'negative') {
          sentiments.negative++;
        } else {
          sentiments.neutral++;
        }
      }
      // Fallback to prompts[0] structure
      else if (prompt[0]?.brandAnalysis?.sentiment) {
        const sentiment = prompt[0].brandAnalysis.sentiment.toLowerCase();
        if (sentiment === 'positive') {
          sentiments.positive++;
        } else if (sentiment === 'negative') {
          sentiments.negative++;
        } else {
          sentiments.neutral++;
        }
      }
      // Fallback to old structure if exists
      else if (prompt.responses?.brandAnalysis?.sentiment) {
        const sentiment = prompt.responses.brandAnalysis.sentiment.toLowerCase();
        if (sentiment === 'positive') {
          sentiments.positive++;
        } else if (sentiment === 'negative') {
          sentiments.negative++;
        } else {
          sentiments.neutral++;
        }
      }
      else if (prompt.sentiment_analysis?.business_sentiment) {
        sentiments[prompt.sentiment_analysis.business_sentiment]++;
      }
      // Fallback to sentiment_score if exists
      else if (prompt.sentiment_score !== undefined) {
        if (prompt.sentiment_score > 0.6) {
          sentiments.positive++;
        } else if (prompt.sentiment_score < 0.4) {
          sentiments.negative++;
        } else {
          sentiments.neutral++;
        }
      }
    });

    const total = Object.values(sentiments).reduce((sum, count) => sum + count, 0);
    
    // Debug: Log sentiment counts
    console.log('SentimentAnalysis - Positive count:', sentiments.positive);
    console.log('SentimentAnalysis - Neutral count:', sentiments.neutral);
    console.log('SentimentAnalysis - Negative count:', sentiments.negative);
    console.log('SentimentAnalysis - Total prompts:', total);
    
    return {
      positive: { count: sentiments.positive, percentage: total > 0 ? (sentiments.positive / total * 100).toFixed(1) : 0 },
      neutral: { count: sentiments.neutral, percentage: total > 0 ? (sentiments.neutral / total * 100).toFixed(1) : 0 },
      negative: { count: sentiments.negative, percentage: total > 0 ? (sentiments.negative / total * 100).toFixed(1) : 0 }
    };
  };

  const sentimentData = getSentimentData();
  const totalSentiments = sentimentData.positive.count + sentimentData.neutral.count + sentimentData.negative.count;

  // If no sentiment data available, show message
  if (totalSentiments === 0) {
    return (
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse text-right' : ''} ${isHebrew ? 'justify-end' : ''}`}>
            {isHebrew ? (
              <>
                {t('analytics.sentimentAnalysis')}
                <Heart className="w-5 h-5 text-green-600" />
              </>
            ) : (
              <>
                <Heart className="w-5 h-5 text-green-600" />
                {t('analytics.sentimentAnalysis')}
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-2">
              {t('analytics.noSentimentData') || 'No Sentiment Data Available'}
            </h3>
            <p className="text-sm text-gray-600">
              {t('analytics.noSentimentDataMessage') || 'Sentiment analysis data will appear here after running prompts with sentiment analysis.'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const sentimentItems = [
    {
      type: 'positive',
      icon: Heart,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      label: t('analytics.positive'),
      data: sentimentData.positive
    },
    {
      type: 'neutral',
      icon: Meh,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      label: t('analytics.neutral'),
      data: sentimentData.neutral
    },
    {
      type: 'negative',
      icon: Frown,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      label: t('analytics.negative'),
      data: sentimentData.negative
    }
  ];

  return (
    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse text-right' : ''} ${isHebrew ? 'justify-end' : ''}`}>
          {isHebrew ? (
            <>
              {t('analytics.sentimentAnalysis')}
              <Heart className="w-5 h-5 text-green-600" />
            </>
          ) : (
            <>
              <Heart className="w-5 h-5 text-green-600" />
              {t('analytics.sentimentAnalysis')}
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sentimentItems.map((item) => (
            <div key={item.type} className={`flex items-center justify-between p-4 rounded-lg bg-gray-50 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`p-2 rounded-full ${item.bgColor}`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div className={isRTL ? 'text-right' : ''}>
                  <p className="font-medium text-gray-900">{item.label}</p>
                  <p className="text-sm text-gray-500">{item.data.count} {t('analytics.mentions')}</p>
                </div>
              </div>
              <div className={`${isRTL ? 'text-left' : 'text-right'}`}>
                <div className="text-2xl font-bold text-gray-900">{item.data.percentage}%</div>
                <div className={`w-16 h-2 bg-gray-200 rounded-full mt-1 ${isRTL ? 'mr-auto' : 'ml-auto'}`}>
                  <div 
                    className={`h-full rounded-full ${item.bgColor.replace('bg-', 'bg-').replace('-100', '-500')}`}
                    style={{ width: `${item.data.percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}