import React, { useState, useRef, useEffect } from "react";
import { Persona } from "@/api/entities";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lordicon } from "@/components/ui/lordicon";
import { Sparkles, Wand2, X, CircleAlert } from "lucide-react";
import { useLanguage } from "@/components/common/LanguageProvider";

export default function GeneratePersonasModal({ 
  isOpen, 
  onClose, 
  onPersonasGenerated,
  businessId = null
}) {
  const { isRTL, isHebrew } = useLanguage();
  const [personaCount, setPersonaCount] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState(0);
  const sliderRef = useRef(null);

  const updateSliderValue = (clientX) => {
    if (!sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newValue = Math.round(1 + percentage * 4);
    setPersonaCount(Math.max(1, Math.min(5, newValue)));
  };

  const updateDragPosition = (clientX) => {
    if (!sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    setDragPosition(percentage);
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    updateDragPosition(e.clientX);
    updateSliderValue(e.clientX);
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      e.preventDefault();
      updateDragPosition(e.clientX);
    }
  };

  const handleMouseUp = (e) => {
    e.preventDefault();
    setIsDragging(false);
    // Final update to snap to discrete value
    if (sliderRef.current) {
      const rect = sliderRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      const newValue = Math.round(1 + percentage * 4);
      setPersonaCount(Math.max(1, Math.min(5, newValue)));
    }
  };

  const handleTrackClick = (e) => {
    if (!isDragging) {
      updateSliderValue(e.clientX);
    }
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    setIsDragging(true);
    const touch = e.touches[0];
    updateDragPosition(touch.clientX);
    updateSliderValue(touch.clientX);
  };

  const handleTouchMove = (e) => {
    if (isDragging) {
      e.preventDefault();
      const touch = e.touches[0];
      updateDragPosition(touch.clientX);
    }
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    setIsDragging(false);
    // Final update to snap to discrete value
    if (sliderRef.current && e.changedTouches[0]) {
      const rect = sliderRef.current.getBoundingClientRect();
      const x = e.changedTouches[0].clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      const newValue = Math.round(1 + percentage * 4);
      setPersonaCount(Math.max(1, Math.min(5, newValue)));
    }
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (isDragging) {
        e.preventDefault();
        updateDragPosition(e.clientX);
      }
    };

    const handleGlobalMouseUp = (e) => {
      if (isDragging) {
        e.preventDefault();
        setIsDragging(false);
        // Final update to snap to discrete value
        if (sliderRef.current) {
          const rect = sliderRef.current.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const percentage = Math.max(0, Math.min(1, x / rect.width));
          const newValue = Math.round(1 + percentage * 4);
          setPersonaCount(Math.max(1, Math.min(5, newValue)));
        }
      }
    };

    const handleGlobalTouchMove = (e) => {
      if (isDragging) {
        e.preventDefault();
        const touch = e.touches[0];
        updateDragPosition(touch.clientX);
      }
    };

    const handleGlobalTouchEnd = (e) => {
      if (isDragging) {
        e.preventDefault();
        setIsDragging(false);
        // Final update to snap to discrete value
        if (sliderRef.current && e.changedTouches[0]) {
          const rect = sliderRef.current.getBoundingClientRect();
          const x = e.changedTouches[0].clientX - rect.left;
          const percentage = Math.max(0, Math.min(1, x / rect.width));
          const newValue = Math.round(1 + percentage * 4);
          setPersonaCount(Math.max(1, Math.min(5, newValue)));
        }
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove, { passive: false });
      document.addEventListener('mouseup', handleGlobalMouseUp, { passive: false });
      document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
      document.addEventListener('touchend', handleGlobalTouchEnd, { passive: false });
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
        document.removeEventListener('touchmove', handleGlobalTouchMove);
        document.removeEventListener('touchend', handleGlobalTouchEnd);
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging]);

  const generatePersonas = async () => {
    setIsGenerating(true);
    setProgress(isHebrew ? `יוצר ${personaCount} אווטארים ב-AI...` : `Creating ${personaCount} AI avatars...`);
    setErrorMessage(""); // Clear any previous error messages
    
    try {
      // Use Firebase API to create AI personas
      await Persona.createAI(personaCount, businessId);
      
      setProgress(isHebrew ? `${personaCount} אווטארים נוצרו בהצלחה!` : `${personaCount} avatars created successfully!`);
      
      // Wait a moment to show success message, then close modal
      setTimeout(() => {
        onPersonasGenerated();
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error("Error generating personas:", error);
      let errorMessage = isHebrew ? "יצירת האווטארים נכשלה." : "Failed to generate avatars.";
      
      if (error.message && error.message.includes('parse')) {
        errorMessage = isHebrew 
          ? "שגיאה בעיבוד תגובת ה-AI. אנא ודא שפרופיל העסק שלך מלא עם שם עסק, תעשייה ומוצרים/שירותים. אנא נסה שוב."
          : "Error processing AI response. Please ensure your business profile is complete with business name, industry, and products/services. Please try again.";
      } else if (error.message && error.message.includes('not found')) {
        errorMessage = isHebrew 
          ? "פרופיל העסק לא נמצא. אנא צור פרופיל עסק תחילה."
          : "Business profile not found. Please create a business profile first.";
      }
      
      // Show error in a styled modal instead of browser alert
      setErrorMessage(errorMessage);
    }
    
    setIsGenerating(false);
    setProgress("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg sm:max-w-md min-h-[540px]" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex h-full min-h-[540px] flex-col">
          <DialogHeader className={`${isRTL ? 'flex-row-reverse text-right' : ''}`}>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl font-semibold text-slate-900">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600" />
              <span className="hidden sm:inline">
                {isHebrew ? "צור אווטארים ב-AI" : "Generate AI Avatars"}
              </span>
              <span className="sm:hidden">
                {isHebrew ? "צור אווטארים" : "Generate"}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 min-h-0">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-gradient-to-r from-sky-100 to-sky-200 rounded-full flex items-center justify-center mx-auto">
                <Wand2 className="w-8 h-8 text-sky-600" />
              </div>
              <p className={`text-gray-600 ${isRTL ? 'text-right' : ''}`}>
                {isHebrew 
                  ? "AI ינתח את הפרופיל העסקי שלך ויצור אווטארים מפורטים של לקוחות עם פרומפטים מותאמים."
                  : "AI will analyze your business profile and create detailed customer avatars with custom prompts."
                }
              </p>
            </div>

            <div className={isRTL ? 'text-right' : ''}>
              <Label className="text-sm font-medium text-slate-700 mb-4 block">
                {isHebrew ? "מספר אווטארים ליצור" : "Number of Avatars to Generate"}
              </Label>
              
              {/* Slider Container */}
              <div className="relative">
                {/* Slider Track */}
                <div 
                  ref={sliderRef}
                  className="relative h-2 bg-slate-200 rounded-full cursor-pointer"
                  onClick={handleTrackClick}
                >
                  {/* Active Track */}
                  <div 
                    className="absolute top-0 h-2 bg-slate-900 rounded-full transition-all duration-200"
                    style={{ 
                      left: '0%', 
                      width: isDragging ? `${dragPosition * 100}%` : `${((personaCount - 1) / 4) * 100}%` 
                    }}
                  />
                  
                  {/* Slider Handle */}
                  <div
                    className={`absolute top-1/2 w-6 h-6 bg-white border-2 border-slate-900 rounded-full shadow-lg transform -translate-y-1/2 cursor-pointer transition-all duration-200 hover:scale-110 ${isDragging ? 'scale-110' : ''}`}
                    style={{ 
                      left: isDragging ? `${dragPosition * 100}%` : `${((personaCount - 1) / 4) * 100}%`, 
                      transform: 'translateX(-50%) translateY(-50%)' 
                    }}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                  />
                </div>
                
                {/* Labels */}
                <div className="flex justify-between mt-4 text-xs text-slate-500">
                  <span className="text-center">1</span>
                  <span className="text-center">2</span>
                  <span className="text-center">3</span>
                  <span className="text-center">4</span>
                  <span className="text-center">5</span>
                </div>
              </div>
              
              {/* Current Value Display */}
              <div className="mt-4 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-100 rounded-full">
                  <span className="text-lg font-semibold text-slate-900">{personaCount}</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {isHebrew
                    ? `נבחרו ${personaCount} אווטארים` 
                    : `${personaCount} avatar${personaCount > 1 ? 's' : ''} selected`}
                </p>
              </div>
            </div>

            {progress && (
              <div className="text-center space-y-2">
                <Lordicon size="default" variant="primary" className="mx-auto" />
                <p className={`text-sm text-gray-600 ${isRTL ? 'text-right' : ''}`}>{progress}</p>
              </div>
            )}
          </div>

          <DialogFooter className={`${isRTL ? 'flex-row-reverse text-right' : ''}`}>
            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost"
                className={`h-12 sm:h-12 px-4 sm:px-6 text-base text-slate-500 hover:text-slate-700 flex-1 sm:flex-none ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <X className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {isHebrew ? "סגור" : "Close"}
              </Button>
            </DialogClose>
            <Button
              onClick={generatePersonas}
              disabled={isGenerating}
              className={`flex-1 sm:min-w-[160px] h-12 sm:h-12 px-4 sm:px-6 text-base font-semibold bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              {isGenerating ? (
                <>
                  <Lordicon size="sm" variant="white" className={isRTL ? 'ml-2' : 'mr-2'} />
                  {isHebrew ? 'יוצר...' : 'Generating...'}
                </>
              ) : (
                <>
                  <Sparkles className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {isHebrew ? 'צור אווטארים' : 'Generate Avatars'}
                </>
              )}
            </Button>
          </DialogFooter>
          
          {/* Error Message */}
          {errorMessage && (
            <div className="px-6 pb-4">
              <div className={`flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg ${isRTL ? 'text-right' : ''}`}>
                <CircleAlert className="w-5 h-5 text-red-600 flex-shrink-0" />
                <span className="text-red-800 text-sm">{errorMessage}</span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
