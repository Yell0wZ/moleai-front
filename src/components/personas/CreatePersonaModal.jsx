import React, { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FormField, ValidatedInput, ValidatedTextarea } from "@/components/ui/FormField";
import { Lordicon } from "@/components/ui/lordicon";
import { Save, User, X } from "lucide-react";
import { useLanguage } from "@/components/common/LanguageProvider";
import { useFormValidation } from "@/hooks/useFormValidation";

export default function CreatePersonaModal({ 
  isOpen, 
  onClose, 
  onPersonaCreated, 
  editingPersona,
  businessId = null
}) {
  const { isRTL, isHebrew, t } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    job_title: "",
    lifestyle: "",
    goals: "",
    pain_points: "",
    motivations: "",
    purchasing_habits: "",
    backstory: "",
    avatar_url: "",
    is_ai_generated: false
  });
  const [isSaving, setIsSaving] = useState(false);
  const { 
    errors, 
    clearErrors, 
    clearFieldError, 
    validateFields, 
    getFieldError 
  } = useFormValidation();

  useEffect(() => {
    if (editingPersona) {
      // Normalize field names - handle both snake_case and camelCase
      setFormData({
        name: editingPersona.name || "",
        age: editingPersona.age || "",
        job_title: editingPersona.job_title || editingPersona.jobTitle || "",
        lifestyle: editingPersona.lifestyle || "",
        goals: editingPersona.goals || "",
        pain_points: editingPersona.pain_points || editingPersona.painPoints || "",
        motivations: editingPersona.motivations || "",
        purchasing_habits: editingPersona.purchasing_habits || editingPersona.purchasingHabits || "",
        backstory: editingPersona.backstory || "",
        avatar_url: editingPersona.avatar_url || "",
        is_ai_generated: editingPersona.is_ai_generated || editingPersona.isAiGenerated || false
      });
    } else {
      setFormData({
        name: "",
        age: "",
        job_title: "",
        lifestyle: "",
        goals: "",
        pain_points: "",
        motivations: "",
        purchasing_habits: "",
        backstory: "",
        avatar_url: "",
        is_ai_generated: false
      });
    }
  }, [editingPersona]);

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      return newData;
    });
    // Clear field error when user starts typing
    clearFieldError(field);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    clearErrors();
    
    // Validate required fields
    const isValid = validateFields({
      name: { 
        value: formData.name, 
        required: true,
        customMessage: t('validation.personaNameRequired')
      },
      job_title: { 
        value: formData.job_title, 
        required: true,
        customMessage: t('validation.personaRoleRequired')
      },
      age: { 
        value: formData.age, 
        age: true
      }
    });
    
    // If there are validation errors, return
    if (!isValid) {
      return;
    }
    
    setIsSaving(true);
    
    try {
      const personaData = {
        ...formData,
        age: parseInt(formData.age) || 0
      };

      if (editingPersona) {
        await Persona.update(editingPersona.id, personaData, businessId);
      } else {
        await Persona.create(personaData, businessId);
      }
      
      onPersonaCreated();
    } catch (error) {
      console.error("Error saving persona:", error);
      alert(t('errors.personaSaveFailed'));
    }
    
    setIsSaving(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="lg:max-w-3xl" dir={isRTL ? 'rtl' : 'ltr'}>
        <form onSubmit={handleSubmit} className="flex h-full min-h-0 flex-col">
          <DialogHeader className={`${isRTL ? 'flex-row-reverse text-right' : ''}`}>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl font-semibold text-slate-900">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              <span className="hidden sm:inline">
                {editingPersona ? 
                  (isHebrew ? 'ערוך אווטאר' : 'Edit Avatar') : 
                  (isHebrew ? 'צור אווטאר חדש' : 'Create New Avatar')
                }
              </span>
              <span className="sm:hidden">
                {editingPersona ? 
                  (isHebrew ? 'ערוך' : 'Edit') : 
                  (isHebrew ? 'צור' : 'Create')
                }
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5 min-h-0">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <FormField error={getFieldError('name')} isRTL={isRTL}>
                <Label htmlFor="name">{isHebrew ? 'שם *' : 'Name *'}</Label>
                <ValidatedInput
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder={isHebrew ? "למשל, שרה כהן" : "e.g., Sarah Johnson"}
                  error={getFieldError('name')}
                  isRTL={isRTL}
                  dir="auto"
                />
              </FormField>
              <FormField error={getFieldError('age')} isRTL={isRTL}>
                <Label htmlFor="age">{isHebrew ? 'גיל' : 'Age'}</Label>
                <ValidatedInput
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  placeholder={isHebrew ? "למשל, 32" : "e.g., 32"}
                  min="1"
                  max="100"
                  error={getFieldError('age')}
                  isRTL={isRTL}
                />
              </FormField>
            </div>

            <FormField error={getFieldError('job_title')} isRTL={isRTL}>
              <Label htmlFor="job_title">{isHebrew ? 'תפקיד *' : 'Job Title *'}</Label>
              <ValidatedInput
                id="job_title"
                value={formData.job_title || ''}
                onChange={(e) => handleInputChange('job_title', e.target.value)}
                placeholder={isHebrew ? "למשל, מנהלת שיווק" : "e.g., Marketing Manager"}
                error={getFieldError('job_title')}
                isRTL={isRTL}
                dir="auto"
              />
            </FormField>

            <div className={isRTL ? 'text-right' : ''}>
              <Label htmlFor="goals">{isHebrew ? 'מטרות ושאיפות' : 'Goals & Aspirations'}</Label>
              <Textarea
                id="goals"
                value={formData.goals || ''}
                onChange={(e) => handleInputChange('goals', e.target.value)}
                placeholder={isHebrew ? "מה האווטאר הזה רוצה להשיג?" : "What does this avatar want to achieve?"}
                rows={3}
                className={isRTL ? 'text-right' : ''}
                dir="auto"
              />
            </div>

            <div className={isRTL ? 'text-right' : ''}>
              <Label htmlFor="pain_points">{isHebrew ? 'נקודות כאב ואתגרים' : 'Pain Points & Challenges'}</Label>
              <Textarea
                id="pain_points"
                value={formData.pain_points || ''}
                onChange={(e) => handleInputChange('pain_points', e.target.value)}
                placeholder={isHebrew ? "עם אילו בעיות האווטאר הזה מתמודד?" : "What problems does this avatar face?"}
                rows={3}
                className={isRTL ? 'text-right' : ''}
                dir="auto"
              />
            </div>

            <div className={isRTL ? 'text-right' : ''}>
              <Label htmlFor="lifestyle">{isHebrew ? 'סגנון חיים' : 'Lifestyle'}</Label>
              <Textarea
                id="lifestyle"
                value={formData.lifestyle || ''}
                onChange={(e) => handleInputChange('lifestyle', e.target.value)}
                placeholder={isHebrew ? "תאר את החיים היומיומיים, ההרגלים וההעדפות" : "Describe their daily life, habits, and preferences"}
                rows={2}
                className={isRTL ? 'text-right' : ''}
                dir="auto"
              />
            </div>

            <div className={isRTL ? 'text-right' : ''}>
              <Label htmlFor="motivations">{isHebrew ? 'מניעים מרכזיים' : 'Key Motivations'}</Label>
              <Textarea
                id="motivations"
                value={formData.motivations || ''}
                onChange={(e) => handleInputChange('motivations', e.target.value)}
                placeholder={isHebrew ? "מה מניע את ההחלטות שלהם?" : "What drives their decisions?"}
                rows={2}
                className={isRTL ? 'text-right' : ''}
                dir="auto"
              />
            </div>

            <div className={isRTL ? 'text-right' : ''}>
              <Label htmlFor="purchasing_habits">{isHebrew ? 'הרגלי רכישה' : 'Purchasing Habits'}</Label>
              <Textarea
                id="purchasing_habits"
                value={formData.purchasing_habits || ''}
                onChange={(e) => handleInputChange('purchasing_habits', e.target.value)}
                placeholder={isHebrew ? "איך הם חוקרים וקונים מוצרים/שירותים?" : "How do they research and buy products/services?"}
                rows={2}
                className={isRTL ? 'text-right' : ''}
                dir="auto"
              />
            </div>

            <div className={isRTL ? 'text-right' : ''}>
              <Label htmlFor="backstory">{isHebrew ? 'רקע אישי' : 'Personal Backstory'}</Label>
              <Textarea
                id="backstory"
                value={formData.backstory || ''}
                onChange={(e) => handleInputChange('backstory', e.target.value)}
                placeholder={isHebrew ? "מידע רקע על האווטאר הזה" : "Background information about this avatar"}
                rows={2}
                className={isRTL ? 'text-right' : ''}
                dir="auto"
              />
            </div>
          </div>

          <DialogFooter className={`${isRTL ? 'flex-row-reverse text-right' : ''}`}>
            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost"
                className={`h-12 sm:h-12 px-4 sm:px-6 text-base text-slate-500 hover:text-slate-700 flex-1 sm:flex-none ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <X className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {isHebrew ? 'סגור' : 'Close'}
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isSaving}
              className={`flex-1 sm:min-w-[160px] h-12 sm:h-12 px-4 sm:px-6 text-base font-semibold bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              {isSaving ? (
                <>
                  <Lordicon size="sm" variant="white" className={isRTL ? 'ml-2' : 'mr-2'} />
                  {isHebrew ? 'שומר...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Save className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {editingPersona ?
                  (isHebrew ? 'עדכן אווטאר' : 'Update Avatar') :
                  (isHebrew ? 'צור אווטאר' : 'Create Avatar')
                }
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
