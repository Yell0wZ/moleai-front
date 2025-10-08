import React, { useState, useEffect } from "react";
import { Prompt } from "@/api/entities";
import { BusinessProfile } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Brain, Sparkles, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/common/LanguageProvider";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/common/PageHeader";
import { Lordicon } from "@/components/ui/lordicon";

import StatsOverview from "../components/analytics/StatsOverview";
import SentimentAnalysis from "../components/analytics/SentimentAnalysis";
import TrendChart from "../components/analytics/TrendChart";
import WordCloud from "../components/analytics/WordCloud";
import BrandAnalysis from "../components/analytics/BrandAnalysis";

export default function AnalyticsPage({ businessId, refreshBusinessData }) {
  const { t, isRTL, isHebrew } = useLanguage();
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState([]);
  const [businessProfile, setBusinessProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Get current business context
  const currentBusinessId = businessId || null; // null = primary business

  useEffect(() => {
    loadData();
  }, [businessId, currentBusinessId, refreshTrigger]);

  // Listen for refresh trigger from parent
  useEffect(() => {
    if (refreshBusinessData) {
      setRefreshTrigger(prev => prev + 1);
    }
  }, [refreshBusinessData]);

  const loadData = async () => {
    try {
      console.log('Analytics - Starting loadData with currentBusinessId:', currentBusinessId);
      
      // Load data based on current business context
      const [promptData, businessProfileExists, currentUserProfile] = await Promise.all([
        Prompt.list('-created_date', currentBusinessId),
        BusinessProfile.checkExists(currentBusinessId),
        BusinessProfile.getCurrentUser(currentBusinessId)
      ]);
      
      console.log('Analytics - currentBusinessId:', currentBusinessId);
      console.log('Analytics - promptData:', promptData);
      console.log('Analytics - promptData length:', promptData?.length);
      console.log('Analytics - businessProfileExists:', businessProfileExists);
      console.log('Analytics - currentUserProfile:', currentUserProfile);
      
      // Prompts are already filtered by Prompt.list() based on personas
      // No additional filtering needed
      setPrompts(promptData);
      
      if (businessProfileExists && currentUserProfile) {
        setBusinessProfile(currentUserProfile);
      } else {
        setBusinessProfile(null);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      setBusinessProfile(null);
    }
    setIsLoading(false);
  };

  const handleDataRefresh = () => {
    loadData();
    // Trigger business data refresh
    if (refreshBusinessData) {
      refreshBusinessData();
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-140px)] gap-4">
        <Lordicon size="lg" variant="primary" />
        <p className="text-sm text-gray-500 animate-pulse">
         
        </p>
      </div>
    );
  }

  if (!businessProfile) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto">
        <Card className="text-center shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-8 pb-8">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {isHebrew ? "נדרש פרופיל עסקי" : "Business Profile Required"}
            </h2>
            <p className="text-gray-600 mb-4">
              {isHebrew 
                ? "אנא הגדר תחילה את הפרופיל העסקי שלך כדי לראות אנליטיקה ותובנות."
                : "Please set up your business profile first to view analytics and insights."
              }
            </p>
            <Button 
              onClick={() => navigate(createPageUrl("BusinessProfile"))}
              className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700"
            >
              <Building2 className="w-4 h-4 mr-2" />
              {isHebrew ? "הגדר פרופיל עסקי" : "Set Up Business Profile"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (prompts.length === 0) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto">
        <Card className="text-center shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-8 pb-8">
            <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">{t('analytics.noData')}</h2>
            <p className="text-gray-600 mb-4">
              {t('analytics.noDataMessage')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8 analytics-page-desktop-shift laptop-spacing laptop-lg-spacing desktop-spacing desktop-lg-spacing ${isRTL ? 'text-right' : ''}`}>
      <PageHeader
        icon={(
          <div className="flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <Sparkles className="w-5 h-5 text-sky-500" />
          </div>
        )}
        title={t('analytics.title')}
        subtitle={t('analytics.subtitle')}
        isRTL={isRTL}
        showOnMobile={false}
      />

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <StatsOverview 
          prompts={prompts} 
          businessProfile={businessProfile}
          businessId={currentBusinessId}
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 responsive-grid-3">
        {/* Left Column - Sentiment Analysis and Key Themes */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Sentiment Analysis and Key Themes Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 responsive-grid-2">
            {/* Sentiment Analysis */}
            <motion.div
              initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <SentimentAnalysis 
                prompts={prompts} 
                businessProfile={businessProfile}
                businessId={currentBusinessId}
              />
            </motion.div>

            {/* Key Themes */}
            <motion.div
              initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <WordCloud prompts={prompts} businessId={currentBusinessId} />
            </motion.div>
          </div>

          {/* Trend Chart - Full width below */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <TrendChart prompts={prompts} businessId={currentBusinessId} />
          </motion.div>
        </div>

        {/* Right Column - Brand Analysis */}
        <div className="space-y-4 sm:space-y-6">
            <BrandAnalysis 
              prompts={prompts} 
              businessProfile={businessProfile}
              businessId={currentBusinessId}
            />
        </div>
      </div>
    </div>
  );
}
