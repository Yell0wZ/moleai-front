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

// Utility function to highlight text
const highlightText = (text, brandName, competitors) => {
  if (!text || (!brandName && (!competitors || competitors.length === 0))) {
    return <span>{text}</span>;
  }

  let highlightedText = text;
  const parts = [];
  let lastIndex = 0;

  // Create a regex pattern for all terms to highlight
  const termsToHighlight = [];

  if (brandName && brandName.trim()) {
    termsToHighlight.push({
      term: brandName.trim(),
      type: 'brand'
    });
  }

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

  if (termsToHighlight.length === 0) {
    return <span>{text}</span>;
  }

  // Sort by length (descending) to match longer terms first
  termsToHighlight.sort((a, b) => b.term.length - a.term.length);

  // Create regex pattern
  const pattern = termsToHighlight
    .map(({ term }) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');

  const regex = new RegExp(`(${pattern})`, 'gi');
  const matches = [...text.matchAll(regex)];

  if (matches.length === 0) {
    return <span>{text}</span>;
  }

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

    // Determine highlight type
    const matchedTerm = termsToHighlight.find(({ term }) =>
      term.toLowerCase() === matchText.toLowerCase()
    );

    const highlightClass = matchedTerm?.type === 'brand'
      ? 'bg-green-200 text-green-800 px-1 rounded'
      : 'bg-red-200 text-red-800 px-1 rounded';

    // Add highlighted match
    parts.push(
      <span key={`highlight-${index}`} className={highlightClass}>
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

  return <span>{parts}</span>;
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

          setBusinessProfile({
            business_name: businessData?.business_name || businessData?.businessName || "",
            competitors
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
          {/* Prompt Info */}
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
                <div className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {highlightText(
                    prompt.prompt,
                    businessProfile?.business_name,
                    businessProfile?.competitors
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mentions Summary */}
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
                <div className="bg-sky-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-sky-600">
                    {prompt.industryMentions || 0}
                  </div>
                  <div className={`text-sm text-sky-700 ${isRTL ? 'text-right' : ''}`}>
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

          {/* AI Responses */}
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
                    <div className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                      {response ?
                        highlightText(
                          response,
                          businessProfile?.business_name,
                          businessProfile?.competitors
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