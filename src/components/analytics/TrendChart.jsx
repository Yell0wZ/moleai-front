import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Calendar } from "lucide-react";
import { format, parseISO, eachDayOfInterval, startOfWeek, endOfWeek, subDays, startOfMonth, endOfMonth, subWeeks, subMonths } from "date-fns";
import { useLanguage } from "@/components/common/LanguageProvider";

export default function TrendChart({ prompts, businessId }) {
  const { t, isRTL, isHebrew } = useLanguage();
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  
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
      case 'lifetime':
        // For lifetime, return null to indicate no date filtering
        return null;
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

  const getTrendData = () => {
    if (prompts.length === 0) return [];


    // Group prompts by day
    const dailyMentions = {};
    const dateRange = getDateRange();

    // For lifetime, use all prompts without date filtering
    let filteredPrompts;
    if (selectedPeriod === 'lifetime') {
      filteredPrompts = prompts;
    } else {
      // Filter prompts within the selected date range
      filteredPrompts = prompts.filter(prompt => {
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
    }

    filteredPrompts.forEach(prompt => {
      let date;
      if (prompt.created_date instanceof Date) {
        date = format(prompt.created_date, 'yyyy-MM-dd');
      } else if (typeof prompt.created_date === 'string') {
        date = format(parseISO(prompt.created_date), 'yyyy-MM-dd');
      } else {
        date = format(new Date(), 'yyyy-MM-dd');
      }

      if (!dailyMentions[date]) {
        dailyMentions[date] = 0;
      }
      
      // Try the correct structure: prompts[1].counts.businessNameMentions
      let mentions = 0;
      if (prompt[1]?.counts?.businessNameMentions) {
        mentions = prompt[1].counts.businessNameMentions;
      } else if (prompt[0]?.counts?.businessNameMentions) {
        mentions = prompt[0].counts.businessNameMentions;
      } else if (prompt.counts?.businessNameMentions) {
        mentions = prompt.counts.businessNameMentions;
      } else if (prompt.businessNameMentions) {
        mentions = prompt.businessNameMentions;
      } else if (prompt.business_mentions) {
        mentions = prompt.business_mentions;
      }
      
      dailyMentions[date] += mentions;
    });

    // For lifetime, use all unique dates from prompts instead of a date range
    let days;
    if (selectedPeriod === 'lifetime') {
      // Get all unique dates from prompts
      const uniqueDates = new Set(Object.keys(dailyMentions));
      days = Array.from(uniqueDates)
        .map(dateStr => parseISO(dateStr))
        .filter(date => !isNaN(date.getTime()))
        .sort((a, b) => a.getTime() - b.getTime());
      
      // If no dates found, return empty array
      if (days.length === 0) return [];
    } else {
      // Create array of days in the selected range
      days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
    }

    const result = days.map(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      // Adjust date format based on period - for lifetime use month format, for shorter periods use day format
      let dateFormat = 'MMM dd';
      if (selectedPeriod === 'lifetime') {
        // For lifetime, adjust format based on date range
        if (days.length > 365) {
          dateFormat = 'MMM yyyy';
        } else if (days.length > 60) {
          dateFormat = 'MMM dd';
        } else {
          dateFormat = 'MMM dd';
        }
      } else if (selectedPeriod.includes('30') || selectedPeriod.includes('month')) {
        dateFormat = 'MMM dd';
      } else {
        dateFormat = 'MMM dd';
      }
      return {
        date: format(day, dateFormat),
        mentions: dailyMentions[dateKey] || 0,
        fullDate: dateKey
      };
    });

    return result;
  };

  const trendData = getTrendData();

  const periodOptions = [
    { value: 'week', label: t('competitors.thisWeek') },
    { value: 'lastWeek', label: t('competitors.lastWeek') },
    { value: '7days', label: t('competitors.last7Days') },
    { value: '14days', label: t('competitors.last14Days') },
    { value: '30days', label: t('competitors.last30Days') },
    { value: 'month', label: t('competitors.thisMonth') },
    { value: 'lastMonth', label: t('competitors.lastMonth') },
    { value: 'lifetime', label: t('competitors.lifeTime') },
    { value: 'custom', label: t('competitors.customRange') }
  ];

  return (
    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <div className={`flex flex-col gap-4 ${isRTL ? 'text-right' : ''}`}>
          <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''} ${isHebrew ? 'justify-end' : ''}`}>
            {isHebrew ? (
              <>
                {t('analytics.mentionTrends')}
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </>
            ) : (
              <>
                <TrendingUp className="w-5 h-5 text-blue-600" />
                {t('analytics.mentionTrends')}
              </>
            )}
          </CardTitle>


          <div className={`flex flex-wrap gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {periodOptions.map(option => (
              <Button
                key={option.value}
                variant={selectedPeriod === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod(option.value)}
                className={`text-xs h-8 ${
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
            <div className={`flex gap-2 items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Calendar className="w-4 h-4 text-gray-500" />
              <input
                type="date"
                value={customDateRange.start}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Start Date"
              />
              <span className="text-gray-500 text-sm">to</span>
              <input
                type="date"
                value={customDateRange.end}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="End Date"
              />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {trendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={305}>
            <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="date" 
                stroke="#6B7280"
                tick={{ fontSize: 12 }}
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
              <Line 
                type="monotone" 
                dataKey="mentions" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#1D4ED8' }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">{t('analytics.noTrend')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}