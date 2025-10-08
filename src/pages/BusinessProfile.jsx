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
      console.log('BusinessProfile loadProfile - businessId:', businessId);
      
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
        console.log('BusinessProfile loadProfile - secondaryBusinesses:', secondaryBusinesses);
        businessData = secondaryBusinesses.find(business => 
          business.id === businessId || 
          business.businessId === businessId || 
          business.business_id === businessId
        );
      } else {
        // Load primary business
        businessData = rawData?.businessProfile || rawData?.business_profile || rawData;
        console.log('BusinessProfile loadProfile - primary businessData:', businessData);
      }
      
      console.log('BusinessProfile loadProfile - found businessData:', businessData);

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
      
      console.log('BusinessProfile save - API response:', apiResponse);
      console.log('BusinessProfile save - stableBusinessId:', stableBusinessId);
      console.log('BusinessProfile save - businessId prop:', businessId);
      console.log('BusinessProfile save - apiResponse.businessId:', apiResponse?.businessId);

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
        console.log('Dispatching business-profile-updated event:', {
          businessId: stableBusinessId,
          businessName: formData.business_name
        });
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

  return (
    <div className={`p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 lg:space-y-8 business-profile-desktop-shift laptop-spacing laptop-lg-spacing desktop-spacing desktop-lg-spacing ${isRTL ? 'text-right' : ''}`}>
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
            className={`hidden sm:inline-flex h-12 px-6 text-base font-semibold ${sharedSaveButtonClasses}`}
          >
            <SaveButtonContent />
          </Button>
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm responsive-card">
          <CardHeader className="pb-6">
            <CardTitle 
              className={`flex items-center gap-3 card-title responsive-card-title ${isRTL ? 'flex-row-reverse text-right justify-end' : 'justify-start'}`}
              style={isRTL ? { justifyContent: 'flex-end', direction: 'rtl' } : {}}
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
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="sm:hidden">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className={`w-full py-3 text-base font-semibold ${sharedSaveButtonClasses}`}
                >
                  <SaveButtonContent />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 responsive-grid-2">
                <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                  <Label htmlFor="business_name" className="text-sm font-semibold text-gray-700">
                    {t('business.businessName')} *
                  </Label>
                  <Input
                    id="business_name"
                    value={formData.business_name}
                    onChange={(e) => handleInputChange('business_name', e.target.value)}
                    placeholder={t('placeholder.businessName')}
                    className={`border-gray-200 focus:ring-2 focus:ring-blue-500/20 rounded-xl form-input ${isRTL ? 'text-right' : ''} ${getFieldError('business_name') ? 'border-red-500 focus:border-red-500 focus:ring-red-500 ring-red-500' : ''}`}
                    dir="auto"
                  />
                  {getFieldError('business_name') && (
                    <p className="mt-1 text-sm text-red-600">{getFieldError('business_name')}</p>
                  )}
                </div>
                
                <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                  <Label htmlFor="industry" className="text-sm font-semibold text-gray-700">
                    {t('business.industry')} *
                  </Label>
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                    placeholder={t('placeholder.industry')}
                    className={`border-gray-200 focus:ring-2 focus:ring-blue-500/20 rounded-xl ${isRTL ? 'text-right' : ''} ${getFieldError('industry') ? 'border-red-500 focus:border-red-500 focus:ring-red-500 ring-red-500' : ''}`}
                    dir="auto"
                  />
                  {getFieldError('industry') && (
                    <p className="mt-1 text-sm text-red-600">{getFieldError('industry')}</p>
                  )}
                </div>
              </div>



              <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
                  {t('business.description')} *
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder={t('placeholder.description')}
                  rows={4}
                  className={`border-gray-200 focus:ring-2 focus:ring-blue-500/20 rounded-xl resize-none ${isRTL ? 'text-right' : ''} ${getFieldError('description') ? 'border-red-500 focus:border-red-500 focus:ring-red-500 ring-red-500' : ''}`}
                  dir="auto"
                />
                {getFieldError('description') && (
                  <p className="mt-1 text-sm text-red-600">{getFieldError('description')}</p>
                )}
              </div>

              <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                <Label htmlFor="products_services" className="text-sm font-semibold text-gray-700">
                  {t('business.productsServices')} *
                </Label>
                <Textarea
                  id="products_services"
                  value={formData.products_services}
                  onChange={(e) => handleInputChange('products_services', e.target.value)}
                  placeholder={t('placeholder.productsServices')}
                  rows={3}
                  className={`border-gray-200 focus:ring-2 focus:ring-blue-500/20 rounded-xl resize-none ${isRTL ? 'text-right' : ''} ${getFieldError('products_services') ? 'border-red-500 focus:border-red-500 focus:ring-red-500 ring-red-500' : ''}`}
                  dir="auto"
                />
                {getFieldError('products_services') && (
                  <p className="mt-1 text-sm text-red-600">{getFieldError('products_services')}</p>
                )}
              </div>

              <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                <Label htmlFor="target_market" className="text-sm font-semibold text-gray-700">
                  {t('business.targetMarket')} *
                </Label>
                <Textarea
                  id="target_market"
                  value={formData.target_market}
                  onChange={(e) => handleInputChange('target_market', e.target.value)}
                  placeholder={t('placeholder.targetMarket')}
                  rows={3}
                  className={`border-gray-200 focus:ring-2 focus:ring-blue-500/20 rounded-xl resize-none ${isRTL ? 'text-right' : ''} ${getFieldError('target_market') ? 'border-red-500 focus:border-red-500 focus:ring-red-500 ring-red-500' : ''}`}
                  dir="auto"
                />
                {getFieldError('target_market') && (
                  <p className="mt-1 text-sm text-red-600">{getFieldError('target_market')}</p>
                )}
              </div>

              <div className="space-y-4">
                <Label className={`text-sm font-semibold text-gray-700 ${isRTL ? 'text-right' : ''}`}>
                  {t('business.competitors')} *
                </Label>
                <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Input
                    value={newCompetitor}
                    onChange={(e) => setNewCompetitor(e.target.value)}
                    placeholder={t('placeholder.addCompetitor')}
                    className={`border-gray-200 focus:ring-2 focus:ring-blue-500/20 rounded-xl ${isRTL ? 'text-right' : ''} ${getFieldError('competitors') ? 'border-red-500 focus:border-red-500 focus:ring-red-500 ring-red-500' : ''}`}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCompetitor())}
                    dir="auto"
                  />
                  <Button
                    type="button"
                    onClick={addCompetitor}
                    className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 rounded-xl px-4"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {getFieldError('competitors') && (
                  <p className="mt-1 text-sm text-red-600">{getFieldError('competitors')}</p>
                )}
                
                {formData.competitors.length > 0 && (
                  <div className={`flex flex-wrap gap-2 ${isRTL ? 'justify-end' : ''}`}>
                    {formData.competitors.map((competitor, index) => {
                      const competitorName = typeof competitor === 'string' ? competitor : competitor?.name || '';
                      return (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1 rounded-full"
                        >
                          <span className={isRTL ? 'ml-2' : 'mr-2'}>{competitorName}</span>
                          <button
                            type="button"
                            onClick={() => removeCompetitor(competitor)}
                            className={`hover:text-red-500 transition-colors ${isRTL ? 'mr-2' : 'ml-2'}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-6">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className={`w-full py-3 font-semibold text-base ${sharedSaveButtonClasses}`}
                >
                  <SaveButtonContent />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
