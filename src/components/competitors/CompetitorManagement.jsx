import React, { useState, useEffect } from "react";
import { BusinessProfile, Competitor } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Building2, Save } from "lucide-react";
import { useLanguage } from "@/components/common/LanguageProvider";
import { Lordicon } from "@/components/ui/lordicon";

export default function CompetitorManagement({ businessProfile, competitors: initialCompetitors = [], onUpdate, businessId = null }) {
  const { t, isRTL, isHebrew } = useLanguage();
  const [newCompetitor, setNewCompetitor] = useState("");
  const [competitors, setCompetitors] = useState(initialCompetitors);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    setCompetitors(initialCompetitors);
    setHasUnsavedChanges(false);
  }, [initialCompetitors]);

  // Track changes to competitors
  useEffect(() => {
    const hasChanges = JSON.stringify(competitors.sort((a, b) => a.name.localeCompare(b.name))) !== 
                      JSON.stringify((initialCompetitors || []).sort((a, b) => a.name.localeCompare(b.name)));
    setHasUnsavedChanges(hasChanges);
  }, [competitors, initialCompetitors]);

  const addCompetitor = () => {
    if (newCompetitor.trim() && !competitors.some(c => c.name === newCompetitor.trim())) {
      const newCompetitorData = {
        id: `temp-${Date.now()}`, // Temporary ID for local state
        name: newCompetitor.trim(),
        phone: '',
        created_date: new Date(),
        updated_date: new Date()
      };
      
      setCompetitors([...competitors, newCompetitorData]);
      setNewCompetitor("");
    }
  };

  const removeCompetitor = (competitorToRemove) => {
    setCompetitors(competitors.filter(c => c.name !== competitorToRemove.name));
  };

  const saveChanges = async () => {
    if (!hasUnsavedChanges) return;
    
    setIsSaving(true);
    try {
      // Get current competitors from the business profile
      const currentCompetitors = businessProfile?.competitors || [];
      
      // Find competitors to add (new ones not in current list)
      const competitorsToAdd = competitors.filter(newComp => 
        !currentCompetitors.some(currentComp => 
          (typeof currentComp === 'string' ? currentComp : currentComp.name) === newComp.name
        )
      );
      
      // Find competitors to remove (ones in current list but not in new list)
      const competitorsToRemove = currentCompetitors.filter(currentComp => {
        const currentName = typeof currentComp === 'string' ? currentComp : currentComp.name;
        return !competitors.some(newComp => newComp.name === currentName);
      }).map(currentComp => ({
        name: typeof currentComp === 'string' ? currentComp : currentComp.name
      }));
      
      // Add new competitors in bulk if there are any to add
      if (competitorsToAdd.length > 0) {
        await Competitor.createBulk(competitorsToAdd, businessId);
      }
      
      // Remove deleted competitors in bulk if there are any to remove
      if (competitorsToRemove.length > 0) {
        await Competitor.deleteBulk(competitorsToRemove, businessId);
      }
      
      // Show success message
      const successMsg = document.createElement('div');
      successMsg.className = `fixed ${isRTL ? 'left-4' : 'right-4'} top-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50`;
      successMsg.textContent = isHebrew ? "המתחרים נשמרו בהצלחה" : "Competitors saved successfully";
      document.body.appendChild(successMsg);
      setTimeout(() => document.body.removeChild(successMsg), 3000);
      
      // Reset unsaved changes flag
      setHasUnsavedChanges(false);
      
      // Call the parent update function to refresh data
      if (onUpdate) {
        onUpdate();
      }
      
    } catch (error) {
      console.error("Error saving competitors:", error);
      alert(isHebrew ? "שגיאה בשמירת המתחרים" : "Error saving competitors");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm h-fit" dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse text-right' : ''} ${isHebrew ? 'justify-end' : ''}`}>
          {isHebrew ? (
            <>
              {t('competitors.manage')}
              <Building2 className="w-5 h-5 text-blue-600" />
            </>
          ) : (
            <>
              <Building2 className="w-5 h-5 text-blue-600" />
              {t('competitors.manage')}
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Input
            value={newCompetitor}
            onChange={(e) => setNewCompetitor(e.target.value)}
            placeholder={t('competitors.addCompetitor')}
            className={`flex-1 ${isRTL ? 'text-right' : ''}`}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCompetitor())}
            dir="auto"
          />
          <Button
            onClick={addCompetitor}
            size="icon"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {competitors.length > 0 ? (
          <div className="space-y-2">
            <h4 className={`text-sm font-medium text-gray-700 ${isRTL ? 'text-right' : ''}`}>
              {t('competitors.current')}
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {competitors.map((competitor, index) => (
                <div key={competitor.id || index} className={`flex items-center justify-between p-2 bg-gray-50 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className={`text-sm font-medium ${isRTL ? 'text-right' : ''}`}>{competitor.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCompetitor(competitor)}
                    className="h-6 w-6 hover:bg-red-100 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">{t('competitors.noCompetitors')}</p>
          </div>
        )}

        {/* Save Button */}
        {hasUnsavedChanges && (
          <div className={`flex justify-end pt-4 border-t border-gray-200 ${isRTL ? 'justify-start' : ''}`}>
            <Button
              onClick={saveChanges}
              disabled={isSaving}
              className={`inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg shadow-md transition hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed ${
                isRTL ? "flex-row-reverse" : ""
              }`}
            >
              {isSaving ? (
                <Lordicon size="sm" variant="white" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>
                {isSaving 
                  ? (isHebrew ? "שומר..." : "Saving...") 
                  : (isHebrew ? "שמור שינויים" : "Save Changes")
                }
              </span>
            </Button>
          </div>
        )}

      </CardContent>
    </Card>
  );
}