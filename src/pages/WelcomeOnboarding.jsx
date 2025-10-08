import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Building2, Users, Sparkles, CheckCircle2, UserRound, Plus, CircleAlert } from "lucide-react";
import { BusinessProfile, Persona, UserPreferences } from "@/api/entities";
import { Persona as PersonaAPI } from "@/api/localApi";
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from "@/components/common/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { getAuthHeaders } from "@/utils/authUtils";
import { Badge } from "@/components/ui/badge";
import { Lordicon } from "@/components/ui/lordicon";
import { Spinner } from "@/components/ui/spinner";

const INITIAL_BUSINESS_DATA = {
  business_name: "",
  description: "",
  products_services: "",
  target_market: "",
  competitors: [],
  industry: "",
};

const INITIAL_PERSONA_DATA = {
  name: "",
  age: "",
  job_title: "",
  lifestyle: "",
  goals: "",
  pain_points: "",
  motivations: "",
  purchasing_habits: "",
  backstory: "",
};

const primaryCtaClass = "h-14 px-10 text-lg font-semibold shadow-lg hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200";
const secondaryCtaClass = "h-14 px-8 text-base font-medium";

export default function WelcomeOnboarding({ onComplete }) {
  const { t, isRTL, isHebrew, setLanguage, lockLanguage } = useLanguage();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [businessData, setBusinessData] = useState(() => ({ ...INITIAL_BUSINESS_DATA }));
  const [personaData, setPersonaData] = useState(() => ({ ...INITIAL_PERSONA_DATA }));
  const [newCompetitor, setNewCompetitor] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [businessPage, setBusinessPage] = useState(0);
  const [personaPage, setPersonaPage] = useState(0);
  const [profileData, setProfileData] = useState({
    name: "",
    language: isHebrew ? "hebrew" : "english",
  });
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [isBusinessSubmitting, setIsBusinessSubmitting] = useState(false);
  const [businessProfileId, setBusinessProfileId] = useState(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [generatedPersona, setGeneratedPersona] = useState(null);

  const BUSINESS_PAGE_COUNT = 2;
  const PERSONA_PAGE_COUNT = 3;

  const stepConfig = [
    {
      key: "intro",
      icon: Sparkles,
      title: t("welcome.title"),
      subtitle: t("welcome.subtitle"),
    },
    {
      key: "profile",
      icon: UserRound,
      title: t("welcome.profile.title"),
      subtitle: t("welcome.profile.subtitle"),
    },
    {
      key: "business",
      icon: Building2,
      title: t("welcome.business.title"),
      subtitle: t("welcome.business.subtitle"),
    },
    {
      key: "personaIntro",
      icon: Users,
      title: t("welcome.personaIntro.title"),
      subtitle: t("welcome.personaIntro.subtitle"),
    },
    {
      key: "persona",
      icon: Users,
      title: t("welcome.persona.title"),
      subtitle: t("welcome.persona.subtitle"),
    },
    {
      key: "meetPersona",
      icon: Users,
      title: generatedPersona ? t('welcome.meetPersona.title').replace('{name}', generatedPersona.name) : t('welcome.meetPersona.title').replace('{name}', 'Your Avatar'),
      subtitle: t('welcome.meetPersona.subtitle'),
    },
    {
      key: "businessReview",
      icon: Building2,
      title: t("welcome.businessReview.title"),
      subtitle: t("welcome.businessReview.subtitle"),
    },
    {
      key: "success",
      icon: CheckCircle2,
      title: t("welcome.success.title"),
      subtitle: t("welcome.success.subtitle"),
    },
  ];

  const currentStepInfo = stepConfig[step];

  const handleBusinessChange = (field, value) => {
    setBusinessData(prev => ({ ...prev, [field]: value }));
  };

  const handlePersonaChange = (field, value) => {
    setPersonaData(prev => ({ ...prev, [field]: value }));
  };

  const generatePersonaWithAI = async () => {
    try {
      setIsGeneratingAI(true);
      setErrorMessage(null);

      // Generate a single AI persona
      console.log('Creating AI persona...');
      const aiResponse = await PersonaAPI.createAI(1);
      console.log('AI persona creation response:', aiResponse);

      // Wait a moment for database propagation
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('Fetching personas list...');
      const personas = await Persona.list('-created_date');
      console.log('Personas fetched:', personas);

      if (personas && personas.length > 0) {
        // Get the most recently created persona (first one after sorting by -created_date)
        const latestPersona = personas[0];
        console.log('Latest persona:', latestPersona);

        // Map database fields to form fields
        const mappedPersonaData = {
          name: String(latestPersona.name || ''),
          age: String(latestPersona.age || ''),
          job_title: String(latestPersona.job_title || ''),
          lifestyle: String(latestPersona.lifestyle || ''),
          goals: String(latestPersona.goals || ''),
          pain_points: String(latestPersona.pain_points || ''),
          motivations: String(latestPersona.motivations || ''),
          purchasing_habits: String(latestPersona.purchasing_habits || ''),
          backstory: String(latestPersona.backstory || '')
        };

        setGeneratedPersona(mappedPersonaData);
        
        // Go to the meet persona screen
        setStep(5); // meetPersona step
      } else {
        console.error('No personas found in database after creation');
        setErrorMessage(isHebrew ? 'שגיאה בעיבוד תגובת ה-AI. אנא ודא שפרופיל העסק שלך מלא עם שם עסק, תעשייה ומוצרים/שירותים. אנא נסה שוב.' : 'Error processing AI response. Please ensure your business profile is complete with business name, industry, and products/services. Please try again.');
      }
    } catch (error) {
      console.error('Error generating AI persona:', error);
      setErrorMessage(isHebrew ? 'שגיאה בעיבוד תגובת ה-AI. אנא ודא שפרופיל העסק שלך מלא עם שם עסק, תעשייה ומוצרים/שירותים. אנא נסה שוב.' : 'Error processing AI response. Please ensure your business profile is complete with business name, industry, and products/services. Please try again.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const addCompetitor = () => {
    const trimmed = newCompetitor.trim();
    if (!trimmed) return;
    if (businessData.competitors.includes(trimmed)) {
      setNewCompetitor("");
      return;
    }
    setBusinessData(prev => ({
      ...prev,
      competitors: [...prev.competitors, trimmed]
    }));
    setNewCompetitor("");
  };

  const removeCompetitor = (name) => {
    setBusinessData(prev => ({
      ...prev,
      competitors: prev.competitors.filter(comp => comp !== name)
    }));
  };

  useEffect(() => {
    setErrorMessage(null);
  }, [step, businessPage, personaPage]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const existing = document.querySelector('script[data-lord-icon]');
    if (existing) {
      return;
    }

    const script = document.createElement('script');
    script.src = "https://cdn.lordicon.com/lordicon.js";
    script.async = true;
    script.dataset.lordIcon = "true";
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    const applyPreferences = (prefs) => {
      if (!prefs) {
        return;
      }

      const normalizedLanguage = prefs.language && prefs.language.toLowerCase().startsWith('he')
        ? 'hebrew'
        : 'english';

      setProfileData({
        name: prefs.name || "",
        language: normalizedLanguage
      });

      // Only set language if it's not already locked (to avoid overriding database preferences)
      if (!languageLocked) {
        const languageCode = normalizedLanguage === 'hebrew' ? 'he' : 'en';
        setLanguage(languageCode);
        lockLanguage();
      }

      // Only set profileExists to true if we actually have a name (complete profile)
      if (prefs.name && prefs.name.trim()) {
        setProfileExists(true);
      }
    };

    const loadUserPreferences = async () => {
      try {
        let preferences = null;

        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('user-preferences');
          if (stored) {
            try {
              preferences = JSON.parse(stored);
            } catch (parseError) {
              console.warn('Failed to parse stored user preferences:', parseError);
              preferences = null;
            }
          }
        }

        if (!preferences && user?.uid) {
          // Load directly from Firestore
          const docRef = doc(db, 'clients', user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const docData = docSnap.data();
            if (docData.personal) {
              preferences = docData.personal;
            }
          }
        }

        if (preferences) {
          applyPreferences(preferences);
        }
      } catch (error) {
        console.error('Failed to load existing user preferences:', error);
      }
    };

    loadUserPreferences();
  }, [lockLanguage, setLanguage, languageLocked]);

  useEffect(() => {
    const determineStartingStep = async () => {
      try {
        // Check what data exists directly from Firestore (ignore API calls)
        let firestoreData = { hasBusinessProfile: false, hasPersonasField: false, hasPersonal: false, businessProfile: null, personas: [] };
        let userPrefs = null;

        try {
          if (user?.uid) {

            // Get document directly from Firestore using correct collection and document ID
            const docRef = doc(db, 'clients', user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
              const docData = docSnap.data();

              // Check what fields exist
              const hasPersonal = 'personal' in docData && docData.personal && docData.personal.name;
              const hasBusinessProfile = 'business_profile' in docData && docData.business_profile;
              const hasPersonasField = 'personas' in docData;


              firestoreData = {
                hasPersonal,
                hasBusinessProfile,
                hasPersonasField,
                businessProfile: docData.business_profile || null,
                personas: docData.personas || []
              };

              // If we have personal data, use it
              if (hasPersonal) {
                userPrefs = docData.personal;
              }
            } else {
            }
          }
        } catch (error) {
        }

        // Try localStorage if no personal data found
        if (!userPrefs) {
          try {
            if (typeof window !== 'undefined') {
              const stored = localStorage.getItem('user-preferences');
              if (stored) {
                userPrefs = JSON.parse(stored);
              }
            }
          } catch (error) {
          }
        }

        let startStep = 0; // Default: start from welcome

        if (!firestoreData.hasPersonal) {
          startStep = 0;
        } else if (!firestoreData.hasBusinessProfile) {
          startStep = 2;

          if (userPrefs) {
            const normalizedLanguage = userPrefs.language && userPrefs.language.toLowerCase().startsWith('he')
              ? 'hebrew'
              : 'english';
            setProfileData({
              name: userPrefs.name || "",
              language: normalizedLanguage
            });
            const languageCode = normalizedLanguage === 'hebrew' ? 'he' : 'en';
            setLanguage(languageCode);
            lockLanguage();
            setProfileExists(true);
          }
        } else if (!firestoreData.hasPersonasField) {
          // Has personal and business but no personas - go to persona step
          startStep = 3;

          // Load business data
          if (firestoreData.businessProfile) {
            const businessProfile = firestoreData.businessProfile;
            const normalizedCompetitors = Array.isArray(businessProfile.competitors)
              ? businessProfile.competitors.map(comp => (typeof comp === 'string' ? comp : comp?.name)).filter(Boolean)
              : [];
            const normalizedProducts = Array.isArray(businessProfile.productsServices)
              ? businessProfile.productsServices.join(', ')
              : businessProfile.productsServices || "";

            const mappedBusinessData = {
              business_name: businessProfile.businessName || "",
              description: businessProfile.businessDescription || "",
              products_services: normalizedProducts,
              target_market: businessProfile.targetMarket || "",
              competitors: normalizedCompetitors,
              industry: businessProfile.industry || "",
            };

            setBusinessData(() => ({ ...INITIAL_BUSINESS_DATA, ...mappedBusinessData }));
            if (businessProfile.id) setBusinessProfileId(businessProfile.id);
          }
        } else {
          // Has everything - go to success
          startStep = 7;
        }

        // Set the starting step
        setStep(startStep);
      } catch (error) {
        console.error('Failed to determine starting step:', error);
      }
    };

    determineStartingStep();
  }, []); // Run only once on mount

  // Removed automatic skipping of profile step - let advanceToProfileStep handle it

  const advanceToProfileStep = () => {
    setBusinessPage(0);
    // Always show profile setup step first, then business profile will be handled
    setStep(1);
  };

  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    clearAllErrors();

    if (!profileData.name.trim()) {
      setFieldError('profileName', t("welcome.errors.profileName"));
      return;
    }

    // Set language immediately and proceed to next step
    const nextLanguage = profileData.language === "hebrew" ? "he" : "en";
    setLanguage(nextLanguage);
    lockLanguage();

    const payload = {
      name: profileData.name.trim(),
      language: profileData.language,
    };

    // Save to localStorage immediately
    localStorage.setItem('user-preferences', JSON.stringify(payload));
    setProfileExists(true);

    // Submit in background without waiting
    (async () => {
      try {
        const headers = await getAuthHeaders();
        const requestHeaders = {
          'Content-Type': 'application/json',
          ...(headers || {}),
        };
        await fetch("https://personalset-thg3z73fma-uc.a.run.app", {
          method: "POST",
          headers: requestHeaders,
          body: JSON.stringify(payload),
        });
      } catch (error) {
        console.error("Profile submission error (background):", error);
        // Don't show error to user since they've already moved on
      }
    })();

    // Proceed to next step immediately
    setBusinessPage(0);
    setStep(2);
  };

  const validateBusinessPage = (page) => {
    const errors = {};
    
    if (page === 0) {
      if (!businessData.business_name.trim()) {
        errors.businessName = t("welcome.errors.businessName");
      }
      if (!businessData.industry.trim()) {
        errors.industry = t("welcome.errors.industry");
      }
      if (!businessData.description.trim()) {
        errors.description = t("welcome.errors.description");
      }
    }
    if (page === 1) {
      if (!businessData.products_services.trim()) {
        errors.productsServices = t("welcome.errors.productsServices");
      }
      if (!businessData.target_market.trim()) {
        errors.targetMarket = t("welcome.errors.targetMarket");
      }
      if (businessData.competitors.length === 0) {
        errors.competitors = t("welcome.errors.competitors");
      }
    }
    
    return Object.keys(errors).length > 0 ? errors : null;
  };

  const validatePersonaPage = (page) => {
    const errors = {};
    
    if (page === 0) {
      if (!personaData.name.trim()) {
        errors.personaName = t("welcome.errors.personaName");
      }
      if (!personaData.age.trim()) {
        errors.personaAge = t("welcome.errors.personaAge");
      }
      if (!personaData.job_title.trim()) {
        errors.personaJobTitle = t("welcome.errors.personaRole");
      }
    }
    if (page === 1) {
      if (!personaData.goals.trim()) {
        errors.personaGoals = t("welcome.errors.personaGoals");
      }
      if (!personaData.pain_points.trim()) {
        errors.personaPainPoints = t("welcome.errors.personaPainPoints");
      }
      if (!personaData.lifestyle.trim()) {
        errors.personaLifestyle = t("welcome.errors.personaLifestyle");
      }
    }
    if (page === 2) {
      if (!personaData.motivations.trim()) {
        errors.personaMotivations = t("welcome.errors.personaMotivations");
      }
      if (!personaData.backstory.trim()) {
        errors.personaBackstory = t("welcome.errors.personaBackstory");
      }
    }
    
    return Object.keys(errors).length > 0 ? errors : null;
  };

  const handleBusinessPageNext = () => {
    const errors = validateBusinessPage(businessPage);
    if (errors) {
      setFieldErrors(errors);
      return;
    }
    clearAllErrors();
    setBusinessPage(prev => Math.min(prev + 1, BUSINESS_PAGE_COUNT - 1));
  };

  const handleBusinessBack = () => {
    if (businessPage === 0) {
      setStep(profileExists ? 0 : 1);
      return;
    }
    setBusinessPage(prev => Math.max(prev - 1, 0));
  };

  const handleBusinessSubmit = async () => {
    // Validate all business pages before submitting
    for (let page = 0; page < BUSINESS_PAGE_COUNT; page++) {
      const errors = validateBusinessPage(page);
      if (errors) {
        setFieldErrors(errors);
        setBusinessPage(page);
        return;
      }
    }

    clearAllErrors();
    setIsSubmitting(true);

    const payload = {
      ...businessData,
      competitors: businessData.competitors,
      products_services: businessData.products_services,
    };

    try {
      let savedProfile = null;
      console.log('Saving business profile...');
      if (businessProfileId) {
        savedProfile = await BusinessProfile.update(businessProfileId, payload);
      } else {
        savedProfile = await BusinessProfile.create(payload);
      }

      if (savedProfile?.id) {
        setBusinessProfileId(savedProfile.id);
      }
      console.log('Business profile saved successfully');

      // Proceed to next step after successful save
      setPersonaPage(0);
      setStep(3);
    } catch (error) {
      console.error("Business profile submission error:", error);
      setErrorMessage(isHebrew ? 'שגיאה בשמירת פרופיל העסק. אנא ודא שכל השדות הנדרשים מלאים ונסה שוב.' : 'Error saving business profile. Please ensure all required fields are filled and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePersonaPageNext = () => {
    const errors = validatePersonaPage(personaPage);
    if (errors) {
      setFieldErrors(errors);
      return;
    }
    clearAllErrors();
    setPersonaPage(prev => Math.min(prev + 1, PERSONA_PAGE_COUNT - 1));
  };

  const handlePersonaBack = () => {
    if (personaPage === 0) {
      setStep(3);
      return;
    }
    setPersonaPage(prev => Math.max(prev - 1, 0));
  };

  const startPersonaStep = () => {
    setPersonaPage(0);
    setStep(4);
  };

  const handlePersonaSubmit = async () => {
    // Validate all persona pages before submitting
    for (let page = 0; page < PERSONA_PAGE_COUNT; page++) {
      const errors = validatePersonaPage(page);
      if (errors) {
        setFieldErrors(errors);
        setPersonaPage(page);
        return;
      }
    }

    clearAllErrors();
    setIsSubmitting(true);

    try {
      const personaPayload = {
        ...personaData,
        age: parseInt(personaData.age, 10) || 0,
        is_ai_generated: false,
      };

      await Persona.create(personaPayload);

      setStep(5);
    } catch (error) {
      console.error("Welcome onboarding error:", error);
      setErrorMessage(t("welcome.errors.saving"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBusinessFormSubmit = async (event) => {
    event.preventDefault();
    if (businessPage === BUSINESS_PAGE_COUNT - 1) {
      await handleBusinessSubmit();
    } else {
      handleBusinessPageNext();
    }
  };

  const handlePersonaFormSubmit = async (event) => {
    event.preventDefault();
    if (personaPage === PERSONA_PAGE_COUNT - 1) {
      await handlePersonaSubmit();
    } else {
      handlePersonaPageNext();
    }
  };

  const handleUseThisAvatar = () => {
    if (generatedPersona) {
      setPersonaData(generatedPersona);
      setStep(7); // Go to success
    }
  };

  const handleFinish = () => {
    if (onComplete) {
      onComplete();
    }
  };

  const StepIcon = currentStepInfo.icon;
  const isLastBusinessPage = businessPage === BUSINESS_PAGE_COUNT - 1;
  const isLastPersonaPage = personaPage === PERSONA_PAGE_COUNT - 1;

  // Error management functions
  const setFieldError = (field, error) => {
    setFieldErrors(prev => ({ ...prev, [field]: error }));
  };

  const clearFieldError = (field) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const clearAllErrors = () => {
    setFieldErrors({});
    setErrorMessage(null);
  };

  // Styled Error Message Component
  const StyledErrorMessage = ({ message, className = "" }) => {
    if (!message) return null;
    return (
      <div className={`flex items-center gap-2 text-sm text-red-600 ${isHebrew ? 'text-right' : ''} ${className}`}>
        <CircleAlert className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1">{message}</span>
      </div>
    );
  };

  return (
    <div
      className={`min-h-[100dvh] h-[100dvh] overflow-hidden flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-100 px-4 py-12 ${isRTL ? 'rtl' : ''}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* AI Generation Loading Overlay */}
      {isGeneratingAI && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl">
            <div className="mb-6">
              <lord-icon
                src="https://cdn.lordicon.com/vmzmljdv.json"
                trigger="loop"
                stroke="bold"
                colors="primary:#66a1ee,secondary:#3080e8"
                style={{ width: '120px', height: '120px' }}
              />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {isHebrew ? 'יוצר אווטאר עם בינה מלאכותית...' : 'Generating Avatar with AI...'}
            </h3>
            <p className="text-slate-600">
              {isHebrew 
                ? 'הבינה המלאכותית מנתחת את הפרופיל העסקי שלכם ויוצרת אווטאר מותאם אישית'
                : 'AI is analyzing your business profile and creating a personalized avatar'
              }
            </p>
          </div>
        </div>
      )}
      <div className="max-w-4xl w-full mx-auto">
        <motion.div
          className="w-full"
          key={currentStepInfo.key}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -24 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="overflow-hidden shadow-xl border-0 bg-white/90 backdrop-blur flex flex-col h-full max-h-full w-full">
            <CardHeader 
              className={`border-b border-slate-100 bg-white/70 ${isHebrew ? 'text-right' : ''} shrink-0`}
              style={isHebrew ? { textAlign: 'right' } : {}}
            >
              <div 
                className={`flex items-center gap-4 ${isHebrew ? 'flex-row-reverse text-right justify-end' : ''}`}
                style={isHebrew ? { textAlign: 'right', justifyContent: 'flex-end' } : {}}
              >
                <div className={`p-3 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md ${isHebrew ? 'order-2' : 'order-1'}`}>
                  <StepIcon className="w-6 h-6" />
                </div>
                <div className={`${isHebrew ? 'text-right order-1' : 'order-2'}`} style={isHebrew ? { textAlign: 'right' } : {}}>
                  <CardTitle 
                    className={`text-2xl font-semibold text-slate-900 ${isHebrew ? 'text-right !important' : ''}`}
                    style={isHebrew ? { textAlign: 'right !important' } : {}}
                  >
                    {currentStepInfo.title}
                  </CardTitle>
                  <p 
                    className={`text-slate-600 mt-1 ${isHebrew ? 'text-right !important' : ''}`}
                    style={isHebrew ? { textAlign: 'right !important' } : {}}
                  >
                    {currentStepInfo.subtitle}
                  </p>
                </div>
              </div>
            </CardHeader>

            {step === 0 && (
              <CardContent className={`flex flex-1 flex-col items-center justify-center text-center gap-6 p-4 sm:p-6 lg:p-12 ${isRTL ? 'text-right' : ''}`}>
                <div className="flex items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-blue-200/80 shadow-inner p-4">
                  <lord-icon
                    key="welcome-lord-icon"
                    src="https://cdn.lordicon.com/ytlwczyc.json"
                    trigger="loop"
                    stroke="bold"
                    colors="primary:#0584c7,secondary:#0584c7"
                    style={{ width: '140px', height: '140px' }}
                  />
                </div>
                <p className="text-lg text-slate-600 max-w-2xl">
                  {t("welcome.description")}
                </p>
                <Button
                  size="lg"
                  className={`bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 rounded-2xl transition ${primaryCtaClass}`}
                  onClick={advanceToProfileStep}
                >
                  {t("welcome.start")}
                </Button>
              </CardContent>
            )}

            {step === 1 && (
              <form onSubmit={handleProfileSubmit} className="flex flex-1 flex-col overflow-hidden" noValidate>
                <CardContent className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-h-[calc(100vh-200px)]">
                  {errorMessage && (
                    <div className={`rounded-xl border border-red-100 bg-red-50 ${isRTL ? 'text-right' : ''} px-4 py-3 text-sm text-red-600`}>
                      {errorMessage}
                    </div>
                  )}

                  <div className={`space-y-2 ${isHebrew ? 'text-right' : ''}`}>
                    <Label htmlFor="user_name">{t('welcome.profile.nameLabel')}</Label>
                    <Input
                      id="user_name"
                      value={profileData.name}
                      onChange={(e) => {
                        handleProfileChange('name', e.target.value);
                        if (fieldErrors.profileName) clearFieldError('profileName');
                      }}
                      placeholder={t('welcome.profile.namePlaceholder')}
                      className={`${isHebrew ? 'text-right' : ''} ${fieldErrors.profileName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    />
                    <StyledErrorMessage message={fieldErrors.profileName} />
                  </div>

                  <div className={`space-y-3 ${isHebrew ? 'text-right' : ''}`}>
                    <Label>{t('welcome.profile.languageLabel')}</Label>
                    <div className="grid gap-3 md:grid-cols-2">
                      {[
                        { value: 'english', title: t('welcome.profile.english'), description: t('welcome.profile.englishDescription') },
                        { value: 'hebrew', title: t('welcome.profile.hebrew'), description: t('welcome.profile.hebrewDescription') }
                      ].map(option => (
                        <button
                          type="button"
                          key={option.value}
                          onClick={() => handleProfileChange('language', option.value)}
                          className={`rounded-2xl border p-4 text-left transition-all ${
                            profileData.language === option.value
                              ? 'border-sky-500 bg-sky-50 shadow-sm'
                              : 'border-slate-200 hover:border-sky-300 hover:bg-sky-50/40'
                          } ${isHebrew ? 'text-right' : ''}`}
                        >
                          <span className="block text-lg font-semibold text-slate-800">
                            {option.title}
                          </span>
                          <span className="mt-2 block text-sm text-slate-500">
                            {option.description}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>

                <div className="border-t border-slate-200 bg-white/95 px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
                  {isHebrew ? (
                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 w-full">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setStep(0)}
                        className={`rounded-xl w-full sm:w-auto ${secondaryCtaClass}`}
                      >
                        {t('common.back')}
                      </Button>
                      <Button
                        type="submit"
                        className={`bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 rounded-2xl w-full sm:w-auto ${primaryCtaClass}`}
                      >
                        {t('welcome.profile.continue')}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 w-full">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setStep(0)}
                        className={`rounded-xl w-full sm:w-auto ${secondaryCtaClass}`}
                      >
                        {t('common.back')}
                      </Button>
                      <Button
                        type="submit"
                        className={`bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 rounded-2xl w-full sm:w-auto ${primaryCtaClass}`}
                      >
                        {t('welcome.profile.continue')}
                      </Button>
                    </div>
                  )}
                </div>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleBusinessFormSubmit} className="flex flex-1 flex-col overflow-hidden" noValidate>
                <CardContent className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-h-[calc(100vh-200px)]">
                  {errorMessage && (
                    <div className={`rounded-xl border border-red-100 bg-red-50 ${isRTL ? 'text-right' : ''} px-4 py-3 text-sm text-red-600`}>
                      {errorMessage}
                    </div>
                  )}

                  {businessPage === 0 && (
                    <>
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className={isHebrew ? 'text-right' : ''}>
                          <Label htmlFor="business_name">{t('business.businessName')} *</Label>
                          <Input
                            id="business_name"
                            value={businessData.business_name}
                            onChange={(e) => {
                              handleBusinessChange('business_name', e.target.value);
                              if (fieldErrors.businessName) clearFieldError('businessName');
                            }}
                            placeholder={t('placeholder.businessName')}
                            className={`${isHebrew ? 'text-right' : ''} ${fieldErrors.businessName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                          />
                          <StyledErrorMessage message={fieldErrors.businessName} />
                        </div>
                        <div className={isHebrew ? 'text-right' : ''}>
                          <Label htmlFor="industry">{t('business.industry')} *</Label>
                          <Input
                            id="industry"
                            value={businessData.industry}
                            onChange={(e) => {
                              handleBusinessChange('industry', e.target.value);
                              if (fieldErrors.industry) clearFieldError('industry');
                            }}
                            placeholder={t('placeholder.industry')}
                            className={`${isHebrew ? 'text-right' : ''} ${fieldErrors.industry ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                          />
                          <StyledErrorMessage message={fieldErrors.industry} />
                        </div>
                      </div>


                      <div className={`space-y-2 ${isHebrew ? 'text-right' : ''}`}>
                        <Label htmlFor="description">{t('business.description')} *</Label>
                        <Textarea
                          id="description"
                          value={businessData.description}
                          onChange={(e) => {
                            handleBusinessChange('description', e.target.value);
                            if (fieldErrors.description) clearFieldError('description');
                          }}
                          placeholder={t('placeholder.description')}
                          rows={4}
                          className={`${isHebrew ? 'text-right' : ''} ${fieldErrors.description ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                        />
                        <StyledErrorMessage message={fieldErrors.description} />
                      </div>
                    </>
                  )}

                  {businessPage === 1 && (
                    <>
                      <div className={`space-y-2 ${isHebrew ? 'text-right' : ''}`}>
                        <Label htmlFor="products_services">{t('business.productsServices')} *</Label>
                        <Textarea
                          id="products_services"
                          value={businessData.products_services}
                          onChange={(e) => {
                            handleBusinessChange('products_services', e.target.value);
                            if (fieldErrors.productsServices) clearFieldError('productsServices');
                          }}
                          placeholder={t('placeholder.productsServices')}
                          rows={3}
                          className={`${isHebrew ? 'text-right' : ''} ${fieldErrors.productsServices ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                        />
                        <StyledErrorMessage message={fieldErrors.productsServices} />
                      </div>

                      <div className={`space-y-2 ${isHebrew ? 'text-right' : ''}`}>
                        <Label htmlFor="target_market">{t('business.targetMarket')} *</Label>
                        <Textarea
                          id="target_market"
                          value={businessData.target_market}
                          onChange={(e) => {
                            handleBusinessChange('target_market', e.target.value);
                            if (fieldErrors.targetMarket) clearFieldError('targetMarket');
                          }}
                          placeholder={t('placeholder.targetMarket')}
                          rows={3}
                          className={`${isHebrew ? 'text-right' : ''} ${fieldErrors.targetMarket ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                        />
                        <StyledErrorMessage message={fieldErrors.targetMarket} />
                      </div>

                      <div className={`space-y-3 ${isHebrew ? 'text-right' : ''}`}>
                        <Label>{t('business.competitors')} *</Label>
                        <div className={`flex flex-col gap-3 sm:flex-row ${isHebrew ? 'sm:flex-row-reverse' : ''}`}>
                          <Input
                            value={newCompetitor}
                            onChange={(e) => {
                              setNewCompetitor(e.target.value);
                              if (fieldErrors.competitors) clearFieldError('competitors');
                            }}
                            placeholder={t('placeholder.addCompetitor')}
                            className={`${isHebrew ? 'text-right' : ''} ${fieldErrors.competitors ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                          />
                          <Button
                            type="button"
                            onClick={addCompetitor}
                            variant="secondary"
                            className={`rounded-md ${secondaryCtaClass}`}
                            size="icon"
                            style={{ width: '35px', height: '35px' }}
                          >
                            <Plus className="w-2 h-2" />
                          </Button>
                        </div>
                        <StyledErrorMessage message={fieldErrors.competitors} />
                        {businessData.competitors.length > 0 && (
                          <div className={`flex flex-wrap gap-2 ${isHebrew ? 'justify-end' : ''}`}>
                            {businessData.competitors.map((competitor) => (
                              <Badge
                                key={competitor}
                                variant="secondary"
                                className="gap-2 bg-sky-50 text-sky-700 border border-sky-100"
                              >
                                <span>{competitor}</span>
                                <button
                                  type="button"
                                  onClick={() => removeCompetitor(competitor)}
                                  className="text-sky-500 hover:text-sky-700"
                                >
                                  x
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>

                <div className="border-t border-slate-200 bg-white/95 px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
                  {isHebrew ? (
                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 w-full">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleBusinessBack}
                        className={`rounded-xl w-full sm:w-auto ${secondaryCtaClass}`}
                      >
                        {t('common.back')}
                      </Button>
                      <Button
                        type="submit"
                        className={`bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 rounded-2xl w-full sm:w-auto ${primaryCtaClass}`}
                      >
                        {isLastBusinessPage ? (
                          t('welcome.business.saveAndContinue')
                        ) : (
                          t('common.next')
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 w-full">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleBusinessBack}
                        className={`rounded-xl w-full sm:w-auto ${secondaryCtaClass}`}
                      >
                        {t('common.back')}
                      </Button>
                      <Button
                        type="submit"
                        className={`bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 rounded-2xl w-full sm:w-auto ${primaryCtaClass}`}
                      >
                        {isLastBusinessPage ? (
                          t('welcome.business.saveAndContinue')
                        ) : (
                          t('common.next')
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </form>
            )}

            {step === 3 && (
              <CardContent className={`flex flex-1 flex-col items-center justify-center text-center gap-6 p-4 sm:p-6 lg:p-12 ${isRTL ? 'text-right' : ''}`}>
                <div className="flex items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-blue-200/80 shadow-inner p-4">
                  <Users className="w-16 h-16 text-sky-600" />
                </div>
                <p className="text-lg text-slate-600 max-w-2xl">
                  {t('welcome.personaIntro.description')}
                </p>
                <div className={`flex flex-col gap-3 sm:flex-row ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep(2)}
                    className={`rounded-xl ${secondaryCtaClass}`}
                  >
                    {t('welcome.personaIntro.back')}
                  </Button>
                  <Button
                    type="button"
                    onClick={startPersonaStep}
                    className={`bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 rounded-2xl ${primaryCtaClass}`}
                  >
                    {t('welcome.personaIntro.cta')}
                  </Button>
                </div>
              </CardContent>
            )}

            {step === 4 && (
              <form onSubmit={handlePersonaFormSubmit} className="flex flex-1 flex-col overflow-hidden" noValidate>
                <CardContent className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-h-[calc(100vh-200px)]">
                  {errorMessage && (
                    <div className={`rounded-xl border border-red-100 bg-red-50 ${isRTL ? 'text-right' : ''} px-4 py-3 text-sm text-red-600`}>
                      {errorMessage}
                    </div>
                  )}

                  {personaPage === 0 && (
                    <>
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className={isRTL ? 'text-right' : ''}>
                          <Label htmlFor="persona_name">{t('common.name')} *</Label>
                          <Input
                            id="persona_name"
                            value={personaData.name}
                            onChange={(e) => {
                              handlePersonaChange('name', e.target.value);
                              if (fieldErrors.personaName) clearFieldError('personaName');
                            }}
                            placeholder={isHebrew ? 'למשל, דנה ישראלי' : 'e.g., Dana Cohen'}
                            className={`${isRTL ? 'text-right' : ''} ${fieldErrors.personaName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                          />
                          <StyledErrorMessage message={fieldErrors.personaName} />
                        </div>
                        <div className={isRTL ? 'text-right' : ''}>
                          <Label htmlFor="persona_age">{t('personas.years')} *</Label>
                          <Input
                            id="persona_age"
                            type="number"
                            min="0"
                            max="120"
                            value={personaData.age}
                            onChange={(e) => {
                              handlePersonaChange('age', e.target.value);
                              if (fieldErrors.personaAge) clearFieldError('personaAge');
                            }}
                            placeholder="32"
                            className={`${isRTL ? 'text-right' : ''} ${fieldErrors.personaAge ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                          />
                          <StyledErrorMessage message={fieldErrors.personaAge} />
                        </div>
                      </div>

                      <div className={isRTL ? 'text-right' : ''}>
                        <Label htmlFor="persona_role">{isHebrew ? 'תפקיד *' : 'Job Title *'}</Label>
                        <Input
                          id="persona_role"
                          value={personaData.job_title}
                          onChange={(e) => {
                            handlePersonaChange('job_title', e.target.value);
                            if (fieldErrors.personaJobTitle) clearFieldError('personaJobTitle');
                          }}
                          placeholder={isHebrew ? 'למשל, מנהלת שיווק' : 'e.g., Marketing Manager'}
                          className={`${isRTL ? 'text-right' : ''} ${fieldErrors.personaJobTitle ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                        />
                        <StyledErrorMessage message={fieldErrors.personaJobTitle} />
                      </div>

                      {/* AI Generation Button */}
                      <div className={`flex ${isRTL ? 'justify-start' : 'justify-center'} mt-6`}>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={generatePersonaWithAI}
                          disabled={isGeneratingAI}
                          className={`w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 text-lg bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 border-purple-200 text-purple-700 hover:text-purple-800 rounded-xl min-h-[56px]`}
                        >
                          {isGeneratingAI ? (
                            <Spinner size="default" variant="primary" />
                          ) : (
                            <Sparkles className="w-6 h-6" />
                          )}
                          {isHebrew ? 'יצירה עם בינה מלאכותית' : 'Generate with AI'}
                        </Button>
                      </div>
                    </>
                  )}

                  {personaPage === 1 && (
                    <>
                      <div className={isRTL ? 'text-right' : ''}>
                        <Label htmlFor="persona_goals">{t('personas.goals')} *</Label>
                        <Textarea
                          id="persona_goals"
                          value={personaData.goals}
                          onChange={(e) => {
                            handlePersonaChange('goals', e.target.value);
                            if (fieldErrors.personaGoals) clearFieldError('personaGoals');
                          }}
                          rows={3}
                          className={`${isRTL ? 'text-right' : ''} ${fieldErrors.personaGoals ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                        />
                        <StyledErrorMessage message={fieldErrors.personaGoals} />
                      </div>

                      <div className={isRTL ? 'text-right' : ''}>
                        <Label htmlFor="persona_pain">{t('personas.painPoints')} *</Label>
                        <Textarea
                          id="persona_pain"
                          value={personaData.pain_points}
                          onChange={(e) => {
                            handlePersonaChange('pain_points', e.target.value);
                            if (fieldErrors.personaPainPoints) clearFieldError('personaPainPoints');
                          }}
                          rows={3}
                          className={`${isRTL ? 'text-right' : ''} ${fieldErrors.personaPainPoints ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                        />
                        <StyledErrorMessage message={fieldErrors.personaPainPoints} />
                      </div>

                      <div className={isRTL ? 'text-right' : ''}>
                        <Label htmlFor="persona_lifestyle">{t('personas.lifestyle')} *</Label>
                        <Textarea
                          id="persona_lifestyle"
                          value={personaData.lifestyle}
                          onChange={(e) => {
                            handlePersonaChange('lifestyle', e.target.value);
                            if (fieldErrors.personaLifestyle) clearFieldError('personaLifestyle');
                          }}
                          rows={3}
                          className={`${isRTL ? 'text-right' : ''} ${fieldErrors.personaLifestyle ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                        />
                        <StyledErrorMessage message={fieldErrors.personaLifestyle} />
                      </div>
                    </>
                  )}

                  {personaPage === 2 && (
                    <>
                      <div className={isRTL ? 'text-right' : ''}>
                        <Label htmlFor="persona_motivations">{t('welcome.persona.motivations')} *</Label>
                        <Textarea
                          id="persona_motivations"
                          value={personaData.motivations}
                          onChange={(e) => {
                            handlePersonaChange('motivations', e.target.value);
                            if (fieldErrors.personaMotivations) clearFieldError('personaMotivations');
                          }}
                          rows={3}
                          className={`${isRTL ? 'text-right' : ''} ${fieldErrors.personaMotivations ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                        />
                        <StyledErrorMessage message={fieldErrors.personaMotivations} />
                      </div>

                      <div className={isRTL ? 'text-right' : ''}>
                        <Label htmlFor="persona_backstory">{t('welcome.persona.backstory')} *</Label>
                        <Textarea
                          id="persona_backstory"
                          value={personaData.backstory}
                          onChange={(e) => {
                            handlePersonaChange('backstory', e.target.value);
                            if (fieldErrors.personaBackstory) clearFieldError('personaBackstory');
                          }}
                          rows={3}
                          className={`${isRTL ? 'text-right' : ''} ${fieldErrors.personaBackstory ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                        />
                        <StyledErrorMessage message={fieldErrors.personaBackstory} />
                      </div>
                    </>
                  )}
                </CardContent>

                <div className="border-t border-slate-200 bg-white/95 px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
                  {isHebrew ? (
                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 w-full">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handlePersonaBack}
                        disabled={isSubmitting}
                        className={`rounded-xl w-full sm:w-auto disabled:opacity-60 ${secondaryCtaClass}`}
                      >
                        {t('common.back')}
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting && isLastPersonaPage}
                        className={`bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 rounded-2xl w-full sm:w-auto disabled:opacity-70 ${primaryCtaClass}`}
                      >
                        {isLastPersonaPage ? (
                          isSubmitting ? (
                            <span className="flex items-center gap-2">
                              <Lordicon size="sm" variant="white" />
                              {t('welcome.creating')}
                            </span>
                          ) : (
                            t('welcome.finishSetup')
                          )
                        ) : (
                          t('common.next')
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 w-full">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handlePersonaBack}
                        disabled={isSubmitting}
                        className={`rounded-xl w-full sm:w-auto disabled:opacity-60 ${secondaryCtaClass}`}
                      >
                        {t('common.back')}
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting && isLastPersonaPage}
                        className={`bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 rounded-2xl w-full sm:w-auto disabled:opacity-70 ${primaryCtaClass}`}
                      >
                        {isLastPersonaPage ? (
                          isSubmitting ? (
                            <span className="flex items-center gap-2">
                              <Lordicon size="sm" variant="white" />
                              {t('welcome.creating')}
                            </span>
                          ) : (
                            t('welcome.finishSetup')
                          )
                        ) : (
                          t('common.next')
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </form>
            )}

            {step === 5 && (
              <div className="flex flex-1 flex-col overflow-hidden">
                <CardContent className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-h-[calc(100vh-200px)]">
                  {generatedPersona && (
                    <div className="space-y-6">
                      {/* Persona Header */}
                      <div className="text-center">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-sky-100 to-blue-200 flex items-center justify-center mx-auto mb-4">
                          <Users className="w-10 h-10 text-sky-600" />
                        </div>
                        <h3 className="text-2xl font-semibold text-slate-900 mb-2">
                          {t('welcome.meetPersona.title').replace('{name}', generatedPersona.name)}
                        </h3>
                        <p className="text-slate-600">
                          {t('welcome.meetPersona.subtitle')}
                        </p>
                      </div>

                      {/* Persona Details */}
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className={`space-y-4 ${isRTL ? 'text-right' : ''}`}>
                          <div>
                            <h4 className="font-semibold text-slate-900 mb-2">{isHebrew ? 'פרטים בסיסיים' : 'Basic Details'}</h4>
                            <div className="space-y-2 text-sm">
                              <p><span className="font-medium">{isHebrew ? 'שם:' : 'Name:'}</span> {generatedPersona.name}</p>
                              <p><span className="font-medium">{isHebrew ? 'גיל:' : 'Age:'}</span> {generatedPersona.age}</p>
                              <p><span className="font-medium">{isHebrew ? 'תפקיד:' : 'Job Title:'}</span> {generatedPersona.job_title}</p>
                            </div>
                          </div>

                          {generatedPersona.goals && (
                            <div>
                              <h4 className="font-semibold text-slate-900 mb-2">{isHebrew ? 'מטרות' : 'Goals'}</h4>
                              <p className="text-sm text-slate-600">{generatedPersona.goals}</p>
                            </div>
                          )}

                          {generatedPersona.pain_points && (
                            <div>
                              <h4 className="font-semibold text-slate-900 mb-2">{isHebrew ? 'נקודות כאב' : 'Pain Points'}</h4>
                              <p className="text-sm text-slate-600">{generatedPersona.pain_points}</p>
                            </div>
                          )}
                        </div>

                        <div className={`space-y-4 ${isRTL ? 'text-right' : ''}`}>
                          {generatedPersona.lifestyle && (
                            <div>
                              <h4 className="font-semibold text-slate-900 mb-2">{isHebrew ? 'אורח חיים' : 'Lifestyle'}</h4>
                              <p className="text-sm text-slate-600">{generatedPersona.lifestyle}</p>
                            </div>
                          )}

                          {generatedPersona.motivations && (
                            <div>
                              <h4 className="font-semibold text-slate-900 mb-2">{isHebrew ? 'מוטיבציות' : 'Motivations'}</h4>
                              <p className="text-sm text-slate-600">{generatedPersona.motivations}</p>
                            </div>
                          )}

                          {generatedPersona.purchasing_habits && (
                            <div>
                              <h4 className="font-semibold text-slate-900 mb-2">{isHebrew ? 'הרגלי רכישה' : 'Purchasing Habits'}</h4>
                              <p className="text-sm text-slate-600">{generatedPersona.purchasing_habits}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {generatedPersona.backstory && (
                        <div className={`${isRTL ? 'text-right' : ''}`}>
                          <h4 className="font-semibold text-slate-900 mb-2">{isHebrew ? 'רקע' : 'Backstory'}</h4>
                          <p className="text-sm text-slate-600">{generatedPersona.backstory}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>

                <div className="border-t border-slate-200 bg-white/95 px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
                  {isHebrew ? (
                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 w-full">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setStep(4)}
                        className={`rounded-xl w-full sm:w-auto ${secondaryCtaClass}`}
                      >
                        {t('common.back')}
                      </Button>
                      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setStep(6)}
                          className={`rounded-xl w-full sm:w-auto ${secondaryCtaClass}`}
                        >
                          {t('welcome.personaIntro.back')}
                        </Button>
                        <Button
                          type="button"
                          onClick={handleUseThisAvatar}
                          className={`bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 rounded-2xl w-full sm:w-auto ${primaryCtaClass}`}
                        >
                          {isHebrew ? 'השתמש באווטאר הזה' : 'Use This Avatar'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 w-full">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setStep(4)}
                        className={`rounded-xl w-full sm:w-auto ${secondaryCtaClass}`}
                      >
                        {t('common.back')}
                      </Button>
                      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setStep(6)}
                          className={`rounded-xl w-full sm:w-auto ${secondaryCtaClass}`}
                        >
                          {t('welcome.personaIntro.back')}
                        </Button>
                        <Button
                          type="button"
                          onClick={handleUseThisAvatar}
                          className={`bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 rounded-2xl w-full sm:w-auto ${primaryCtaClass}`}
                        >
                          {isHebrew ? 'השתמש באווטאר הזה' : 'Use This Avatar'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="flex flex-1 flex-col overflow-hidden">
                <CardContent className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-h-[calc(100vh-200px)]">
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-r from-sky-100 to-blue-200 flex items-center justify-center mx-auto mb-4">
                        <Building2 className="w-10 h-10 text-sky-600" />
                      </div>
                      <h3 className="text-2xl font-semibold text-slate-900 mb-2">
                        {isHebrew ? 'סקירת פרטי העסק' : 'Business Details Review'}
                      </h3>
                      <p className="text-slate-600">
                        {isHebrew ? 'בדקו את פרטי העסק שלכם לפני שתמשיכו' : 'Review your business details before continuing'}
                      </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className={`space-y-4 ${isRTL ? 'text-right' : ''}`}>
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-2">{t('business.businessName')}</h4>
                          <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{businessData.business_name}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-2">{t('business.industry')}</h4>
                          <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{businessData.industry}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-2">{t('business.description')}</h4>
                          <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{businessData.description}</p>
                        </div>
                      </div>

                      <div className={`space-y-4 ${isRTL ? 'text-right' : ''}`}>
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-2">{t('business.productsServices')}</h4>
                          <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{businessData.products_services}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-2">{t('business.targetMarket')}</h4>
                          <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{businessData.target_market}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-2">{t('business.competitors')}</h4>
                          <div className="flex flex-wrap gap-2">
                            {businessData.competitors.map((competitor) => (
                              <Badge
                                key={competitor}
                                variant="secondary"
                                className="bg-sky-50 text-sky-700 border border-sky-100"
                              >
                                {competitor}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>

                <div className="border-t border-slate-200 bg-white/95 px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
                  {isHebrew ? (
                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 w-full">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setStep(5)}
                        className={`rounded-xl w-full sm:w-auto ${secondaryCtaClass}`}
                      >
                        {t('common.back')}
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setStep(5)}
                        className={`bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 rounded-2xl w-full sm:w-auto ${primaryCtaClass}`}
                      >
                        {t('welcome.business.saveAndContinue')}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 w-full">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setStep(5)}
                        className={`rounded-xl w-full sm:w-auto ${secondaryCtaClass}`}
                      >
                        {t('common.back')}
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setStep(5)}
                        className={`bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 rounded-2xl w-full sm:w-auto ${primaryCtaClass}`}
                      >
                        {t('welcome.business.saveAndContinue')}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 7 && (
              <CardContent className={`flex flex-1 flex-col items-center justify-center text-center gap-6 p-4 sm:p-6 lg:p-12 ${isRTL ? 'text-right' : ''}`}>
                <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
                <p className="text-lg text-slate-600 max-w-2xl">
                  {t("welcome.success.message")}
                </p>
                <Button
                  size="lg"
                  onClick={handleFinish}
                  className={`bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 rounded-2xl transition ${primaryCtaClass}`}
                >
                  {t("welcome.enterApp")}
                </Button>
              </CardContent>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
