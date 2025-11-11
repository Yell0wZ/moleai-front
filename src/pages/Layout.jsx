
import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Building2, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  BarChart3,
  Brain,
  Sparkles,
  LogOut,
  UserRound,
  Plus,
  X
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { LanguageProvider, useLanguage } from "@/components/common/LanguageProvider";
import { BusinessProfile, UserPreferences } from "@/api/entities";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import CreateBusinessModal from "@/components/business/CreateBusinessModal";
import { Business } from "@/api/entities";

function LayoutContent({ children, currentPageName, businessId }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, isRTL, isHebrew, setLanguage, lockLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState(() => {
    if (typeof window === "undefined") return null;
    
    // Try to get businessId from URL first
    const pathParts = window.location.pathname.split('/').filter(part => part !== '');
    if (pathParts.length >= 2) {
      const urlBusinessId = pathParts[0];
      if (urlBusinessId && urlBusinessId !== 'profile') {
        return urlBusinessId;
      }
    }
    
    // If URL doesn't have businessId, it's the primary business (null)
    return localStorage.getItem("selected-business-id") || null;
  });
  const [isLoadingBusinesses, setIsLoadingBusinesses] = useState(true);
  const [isCreateBusinessModalOpen, setIsCreateBusinessModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [deleteBusinessModal, setDeleteBusinessModal] = useState({ isOpen: false, businessId: null, businessName: '' });

  // Load language from database when component mounts
  useEffect(() => {
    const loadLanguageFromDatabase = async () => {
      try {
        // Always load language from database on every refresh
        // Load personal data directly from Firestore
        if (user?.uid) {
          const docRef = doc(db, 'clients', user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const docData = docSnap.data();
            console.log('=== FIRESTORE RAW DATA ===');
            console.log('Full Firestore document:', docData);
            console.log('Firestore document keys:', Object.keys(docData || {}));
            console.log('Personal field:', docData.personal);
            console.log('Personal language:', docData.personal?.language);
            console.log('=== END FIRESTORE RAW DATA ===');
            
            const personalData = docData.personal;
            
            if (personalData && personalData.language) {
              const normalizedLanguage = personalData.language.toLowerCase().startsWith('he')
                ? 'hebrew'
                : 'english';
              
              const languageCode = normalizedLanguage === 'hebrew' ? 'he' : 'en';
              setLanguage(languageCode);
              lockLanguage();
            }
          }
        }
      } catch (error) {
        console.error('Failed to load language from database:', error);
      }
    };

    if (user) {
      loadLanguageFromDatabase();
    }
  }, [user, setLanguage, lockLanguage]);

  const navigationItems = useMemo(() => {
    const businessId = selectedBusinessId;
    const selectedBusiness = businesses.find(b => b.id === businessId);
    const isPrimary = selectedBusiness?.isPrimary || false;
    
    return [
      {
        title: t('nav.businessProfile'),
        url: createPageUrl("BusinessProfile", businessId, isPrimary),
        icon: Building2,
      },
      {
        title: t('nav.personas'),
        url: createPageUrl("Avatar", businessId, isPrimary),
        icon: Users,
      },
      {
        title: t('nav.prompts'),
        url: createPageUrl("Prompt", businessId, isPrimary),
        icon: MessageSquare,
      },
      {
        title: t('nav.competitors'),
        url: createPageUrl("Competitor", businessId, isPrimary),
        icon: TrendingUp,
      },
      {
        title: t('nav.analytics'),
        url: createPageUrl("Analytics", businessId, isPrimary),
        icon: BarChart3,
      },
    ];
  }, [t, selectedBusinessId, businesses]);

  const profileNavItem = {
    title: t('nav.profile'),
    url: createPageUrl("Profile"),
    icon: UserRound,
  };

  const handleProfileClick = () => {
    navigate(profileNavItem.url);
  };

  const getShortTitle = (title) => {
    const shortTitles = {
      [t('nav.businessProfile')]: isHebrew ? 'עסק' : 'Business',
      [t('nav.personas')]: isHebrew ? 'אווטארים' : 'Avatars', 
      [t('nav.prompts')]: isHebrew ? 'פרומפטים' : 'Prompts',
      [t('nav.competitors')]: isHebrew ? 'מתחרים' : 'Competitors',
      [t('nav.analytics')]: isHebrew ? 'אנליטיקה' : 'Analytics'
    };
    return shortTitles[title] || title;
  };

  useEffect(() => {
    let isMounted = true;

    const loadBusinesses = async () => {
      try {
        setIsLoadingBusinesses(true);
        
        if (!user) {
          setBusinesses([]);
          return;
        }

        // Import Firebase functions
        const { doc, collection, getDoc, getDocs } = await import('firebase/firestore');
        const { db } = await import('@/firebase');

        const clientRef = doc(db, "clients", user.uid);
        const businessesRef = collection(clientRef, "businesses");

        const [clientSnapshot, businessesSnapshot] = await Promise.all([
          getDoc(clientRef),
          getDocs(businessesRef).catch((error) => {
            console.warn("Unable to load businesses sub-collection:", error);
            return null;
          }),
        ]);

        const businessMap = new Map();
        let fallbackCounter = 0;

        const nextFallbackId = (source = "inline") => {
          fallbackCounter += 1;
          return `${source}-business-${fallbackCounter}`;
        };

        const normalizeBusiness = (raw, fallbackId, overrides = {}) => {
          if (!raw) {
            return null;
          }

          let data = raw;
          let baseId = fallbackId;

          if (raw && typeof raw.data === "function") {
            baseId = raw.id || fallbackId;
            data = raw.data();
          }

          if (typeof data === "string") {
            return {
              id: baseId || data || nextFallbackId(overrides.source),
              name: data,
              ...overrides,
            };
          }

          if (typeof data !== "object") {
            return null;
          }

          const name =
            data.business_name ||
            data.businessName ||
            data.name ||
            data.title ||
            baseId ||
            t("layout.businessFallback");

          // Extract ID from database - prioritize actual database ID
          const normalizedId = 
            data.id || 
            data.uid || 
            data.businessId || 
            data.business_id ||
            baseId || 
            name || 
            nextFallbackId(overrides.source);

          return {
            id: normalizedId.toString(),
            name,
            ...overrides,
          };
        };

        const mergeBusiness = (business) => {
          if (!business) {
            return;
          }

          const existing = businessMap.get(business.id);

          if (existing) {
            businessMap.set(business.id, {
              ...existing,
              ...business,
              isPrimary: existing.isPrimary || business.isPrimary || false,
              source: existing.isPrimary ? existing.source : business.source,
            });
          } else {
            businessMap.set(business.id, business);
          }
        };

        // Load primary business from client document
        if (clientSnapshot.exists()) {
          const clientData = clientSnapshot.data() || {};

          const primaryBusinessData =
            clientData.businessProfile || clientData.business_profile || null;

          if (primaryBusinessData) {
            // For primary business, use the actual ID from database if available
            const primaryBusinessId = primaryBusinessData.id || primaryBusinessData.businessId || primaryBusinessData.business_id || `${clientSnapshot.id}-primary`;
            mergeBusiness(
              normalizeBusiness(primaryBusinessData, primaryBusinessId, {
                source: "primary",
                isPrimary: true,
              })
            );
          }

          // Load secondary businesses from the new structure
          const secondaryBusinesses = clientData.secondary_buisness || clientData.secondary_business || [];

          if (Array.isArray(secondaryBusinesses)) {
            secondaryBusinesses.forEach((business, index) => {
              // For secondary businesses, use the actual ID from database if available
              const businessId = business.id || business.businessId || business.business_id || `${clientSnapshot.id}-secondary-${index}`;
              mergeBusiness(
                normalizeBusiness(business, businessId, {
                  source: "secondary",
                  isPrimary: false,
                })
              );
            });
          }
        }

        // Load businesses from sub-collection
        if (businessesSnapshot && !businessesSnapshot.empty) {
          businessesSnapshot.forEach((businessDoc) => {
            // For businesses from sub-collection, use the document ID as the business ID
            const businessData = businessDoc.data();
            const businessId = businessData.id || businessData.businessId || businessData.business_id || businessDoc.id;
            mergeBusiness(
              normalizeBusiness(businessDoc, businessId, {
                source: "collection",
              })
            );
          });
        }

        // Sort businesses: primary first, then by name
        const businesses = Array.from(businessMap.values()).sort((a, b) => {
          if (a.isPrimary === b.isPrimary) {
            return a.name.localeCompare(b.name);
          }
          return a.isPrimary ? -1 : 1;
        });

        if (!isMounted) return;

        setBusinesses(businesses);

        if (businesses.length > 0) {
          const storedSelection = typeof window !== "undefined"
            ? localStorage.getItem("selected-business-id")
            : selectedBusinessId;

          // If stored selection is null or empty string, use primary business (null)
          if (!storedSelection || storedSelection === "null") {
            setSelectedBusinessId(null);
          } else {
            // Check if stored selection exists in businesses
            const nextSelection = businesses.some(entry => entry.id === storedSelection)
              ? storedSelection
              : null; // Default to primary business if stored selection not found
            setSelectedBusinessId(nextSelection);
          }
        }
      } catch (error) {
        console.error("Error loading businesses:", error);
        // Fallback to the old method if the new method fails
        try {
          const current = await BusinessProfile.getCurrentUser();
          if (current) {
            const fallbackBusiness = {
              id: current.id || current.phone || 'business-fallback',
              name: current.business_name || current.businessName || current.name || t('layout.businessFallback'),
              isPrimary: true
            };
            setBusinesses([fallbackBusiness]);
            setSelectedBusinessId(fallbackBusiness.id);
          }
        } catch (fallbackError) {
          console.error("Fallback business loading also failed:", fallbackError);
          setBusinesses([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingBusinesses(false);
        }
      }
    };

    loadBusinesses();

    return () => {
      isMounted = false;
    };
  }, [t, user]);

  // Update selectedBusinessId when URL changes
  useEffect(() => {
    const pathParts = location.pathname.split('/').filter(part => part !== '');
    
    if (pathParts.length >= 2) {
      // URL has businessId: /businessId/tab
      const urlBusinessId = pathParts[0];
      if (urlBusinessId && urlBusinessId !== 'profile' && urlBusinessId !== selectedBusinessId) {
        setSelectedBusinessId(urlBusinessId);
        if (typeof window !== "undefined") {
          localStorage.setItem("selected-business-id", urlBusinessId);
        }
      }
    } else if (pathParts.length === 1 && pathParts[0] !== 'profile') {
      // URL is just /tab - this is the primary business (null)
      if (selectedBusinessId !== null) {
        setSelectedBusinessId(null);
        if (typeof window !== "undefined") {
          localStorage.setItem("selected-business-id", "null");
        }
      }
    }
  }, [location.pathname, selectedBusinessId, businesses]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleBusinessProfileUpdated = (event) => {
      const { businessId, businessName } = event.detail || {};
      if (!businessId || !businessName) {
        return;
      }

      setBusinesses((prev) => {
        const next = Array.isArray(prev) ? [...prev] : [];
        const existingIndex = next.findIndex(entry => entry.id === businessId);
        const updatedEntry = {
          id: businessId,
          name: businessName,
        };

        if (existingIndex >= 0) {
          next[existingIndex] = { ...next[existingIndex], ...updatedEntry };
        } else {
          next.push(updatedEntry);
        }

        // Sort to maintain primary first, then by name
        return next.sort((a, b) => {
          if (a.isPrimary === b.isPrimary) {
            return a.name.localeCompare(b.name);
          }
          return a.isPrimary ? -1 : 1;
        });
      });

      setSelectedBusinessId((prev) => prev || businessId);
    };

    window.addEventListener("business-profile-updated", handleBusinessProfileUpdated);
    return () => {
      window.removeEventListener("business-profile-updated", handleBusinessProfileUpdated);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("selected-business-id", selectedBusinessId || "null");
  }, [selectedBusinessId]);

  const selectedBusiness = useMemo(() => {
    if (selectedBusinessId === null) {
      // Return primary business when selectedBusinessId is null
      return businesses.find(entry => entry.isPrimary) || null;
    }
    return businesses.find(entry => entry.id === selectedBusinessId) || null;
  }, [businesses, selectedBusinessId]);

  const businessLabel = selectedBusiness?.name || t('layout.businessFallback');

  const pageCopy = useMemo(() => {
    const pageMap = {
      BusinessProfile: {
        title: t('business.title'),
        subtitle: t('business.subtitle'),
      },
      Avatar: {
        title: t('personas.title'),
        subtitle: t('personas.subtitle'),
      },
      Prompt: {
        title: t('prompts.title'),
        subtitle: t('prompts.subtitle'),
      },
      Competitor: {
        title: t('competitors.title'),
        subtitle: t('competitors.subtitle'),
      },
      Analytics: {
        title: t('analytics.title'),
        subtitle: t('analytics.subtitle'),
      },
      Profile: {
        title: t('profile.title'),
        subtitle: t('profile.subtitle'),
      },
    };

    const normalizedKey = currentPageName || '';

    if (normalizedKey && pageMap[normalizedKey]) {
      return pageMap[normalizedKey];
    }

    if (normalizedKey) {
      const navMatch = [...navigationItems, profileNavItem].find(
        (item) => item.url === createPageUrl(normalizedKey)
      );

      if (navMatch) {
        return { title: navMatch.title, subtitle: '' };
      }
    }

    return {
      title: businessLabel,
      subtitle: t('layout.businessManageCaption'),
    };
  }, [currentPageName, navigationItems, profileNavItem, businessLabel, t]);

  const mobileHeaderTitle = pageCopy.title || businessLabel;
  const mobileHeaderSubtitle = pageCopy.subtitle;

  const handleBusinessSwitch = (value) => {
    const newBusinessId = value === "primary" ? null : value;
    
    setSelectedBusinessId(newBusinessId);
    if (typeof window !== "undefined") {
      localStorage.setItem("selected-business-id", newBusinessId || "null");
    }
    
    // Trigger refresh of all data when switching businesses
    setRefreshTrigger(prev => prev + 1);
    
    // Navigate to the current page with the new business ID
    if (location.pathname !== '/profile') {
      const pathParts = location.pathname.split('/');
      const currentTab = pathParts[pathParts.length - 1] || 'businessprofile';
      
      // Check if the selected business is primary
      const isPrimary = value === "primary";
      
      const newUrl = createPageUrl(currentTab, newBusinessId, isPrimary);
      navigate(newUrl);
    }
    
    console.debug("Business context switched to:", newBusinessId);
  };

  const handleBusinessCreated = (newBusiness) => {
    // Add the new business to the list
    const businessEntry = {
      id: newBusiness.id || newBusiness.phone || `business-${Date.now()}`,
      name: newBusiness.businessName || newBusiness.business_name || newBusiness.name || t('layout.businessFallback'),
      isPrimary: false // New businesses are secondary by default
    };
    
    setBusinesses(prev => {
      const updated = [...prev, businessEntry];
      // Sort to maintain primary first, then by name
      return updated.sort((a, b) => {
        if (a.isPrimary === b.isPrimary) {
          return a.name.localeCompare(b.name);
        }
        return a.isPrimary ? -1 : 1;
      });
    });
    
    // Select the new business and navigate to it
    setSelectedBusinessId(businessEntry.id);
    if (typeof window !== "undefined") {
      localStorage.setItem("selected-business-id", businessEntry.id);
    }
    
    // Navigate to business profile with the new business ID
    const newUrl = createPageUrl("BusinessProfile", businessEntry.id, false);
    navigate(newUrl);
    
    // Close the modal
    setIsCreateBusinessModalOpen(false);
  };

  const handleDeleteBusiness = (businessIdToDelete) => {
    if (!businessIdToDelete) return; // Can't delete primary business
    
    const businessToDelete = businesses.find(b => b.id === businessIdToDelete);
    if (!businessToDelete) return;
    
    setDeleteBusinessModal({
      isOpen: true,
      businessId: businessIdToDelete,
      businessName: businessToDelete.name
    });
  };

  const confirmDeleteBusiness = async () => {
    const { businessId: businessIdToDelete } = deleteBusinessModal;
    
    try {
      await Business.delete(businessIdToDelete);
      
      // Remove from local state
      setBusinesses(prev => prev.filter(b => b.id !== businessIdToDelete));
      
      // If the deleted business was selected, switch to primary business
      if (selectedBusinessId === businessIdToDelete) {
        setSelectedBusinessId(null);
        if (typeof window !== "undefined") {
          localStorage.setItem("selected-business-id", "null");
        }
        
        // Navigate to primary business
        const newUrl = createPageUrl("BusinessProfile", null, true);
        navigate(newUrl);
      }
      
      // Trigger refresh of all data
      setRefreshTrigger(prev => prev + 1);
      
      // Show success message
      const successMsg = document.createElement('div');
      successMsg.className = `fixed ${isRTL ? 'left-4' : 'right-4'} top-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50`;
      successMsg.textContent = isHebrew ? "העסק נמחק בהצלחה" : "Business deleted successfully";
      document.body.appendChild(successMsg);
      setTimeout(() => document.body.removeChild(successMsg), 3000);
      
    } catch (error) {
      console.error("Error deleting business:", error);
      alert(t('errors.deleteBusinessFailed'));
    } finally {
      setDeleteBusinessModal({ isOpen: false, businessId: null, businessName: '' });
    }
  };

  const cancelDeleteBusiness = () => {
    setDeleteBusinessModal({ isOpen: false, businessId: null, businessName: '' });
  };

  const refreshBusinessData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Listen for business profile updates
  useEffect(() => {
    const handleBusinessProfileUpdate = (event) => {
      const { businessId: updatedBusinessId, businessName } = event.detail;
      
      // Update the business name in the businesses list
      setBusinesses(prev => {
        const updated = prev.map(business => {
          if (business.id === updatedBusinessId) {
            return { ...business, name: businessName };
          }
          return business;
        });
        return updated;
      });
    };

    window.addEventListener('business-profile-updated', handleBusinessProfileUpdate);
    
    return () => {
      window.removeEventListener('business-profile-updated', handleBusinessProfileUpdate);
    };
  }, [businesses]);

  const BusinessSwitcher = ({ triggerClassName = "", contentClassName = "" }) => (
    <Select
      value={businesses.length === 0 ? undefined : (selectedBusinessId || "primary")}
      onValueChange={handleBusinessSwitch}
      disabled={isLoadingBusinesses || businesses.length === 0}
    >
      <SelectTrigger
        className={`h-11 rounded-xl border border-slate-200 bg-white/90 px-4 text-sm font-semibold text-slate-700 shadow-sm transition select-trigger business-switcher-trigger ${isRTL ? 'flex-row-reverse justify-end' : 'justify-start'} ${triggerClassName}`.trim()}
        style={isRTL ? { justifyContent: 'flex-end', textAlign: 'right', direction: 'rtl' } : {}}
      >
        <div 
          className={`flex items-center gap-2 truncate ${isRTL ? 'flex-row-reverse justify-end' : 'justify-start'}`}
          style={isRTL ? { justifyContent: 'flex-end', direction: 'rtl' } : {}}
        >
          <Building2 className="h-4 w-4 text-sky-600" />
          <span 
            className={`truncate max-w-[180px] ${isRTL ? 'text-right' : 'text-left'}`}
            style={isRTL ? { textAlign: 'right', direction: 'rtl' } : {}}
          >
            {isLoadingBusinesses ? t('layout.businessLoading') : businessLabel}
          </span>
        </div>
      </SelectTrigger>
      <SelectContent dir={isRTL ? 'rtl' : 'ltr'} className={`max-h-64 ${contentClassName}`.trim()}>
        {businesses.length === 0 ? (
          <SelectItem value="placeholder" disabled>
            {t('layout.businessUnavailable')}
          </SelectItem>
        ) : (
          <>

            {businesses.find(b => b.isPrimary) && (
              <SelectItem key="primary" value="primary" className={`text-sm ${isRTL ? 'text-right' : 'text-left'}`}>
                <span className={`font-semibold text-sky-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {businesses.find(b => b.isPrimary)?.name} {isHebrew ? '(עסק ראשי)' : '(Main Business)'}
                </span>
              </SelectItem>
            )}
            

              {businesses.filter(b => !b.isPrimary).map((entry, index) => (
                <div key={entry.id} className="relative">
                  <SelectItem value={entry.id} className={`text-sm pr-8 ${isRTL ? 'text-right' : 'text-left'}`}>
                    <span className={`text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {entry.name}
                    </span>
                  </SelectItem>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteBusiness(entry.id);
                    }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-red-100 rounded-full transition-colors"
                    title={isHebrew ? "מחק עסק" : "Delete Business"}
                  >
                    <X className="w-3 h-3 text-red-500 hover:text-red-700" />
                  </button>
                </div>
              ))}
          </>
        )}
        

        <div className="border-t border-slate-200 p-1">
          <Button
            onClick={() => setIsCreateBusinessModalOpen(true)}
            variant="ghost"
            size="sm"
            className={`w-full h-8 text-sky-600 hover:text-sky-700 hover:bg-sky-50 create-business-button ${isRTL ? 'flex-row-reverse justify-end text-right' : 'justify-start text-left'}`}
          >
            <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('business.createNew') || "Create New Business"}
          </Button>
        </div>
      </SelectContent>
    </Select>
  );

  const BottomNavigation = () => {
    const items = navigationItems;

    return (
      <nav className={`fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-slate-200 px-2 pt-2 pb-2 z-50 xl:hidden touch-optimized ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="flex justify-around items-center max-w-lg mx-auto">
          {items.map((item) => {
            const isActive = location.pathname === item.url;
            return (
              <Link
                key={item.title}
                to={item.url}
                className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl transition-all duration-200 min-w-0 flex-1 touch-manipulation touch-optimized hover-optimized ${
                  isActive
                    ? 'bg-gradient-to-t from-sky-500/15 to-blue-500/15 text-sky-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 active:bg-slate-100'
                }`}
                style={{ minHeight: '44px' }} // iOS touch target minimum
              >
                <item.icon className={`w-5 h-5 transition-transform ${
                  isActive ? 'text-sky-600 scale-110' : 'text-slate-500'
                }`} />
                <span className={`text-xs font-medium leading-none truncate max-w-full text-center ${isRTL ? 'text-right' : 'text-left'}`}>
                  {getShortTitle(item.title)}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    );
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-sky-50 via-sky-100 to-sky-200 ${isRTL ? 'rtl' : 'ltr'}`}>
      <style>{`
        :root {
          --gradient-primary: linear-gradient(135deg, #7ecbff 0%, #3a8dff 100%);
          --gradient-secondary: linear-gradient(135deg, #b7e3ff 0%, #7ecbff 100%);
          --gradient-accent: linear-gradient(135deg, #63b3ff 0%, #1c7dff 100%);
          --shadow-luxury: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
          --shadow-card: 0 10px 25px rgba(0, 0, 0, 0.05);
          --mobile-header-height: 72px;
          --mobile-bottom-nav-height: calc(88px + env(safe-area-inset-bottom));
        }
        
        .luxury-gradient {
          background: var(--gradient-primary);
        }
        
        .glass-morphism {
          backdrop-filter: blur(16px);
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }


        [dir="rtl"] .sidebar {
          border-left: 1px solid rgba(255, 255, 255, 0.2);
          border-right: none;
        }
        

        [dir="ltr"] .sidebar {
          border-right: 1px solid rgba(255, 255, 255, 0.2);
          border-left: none;
        }
        
        [dir="rtl"] .sidebar-header {
          text-align: right;
        }
        
        [dir="rtl"] .sidebar-header h2 {
          text-align: right !important;
        }
        
        [dir="rtl"] .sidebar-header p {
          text-align: right !important;
        }
        
        [dir="rtl"] .sidebar-header .flex {
          justify-content: flex-end !important;
        }
        
        [dir="rtl"] .sidebar-header h2,
        [dir="rtl"] .sidebar-header p {
          margin-left: 0 !important;
          margin-right: 0 !important;
          padding-left: 0 !important;
          padding-right: 0 !important;
        }
        
        [dir="rtl"] .create-business-button {
          justify-content: flex-end !important;
          text-align: right !important;
        }
        
        [dir="rtl"] .create-business-button .flex {
          justify-content: flex-end !important;
        }
        
        [dir="rtl"] .select-content {
          text-align: right !important;
        }
        
        [dir="rtl"] .select-item {
          text-align: right !important;
          justify-content: flex-end !important;
        }
        
        [dir="rtl"] .select-item span {
          text-align: right !important;
        }
        
        [dir="rtl"] .select-trigger {
          justify-content: flex-end !important;
          text-align: right !important;
          direction: rtl !important;
        }
        
        [dir="rtl"] .select-trigger .flex {
          justify-content: flex-end !important;
          direction: rtl !important;
        }
        
        [dir="rtl"] .select-trigger span {
          text-align: right !important;
          direction: rtl !important;
        }
        
        [dir="rtl"] [data-radix-select-trigger] {
          justify-content: flex-end !important;
          text-align: right !important;
          direction: rtl !important;
        }
        
        [dir="rtl"] [data-radix-select-trigger] .flex {
          justify-content: flex-end !important;
          direction: rtl !important;
        }
        
        [dir="rtl"] [data-radix-select-trigger] span {
          text-align: right !important;
          direction: rtl !important;
        }
        
        [dir="rtl"] .flex-row-reverse {
          flex-direction: row-reverse;
        }
        

        [dir="rtl"] .business-switcher-trigger {
          justify-content: flex-end !important;
          text-align: right !important;
          direction: rtl !important;
        }
        
        [dir="rtl"] .business-switcher-trigger > div {
          justify-content: flex-end !important;
          direction: rtl !important;
        }
        
        [dir="rtl"] .business-switcher-trigger span {
          text-align: right !important;
          direction: rtl !important;
        }
        

        [dir="rtl"] .sidebar-menu-item {
          text-align: right !important;
          direction: rtl !important;
        }
        
        [dir="rtl"] .sidebar-menu-item a {
          justify-content: flex-end !important;
          text-align: right !important;
          direction: rtl !important;
        }
        
        [dir="rtl"] .sidebar-menu-item span {
          text-align: right !important;
          direction: rtl !important;
        }
        
        [dir="rtl"] .sidebar-menu-item .flex {
          justify-content: flex-end !important;
          direction: rtl !important;
        }
        

        [dir="rtl"] [data-sidebar="menu-item"] {
          text-align: right !important;
          direction: rtl !important;
        }
        
        [dir="rtl"] [data-sidebar="menu-item"] a {
          justify-content: flex-end !important;
          text-align: right !important;
          direction: rtl !important;
        }
        
        [dir="rtl"] [data-sidebar="menu-item"] span {
          text-align: right !important;
          direction: rtl !important;
        }
        
        [dir="rtl"] [data-sidebar="menu-item"] .flex {
          justify-content: flex-end !important;
          direction: rtl !important;
        }
        

        [dir="rtl"] [data-sidebar="menu-item"] a {
          flex-direction: row-reverse !important;
        }
        
        [dir="rtl"] [data-sidebar="menu-item"] a svg {
          order: 2 !important;
        }
        
        [dir="rtl"] [data-sidebar="menu-item"] a span {
          order: 1 !important;
        }
        

        [dir="rtl"] .sidebar-menu-item a {
          flex-direction: row-reverse !important;
        }
        
        [dir="rtl"] .sidebar-menu-item a svg {
          order: 2 !important;
        }
        
        [dir="rtl"] .sidebar-menu-item a span {
          order: 1 !important;
        }
        

        [dir="ltr"] [data-sidebar="menu-item"] a {
          flex-direction: row !important;
        }
        
        [dir="ltr"] [data-sidebar="menu-item"] a svg {
          order: 1 !important;
        }
        
        [dir="ltr"] [data-sidebar="menu-item"] a span {
          order: 2 !important;
        }
        

        [dir="ltr"] .sidebar-menu-item a {
          flex-direction: row !important;
        }
        
        [dir="ltr"] .sidebar-menu-item a svg {
          order: 1 !important;
        }
        
        [dir="ltr"] .sidebar-menu-item a span {
          order: 2 !important;
        }
        

        [dir="rtl"] .sidebar-footer {
          text-align: right !important;
          direction: rtl !important;
        }
        
        [dir="rtl"] .sidebar-footer .flex {
          justify-content: flex-end !important;
          direction: rtl !important;
        }
        
        [dir="rtl"] .sidebar-footer button {
          flex-direction: row-reverse !important;
          justify-content: flex-end !important;
          direction: rtl !important;
        }
        
        [dir="rtl"] .sidebar-footer button div {
          order: 2 !important;
        }
        
        [dir="rtl"] .sidebar-footer button .flex-1 {
          order: 1 !important;
          text-align: right !important;
        }
        

        [dir="ltr"] .sidebar-footer {
          text-align: left !important;
          direction: ltr !important;
        }
        
        [dir="ltr"] .sidebar-footer .flex {
          justify-content: flex-start !important;
          direction: ltr !important;
        }
        
        [dir="ltr"] .sidebar-footer button {
          flex-direction: row !important;
          justify-content: flex-start !important;
          direction: ltr !important;
        }
        
        [dir="ltr"] .sidebar-footer button div {
          order: 1 !important;
        }
        
        [dir="ltr"] .sidebar-footer button .flex-1 {
          order: 2 !important;
          text-align: left !important;
        }
        

        [dir="rtl"] .page-header {
          text-align: right !important;
          direction: rtl !important;
        }
        
        [dir="rtl"] .page-header h1 {
          text-align: right !important;
          direction: rtl !important;
        }
        
        [dir="rtl"] .page-header p {
          text-align: right !important;
          direction: rtl !important;
        }
        
        [dir="rtl"] .page-header .flex {
          justify-content: flex-end !important;
          direction: rtl !important;
        }
        
        [dir="rtl"] .page-header .actions {
          justify-content: flex-end !important;
          direction: rtl !important;
        }
        

        [dir="rtl"] .page-header .flex-row-reverse {
          flex-direction: row-reverse !important;
        }
        
        [dir="rtl"] .page-header .flex-row-reverse .actions {
          order: 1 !important;
        }
        
        [dir="rtl"] .page-header .flex-row-reverse > div:first-child {
          order: 2 !important;
        }
        

        [dir="rtl"] .page-header div[class*="flex"] {
          flex-direction: row-reverse !important;
        }
        
        [dir="rtl"] .page-header div[class*="actions"] {
          order: 1 !important;
          margin-left: 0 !important;
          margin-right: auto !important;
        }
        
        [dir="rtl"] .page-header div[class*="flex"] > div:not([class*="actions"]) {
          order: 2 !important;
        }
        

        [dir="rtl"] .page-header button {
          margin-left: 0 !important;
          margin-right: auto !important;
        }
        

        [dir="rtl"] .page-header * {
          direction: rtl !important;
        }
        

        [dir="rtl"] .page-header .actions {
          position: absolute !important;
          left: 0 !important;
          right: auto !important;
          margin-left: 0 !important;
          margin-right: 0 !important;
        }
        
        [dir="rtl"] .page-header .actions button {
          margin-left: 0 !important;
          margin-right: 0 !important;
        }
        

        [dir="rtl"] .page-header > div {
          position: relative !important;
        }
        

        [dir="rtl"] .card-title {
          text-align: right !important;
          direction: rtl !important;
        }
        
        [dir="rtl"] .card-title .flex {
          justify-content: flex-end !important;
          direction: rtl !important;
        }
        
        [dir="rtl"] .card-title span {
          text-align: right !important;
          direction: rtl !important;
        }
        

        [dir="rtl"] .card-title .flex-row-reverse {
          flex-direction: row-reverse !important;
        }
        
        [dir="rtl"] .card-title .flex-row-reverse > div:last-child {
          order: 1 !important;
        }
        
        [dir="rtl"] .card-title .flex-row-reverse > span:first-child {
          order: 2 !important;
        }
        

        [dir="rtl"] .persona-card h3 {
          text-align: right !important;
          direction: rtl !important;
        }
        
        [dir="rtl"] .persona-card p {
          text-align: right !important;
          direction: rtl !important;
        }
        
        [dir="rtl"] .persona-card .text-right {
          text-align: right !important;
          direction: rtl !important;
        }
        
        [dir="rtl"] .persona-card [data-radix-badge] {
          text-align: right !important;
          direction: rtl !important;
        }
        

        [dir="rtl"] .persona-card .flex-row-reverse {
          flex-direction: row-reverse !important;
        }
        
        [dir="rtl"] .persona-card .order-1 {
          order: 1 !important;
        }
        
        [dir="rtl"] .persona-card .order-2 {
          order: 2 !important;
        }


        [lang="he"] {
          font-family: 'Segoe UI', Tahoma, Arial, 'Noto Sans Hebrew', sans-serif;
        }
        
        [dir="rtl"] .text-right {
          text-align: right;
        }
        
        [dir="rtl"] .text-left {
          text-align: left;
        }


        .safe-area-inset-bottom {
          padding-bottom: 1.25rem;
          padding-bottom: calc(1.25rem + env(safe-area-inset-bottom));
          padding-bottom: calc(1.25rem + constant(safe-area-inset-bottom));
        }

        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom);
        }


        .touch-manipulation {
          touch-action: manipulation;
        }


        @media (max-width: 1024px) {
          .bottom-nav-padding {
            padding-bottom: calc(88px + env(safe-area-inset-bottom));
          }
        }


        @media (max-width: 640px) {
          .mobile-padding {
            padding-left: 1rem;
            padding-right: 1rem;
          }
        }


        @media (max-width: 768px) {
          .mobile-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
        }

        @media (min-width: 769px) and (max-width: 1024px) {
          .tablet-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1.5rem;
          }
        }

        .page-loading-state {
          min-height: calc(100vh - var(--mobile-header-height) - var(--mobile-bottom-nav-height));
        }

        @media (min-width: 1024px) {
          :root {
            --mobile-header-height: 0px;
            --mobile-bottom-nav-height: 0px;
          }

          .page-loading-state {
            min-height: 100vh;
          }
        }
      `}</style>
      
      <SidebarProvider>
        <div className={`flex w-full ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Sidebar side={isRTL ? "right" : "left"} className={`w-[280px] border-white/20 glass-morphism sidebar ${isRTL ? 'order-1' : 'order-1'} touch-optimized hidden xl:flex`}>
            <SidebarHeader className="border-b border-white/10 p-6 sidebar-header">
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse justify-end text-right' : 'justify-start text-left'}`}>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <h2 className={`font-bold text-gray-900 text-lg ${isRTL ? 'text-right' : 'text-left'}`}>
                    Mole AI
                  </h2>
                  <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse justify-end' : 'justify-start'}`}>
                    <Sparkles className="w-3 h-3 text-sky-500" />
                    <p className={`text-xs text-sky-600 font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
                      {isHebrew ? 'מדידת מותג במנועי AI' : 'Brand measurement in AI engines'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className={`mt-4 flex ${isRTL ? 'justify-start' : 'justify-end'}`}>
                <div className="w-full">
                  <BusinessSwitcher triggerClassName="w-full" />
                </div>
              </div>
            </SidebarHeader>
            
            <SidebarContent className="p-2">
              <SidebarGroup>
                <SidebarGroupLabel className={`text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('nav.platform')}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1">
                    {navigationItems.map((item) => (
                      <SidebarMenuItem key={item.title} className="sidebar-menu-item">
                        <SidebarMenuButton 
                          asChild 
                          className={`hover:bg-gradient-to-r hover:from-sky-500/10 hover:to-blue-500/10 hover:text-sky-700 transition-all duration-300 rounded-xl mb-1 group touch-optimized hover-optimized ${
                            location.pathname === item.url ? 'bg-gradient-to-r from-sky-500/15 to-blue-500/15 text-sky-700 shadow-sm' : ''
                          }`}
                        >
                          <Link 
                            to={item.url} 
                            className={`flex w-full items-center gap-4 px-6 py-5 ${isRTL ? 'flex-row-reverse text-right justify-end' : 'justify-start'}`}
                            style={isRTL ? { justifyContent: 'flex-end', textAlign: 'right', direction: 'rtl', flexDirection: 'row-reverse' } : {}}
                          >
                            {isRTL ? (
                              <>
                                <span 
                                  className={`font-semibold text-base ${isRTL ? 'text-right' : 'text-left'}`}
                                  style={isRTL ? { textAlign: 'right', direction: 'rtl' } : {}}
                                >
                                  {item.title}
                                </span>
                                <item.icon className={`w-6 h-6 transition-transform group-hover:scale-110 ${
                                  location.pathname === item.url ? 'text-sky-600' : 'text-gray-500'
                                }`} />
                              </>
                            ) : (
                              <>
                                <item.icon className={`w-6 h-6 transition-transform group-hover:scale-110 ${
                                  location.pathname === item.url ? 'text-sky-600' : 'text-gray-500'
                                }`} />
                                <span 
                                  className={`font-semibold text-base ${isRTL ? 'text-right' : 'text-left'}`}
                                  style={isRTL ? { textAlign: 'right', direction: 'rtl' } : {}}
                                >
                                  {item.title}
                                </span>
                              </>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t border-white/10 p-4">
              <div
                className={`flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-white/90 via-white/85 to-sky-50/60 shadow-sm border border-white/70 ${
                  isRTL ? 'flex-row-reverse justify-end' : 'justify-start'
                } ${location.pathname === profileNavItem.url ? 'ring-2 ring-sky-200' : ''}`}
                style={isRTL ? { justifyContent: 'flex-end', direction: 'rtl' } : {}}
              >
                <button
                  type="button"
                  onClick={handleProfileClick}
                  className={`flex flex-1 items-center gap-2 rounded-lg px-1 py-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                    isRTL ? 'flex-row-reverse text-right justify-end' : 'justify-start'
                  }`}
                  style={isRTL ? { justifyContent: 'flex-end', direction: 'rtl' } : {}}
                  title={t('nav.profile')}
                >
                  {isRTL ? (
                    <>
                      <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : 'text-left'}`}>
                        <p className={`font-semibold text-slate-900 text-sm ${isRTL ? 'text-right' : 'text-left'}`}>
                          {user?.displayName || (isHebrew ? 'חשבון משתמש' : 'User Account')}
                        </p>
                        <p className={`text-xs text-slate-500 truncate ${isRTL ? 'text-right' : 'text-left'}`}>
                          {user?.email || (isHebrew ? 'מודיעין מותגים' : 'Brand Intelligence')}
                        </p>
                      </div>
                      <div className="w-8 h-8 bg-gradient-to-r from-sky-500 to-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 bg-gradient-to-r from-sky-500 to-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : 'text-left'}`}>
                        <p className={`font-semibold text-slate-900 text-sm ${isRTL ? 'text-right' : 'text-left'}`}>
                          {user?.displayName || (isHebrew ? 'חשבון משתמש' : 'User Account')}
                        </p>
                        <p className={`text-xs text-slate-500 truncate ${isRTL ? 'text-right' : 'text-left'}`}>
                          {user?.email || (isHebrew ? 'מודיעין מותגים' : 'Brand Intelligence')}
                        </p>
                      </div>
                    </>
                  )}
                </button>
                <button
                  onClick={logout}
                  className={`p-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors group ${isRTL ? 'order-first' : ''}`}
                  title={isHebrew ? 'התנתקות' : 'Sign Out'}
                >
                  <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </SidebarFooter>
          </Sidebar>

          <main className={`flex-1 flex flex-col min-h-screen ${isRTL ? 'order-2' : 'order-2'}`}>
            <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 px-4 py-4 xl:hidden sticky top-0 z-50">
              <div className={`flex items-center justify-between gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>

                <div className={`flex-1 min-w-0 ${isRTL ? 'order-2' : 'order-1'}`}>
                  <BusinessSwitcher triggerClassName="w-full" contentClassName="min-w-[180px]" />
                </div>
                

                {user && (
                  <button
                    type="button"
                    onClick={handleProfileClick}
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${isRTL ? 'order-1' : 'order-2'}`}
                    aria-label={t('nav.profile')}
                  >
                    <span className="text-sm font-semibold">
                      {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </button>
                )}
              </div>
              

              <div className="mt-3">
                <h1 className={`text-lg font-semibold bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent truncate ${isRTL ? 'text-right' : 'text-left'}`}>
                  {mobileHeaderTitle}
                </h1>
                {mobileHeaderSubtitle && (
                  <p className={`text-xs text-slate-500 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {mobileHeaderSubtitle}
                  </p>
                )}
              </div>
            </header>

            <div className="flex-1 overflow-auto bottom-nav-padding lg:pb-0">
              {(() => {
                return React.cloneElement(children, { businessId: selectedBusinessId, refreshBusinessData });
              })()}
            </div>
          </main>
          
          <BottomNavigation />
        </div>
      </SidebarProvider>
      
      <CreateBusinessModal
        isOpen={isCreateBusinessModalOpen}
        onClose={() => setIsCreateBusinessModalOpen(false)}
        onBusinessCreated={handleBusinessCreated}
      />


      {deleteBusinessModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {isHebrew ? "מחיקת עסק" : "Delete Business"}
              </h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              {isHebrew 
                ? (
                  <>
                    האם אתה בטוח שברצונך למחוק את העסק "{deleteBusinessModal.businessName}"?<br></br>
                    <span className="font-semibold text-red-600">פעולה זו לא ניתנת לביטול.</span>
                  </>
                )
                : (
                  <>
                    Are you sure you want to delete the business "{deleteBusinessModal.businessName}"?<br></br>
                    <span className="font-semibold text-red-600">This action cannot be undone.</span>
                  </>
                )
              }
            </p>
            
            <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Button
                onClick={cancelDeleteBusiness}
                variant="outline"
                className="flex-1"
              >
                {isHebrew ? "ביטול" : "Cancel"}
              </Button>
              <Button
                onClick={confirmDeleteBusiness}
                variant="destructive"
                className="flex-1"
              >
                {isHebrew ? "מחק" : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Layout({ children, currentPageName, businessId }) {
  return (
    <LanguageProvider>
      <LayoutContent children={children} currentPageName={currentPageName} businessId={businessId} />
    </LanguageProvider>
  );
}
