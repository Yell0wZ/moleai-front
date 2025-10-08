import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from '@/contexts/AuthContext';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

const translations = {
  en: {
    // Navigation
    'nav.businessProfile': 'Business Profile',
    'nav.personas': 'Avatars',
    'nav.prompts': 'Prompts',
    'nav.competitors': 'Competitors',
    'nav.analytics': 'Analytics & Insights',
    'nav.profile': 'Profile & Usage',
    'nav.platform': 'Platform',

    // Welcome Onboarding
    'welcome.title': 'Welcome to Mole.AI',
    'welcome.subtitle': 'Let\'s customize the platform for your business.',
    'welcome.description': 'Answer a few quick questions so we can tailor insights and generate an avatar that reflects your ideal customer.',
    'welcome.start': 'Start Setup',
    'welcome.profile.title': 'Let\'s personalize your experience',
    'welcome.profile.subtitle': 'Tell us your name and preferred language to get started.',
    'welcome.profile.nameLabel': 'First Name *',
    'welcome.profile.namePlaceholder': 'e.g., Sarah',
    'welcome.profile.languageLabel': 'Preferred Language',
    'welcome.profile.english': 'English',
    'welcome.profile.hebrew': 'עברית',
    'welcome.profile.englishDescription': 'Keep the interface in English.',
    'welcome.profile.hebrewDescription': 'עבור לממשק בעברית.',
    'welcome.profile.businessFallbackName': 'Unnamed business',
    'welcome.profile.continue': 'Continue',
    'welcome.profile.saving': 'Saving your preferences...',
    'welcome.business.title': 'Tell us about your business',
    'welcome.business.subtitle': 'We use this information to personalize AI research and messaging.',
    'welcome.business.saveAndContinue': 'Save & continue',
    'welcome.business.saving': 'Saving business profile...',
    'welcome.persona.title': 'Design your first avatar',
    'welcome.persona.subtitle': 'Describe your ideal customer so we can craft AI prompts and insights.',
    'welcome.personaIntro.title': 'Meet your first avatar',
    'welcome.personaIntro.subtitle': 'We use your business details to craft tailored personas.',
    'welcome.personaIntro.description': 'Great personas help Mole.AI produce sharper insights. Take a moment to get ready before we ask about your ideal customer.',
    'welcome.personaIntro.cta': 'Start persona setup',
    'welcome.personaIntro.back': 'Review business details',
    'welcome.meetPersona.title': 'Meet {name}',
    'welcome.meetPersona.subtitle': 'Here\'s your AI-generated customer avatar',
    'welcome.businessReview.title': 'Review Business Details',
    'welcome.businessReview.subtitle': 'Please review your business information before continuing',
    'welcome.persona.motivations': 'Key Motivations',
    'welcome.persona.backstory': 'Background Story',
    'welcome.creating': 'Creating your setup...',
    'welcome.finishSetup': 'Create Avatar & Finish',
    'welcome.success.title': 'You\'re all set!',
    'welcome.success.subtitle': 'Your business profile and first avatar are ready.',
    'welcome.success.message': 'We\'ve saved your business profile and created your first avatar. You can always edit or add more later from the Avatars page.',
    'welcome.enterApp': 'Enter Mole.AI',
    'welcome.errors.businessName': 'אנא הזן שם עסק כדי להמשיך.',
    'welcome.errors.description': 'אנא תאר את העסק שלך כדי שנוכל להתאים את החוויה.',
    'welcome.errors.industry': 'אנא ציין את התעשייה שלך כדי להמשיך.',
    'welcome.errors.productsServices': 'אנא תאר את המוצרים והשירותים שלך.',
    'welcome.errors.targetMarket': 'אנא תאר את השוק המטרה שלך.',
    'welcome.errors.competitors': 'אנא הוסף לפחות מתחרה אחד.',
    'welcome.errors.personaName': 'אנא הזן שם לאווטאר כדי להמשיך.',
    'welcome.errors.personaRole': 'אנא הזן תפקיד כדי שנבין מי האווטאר הזה מייצג.',
    'welcome.errors.personaAge': 'אנא הזן גיל לאווטאר.',
    'welcome.errors.personaGoals': 'אנא תאר את המטרות של האווטאר.',
    'welcome.errors.personaPainPoints': 'אנא תאר את נקודות הכאב והאתגרים של האווטאר.',
    'welcome.errors.personaLifestyle': 'אנא תאר את סגנון החיים של האווטאר.',
    'welcome.errors.personaMotivations': 'אנא תאר את המניעים של האווטאר.',
    'welcome.errors.personaBackstory': 'אנא ספק רקע אישי לאווטאר.',
    'welcome.errors.saving': 'שגיאה בשמירת ההגדרות. אנא נסה שוב.',
    'welcome.errors.profileName': 'אנא שתף את השם הפרטי שלך כדי שנוכל להתאים את החוויה.',
    'welcome.errors.profileSubmit': 'שגיאה בשמירת ההעדפות. אנא נסה שוב.',

    // Layout
    'layout.businessFallback': 'My Business',
    'layout.businessLoading': 'Loading businesses...',
    'layout.businessUnavailable': 'No businesses available',
    'layout.businessManageCaption': 'Manage businesses',

    
    // Placeholders
    'placeholder.businessName': 'Your company name',
    'placeholder.industry': 'e.g., Technology, Healthcare, Finance',
    'placeholder.phone': 'e.g., 0501234567',
    'placeholder.description': 'Describe what your company does, its mission, and key value propositions',
    'placeholder.productsServices': 'List your main products and services',
    'placeholder.targetMarket': 'Describe your ideal customers and target demographics',
    'placeholder.addCompetitor': 'Add competitor name',
    
    // Personas
    'personas.title': 'Customer Avatars',
    'personas.subtitle': 'AI-generated profiles for market research',
    'personas.generateAI': 'Generate AI Avatars',
    'personas.createManual': 'Create Manual Avatar',
    'personas.noPersonas': 'No Avatars Yet',
    'personas.createFirst': 'Create your first customer avatar to start analyzing market perception',
    'personas.generateWith': 'Generate with AI',
    'personas.createManually': 'Create Manually',
    'personas.businessRequired': 'Business Profile Required',
    'personas.setupFirst': 'Please set up your business profile first to create AI-powered avatars.',
    'personas.setupProfile': 'Set Up Business Profile',
    'personas.edit': 'Edit',
    'personas.delete': 'Delete',
    'personas.goals': 'Goals',
    'personas.painPoints': 'Pain Points',
    'personas.lifestyle': 'Lifestyle',
    'personas.years': 'Age',
    
    // Prompts
    'prompts.title': 'Prompt History',
    'prompts.subtitle': 'Track AI queries and analyze responses',
    'prompts.totalPrompts': 'Total Prompts',
    'prompts.completed': 'Completed',
    'prompts.pending': 'Pending',
    'prompts.brandMentions': 'Brand Mentions',
    'prompts.mentions': 'Mentions',
    'prompts.sendNew': 'Send New Prompt',
    'prompts.recentPrompts': 'Recent Prompts',
    'prompts.noPrompts': 'No Prompts Sent Yet',
    'prompts.sendFirst': 'Send your first prompt to start analyzing AI responses',
    'prompts.sendFirstBtn': 'Send First Prompt',
    'prompts.noPersonas': 'No Avatars Available',
    'prompts.createPersonasFirst': 'You need to create avatars first before sending prompts to AI tools.',
    'prompts.createPersonas': 'Create Avatars',
    
    // Competitors
    'competitors.title': 'Competitor Analysis',
    'competitors.subtitle': 'Compare your brand against competitors',
    'competitors.manage': 'Manage Competitors',
    'competitors.mentionComparison': 'Mention Comparison',
    'competitors.marketShare': 'Market Share of Mentions',
    'competitors.current': 'Current Competitors',
    'competitors.addCompetitor': 'Add competitor',
    'competitors.noCompetitors': 'No competitors added yet',
    'competitors.saveChanges': 'Save Changes',
    'competitors.saving': 'Saving...',
    'competitors.updated': 'Competitors updated successfully!',
    'competitors.noData': 'No data available yet. Send some prompts to see competitor analysis.',
    'competitors.businessRequired': 'Business Profile Required',
    'competitors.setupRequired': 'Please set up your business profile and add competitors to view this analysis.',
    'competitors.thisWeek': 'This Week',
    'competitors.lastWeek': 'Last Week',
    'competitors.last7Days': 'Last 7 Days',
    'competitors.last14Days': 'Last 14 Days',
    'competitors.last30Days': 'Last 30 Days',
    'competitors.thisMonth': 'This Month',
    'competitors.lastMonth': 'Last Month',
    'competitors.customRange': 'Custom Range',
    
    // Analytics
    'analytics.title': 'Analytics & Insights',
    'analytics.subtitle': 'AI-powered brand perception analysis',
    'analytics.totalMentions': 'Total Mentions',
    'analytics.mentionShare': 'Mention Share',
    'analytics.avgQuery': 'Avg per Query',
    'analytics.brandScore': 'Brand Score',
    'analytics.vsCompetitors': 'vs competitors',
    'analytics.mentionsPerPrompt': 'mentions per prompt',
    'analytics.outOf100': 'out of 100',
    'analytics.vsLastWeek': '+12% vs last week',
    'analytics.mentionTrends': 'Mention Trends',
    'analytics.sentimentAnalysis': 'Sentiment Analysis',
    'analytics.keyThemes': 'Key Themes',
    'analytics.aiInsights': 'AI Insights',
    'analytics.refreshInsights': 'Refresh Insights',
    'analytics.analyzing': 'Analyzing your brand data...',
    'analytics.noTrend': 'No trend data available yet',
    'analytics.positive': 'Positive',
    'analytics.neutral': 'Neutral',
    'analytics.negative': 'Negative',
    'analytics.mentions': 'mentions',
    'analytics.setupRequired': 'Setup Required',
    'analytics.setupMessage': 'Please set up your business profile and send some prompts to view analytics.',
    'analytics.noData': 'No Data Yet',
    'analytics.noDataMessage': 'Send some prompts from your avatars to start seeing analytics and insights.',
    'analytics.noSentimentData': 'No Sentiment Data Available',
    'analytics.noSentimentDataMessage': 'Sentiment analysis data will appear here after running prompts with sentiment analysis.',

    // Profile
    'profile.title': 'Account Overview',
    'profile.subtitle': 'Review your businesses and track prompt usage in one place.',
    'profile.refresh': 'Refresh Data',
    'profile.businessesSection': 'Businesses',
    'profile.primaryLabel': 'Primary',
    'profile.additionalLabel': 'Additional',
    'profile.primaryBusinessSection': 'Primary Business',
    'profile.secondaryBusinessesSection': 'Secondary Businesses',
    'profile.businessesEmpty': 'No businesses found for this account yet.',
    'profile.usageSection': 'Usage Summary',
    'profile.maxPrompts': 'Plan Limit',
    'profile.monthlyPrompts': 'Prompts This Month',
    'profile.totalPrompts': 'All-Time Prompts',
    'profile.remainingPrompts': 'Remaining This Month',
    'profile.noUsage': 'Usage metrics are not available yet.',
    'profile.loadingError': 'We could not load your profile details.',
    'profile.retry': 'Try Again',
    'profile.missingUser': 'Sign in to view your profile information.',

    // Business
    'business.title': 'Business Profile',
    'business.subtitle': 'Define your brand foundation for AI analysis',
    'business.companyInfo': 'Company Information',
    'business.createNew': 'Create New Business',
    'business.create': 'Create Business',
    'business.creating': 'Creating...',
    'business.businessName': 'Business Name',
    'business.businessNameRequired': 'Business name is required',
    'business.industry': 'Industry',
    'business.industryRequired': 'Industry is required',
    'business.description': 'Description',
    'business.descriptionRequired': 'Description is required',
    'business.phone': 'Phone',
    'business.targetMarket': 'Target Market',
    'business.targetMarketRequired': 'Target market is required',
    'business.productsServices': 'Products/Services',
    'business.productsServicesRequired': 'At least one product/service is required',
    'business.competitors': 'Competitors',
    'business.addCompetitor': 'Add Competitor',
    'business.competitorsRequired': 'At least one competitor is required',
    'business.pleaseFillRequiredFields': 'Please fill in all required fields',
    'business.createError': 'Failed to create business. Please try again.',
    'business.saving': 'Saving...',
    'business.update': 'Update Business',
    'business.profileSaved': 'Business profile saved successfully',

    // Validation Errors
    'validation.required': 'This field is required',
    'validation.email': 'Please enter a valid email address',
    'validation.emailRequired': 'Email is required',
    'validation.password': 'Password must be at least 6 characters',
    'validation.passwordRequired': 'Password is required',
    'validation.passwordMismatch': 'Passwords do not match',
    'validation.confirmPasswordRequired': 'Please confirm your password',
    'validation.nameRequired': 'Name is required',
    'validation.jobTitleRequired': 'Job title is required',
    'validation.ageRequired': 'Age is required',
    'validation.ageInvalid': 'Please enter a valid age (1-120)',
    'validation.personaNameRequired': 'שם האווטאר נדרש',
    'validation.personaRoleRequired': 'תפקיד האווטאר נדרש',
    'validation.promptTextRequired': 'Prompt text is required',
    'validation.personaSelectionRequired': 'Please select a persona',
    'validation.phoneInvalid': 'Please enter a valid phone number',

    // Common
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.create': 'Create',
    'common.update': 'Update',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.view': 'View',
    'common.send': 'Send',
    'common.loading': '',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.close': 'Close',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.all': 'All',
    'common.name': 'Name',
    'common.date': 'Date',
    'common.status': 'Status',
    'common.actions': 'Actions',
    
    // Status
    'status.pending': 'Pending',
    'status.analyzing': 'Analyzing',
    'status.completed': 'Completed',
    'status.error': 'Error',
    
  },
  he: {
    // Navigation
    'nav.businessProfile': 'פרופיל עסקי',
    'nav.personas': 'אווטארים',
    'nav.prompts': 'פרומפטים',
    'nav.competitors': 'מתחרים',
    'nav.analytics': 'אנליטיקה ותובנות',
    'nav.profile': 'פרופיל וצריכה',
    'nav.platform': 'פלטפורמה',

    // Welcome Onboarding
    'welcome.title': 'ברוכים הבאים ל-Mole.AI',
    'welcome.subtitle': 'בואו נתאים את הפלטפורמה לעסק שלכם.',
    'welcome.description': 'ענו על כמה שאלות קצרות כדי שנתאים תובנות ונייצר אווטאר שמייצג את הלקוח האידיאלי שלכם.',
    'welcome.start': 'התחלת הגדרה',
    'welcome.profile.title': 'נתאים את החוויה אליך',
    'welcome.profile.subtitle': 'ספר לנו איך לקרוא לך ובאיזו שפה תרצה להשתמש.',
    'welcome.profile.nameLabel': 'שם פרטי *',
    'welcome.profile.namePlaceholder': 'לדוגמה, דנה',
    'welcome.profile.languageLabel': 'שפה מועדפת',
    'welcome.profile.english': 'English',
   'welcome.profile.hebrew': 'עברית',
    'welcome.profile.englishDescription': 'השאר את הממשק באנגלית.',
    'welcome.profile.hebrewDescription': 'העבר את הממשק לעברית.',
    'welcome.profile.businessFallbackName': 'עסק ללא שם',
    'welcome.profile.continue': 'המשך',
    'welcome.profile.saving': 'שומר את ההעדפות...',
    'welcome.business.title': 'ספרו לנו על העסק שלכם',
    'welcome.business.subtitle': 'נשתמש במידע הזה כדי להתאים אישית את תובנות ה-AI והמסרים.',
    'welcome.business.saveAndContinue': 'שמור והמשך',
    'welcome.business.saving': 'שומרים את פרטי העסק...',
    'welcome.persona.title': 'צרו את האווטאר הראשון שלכם',
    'welcome.persona.subtitle': 'תארו את הלקוח האידיאלי כדי שנבנה פרומפטים ותובנות מותאמים.',
    'welcome.personaIntro.title': 'הכירו את האווטאר הראשון שלכם',
    'welcome.personaIntro.subtitle': 'אנחנו משתמשים בפרטי העסק כדי ליצור אווטארים מותאמים.',
    'welcome.personaIntro.description': 'אווטארים מדויקים עוזרים ל-Mole.AI לייצר תובנות חדות. הקדישו רגע להתכונן לפני שנשאל על הלקוח האידיאלי שלכם.',
    'welcome.personaIntro.cta': 'להתחיל ביצירת האווטאר',
    'welcome.personaIntro.back': 'חזרה לפרטי העסק',
    'welcome.meetPersona.title': 'הכירו את {name}',
    'welcome.meetPersona.subtitle': 'האווטאר שלכם שנוצר על ידי בינה מלאכותית',
    'welcome.businessReview.title': 'סקירת פרטי העסק',
    'welcome.businessReview.subtitle': 'אנא סקרו את פרטי העסק שלכם לפני שתמשיכו',
    'welcome.persona.motivations': 'מניעים מרכזיים',
    'welcome.persona.backstory': 'רקע וסיפור אישי',
    'welcome.creating': 'יוצר את ההגדרה...',
    'welcome.finishSetup': 'יצירת אווטאר וסיום',
    'welcome.success.title': 'הכול מוכן!',
    'welcome.success.subtitle': 'הפרופיל העסקי והאווטאר הראשון נשמרו.',
    'welcome.success.message': 'שמחנו להכיר את העסק שלכם! הפרופיל העסקי נשמר ויצרנו אווטאר ראשון. תמיד תוכלו לערוך או להוסיף עוד בדף האווטארים.',
    'welcome.enterApp': 'כניסה ל-Mole.AI',
    'welcome.errors.businessName': 'אנא הזינו את שם העסק כדי להמשיך.',
    'welcome.errors.description': 'אנא תארו את העסק כדי שנוכל להתאים חוויה אישית.',
    'welcome.errors.industry': 'אנא ציינו את התחום כדי להמשיך.',
    'welcome.errors.productsServices': 'אנא תארו את המוצרים והשירותים שלכם.',
    'welcome.errors.targetMarket': 'אנא תארו את קהל היעד שלכם.',
    'welcome.errors.competitors': 'אנא הוסיפו לפחות מתחרה אחד.',
    'welcome.errors.personaName': 'אנא תנו שם לאווטאר כדי להמשיך.',
    'welcome.errors.personaRole': 'אנא הזינו תפקיד לאווטאר כדי שנבין את הייצוג שלו.',
    'welcome.errors.personaAge': 'אנא ציינו את גיל האווטאר.',
    'welcome.errors.personaGoals': 'אנא תארו את המטרות של האווטאר.',
    'welcome.errors.personaPainPoints': 'אנא תארו את נקודות הכאב של האווטאר.',
    'welcome.errors.personaLifestyle': 'אנא תארו את אורח החיים של האווטאר.',
    'welcome.errors.personaMotivations': 'אנא תארו את המוטיבציות של האווטאר.',
    'welcome.errors.personaBackstory': 'אנא תארו את הרקע של האווטאר.',
    'welcome.errors.saving': 'אירעה שגיאה בשמירת ההגדרה. נסו שוב.',
    'welcome.errors.profileName': 'אנא הזינו שם פרטי כדי שנוכל לפנות אליכם.',
    'welcome.errors.profileSubmit': 'אירעה שגיאה בשמירת ההעדפות. נסו שוב.',

    // Layout
    'layout.businessFallback': 'העסק שלי',
    'layout.businessLoading': 'טוען עסקים...',
    'layout.businessUnavailable': 'לא נמצאו עסקים',
    'layout.businessManageCaption': 'נהל עסקים',

    // Business Profile
    'business.title': 'פרופיל עסקי',
    
    // Placeholders
    'placeholder.businessName': 'שם החברה שלך',
    'placeholder.industry': 'למשל, טכנולוגיה, בריאות, פיננסים',
    'placeholder.phone': 'למשל: 0501234567',
    'placeholder.description': 'תאר מה החברה שלך עושה, המשימה שלה והצעות הערך המרכזיות',
    'placeholder.productsServices': 'פרט את המוצרים והשירותים העיקריים שלך',
    'placeholder.targetMarket': 'תאר את הלקוחות האידיאליים שלך והדמוגרפיות של קהל היעד',
    'placeholder.addCompetitor': 'הוסף שם מתחרה',
    
    // Personas
    'personas.title': 'אווטארים של לקוחות',
    'personas.subtitle': 'פרופילים שנוצרים בעזרת AI למחקר שוק',
    'personas.generateAI': 'צור אווטארים בעזרת AI',
    'personas.createManual': 'צור אווטאר ידני',
    'personas.noPersonas': 'אין אווטארים עדיין',
    'personas.createFirst': 'צור את אווטאר הלקוח הראשון שלך כדי להתחיל לנתח תפיסת מותג',
    'personas.generateWith': 'צור עם AI',
    'personas.createManually': 'צור ידנית',
    'personas.businessRequired': 'נדרש פרופיל עסקי',
    'personas.setupFirst': 'אנא הגדר תחילה את הפרופיל העסקי שלך כדי ליצור אווטארים מופעלי AI.',
    'personas.setupProfile': 'הגדר פרופיל עסקי',
    'personas.edit': 'ערוך',
    'personas.delete': 'מחק',
    'personas.goals': 'מטרות',
    'personas.painPoints': 'נקודות כאב',
    'personas.lifestyle': 'סגנון חיים',
    'personas.years': 'גיל',
    
    // Prompts
    'prompts.title': 'היסטוריית פרומפטים',
    'prompts.subtitle': 'עקוב אחר שאילתות AI וניתח תגובות',
    'prompts.totalPrompts': 'סה״כ פרומפטים',
    'prompts.completed': 'הושלמו',
    'prompts.pending': 'בהמתנה',
    'prompts.brandMentions': 'אזכורי מותג',
    'prompts.mentions': 'אזכורים',
    'prompts.sendNew': 'שלח פרומפט חדש',
    'prompts.recentPrompts': 'פרומפטים אחרונים',
    'prompts.noPrompts': 'עדיין לא נשלחו פרומפטים',
    'prompts.sendFirst': 'שלח את הפרומפט הראשון שלך כדי להתחיל לנתח תגובות AI',
    'prompts.sendFirstBtn': 'שלח פרומפט ראשון',
    'prompts.noPersonas': 'אין אווטארים זמינים',
    'prompts.createPersonasFirst': 'עליך ליצור אווטארים קודם לפני שליחת פרומפטים לכלי AI.',
    'prompts.createPersonas': 'צור אווטארים',
    
    // Competitors
    'competitors.title': 'ניתוח מתחרים',
    'competitors.subtitle': 'השווה את המותג שלך מול מתחרים',
    'competitors.manage': 'נהל מתחרים',
    'competitors.mentionComparison': 'השוואת אזכורים',
    'competitors.marketShare': 'נתח שוק של אזכורים',
    'competitors.current': 'מתחרים נוכחיים',
    'competitors.addCompetitor': 'הוסף מתחרה',
    'competitors.noCompetitors': 'עדיין לא הוספו מתחרים',
    'competitors.saveChanges': 'שמור שינויים',
    'competitors.saving': 'שומר...',
    'competitors.updated': 'המתחרים עודכנו בהצלחה!',
    'competitors.noData': 'אין נתונים זמינים עדיין. שלח פרומפטים כדי לראות ניתוח מתחרים.',
    'competitors.businessRequired': 'נדרש פרופיל עסקי',
    'competitors.setupRequired': 'אנא הגדר את הפרופיל העסקי שלך והוסף מתחרים כדי לראות ניתוח זה.',
    'competitors.thisWeek': 'השבוע',
    'competitors.lastWeek': 'השבוע שעבר',
    'competitors.last7Days': '7 הימים האחרונים',
    'competitors.last14Days': '14 הימים האחרונים',
    'competitors.last30Days': '30 הימים האחרונים',
    'competitors.thisMonth': 'החודש',
    'competitors.lastMonth': 'החודש שעבר',
    'competitors.customRange': 'טווח מותאם אישית',
    
    // Analytics
    'analytics.title': 'אנליטיקה ותובנות',
    'analytics.subtitle': 'ניתוח תפיסת מותג מופעל AI',
    'analytics.totalMentions': 'סה״כ אזכורים',
    'analytics.mentionShare': 'נתח אזכורים',
    'analytics.avgQuery': 'ממוצע לשאילתה',
    'analytics.brandScore': 'ציון מותג',
    'analytics.vsCompetitors': 'מול מתחרים',
    'analytics.mentionsPerPrompt': 'אזכורים לפרומפט',
    'analytics.outOf100': 'מתוך 100',
    'analytics.vsLastWeek': '+12% מול השבוע שעבר',
    'analytics.mentionTrends': 'מגמות אזכורים',
    'analytics.sentimentAnalysis': 'ניתוח סנטימנט',
    'analytics.keyThemes': 'נושאים מרכזיים',
    'analytics.aiInsights': 'תובנות AI',
    'analytics.refreshInsights': 'רענן תובנות',
    'analytics.analyzing': 'מנתח את נתוני המותג שלך...',
    'analytics.noTrend': 'אין נתוני מגמה זמינים עדיין',
    'analytics.positive': 'חיובי',
    'analytics.neutral': 'נייטרלי',
    'analytics.negative': 'שלילי',
    'analytics.mentions': 'אזכורים',
    'analytics.setupRequired': 'נדרשת הגדרה',
    'analytics.setupMessage': 'אנא הגדר את הפרופיל העסקי שלך ושלח פרומפטים כדי לראות אנליטיקה.',
    'analytics.noData': 'אין נתונים עדיין',
    'analytics.noDataMessage': 'שלח פרומפטים מהאווטארים שלך כדי להתחיל לראות אנליטיקה ותובנות.',
    'analytics.noSentimentData': 'אין נתוני רגש זמינים',
    'analytics.noSentimentDataMessage': 'נתוני ניתוח רגש יופיעו כאן לאחר ביצוע פרומפטים עם ניתוח רגש.',

    // Profile
    'profile.title': 'סקירת חשבון',
    'profile.subtitle': 'צפו בעסקים שלכם ועקבו אחר שימוש בפרומפטים במקום אחד.',
    'profile.refresh': 'רענון נתונים',
    'profile.businessesSection': 'עסקים',
    'profile.primaryLabel': 'ראשי',
    'profile.additionalLabel': 'נוסף',
    'profile.primaryBusinessSection': 'עסק ראשי',
    'profile.secondaryBusinessesSection': 'עסקים משניים',
    'profile.businessesEmpty': 'לא נמצאו עסקים לחשבון זה.',
    'profile.usageSection': 'סיכום שימוש',
    'profile.maxPrompts': 'מגבלת התוכנית',
    'profile.monthlyPrompts': 'פרומפטים החודש',
    'profile.totalPrompts': 'פרומפטים מצטברים',
    'profile.remainingPrompts': 'נותרו החודש',
    'profile.noUsage': 'נתוני שימוש עדיין לא זמינים.',
    'profile.loadingError': 'לא הצלחנו לטעון את פרטי החשבון.',
    'profile.retry': 'נסו שוב',
    'profile.missingUser': 'התחברו כדי לצפות במידע הפרופיל שלכם.',
    
    // Business
    'business.title': 'פרופיל עסקי',
    'business.subtitle': 'הגדר את הבסיס למותג שלך לניתוח AI',
    'business.companyInfo': 'מידע על החברה',
    'business.createNew': 'צור עסק חדש',
    'business.create': 'צור עסק',
    'business.creating': 'יוצר...',
    'business.businessName': 'שם העסק',
    'business.businessNameRequired': 'שם העסק נדרש',
    'business.industry': 'תעשייה',
    'business.industryRequired': 'תעשייה נדרשת',
    'business.description': 'תיאור',
    'business.descriptionRequired': 'תיאור נדרש',
    'business.phone': 'טלפון',
    'business.targetMarket': 'קהל יעד',
    'business.targetMarketRequired': 'קהל יעד נדרש',
    'business.productsServices': 'מוצרים/שירותים',
    'business.productsServicesRequired': 'נדרש לפחות מוצר או שירות אחד',
    'business.competitors': 'מתחרים',
    'business.addCompetitor': 'הוסף מתחרה',
    'business.competitorsRequired': 'נדרש לפחות מתחרה אחד',
    'business.pleaseFillRequiredFields': 'אנא מלא את כל השדות הנדרשים',
    'business.createError': 'יצירת העסק נכשלה. אנא נסו שוב.',
    'business.saving': 'שומר...',
    'business.update': 'עדכן עסק',
    'business.profileSaved': 'פרופיל העסק נשמר בהצלחה',

    // Validation Errors
    'validation.required': 'שדה זה נדרש',
    'validation.email': 'אנא הזן כתובת אימייל תקינה',
    'validation.emailRequired': 'אימייל נדרש',
    'validation.password': 'הסיסמה חייבת להכיל לפחות 6 תווים',
    'validation.passwordRequired': 'סיסמה נדרשת',
    'validation.passwordMismatch': 'הסיסמאות אינן תואמות',
    'validation.confirmPasswordRequired': 'אנא אשר את הסיסמה',
    'validation.nameRequired': 'שם נדרש',
    'validation.jobTitleRequired': 'תפקיד נדרש',
    'validation.ageRequired': 'גיל נדרש',
    'validation.ageInvalid': 'אנא הזן גיל תקין (1-120)',
    'validation.personaNameRequired': 'שם האווטאר נדרש',
    'validation.personaRoleRequired': 'תפקיד האווטאר נדרש',
    'validation.promptTextRequired': 'טקסט הפרומפט נדרש',
    'validation.personaSelectionRequired': 'אנא בחר אווטאר',
    'validation.phoneInvalid': 'אנא הזן מספר טלפון תקין',
    
    // Common
    'common.cancel': 'בטל',
    'common.save': 'שמור',
    'common.create': 'צור',
    'common.update': 'עדכן',
    'common.edit': 'ערוך',
    'common.delete': 'מחק',
    'common.view': 'הצג',
    'common.send': 'שלח',
    'common.loading': 'טוען...',
    'common.error': 'שגיאה',
    'common.success': 'הצלחה',
    'common.close': 'סגור',
    'common.back': 'חזור',
    'common.next': 'הבא',
    'common.previous': 'הקודם',
    'common.search': 'חפש',
    'common.filter': 'סנן',
    'common.all': 'הכל',
    'common.name': 'שם',
    'common.date': 'תאריך',
    'common.status': 'סטטוס',
    'common.actions': 'פעולות',
    
    // Status
    'status.pending': 'בהמתנה',
    'status.analyzing': 'מנתח',
    'status.completed': 'הושלם',
    'status.error': 'שגיאה',
    
  }
};

export function LanguageProvider({ children }) {
  const { user } = useAuth();
  const [language, setLanguage] = useState(() => {
    if (typeof window === 'undefined') {
      return 'en';
    }
    const saved = localStorage.getItem('app-language');
    return saved || 'en';
  });

  const [direction, setDirection] = useState(() => {
    return language === 'he' ? 'rtl' : 'ltr';
  });
  const [languageLocked, setLanguageLocked] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return localStorage.getItem('language-locked') === 'true';
  });

  // Load language from Firestore on mount
  useEffect(() => {
    const loadLanguageFromFirestore = async () => {
      try {
        // Always try to load from Firestore if user is available, and override localStorage if different
        if (user?.uid) {
          const docRef = doc(db, 'clients', user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const docData = docSnap.data();
            if (docData.personal && docData.personal.language) {
              const firestoreLanguage = docData.personal.language.toLowerCase();
              const normalizedLanguage = firestoreLanguage.startsWith('he') ? 'he' : 'en';
              const currentLanguage = localStorage.getItem('app-language');
              
              // If Firestore language is different from localStorage, update it
              if (currentLanguage !== normalizedLanguage) {
                console.log('Language mismatch detected. Firestore:', firestoreLanguage, 'LocalStorage:', currentLanguage);
                console.log('Updating language to:', normalizedLanguage);
                setLanguage(normalizedLanguage);
                // Clear the language lock to allow the update
                localStorage.removeItem('language-locked');
              } else {
                console.log('Language already in sync:', normalizedLanguage);
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to load language from Firestore:', error);
      }
    };

    loadLanguageFromFirestore();
  }, [user]);

  useEffect(() => {
    localStorage.setItem('app-language', language);
    const newDirection = language === 'he' ? 'rtl' : 'ltr';
    setDirection(newDirection);
    document.documentElement.setAttribute('dir', newDirection);
    document.documentElement.setAttribute('lang', language);
  }, [language]);

  const t = (key, fallback) => {
    const translation = translations[language]?.[key];
    return translation || fallback || key;
  };

  const isRTL = direction === 'rtl';
  const isHebrew = language === 'he';

  const lockLanguage = () => {
    setLanguageLocked(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('language-locked', 'true');
    }
  };

  const clearLanguageCache = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('app-language');
      localStorage.removeItem('language-locked');
      console.log('Language cache cleared, will reload from Firestore');
    }
  };

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      direction,
      isRTL,
      isHebrew,
      languageLocked,
      lockLanguage,
      clearLanguageCache,
      t
    }}>
      {children}
    </LanguageContext.Provider>
  );
}
