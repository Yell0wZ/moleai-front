import React, { useState, useEffect, useCallback } from "react";
import { BusinessProfile } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Building2, Plus, X, Save, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/common/LanguageProvider";
import { useAuth } from "@/contexts/AuthContext";
import PageHeader from "@/components/common/PageHeader";
import { Lordicon } from "@/components/ui/lordicon";
import { db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useFormValidation } from "@/hooks/useFormValidation";

const INITIAL_FORM_DATA = {
  business_name: "",
  description: "",
  products_services: "",
  target_market: "",
  competitors: [],
  industry: "",
  phone: "",
};

export default function BusinessProfilePage({ businessId, refreshBusinessData }) {
  const { t, isRTL, isHebrew } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState(() => ({ ...INITIAL_FORM_DATA }));
  const [newCompetitor, setNewCompetitor] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { errors, clearErrors, clearFieldError, validateFields, getFieldError } = useFormValidation();

  const iconMarginClass = isRTL ? "ml-2" : "mr-2";
  const sharedSaveButtonClasses = `bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl ${isRTL ? 'flex-row-reverse' : ''}`;

  const SaveButtonContent = () => (
    isSaving ? (
      <>
        <Spinner size="sm" variant="white" className={iconMarginClass} />
        {t('business.saving')}
      </>
    ) : (
      <>
        <Save className={`w-4 h-4 ${iconMarginClass}`} />
        {profile ? t('business.update') : t('business.create')}
      </>
    )
  );

  const loadProfile = useCallback(async (uid) => {
    setIsLoading(true);

    try {
      
      const clientDocRef = doc(db, "clients", uid);
      const snapshot = await getDoc(clientDocRef);

      if (!snapshot.exists()) {
        setProfile(null);
        setFormData({ ...INITIAL_FORM_DATA });
        return;
      }

      const rawData = snapshot.data();
      let businessData = null;

      if (businessId) {
        // Load secondary business by ID
        const secondaryBusinesses = rawData?.secondary_buisness || rawData?.secondary_business || [];
        businessData = secondaryBusinesses.find(business => 
          business.id === businessId || 
          business.businessId === businessId || 
          business.business_id === businessId
        );
      } else {
        // Load primary business
        businessData = rawData?.businessProfile || rawData?.business_profile || rawData;
      }
      

      const competitors = Array.isArray(businessData?.competitors)
        ? businessData.competitors
        : typeof businessData?.competitors === "string"
          ? businessData.competitors.split(",").map(item => item.trim()).filter(Boolean)
          : [];

      const normalizedProfile = {
        business_name: businessData?.business_name || businessData?.businessName || "",
        description: businessData?.description || businessData?.businessDescription || "",
        products_services: Array.isArray(businessData?.products_services)
          ? businessData.products_services.join(", ")
          : businessData?.products_services || businessData?.productsServices || "",
        target_market: businessData?.target_market || businessData?.targetMarket || "",
        competitors,
        industry: businessData?.industry || "",
        website: businessData?.website || "",
        phone: rawData?.phone || rawData?.phone_number || rawData?.phoneNumber || "",
      };

      const profileId = normalizedProfile.phone || snapshot.id || user?.uid || "business-profile";

      setProfile({ id: profileId, source: "firestore", ...normalizedProfile });
      setFormData(normalizedProfile);
    } catch (error) {
      console.error("Error loading profile from Firestore:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid, businessId]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (user?.uid) {
      loadProfile(user.uid);
    } else {
      setIsLoading(false);
    }
  }, [authLoading, user?.uid, loadProfile, businessId, refreshTrigger]);

  // Listen for refresh trigger from parent
  useEffect(() => {
    if (refreshBusinessData) {
      setRefreshTrigger(prev => prev + 1);
    }
  }, [refreshBusinessData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    clearFieldError(field);
  };

  const addCompetitor = () => {
    if (newCompetitor.trim() && !formData.competitors.includes(newCompetitor.trim())) {
      setFormData(prev => ({
        ...prev,
        competitors: [...prev.competitors, newCompetitor.trim()]
      }));
      setNewCompetitor("");
      clearFieldError('competitors');
    }
  };

  const removeCompetitor = (competitorToRemove) => {
    setFormData(prev => ({
      ...prev,
      competitors: prev.competitors.filter(c => c !== competitorToRemove)
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!user?.uid) {
      return;
    }

    // Validate required fields
    const validationRules = {
      business_name: { value: formData.business_name, required: true },
      description: { value: formData.description, required: true },
      industry: { value: formData.industry, required: true },
      products_services: { value: formData.products_services, required: true },
      target_market: { value: formData.target_market, required: true },
      competitors: { value: formData.competitors, minLength: 1 }
    };

    const isValid = validateFields(validationRules);
    if (!isValid) {
      return;
    }

    setIsSaving(true);

    try {
      // אם יש selectedBusinessId (עסק משני), תוסיף אותו לבקשה
      const apiResponse = profile
        ? await BusinessProfile.update(profile.id, formData, businessId)
        : await BusinessProfile.create(formData, businessId);

      // Use the businessId from the API response if available, otherwise use the current businessId
      const stableBusinessId = apiResponse?.businessId || businessId || profile?.id || "business-profile";
      

      const normalizedCompetitors = Array.isArray(formData.competitors)
        ? formData.competitors
        : [];

      setProfile(prev => ({
        ...(prev || { id: stableBusinessId, source: "firestore" }),
        ...(apiResponse || {}),
        ...formData,
        id: stableBusinessId,
        competitors: normalizedCompetitors,
      }));

      if (typeof window !== "undefined" && stableBusinessId && formData.business_name) {
        window.dispatchEvent(new CustomEvent("business-profile-updated", {
          detail: {
            businessId: stableBusinessId,
            businessName: formData.business_name,
          }
        }));
      }

      // Trigger refresh of business data in Layout
      if (refreshBusinessData) {
        refreshBusinessData();
      }

      // Show success feedback
      const successMsg = document.createElement('div');
      successMsg.className = `fixed ${isRTL ? 'left-4' : 'right-4'} top-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50`;
      successMsg.textContent = t('business.profileSaved');
      document.body.appendChild(successMsg);
      setTimeout(() => document.body.removeChild(successMsg), 3000);
      
    } catch (error) {
      console.error("Error saving profile:", error);
    }
    
    setIsSaving(false);
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

  const containerClasses = [
    "p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8",
    isRTL ? "lg:pr-40 xl:pr-56" : "business-profile-desktop-shift",
    "laptop-spacing",
    "laptop-lg-spacing",
    "desktop-spacing",
    "desktop-lg-spacing",
    isRTL ? "text-right" : ""
  ].filter(Boolean).join(" ");

  return (
    <div className={containerClasses}>
      <PageHeader
        icon={<Building2 className="w-8 h-8" />}
        title={t('business.title')}
        subtitle={t('business.subtitle')}
        isRTL={isRTL}
        showOnMobile={false}
        actions={
          <Button
            onClick={handleSubmit}
            disabled={isSaving}
            className={`hidden sm:inline-flex h-12 px-8 text-base font-semibold ${sharedSaveButtonClasses}`}
          >
            <SaveButtonContent />
          </Button>
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-6"
      >

        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-sky-50 to-blue-50 border-b border-sky-100">
            <CardTitle 
              className={`flex items-center gap-3 text-xl font-bold text-gray-800 ${isRTL ? 'flex-row-reverse text-right justify-end' : 'justify-start'}`}
            >
              {isRTL ? (
                <>
                  <span className="text-right">
                    {t('business.companyInfo')}
                  </span>
                  <div className="w-2 h-8 bg-gradient-to-b from-sky-500 to-blue-600 rounded-full"></div>
                </>
              ) : (
                <>
                  <div className="w-2 h-8 bg-gradient-to-b from-sky-500 to-blue-600 rounded-full"></div>
                  <span className="text-left">
                    {t('business.companyInfo')}
                  </span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="sm:hidden">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className={`w-full py-3 text-base font-semibold ${sharedSaveButtonClasses}`}
                >
                  <SaveButtonContent />
                </Button>
              </div>


              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div 
                  className={`space-y-3 ${isRTL ? 'text-right' : ''}`}
                  initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Label htmlFor="business_name" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-sky-500" />
                    {t('business.businessName')} *
                  </Label>
                  <Input
                    id="business_name"
                    value={formData.business_name}
                    onChange={(e) => handleInputChange('business_name', e.target.value)}
                    placeholder={t('placeholder.businessName')}
                    className={`h-12 border-2 border-gray-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/20 rounded-xl transition-all duration-300 ${isRTL ? 'text-right' : ''} ${getFieldError('business_name') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                    dir="auto"
                  />
                  {getFieldError('business_name') && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                      {getFieldError('business_name')}
                    </p>
                  )}
                </motion.div>
                
                <motion.div 
                  className={`space-y-3 ${isRTL ? 'text-right' : ''}`}
                  initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Label htmlFor="industry" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-500" />
                    {t('business.industry')} *
                  </Label>
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                    placeholder={t('placeholder.industry')}
                    className={`h-12 border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 rounded-xl transition-all duration-300 ${isRTL ? 'text-right' : ''} ${getFieldError('industry') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                    dir="auto"
                  />
                  {getFieldError('industry') && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                      {getFieldError('industry')}
                    </p>
                  )}
                </motion.div>
              </div>




              <motion.div 
                className={`space-y-3 ${isRTL ? 'text-right' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Label htmlFor="description" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  {t('business.description')} *
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder={t('placeholder.description')}
                  rows={4}
                  className={`border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 rounded-xl resize-none transition-all duration-300 ${isRTL ? 'text-right' : ''} ${getFieldError('description') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                  dir="auto"
                />
                {getFieldError('description') && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    {getFieldError('description')}
                  </p>
                )}
              </motion.div>


              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div 
                  className={`space-y-3 ${isRTL ? 'text-right' : ''}`}
                  initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Label htmlFor="products_services" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    {t('business.productsServices')} *
                  </Label>
                  <Textarea
                    id="products_services"
                    value={formData.products_services}
                    onChange={(e) => handleInputChange('products_services', e.target.value)}
                    placeholder={t('placeholder.productsServices')}
                    rows={3}
                    className={`border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 rounded-xl resize-none transition-all duration-300 ${isRTL ? 'text-right' : ''} ${getFieldError('products_services') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                    dir="auto"
                  />
                  {getFieldError('products_services') && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                      {getFieldError('products_services')}
                    </p>
                  )}
                </motion.div>

                <motion.div 
                  className={`space-y-3 ${isRTL ? 'text-right' : ''}`}
                  initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Label htmlFor="target_market" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                    {t('business.targetMarket')} *
                  </Label>
                  <Textarea
                    id="target_market"
                    value={formData.target_market}
                    onChange={(e) => handleInputChange('target_market', e.target.value)}
                    placeholder={t('placeholder.targetMarket')}
                    rows={3}
                    className={`border-2 border-gray-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/20 rounded-xl resize-none transition-all duration-300 ${isRTL ? 'text-right' : ''} ${getFieldError('target_market') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                    dir="auto"
                  />
                  {getFieldError('target_market') && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                      {getFieldError('target_market')}
                    </p>
                  )}
                </motion.div>
              </div>


              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Label className={`text-sm font-semibold text-gray-700 flex items-center gap-2 ${isRTL ? 'text-right justify-end' : 'justify-start'}`}>
                  <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                  {t('business.competitors')} *
                </Label>
                <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Input
                    value={newCompetitor}
                    onChange={(e) => setNewCompetitor(e.target.value)}
                    placeholder={t('placeholder.addCompetitor')}
                    className={`flex-1 h-12 border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 rounded-xl transition-all duration-300 ${isRTL ? 'text-right' : ''} ${getFieldError('competitors') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCompetitor())}
                    dir="auto"
                  />
                  <Button
                    type="button"
                    onClick={addCompetitor}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-xl px-6 h-12 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>
                {getFieldError('competitors') && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    {getFieldError('competitors')}
                  </p>
                )}
                
                {formData.competitors.length > 0 && (
                  <div className={`flex flex-wrap gap-3 ${isRTL ? 'justify-end' : ''}`}>
                    {formData.competitors.map((competitor, index) => {
                      const competitorName = typeof competitor === 'string' ? competitor : competitor?.name || '';
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Badge
                            variant="secondary"
                            className="bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 hover:from-indigo-100 hover:to-purple-100 px-4 py-2 rounded-full border border-indigo-200 shadow-sm hover:shadow-md transition-all duration-300"
                          >
                            <span className={isRTL ? 'ml-2' : 'mr-2'}>{competitorName}</span>
                            <button
                              type="button"
                              onClick={() => removeCompetitor(competitor)}
                              className={`hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50 ${isRTL ? 'mr-2' : 'ml-2'}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>


              <motion.div 
                className="pt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Button
                  type="submit"
                  disabled={isSaving}
                  className={`w-full py-4 font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 ${sharedSaveButtonClasses}`}
                >
                  <SaveButtonContent />
                </Button>
              </motion.div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
