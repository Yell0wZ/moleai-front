import React, { useState, useEffect } from "react";
import { BusinessProfile, Competitor } from "@/api/entities";
import { Prompt } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Building2, BarChart3, Calendar } from "lucide-react";
import { useLanguage } from "@/components/common/LanguageProvider";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import PageHeader from "@/components/common/PageHeader";
import { Lordicon } from "@/components/ui/lordicon";
import { format, parseISO, startOfWeek, endOfWeek, subDays, startOfMonth, endOfMonth, subWeeks, subMonths } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

import CompetitorManagement from "../components/competitors/CompetitorManagement";

export default function CompetitorPage({ businessId, refreshBusinessData }) {
  const { t, isRTL, isHebrew } = useLanguage();
  const navigate = useNavigate();
  const [businessProfile, setBusinessProfile] = useState(null);
  const [prompts, setPrompts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
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
      // Check if business profile exists for current user
      const [promptData, businessProfileExists, currentUserProfile] = await Promise.all([
        Prompt.list('-created_date', currentBusinessId),
        BusinessProfile.checkExists(currentBusinessId),
        BusinessProfile.getCurrentUser(currentBusinessId)
      ]);
      

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

  const handleDataUpdate = () => {
    loadData();
    // Trigger business data refresh
    if (refreshBusinessData) {
      refreshBusinessData();
    }
  };

  const getDateRange = () => {
    const today = new Date();

    switch (selectedPeriod) {
      case 'week':
        return { start: startOfWeek(today), end: endOfWeek(today) };
      case 'lastWeek':
        const lastWeekStart = startOfWeek(subWeeks(today, 1));
        const lastWeekEnd = endOfWeek(subWeeks(today, 1));
        return { start: lastWeekStart, end: lastWeekEnd };
      case '7days':
        return { start: subDays(today, 6), end: today };
      case '14days':
        return { start: subDays(today, 13), end: today };
      case '30days':
        return { start: subDays(today, 29), end: today };
      case 'month':
        return { start: startOfMonth(today), end: endOfMonth(today) };
      case 'lastMonth':
        const lastMonth = subMonths(today, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case 'custom':
        if (customDateRange.start && customDateRange.end) {
          return {
            start: parseISO(customDateRange.start),
            end: parseISO(customDateRange.end)
          };
        }
        return { start: subDays(today, 6), end: today };
      default:
        return { start: startOfWeek(today), end: endOfWeek(today) };
    }
  };

  const getFilteredPrompts = () => {
    if (!prompts.length) return [];

    const dateRange = getDateRange();
    return prompts.filter(prompt => {
      let promptDate;
      if (prompt.created_date instanceof Date) {
        promptDate = prompt.created_date;
      } else if (typeof prompt.created_date === 'string') {
        promptDate = parseISO(prompt.created_date);
      } else {
        promptDate = new Date();
      }

      return promptDate >= dateRange.start && promptDate <= dateRange.end;
    });
  };

  const getCompetitorData = () => {
    if (!businessProfile) return [];

    const filteredPrompts = getFilteredPrompts();
    if (!filteredPrompts.length) return [];

    const businessMentions = filteredPrompts.reduce((sum, p) => sum + (p.businessNameMentions || 0), 0);
    const totalCompetitorMentions = filteredPrompts.reduce((sum, p) => sum + (p.competitorsMentions || 0), 0);

    // Get business name from current business profile
    const businessName = businessProfile.business_name || businessProfile.businessName || 'Business';

    const data = [
      {
        name: businessName,
        mentions: businessMentions,
        type: 'business'
      }
    ];

    // Get competitors from current business profile
    const competitors = businessProfile.competitors || [];
    if (competitors.length > 0) {
      // Since we only have total competitor mentions, distribute them equally among competitors
      // or show total competitor mentions as a single entry
      const mentionsPerCompetitor = Math.floor(totalCompetitorMentions / competitors.length);
      const remainingMentions = totalCompetitorMentions % competitors.length;

      competitors.forEach((competitor, index) => {
        const mentions = mentionsPerCompetitor + (index < remainingMentions ? 1 : 0);
        data.push({
          name: typeof competitor === 'string' ? competitor : competitor.name,
          mentions,
          type: 'competitor'
        });
      });
    }

    return data.sort((a, b) => b.mentions - a.mentions);
  };

  const getPieChartData = () => {
    const data = getCompetitorData();
    const totalMentions = data.reduce((sum, item) => sum + item.mentions, 0);
    
    if (totalMentions === 0) return [];
    
    return data.map(item => ({
      name: item.name,
      value: item.mentions,
      percentage: ((item.mentions / totalMentions) * 100).toFixed(1)
    }));
  };

  const COLORS = ['#3B82F6', '#8B5CF6', '#EF4444', '#10B981', '#F59E0B', '#6366F1'];

  const periodOptions = [
    { value: 'week', label: t('competitors.thisWeek') },
    { value: 'lastWeek', label: t('competitors.lastWeek') },
    { value: '7days', label: t('competitors.last7Days') },
    { value: '14days', label: t('competitors.last14Days') },
    { value: '30days', label: t('competitors.last30Days') },
    { value: 'month', label: t('competitors.thisMonth') },
    { value: 'lastMonth', label: t('competitors.lastMonth') },
    { value: 'custom', label: t('competitors.customRange') }
  ];

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
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {isHebrew ? "נדרש פרופיל עסקי" : "Business Profile Required"}
            </h2>
            <p className="text-gray-600 mb-4">
              {isHebrew 
                ? "אנא הגדר תחילה את הפרופיל העסקי שלך והוסף מתחרים כדי לראות ניתוח זה."
                : "Please set up your business profile and add competitors to view this analysis."
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

  const competitorData = getCompetitorData();
  const pieData = getPieChartData();

  return (
    <div className={`p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8 competitor-page-desktop-shift ${isRTL ? 'text-right' : ''}`}>
      <PageHeader
        icon={<TrendingUp className="w-8 h-8" />}
        title={t('competitors.title')}
        subtitle={t('competitors.subtitle')}
        isRTL={isRTL}
        showOnMobile={false}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <CompetitorManagement
            businessProfile={businessProfile}
            competitors={(businessProfile?.competitors || []).map(comp =>
              typeof comp === 'string' ? { id: comp, name: comp } : comp
            )}
            onUpdate={handleDataUpdate}
            businessId={currentBusinessId}
          />
        </motion.div>


        <div className="lg:col-span-2 space-y-4 sm:space-y-6">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className={`flex flex-col gap-4 ${isRTL ? 'text-right' : ''}`}>
                  <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''} ${isHebrew ? 'justify-end' : ''}`}>
                    {isHebrew ? (
                      <>
                        {t('competitors.mentionComparison')}
                        <BarChart3 className="w-5 h-5 text-sky-600" />
                      </>
                    ) : (
                      <>
                        <BarChart3 className="w-5 h-5 text-sky-600" />
                        {t('competitors.mentionComparison')}
                      </>
                    )}
                  </CardTitle>


                  <div className={`flex flex-wrap gap-1 sm:gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    {periodOptions.map(option => (
                      <Button
                        key={option.value}
                        variant={selectedPeriod === option.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedPeriod(option.value)}
                        className={`text-xs h-8 px-2 sm:px-3 ${
                          selectedPeriod === option.value
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300'
                        }`}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>


                  {selectedPeriod === 'custom' && (
                    <div className={`flex flex-col sm:flex-row gap-2 items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <input
                        type="date"
                        value={customDateRange.start}
                        onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto"
                        placeholder="Start Date"
                      />
                      <span className="text-gray-500 text-sm">{isHebrew ? "עד" : "to"}</span>
                      <input
                        type="date"
                        value={customDateRange.end}
                        onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto"
                        placeholder="End Date"
                      />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {competitorData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={competitorData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#6B7280"
                        tick={{ fontSize: 12, fill: '#374151' }}
                        angle={0}
                        textAnchor="middle"
                        height={60}
                        interval={0}
                        tickMargin={10}
                      />
                      <YAxis stroke="#6B7280" />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Bar 
                        dataKey="mentions" 
                        fill={(entry, index) => entry.type === 'business' ? '#3B82F6' : '#8B5CF6'}
                        radius={[4, 4, 0, 0]}
                      >
                        {competitorData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.type === 'business' ? '#3B82F6' : COLORS[index % COLORS.length]} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12">
                    <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">{t('competitors.noData')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>


          {pieData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-sky-600" />
                    {t('competitors.marketShare')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col lg:flex-row items-center gap-4 sm:gap-6">
                    <ResponsiveContainer width="100%" height={350}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({percentage, value}) => {
                            // Only show label if value is greater than 0 and percentage is meaningful
                            if (value > 0 && parseFloat(percentage) >= 1) {
                              return `${percentage}%`;
                            }
                            return '';
                          }}
                          labelLine={{ stroke: '#666', strokeWidth: 1 }}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #E5E7EB',
                            borderRadius: '8px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                          }}
                          formatter={(value, name, props) => [
                            `${props.payload.percentage}% (${value} mentions)`,
                            props.payload.name
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    
                    <div className="space-y-2 w-full lg:min-w-[200px]">
                      {pieData.map((entry, index) => (
                        <div key={entry.name} className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          ></div>
                          <span className={`text-sm font-medium truncate ${isRTL ? 'text-right' : ''}`}>{entry.name}</span>
                          <span className={`text-sm text-gray-500 ${isRTL ? 'mr-auto' : 'ml-auto'}`}>{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
