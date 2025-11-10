import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, MessageSquare, TrendingUp, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/components/common/LanguageProvider";
import { db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";

const aiToolColors = {
  chatgpt: "bg-green-100 text-green-800 border-green-200",
  claude: "bg-orange-100 text-orange-800 border-orange-200",
  perplexity: "bg-blue-100 text-blue-800 border-blue-200",
  grok: "bg-sky-100 text-sky-800 border-sky-200",
  gemini: "bg-yellow-100 text-yellow-800 border-yellow-200"
};

// Utility function to highlight text with different mention types
const highlightText = (text, brandName, competitors, industry, productsServices) => {
  if (!text) {
    return <span>{text}</span>;
  }

  const parts = [];
  let lastIndex = 0;

  // Create a regex pattern for all terms to highlight
  const termsToHighlight = [];

  // Business Mentions (blue)
  if (brandName && brandName.trim()) {
    termsToHighlight.push({
      term: brandName.trim(),
      type: 'business'
    });
  }

  // Competitor Mentions (green)
  if (competitors && competitors.length > 0) {
    competitors.forEach(competitor => {
      // Handle both string and object formats
      const competitorName = typeof competitor === 'string' ? competitor : competitor?.name;
      if (competitorName && typeof competitorName === 'string' && competitorName.trim()) {
        termsToHighlight.push({
          term: competitorName.trim(),
          type: 'competitor'
        });
      }
    });
  }

  // Industry Mentions (purple)
  if (industry && industry.trim()) {
    termsToHighlight.push({
      term: industry.trim(),
      type: 'industry'
    });
  }

  // Products/Services Mentions (orange)
  if (productsServices && productsServices.length > 0) {
    productsServices.forEach(productService => {
      const psName = typeof productService === 'string' ? productService : productService?.name;
      if (psName && typeof psName === 'string' && psName.trim()) {
        termsToHighlight.push({
          term: psName.trim(),
          type: 'products'
        });
      }
    });
  }

  if (termsToHighlight.length === 0) {
    return <span>{text}</span>;
  }

  // Sort by length (descending) to match longer terms first
  termsToHighlight.sort((a, b) => b.term.length - a.term.length);

  // Helper function to normalize text for comparison (handles Hebrew and English)
  const normalizeText = (str) => {
    if (!str) return '';
    // Remove diacritics/nikud for Hebrew and normalize Unicode
    return str
      .normalize('NFD')
      .replace(/[\u0591-\u05C7]/g, '') // Remove Hebrew niqqud
      .normalize('NFC')
      .toLowerCase()
      .trim();
  };

  // Create regex pattern with Unicode support for Hebrew
  const pattern = termsToHighlight
    .map(({ term }) => {
      // Escape special regex characters
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return escaped;
    })
    .join('|');

  // Use Unicode flag (u) for Hebrew support and case insensitive (i) flag
  // Also use word boundaries for better matching but allow partial matches for Hebrew
  let regex;
  try {
    regex = new RegExp(`(${pattern})`, 'giu');
  } catch (e) {
    // If regex fails, return text without highlighting
    console.warn('Regex pattern error:', pattern);
    return <span dir="auto">{text}</span>;
  }
  
  const matches = [];
  try {
    // Try to get all matches
    const allMatches = text.matchAll(regex);
    for (const match of allMatches) {
      matches.push(match);
    }
  } catch (e) {
    console.warn('Error matching text:', e);
  }

  // If no matches found, try word-based matching for Hebrew/Unicode text
  if (matches.length === 0 && termsToHighlight.length > 0) {
    // For Hebrew/Unicode text, try to find matches by searching character by character
    termsToHighlight.forEach(({ term, type }) => {
      // First try exact match (case sensitive)
      let searchIndex = 0;
      while ((searchIndex = text.indexOf(term, searchIndex)) !== -1) {
        const exists = matches.some(m => m.index === searchIndex && m[0] === term);
        if (!exists) {
          matches.push({
            0: term,
            index: searchIndex,
            type: type // Store type for easier matching later
          });
        }
        searchIndex += term.length;
      }
      
      // Then try case-insensitive match
      const lowerTerm = term.toLowerCase();
      const lowerText = text.toLowerCase();
      searchIndex = 0;
      while ((searchIndex = lowerText.indexOf(lowerTerm, searchIndex)) !== -1) {
        const exists = matches.some(m => m.index === searchIndex);
        if (!exists) {
          // Get the actual text slice
          const actualSlice = text.slice(searchIndex, searchIndex + term.length);
          matches.push({
            0: actualSlice,
            index: searchIndex,
            type: type
          });
        }
        searchIndex += lowerTerm.length;
      }
      
      // Finally try normalized matching for Hebrew
      const normalizedTerm = normalizeText(term);
      if (normalizedTerm && normalizedTerm.length > 0) {
        // Search through text character by character with sliding window
        for (let i = 0; i <= text.length - term.length; i++) {
          const window = text.slice(i, i + term.length + 5); // Add some buffer
          const normalizedWindow = normalizeText(window);
          
          if (normalizedWindow.startsWith(normalizedTerm)) {
            const exists = matches.some(m => m.index === i && m[0] === term);
            if (!exists) {
              const actualSlice = text.slice(i, i + term.length);
              matches.push({
                0: actualSlice,
                index: i,
                type: type
              });
              i += term.length - 1; // Skip ahead to avoid overlapping matches
            }
          }
        }
      }
    });
  }

  if (matches.length === 0) {
    return <span dir="auto">{text}</span>;
  }
  
  // Sort matches by index
  matches.sort((a, b) => a.index - b.index);

  matches.forEach((match, index) => {
    const matchText = match[0];
    const matchIndex = match.index;

    // Add text before match
    if (matchIndex > lastIndex) {
      parts.push(
        <span key={`text-${index}`}>
          {text.slice(lastIndex, matchIndex)}
        </span>
      );
    }

    // Determine highlight type and color - use normalized comparison for Hebrew
    let matchedTerm;
    
    // First check if match has type stored (from fallback matching)
    if (match.type) {
      matchedTerm = termsToHighlight.find(({ type: t }) => t === match.type);
    }
    
    // If not found, try matching by text
    if (!matchedTerm) {
      const normalizedMatchText = normalizeText(matchText);
      matchedTerm = termsToHighlight.find(({ term }) => {
        const normalizedTerm = normalizeText(term);
        // Check both exact match and normalized match for Hebrew
        return normalizedTerm === normalizedMatchText || 
               term.toLowerCase() === matchText.toLowerCase() ||
               term === matchText ||
               matchText.includes(term) ||
               term.includes(matchText);
      });
    }

    let highlightClass = '';
    switch (matchedTerm?.type) {
      case 'business':
        highlightClass = 'bg-blue-200 text-blue-800 px-1 rounded font-medium';
        break;
      case 'competitor':
        highlightClass = 'bg-green-200 text-green-800 px-1 rounded font-medium';
        break;
      case 'industry':
        highlightClass = 'bg-purple-200 text-purple-800 px-1 rounded font-medium';
        break;
      case 'products':
        highlightClass = 'bg-orange-200 text-orange-800 px-1 rounded font-medium';
        break;
      default:
        highlightClass = 'bg-gray-200 text-gray-800 px-1 rounded';
    }

    // Add highlighted match with RTL support
    parts.push(
      <span 
        key={`highlight-${index}`} 
        className={highlightClass}
        dir="auto"
      >
        {matchText}
      </span>
    );

    lastIndex = matchIndex + matchText.length;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(
      <span key="text-end">
        {text.slice(lastIndex)}
      </span>
    );
  }

  return <span dir="auto">{parts}</span>;
};

export default function PromptResponseModal({ isOpen, onClose, prompt }) {
  if (prompt?.responses) {
    Object.entries(prompt.responses).forEach(([key, value]) => {
    });
  }
  const { user } = useAuth();
  const { t, isRTL, isHebrew } = useLanguage();
  const [businessProfile, setBusinessProfile] = useState(null);

  useEffect(() => {
    const loadBusinessProfile = async () => {
      if (!user?.uid) return;

      try {
        const clientDocRef = doc(db, "clients", user.uid);
        const snapshot = await getDoc(clientDocRef);

        if (snapshot.exists()) {
          const rawData = snapshot.data();
          const businessData = rawData?.businessProfile || rawData?.business_profile || rawData;

          const competitors = Array.isArray(businessData?.competitors)
            ? businessData.competitors
            : typeof businessData?.competitors === "string"
              ? businessData.competitors.split(",").map(item => item.trim()).filter(Boolean)
              : [];

          const productsServices = Array.isArray(businessData?.products_services)
            ? businessData.products_services
            : typeof businessData?.products_services === "string"
              ? businessData.products_services.split(",").map(item => item.trim()).filter(Boolean)
              : Array.isArray(businessData?.productsServices)
                ? businessData.productsServices
                : typeof businessData?.productsServices === "string"
                  ? businessData.productsServices.split(",").map(item => item.trim()).filter(Boolean)
                  : [];

          setBusinessProfile({
            business_name: businessData?.business_name || businessData?.businessName || "",
            competitors,
            industry: businessData?.industry || "",
            products_services: productsServices
          });
        }
      } catch (error) {
        console.error("Error loading business profile:", error);
      }
    };

    if (isOpen) {
      loadBusinessProfile();
    }
  }, [isOpen, user?.uid]);

  if (!prompt) return null;


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl lg:max-w-6xl max-h-[90vh]">
        <div className="flex h-full min-h-0 flex-col">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 text-lg sm:text-xl font-semibold text-slate-900 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              <span className="hidden sm:inline">
                {isHebrew ? "ניתוח תגובות AI" : "AI Responses Analysis"}
              </span>
              <span className="sm:hidden">
                {isHebrew ? "תגובות" : "Responses"}
              </span>
            </DialogTitle>
          </DialogHeader>
        
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 min-h-0">

          <Card>
            <CardHeader>
              <CardTitle className={`text-lg ${isRTL ? 'text-right' : ''}`}>
                {isHebrew ? "פרומפט מקורי" : "Original Prompt"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{prompt.personaName}</Badge>
                </div>
                <div className={`text-gray-700 bg-gray-50 p-4 rounded-lg ${isRTL ? 'text-right' : ''}`} dir="auto">
                  {highlightText(
                    prompt.prompt,
                    businessProfile?.business_name,
                    businessProfile?.competitors,
                    businessProfile?.industry,
                    businessProfile?.products_services
                  )}
                </div>
              </div>
            </CardContent>
          </Card>


          <Card>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                <TrendingUp className="w-5 h-5" />
                {isHebrew ? "סיכום אזכורים" : "Mentions Summary"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {prompt.businessNameMentions || 0}
                  </div>
                  <div className={`text-sm text-blue-700 ${isRTL ? 'text-right' : ''}`}>
                    {isHebrew ? "אזכורי עסק" : "Business Mentions"}
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {prompt.competitorsMentions || 0}
                  </div>
                  <div className={`text-sm text-green-700 ${isRTL ? 'text-right' : ''}`}>
                    {isHebrew ? "אזכורי מתחרים" : "Competitor Mentions"}
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {prompt.industryMentions || 0}
                  </div>
                  <div className={`text-sm text-purple-700 ${isRTL ? 'text-right' : ''}`}>
                    {isHebrew ? "אזכורי תעשייה" : "Industry Mentions"}
                  </div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {prompt.productsServicesMentions || 0}
                  </div>
                  <div className={`text-sm text-orange-700 ${isRTL ? 'text-right' : ''}`}>
                    {isHebrew ? "אזכורי מוצרים/שירותים" : "Products/Services Mentions"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>


          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {prompt.responses && Object.entries(prompt.responses).map(([aiTool, response]) => (
              <Card key={aiTool} className="h-fit">
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <MessageSquare className="w-5 h-5" />
                    <Badge className={aiToolColors[aiTool]}>
                      {aiTool.charAt(0).toUpperCase() + aiTool.slice(1)}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg max-h-80 overflow-y-auto">
                    <div className={`text-gray-700 whitespace-pre-wrap text-sm leading-relaxed ${isRTL ? 'text-right' : ''}`} dir="auto">
                      {response ?
                        highlightText(
                          response,
                          businessProfile?.business_name,
                          businessProfile?.competitors,
                          businessProfile?.industry,
                          businessProfile?.products_services
                        ) :
                        isHebrew ? "אין תגובה זמינה" : "No response available"
                      }
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                {isHebrew ? "סגור" : "Close"}
              </Button>
            </DialogClose>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}