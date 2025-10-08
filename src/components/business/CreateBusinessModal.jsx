import React, { useState } from "react";
import { BusinessProfile } from "@/api/entities";
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
import { Building2, Plus, X, Save } from "lucide-react";
import { useLanguage } from "@/components/common/LanguageProvider";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/contexts/AuthContext";
import { useFormValidation } from "@/hooks/useFormValidation";

const INITIAL_FORM_DATA = {
  businessName: "",
  businessDescription: "",
  industry: "",
  targetMarket: "",
  productsServices: [],
  competitors: [],
};

export default function CreateBusinessModal({ 
  isOpen, 
  onClose, 
  onBusinessCreated 
}) {
  const { t, isRTL, isHebrew } = useLanguage();
  const { user } = useAuth();
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [newProduct, setNewProduct] = useState("");
  const [newCompetitor, setNewCompetitor] = useState("");
  const { 
    errors, 
    clearErrors, 
    clearFieldError, 
    validateFields, 
    getFieldError 
  } = useFormValidation();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errorMessage) setErrorMessage("");
    // Clear field error when user starts typing
    clearFieldError(field);
  };

  const addProduct = () => {
    if (newProduct.trim() && !formData.productsServices.includes(newProduct.trim())) {
      setFormData(prev => ({
        ...prev,
        productsServices: [...prev.productsServices, newProduct.trim()]
      }));
      setNewProduct("");
    }
  };

  const removeProduct = (productToRemove) => {
    setFormData(prev => ({
      ...prev,
      productsServices: prev.productsServices.filter(p => p !== productToRemove)
    }));
  };

  const addCompetitor = () => {
    if (newCompetitor.trim()) {
      const competitorExists = formData.competitors.some(c => c.name === newCompetitor.trim());
      if (!competitorExists) {
        setFormData(prev => ({
          ...prev,
          competitors: [...prev.competitors, { name: newCompetitor.trim() }]
        }));
        setNewCompetitor("");
      }
    }
  };

  const removeCompetitor = (competitorToRemove) => {
    setFormData(prev => ({
      ...prev,
      competitors: prev.competitors.filter(c => c.name !== competitorToRemove)
    }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    clearErrors();
    setErrorMessage("");
    
     // Validate required fields
     const isValid = validateFields({
       businessName: { 
         value: formData.businessName, 
         required: true,
         customMessage: t('business.businessNameRequired')
       },
       industry: { 
         value: formData.industry, 
         required: true,
         customMessage: t('business.industryRequired')
       },
       businessDescription: { 
         value: formData.businessDescription, 
         required: true,
         customMessage: t('business.descriptionRequired')
       },
       targetMarket: { 
         value: formData.targetMarket, 
         required: true,
         customMessage: t('business.targetMarketRequired')
       },
       productsServices: {
         value: formData.productsServices,
         required: true,
         minLength: 1,
         customMessage: t('business.productsServicesRequired')
       },
       competitors: {
         value: formData.competitors,
         required: true,
         minLength: 1,
         customMessage: t('business.competitorsRequired')
       }
     });
    
    // If there are validation errors, return
    if (!isValid) {
      setErrorMessage(t('business.pleaseFillRequiredFields') || "Please fill in all required fields");
      return;
    }

    if (!user) {
      setErrorMessage("You must be logged in to create a business");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      // Get Firebase ID token
      const token = await user.getIdToken();
      
      // Prepare data for Firebase Functions
      const businessData = {
        businessName: formData.businessName,
        businessDescription: formData.businessDescription,
        industry: formData.industry,
        targetMarket: formData.targetMarket,
        productsServices: formData.productsServices,
        competitors: formData.competitors.map(comp => ({
          name: comp.name,
          phone: "" // Add empty phone field as required by the API
        }))
      };

      // Call Firebase Functions endpoint
      const response = await fetch('https://createbuisness-thg3z73fma-uc.a.run.app/secondary-business', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(businessData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create business');
      }

      const result = await response.json();
      
      // Reset form
      setFormData(INITIAL_FORM_DATA);
      setNewProduct("");
      setNewCompetitor("");
      
      // Notify parent component
      if (onBusinessCreated) {
        onBusinessCreated(result.business);
      }
      
      // Close modal
      onClose();
      
    } catch (error) {
      console.error("Error creating business:", error);
      setErrorMessage(error.message || t('business.createError') || "Failed to create business. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      setFormData(INITIAL_FORM_DATA);
      setNewProduct("");
      setNewCompetitor("");
      setErrorMessage("");
      clearErrors();
      onClose();
    }
  };

  const iconMarginClass = isRTL ? "ml-2" : "mr-2";

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className={`sm:max-w-[600px] max-h-[90vh] overflow-y-auto ${isRTL ? 'text-right' : ''}`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Building2 className="h-5 w-5 text-sky-600" />
            {t('business.createNew') || "Create New Business"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-2" noValidate>
          {errorMessage && (
            <div className={`rounded-xl border border-red-100 bg-red-50 ${isRTL ? 'text-right' : ''} px-4 py-3 text-sm text-red-600`}>
              {errorMessage}
            </div>
          )}

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={isRTL ? 'text-right' : ''}>
                <Label htmlFor="businessName" className="text-sm font-medium text-gray-700">
                  {t('business.businessName') || "Business Name"} *
                </Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  placeholder={t('placeholder.businessName') || "Enter business name"}
                  className={`mt-1 ${isRTL ? 'text-right' : ''} ${getFieldError('businessName') ? 'border-red-500 focus:border-red-500 focus:ring-red-500 ring-red-500' : ''}`}
                  disabled={isSaving}
                />
                {getFieldError('businessName') && (
                  <p className="mt-1 text-sm text-red-600">{getFieldError('businessName')}</p>
                )}
              </div>

              <div className={isRTL ? 'text-right' : ''}>
                <Label htmlFor="industry" className="text-sm font-medium text-gray-700">
                  {t('business.industry') || "Industry"} *
                </Label>
                <Input
                  id="industry"
                  value={formData.industry}
                  onChange={(e) => handleInputChange('industry', e.target.value)}
                  placeholder={t('placeholder.industry') || "Enter industry"}
                  className={`mt-1 ${isRTL ? 'text-right' : ''} ${getFieldError('industry') ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  disabled={isSaving}
                />
                {getFieldError('industry') && (
                  <p className="mt-1 text-sm text-red-600">{getFieldError('industry')}</p>
                )}
              </div>
            </div>

            <div className={isRTL ? 'text-right' : ''}>
              <Label htmlFor="businessDescription" className="text-sm font-medium text-gray-700">
                {t('business.description') || "Description"} *
              </Label>
              <Textarea
                id="businessDescription"
                value={formData.businessDescription}
                onChange={(e) => handleInputChange('businessDescription', e.target.value)}
                placeholder={t('placeholder.description') || "Enter business description"}
                className={`mt-1 ${isRTL ? 'text-right' : ''} ${getFieldError('businessDescription') ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                disabled={isSaving}
                rows={3}
              />
              {getFieldError('businessDescription') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError('businessDescription')}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={isRTL ? 'text-right' : ''}>
                <Label htmlFor="targetMarket" className="text-sm font-medium text-gray-700">
                  {t('business.targetMarket') || "Target Market"} *
                </Label>
                <Textarea
                  id="targetMarket"
                  value={formData.targetMarket}
                  onChange={(e) => handleInputChange('targetMarket', e.target.value)}
                  placeholder={t('placeholder.targetMarket') || "Describe your target market"}
                  className={`mt-1 ${isRTL ? 'text-right' : ''} ${getFieldError('targetMarket') ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  disabled={isSaving}
                  rows={2}
                />
                {getFieldError('targetMarket') && (
                  <p className="mt-1 text-sm text-red-600">{getFieldError('targetMarket')}</p>
                )}
              </div>
            </div>

            {/* Products/Services */}
            <div className={isRTL ? 'text-right' : ''}>
              <Label className="text-sm font-medium text-gray-700">
                {t('business.productsServices') || "Products/Services"} *
              </Label>
              <div className="space-y-3 mt-1">
                <div className="flex gap-2 items-stretch">
                  <Input
                    value={newProduct}
                    onChange={(e) => setNewProduct(e.target.value)}
                    placeholder={t('placeholder.productsServices') || "Add product/service"}
                    className={`flex-1 ${isRTL ? 'text-right' : ''}`}
                    disabled={isSaving}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addProduct())}
                  />
                  <Button
                    type="button"
                    onClick={addProduct}
                    disabled={!newProduct.trim() || isSaving}
                    variant="outline"
                    className="px-3"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.productsServices.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.productsServices.map((product, index) => (
                      <div key={index} className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-200">
                        <span className="text-sm">{product}</span>
                        <Button
                          type="button"
                          onClick={() => removeProduct(product)}
                          size="sm"
                          variant="ghost"
                          disabled={isSaving}
                          className="h-4 w-4 p-0 hover:bg-green-100 rounded-full"
                        >
                          <X className="h-3 w-3 text-green-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {getFieldError('productsServices') && (
                  <p className="mt-1 text-sm text-red-600">{getFieldError('productsServices')}</p>
                )}
              </div>
            </div>

            {/* Competitors */}
            <div className={isRTL ? 'text-right' : ''}>
              <Label className="text-sm font-medium text-gray-700">
                {t('business.competitors') || "Competitors"} *
              </Label>
              <div className="space-y-3 mt-1">
                <div className="flex gap-2 items-stretch">
                  <Input
                    value={newCompetitor}
                    onChange={(e) => setNewCompetitor(e.target.value)}
                    placeholder={t('placeholder.addCompetitor') || "Add competitor name"}
                    className={`flex-1 ${isRTL ? 'text-right' : ''}`}
                    disabled={isSaving}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCompetitor())}
                  />
                  <Button
                    type="button"
                    onClick={addCompetitor}
                    disabled={!newCompetitor.trim() || isSaving}
                    variant="outline"
                    className="px-3"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.competitors.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.competitors.map((competitor, index) => (
                      <div key={index} className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full border border-blue-200">
                        <span className="text-sm">{competitor.name}</span>
                        <Button
                          type="button"
                          onClick={() => removeCompetitor(competitor.name)}
                          size="sm"
                          variant="ghost"
                          disabled={isSaving}
                          className="h-4 w-4 p-0 hover:bg-blue-100 rounded-full"
                        >
                          <X className="h-3 w-3 text-blue-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {getFieldError('competitors') && (
                  <p className="mt-1 text-sm text-red-600">{getFieldError('competitors')}</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className={`flex justify-end gap-3 pt-6 pb-6 px-6 border-t border-gray-200 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <DialogClose asChild>
              <Button 
                type="button" 
                variant="outline" 
                disabled={isSaving}
                className={`px-6 ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <X className={`w-4 h-4 ${iconMarginClass}`} />
                {t('common.cancel') || "Cancel"}
              </Button>
            </DialogClose>
            <Button 
              type="submit" 
              disabled={isSaving}
              className={`px-6 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              {isSaving ? (
                <>
                  <Spinner size="sm" variant="white" className={iconMarginClass} />
                  {t('business.creating') || "Creating..."}
                </>
              ) : (
                <>
                  <Save className={`w-4 h-4 ${iconMarginClass}`} />
                  {t('business.create') || "Create Business"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
