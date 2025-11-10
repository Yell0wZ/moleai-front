import React, { useState } from "react";
import { Prompt } from "@/api/entities";
import { BusinessProfile } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField, ValidatedTextarea, ValidatedSelect } from "@/components/ui/FormField";
import { Lordicon } from "@/components/ui/lordicon";
import { Send, User, MessageSquare, AlertTriangle, Crown, Clock, X } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/common/LanguageProvider";
import { useFormValidation } from "@/hooks/useFormValidation";

export default function SendPromptModal({ isOpen, onClose, onPromptSent, personas, businessId = null }) {
  const { isRTL, isHebrew, t } = useLanguage();
  const [selectedPersona, setSelectedPersona] = useState("");
  const [promptText, setPromptText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showLimitError, setShowLimitError] = useState(false);
  
  // Debug log to see personas data
  const { 
    errors, 
    clearErrors, 
    clearFieldError, 
    validateFields, 
    getFieldError 
  } = useFormValidation();

  const handlePersonaChange = (personaId) => {
    setSelectedPersona(personaId);
    clearFieldError('selectedPersona');
    const persona = personas.find(p => p.id === personaId);
    
    // Try multiple possible field names for the prompt template
    const promptTemplate = persona?.prompt_template || persona?.aiPrompt || persona?.ai_prompt || persona?.prompt;
    
    if (promptTemplate) {
      setPromptText(promptTemplate);
    } else {
    }
  };

  const handlePromptTextChange = (value) => {
    setPromptText(value);
    clearFieldError('promptText');
  };

  const handleClose = () => {
    setShowLimitError(false);
    onClose();
  };

  const sendPrompt = async () => {
    // Clear previous errors
    clearErrors();
    
    // Validate required fields
    const isValid = validateFields({
      selectedPersona: { 
        value: selectedPersona, 
        required: true,
        customMessage: t('validation.personaSelectionRequired')
      },
      promptText: { 
        value: promptText, 
        required: true,
        customMessage: t('validation.promptTextRequired')
      }
    });
    
    // If there are validation errors, return
    if (!isValid) {
      return;
    }

    setIsSending(true);
    
    try {
      const persona = personas.find(p => p.id === selectedPersona);
      
      // Create the AI prompt using Firebase API
      const promptData = {
        prompt: promptText,
        personaId: selectedPersona,
        models: ["openai", "claude", "perplexity", "gemini"]
      };

      const promptRecord = await Prompt.create(promptData, businessId);

      onPromptSent(promptRecord);
      
    } catch (error) {
      console.error("Error sending prompt:", error);
      
      // Check if it's a monthly limit error
      const errorMessage = error.message || '';
      if (errorMessage.includes("monthly prompt limit") || 
          errorMessage.includes("You have reached your monthly prompt limit") ||
          errorMessage.includes("upgrade your plan")) {
        setShowLimitError(true);
      } else {
        alert(t('errors.aiProcessingFailed'));
      }
    }
    
    setIsSending(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="lg:max-w-2xl" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="flex h-full min-h-0 flex-col relative">
            <DialogHeader className={`${isRTL ? 'flex-row-reverse text-right' : ''} ${isHebrew ? 'justify-end' : ''}`}>
              <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl font-semibold text-slate-900">
                {isHebrew ? (
                  <>
                    <span className="hidden sm:inline">
                      שלח פרומפט לכלי AI
                    </span>
                    <span className="sm:hidden">
                      שלח פרומפט
                    </span>
                    <Send className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    <span className="hidden sm:inline">
                      Send Prompt to AI Tools
                    </span>
                    <span className="sm:hidden">
                      Send Prompt
                    </span>
                  </>
                )}
              </DialogTitle>
            </DialogHeader>
          
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 min-h-0">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-gradient-to-r from-sky-100 to-sky-200 rounded-full flex items-center justify-center mx-auto">
                <MessageSquare className="w-8 h-8 text-blue-600" />
              </div>
              <p className={`text-gray-600 ${isRTL ? 'text-right' : ''}`}>
                {isHebrew 
                  ? "שלח פרומפט מנקודת מבט של אווטאר למספר כלי AI וניתח את התגובות שלהם."
                  : "Send a prompt from an avatar's perspective to multiple AI tools and analyze their responses."
                }
              </p>
            </div>

            <FormField error={getFieldError('selectedPersona')} isRTL={isRTL}>
              <Label htmlFor="persona" className={isRTL ? 'text-right' : ''}>
                {isHebrew ? "בחר אווטאר *" : "Select Avatar *"}
              </Label>
              <Select value={selectedPersona} onValueChange={handlePersonaChange}>
                <SelectTrigger className={`mt-1 ${isRTL ? 'text-right' : ''} ${isHebrew ? 'justify-end' : ''} ${isHebrew ? '[&>svg]:order-first [&>svg]:ml-0 [&>svg]:mr-auto' : ''} ${getFieldError('selectedPersona') ? 'border-red-500 focus:border-red-500 focus:ring-red-500 ring-red-500' : ''}`}>
                  <SelectValue placeholder={isHebrew ? "בחר אווטאר" : "Choose an avatar"} />
                </SelectTrigger>
                <SelectContent>
                  {personas.map((persona) => {
                    return (
                      <SelectItem key={persona.id} value={persona.id} className={isHebrew ? '!justify-end' : ''}>
                        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''} ${isHebrew ? '!justify-end' : ''}`}>
                          <User className="w-4 h-4" />
                          <span className={`font-medium ${isHebrew ? 'text-right' : ''}`}>
                            {persona.name}
                            {(persona.job_title || persona.jobTitle) && ` - ${persona.job_title || persona.jobTitle}`}
                            {!persona.job_title && !persona.jobTitle && ' (No job title)'}
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </FormField>

            <FormField error={getFieldError('promptText')} isRTL={isRTL}>
              <Label htmlFor="promptText" className={isRTL ? 'text-right' : ''}>
                {isHebrew ? "טקסט הפרומפט *" : "Prompt Text *"}
              </Label>
              <ValidatedTextarea
                id="promptText"
                value={promptText}
                onChange={(e) => handlePromptTextChange(e.target.value)}
                placeholder={isHebrew 
                  ? "...AI הכנס את הפרומפט לשליחה לכלי"
                  : "Enter the prompt to send to AI tools..."
                }
                rows={8}
                error={getFieldError('promptText')}
                isRTL={isRTL}
                dir="auto"
              />
            </FormField>

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
                onClick={sendPrompt}
                disabled={isSending || !selectedPersona || !promptText.trim()}
                className={`flex-1 sm:min-w-[180px] h-12 sm:h-12 px-4 sm:px-6 text-base font-semibold bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                {isSending ? (
                  <>
                    <Lordicon size="sm" variant="white" className={isRTL ? 'ml-2' : 'mr-2'} />
                    {isHebrew ? "שולח לכלי AI..." : "Sending to AI Tools..."}
                  </>
                ) : (
                  <>
                    <Send className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {isHebrew ? "שלח פרומפט" : "Send Prompt"}
                  </>
                )}
              </Button>
            </DialogFooter>


            {isSending && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-50 rounded-3xl">
                <div className="text-center space-y-4 p-6">
                  <Lordicon size="lg" variant="primary" />
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {isHebrew ? "שולח לכלי AI..." : "Sending to AI Tools..."}
                    </h3>
                    <div className="max-w-md mx-auto">
                      <p className="text-sm text-slate-600 mb-2">
                        {isHebrew ? "הפרומפט שלך:" : "Your prompt:"}
                      </p>
                      <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-800 border">
                        "{promptText}"
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>


      <Dialog open={showLimitError} onOpenChange={setShowLimitError}>
        <DialogContent className="lg:max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="flex h-full min-h-0 flex-col">
            <DialogHeader className={`${isRTL ? 'flex-row-reverse text-right' : ''}`}>
              <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl font-semibold text-slate-900">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                <span className="hidden sm:inline">
                  {isHebrew ? "הגעת למגבלה החודשית" : "Monthly Limit Reached"}
                </span>
                <span className="sm:hidden">
                  {isHebrew ? "מגבלה" : "Limit"}
                </span>
              </DialogTitle>
            </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 min-h-0">

            <motion.div 
              className="text-center space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div 
                className="w-20 h-20 bg-gradient-to-br from-sky-100 to-sky-200 rounded-full flex items-center justify-center mx-auto"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <AlertTriangle className="w-10 h-10 text-amber-600" />
              </motion.div>
              
              <div className="space-y-2">
                <h3 className={`text-lg font-semibold text-gray-900 ${isRTL ? 'text-right' : ''}`}>
                  {isHebrew ? "הגעת למגבלת הפרומפטים החודשית" : "You've reached your monthly prompt limit"}
                </h3>
                <p className={`text-gray-600 text-sm ${isRTL ? 'text-right' : ''}`}>
                  {isHebrew 
                    ? "השתמשת בכל הפרומפטים החודשיים שלך. שדרג את התוכנית שלך או המתן לחודש הבא."
                    : "You've used all your monthly prompts. Upgrade your plan or wait for next month."
                  }
                </p>
              </div>
            </motion.div>


            <motion.div 
              className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${isRTL ? 'text-right' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MessageSquare className="w-3 h-3 text-blue-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-900">
                    {isHebrew ? "טיפ:" : "Tip:"}
                  </p>
                  <p className="text-xs text-blue-700">
                    {isHebrew 
                      ? "תוכניות משודרגות כוללות יותר פרומפטים חודשיים ותכונות מתקדמות."
                      : "Upgraded plans include more monthly prompts and advanced features."
                    }
                  </p>
                </div>
              </div>
            </motion.div>
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
              onClick={() => {
                setShowLimitError(false);
                window.open('#upgrade', '_blank');
              }}
              className={`flex-1 sm:min-w-[160px] h-12 sm:h-12 px-4 sm:px-6 text-base font-semibold bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <Crown className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {isHebrew ? "שדרג עכשיו" : "Upgrade Now"}
            </Button>
            <Button
              onClick={() => setShowLimitError(false)}
              variant="outline"
              className={`flex-1 sm:min-w-[140px] h-12 sm:h-12 px-4 sm:px-6 text-base ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <Clock className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {isHebrew ? "המתן לחודש הבא" : "Wait for Next Month"}
            </Button>
          </DialogFooter>
        </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
