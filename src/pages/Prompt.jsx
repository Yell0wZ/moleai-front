import React, { useState, useEffect } from "react";
import { Prompt } from "@/api/entities";
import { Persona } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Eye, Calendar, User, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/components/common/LanguageProvider";
import PageHeader from "@/components/common/PageHeader";
import { Lordicon } from "@/components/ui/lordicon";

import PromptHistoryTable from "../components/prompts/PromptHistoryTable";
import SendPromptModal from "../components/prompts/SendPromptModal";
import PromptResponseModal from "../components/prompts/PromptResponseModal";

export default function PromptPage({ businessId, refreshBusinessData }) {
  const { t, isRTL, isHebrew } = useLanguage();
  const [prompts, setPrompts] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Get current business context
  const currentBusinessId = businessId || null; // null = primary business
  
  // Debug state changes
  useEffect(() => {
    console.log('showResponseModal changed to:', showResponseModal);
  }, [showResponseModal]);
  
  useEffect(() => {
    console.log('selectedPrompt changed to:', selectedPrompt);
  }, [selectedPrompt]);
  const navigate = useNavigate();

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
      const [promptData, personaData] = await Promise.all([
        Prompt.list('-created_date', currentBusinessId),
        Persona.list('-created_date', currentBusinessId)
      ]);
      
      setPrompts(promptData);
      setPersonas(personaData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const handlePromptSent = () => {
    loadData();
    setShowSendModal(false);
    // Trigger business data refresh
    if (refreshBusinessData) {
      refreshBusinessData();
    }
  };

  const handleViewResponses = (prompt) => {
    console.log('handleViewResponses called with prompt:', prompt);
    setSelectedPrompt(prompt);
    setShowResponseModal(true);
  };

  const getStatsData = () => {
    return {
      totalPrompts: prompts.length,
      completedPrompts: prompts.filter(p => p.status === 'completed').length,
      pendingPrompts: prompts.filter(p => p.status === 'pending' || p.status === 'analyzing').length,
      totalMentions: prompts.reduce((sum, p) => sum + (p.businessNameMentions || 0), 0)
    };
  };

  const stats = getStatsData();

  const headerActions = (
    <Button
      onClick={() => setShowSendModal(true)}
      className={`bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white px-6 py-4 sm:px-6 sm:py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-base sm:text-base w-full sm:w-auto h-14 sm:h-auto ${isRTL ? 'flex-row-reverse' : ''}`}
    >
      <Send className={`w-5 h-5 sm:w-5 sm:h-5 ${isRTL ? 'ml-2 sm:ml-2' : 'mr-2 sm:mr-2'}`} />
      {t('prompts.sendNew')}
    </Button>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-140px)] gap-4">
        <Lordicon size="lg" variant="primary" />
        <p className="text-sm text-gray-500 animate-pulse">
  
        </p>
      </div>
    );
  }

  if (personas.length === 0) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto">
        <Card className="text-center shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-8 pb-8">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">{t('prompts.noPersonas')}</h2>
            <p className="text-gray-600 mb-4">
              {t('prompts.createPersonasFirst')}
            </p>
            <Button 
              onClick={() => navigate(createPageUrl("Avatar"))}
              className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700"
            >
              {t('prompts.createPersonas')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8 prompt-page-desktop-shift ${isRTL ? 'text-right' : ''}`}>
      <PageHeader
        icon={<MessageSquare className="w-6 h-6 sm:w-8 sm:h-8" />}
        title={t('prompts.title')}
        subtitle={t('prompts.subtitle')}
        actions={headerActions}
        isRTL={isRTL}
        showOnMobile={false}
      />

      {/* Mobile-only Send Button */}
      <div className="block sm:hidden">
        <Button
          onClick={() => setShowSendModal(true)}
          className={`bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white px-4 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-base w-full h-12 ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          <Send className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t('prompts.sendNew')}
        </Button>
      </div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      >
        <Card className="bg-gradient-to-br from-sky-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              {isHebrew ? (
                <>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-right">{stats.totalPrompts}</div>
                    <div className="text-sky-100 text-xs sm:text-sm font-medium text-right">{t('prompts.totalPrompts')}</div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <div className="text-xl sm:text-2xl lg:text-3xl font-bold">{stats.totalPrompts}</div>
                    <div className="text-sky-100 text-xs sm:text-sm font-medium">{t('prompts.totalPrompts')}</div>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-sky-400 to-blue-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              {isHebrew ? (
                <>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-right">{stats.completedPrompts}</div>
                    <div className="text-sky-100 text-xs sm:text-sm font-medium text-right">{t('prompts.completed')}</div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <div className="text-xl sm:text-2xl lg:text-3xl font-bold">{stats.completedPrompts}</div>
                    <div className="text-sky-100 text-xs sm:text-sm font-medium">{t('prompts.completed')}</div>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              {isHebrew ? (
                <>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-right">{stats.pendingPrompts}</div>
                    <div className="text-blue-100 text-xs sm:text-sm font-medium text-right">{t('prompts.pending')}</div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <div className="text-xl sm:text-2xl lg:text-3xl font-bold">{stats.pendingPrompts}</div>
                    <div className="text-blue-100 text-xs sm:text-sm font-medium">{t('prompts.pending')}</div>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              {isHebrew ? (
                <>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-right">{stats.totalMentions}</div>
                    <div className="text-indigo-100 text-xs sm:text-sm font-medium text-right">{t('prompts.mentions')}</div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <div className="text-xl sm:text-2xl lg:text-3xl font-bold">{stats.totalMentions}</div>
                    <div className="text-indigo-100 text-xs sm:text-sm font-medium">{t('prompts.mentions')}</div>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

      </motion.div>

      {/* Prompts Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse text-right' : ''} ${isHebrew ? 'justify-end' : ''}`}>
              {isHebrew ? (
                <>
                  {t('prompts.recentPrompts')}
                  <div className="w-2 h-8 bg-gradient-to-b from-sky-500 to-blue-600 rounded-full"></div>
                </>
              ) : (
                <>
                  <div className="w-2 h-8 bg-gradient-to-b from-sky-500 to-blue-600 rounded-full"></div>
                  {t('prompts.recentPrompts')}
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {prompts.length > 0 ? (
              <PromptHistoryTable 
                prompts={prompts} 
                onViewResponses={handleViewResponses} 
              />
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('prompts.noPrompts')}</h3>
                <p className="text-gray-500 mb-4">
                  {t('prompts.sendFirst')}
                </p>
                <Button
                  onClick={() => setShowSendModal(true)}
                  className={`bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  <Send className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('prompts.sendFirstBtn')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <SendPromptModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        onPromptSent={handlePromptSent}
        personas={personas}
        businessId={currentBusinessId}
      />

      <PromptResponseModal
        isOpen={showResponseModal}
        onClose={() => {
          console.log('Closing response modal');
          setShowResponseModal(false);
        }}
        prompt={selectedPrompt}
      />
    </div>
  );
}
