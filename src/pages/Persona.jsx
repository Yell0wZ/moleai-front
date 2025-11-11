import React, { useState, useEffect } from "react";
import { Persona } from "@/api/entities";
import { BusinessProfile } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Plus, Sparkles, User, Edit, Building2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/components/common/LanguageProvider";
import PageHeader from "@/components/common/PageHeader";
import { Lordicon } from "@/components/ui/lordicon";

import PersonaCard from "../components/personas/PersonaCard";
import CreatePersonaModal from "../components/personas/CreatePersonaModal";
import GeneratePersonasModal from "../components/personas/GeneratePersonasModal";

export default function PersonaPage({ businessId, refreshBusinessData }) {
  const { t, isRTL, isHebrew } = useLanguage();
  const [personas, setPersonas] = useState([]);
  const [businessProfile, setBusinessProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [editingPersona, setEditingPersona] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, persona: null, isDeleting: false });
  const navigate = useNavigate();

  // Get current business context
  const currentBusinessId = businessId || null; // null = primary business

  useEffect(() => {
    loadData();
  }, [businessId, currentBusinessId, refreshTrigger]);

  // Listen for refresh trigger from parent
  useEffect(() => {
    if (refreshBusinessData) {
      setRefreshTrigger(prev => prev + 1);
    }
  }, [refreshBusinessData]);

  const loadData = async () => {
    try {
      // Check if business profile exists for current user
      const [personaData, businessProfileExists, currentUserProfile] = await Promise.all([
        Persona.list('-created_date', currentBusinessId),
        BusinessProfile.checkExists(),
        BusinessProfile.getCurrentUser()
      ]);
      
      setPersonas(personaData);
      
      if (businessProfileExists && currentUserProfile) {
        setBusinessProfile(currentUserProfile);
      } else {
        setBusinessProfile(null);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      setBusinessProfile(null);
    }
    setIsLoading(false);
  };

  const handlePersonaCreated = () => {
    loadData();
    setShowCreateModal(false);
    setEditingPersona(null);
    // Trigger business data refresh
    if (refreshBusinessData) {
      refreshBusinessData();
    }
  };

  const handlePersonaEdit = (persona) => {
    setEditingPersona(persona);
    setShowCreateModal(true);
  };

  const handlePersonaDelete = (personaId) => {
    const persona = personas.find(p => p.id === personaId);
    setDeleteModal({ isOpen: true, persona, isDeleting: false });
  };

  const confirmDelete = async () => {
    if (deleteModal.isDeleting) return; // Prevent double clicks
    
    setDeleteModal(prev => ({ ...prev, isDeleting: true }));
    try {
      await Persona.delete(deleteModal.persona.id, currentBusinessId);
      // Close modal immediately after successful deletion
      setDeleteModal({ isOpen: false, persona: null, isDeleting: false });
      // Refresh data
      loadData();
    } catch (error) {
      console.error("Error deleting persona:", error);
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  const cancelDelete = () => {
    if (deleteModal.isDeleting) return; // Prevent closing while deleting
    setDeleteModal({ isOpen: false, persona: null, isDeleting: false });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-140px)] gap-4">
        <Lordicon size="lg" variant="primary" />
        <p className="text-sm text-gray-500 animate-pulse">
   
        </p>
      </div>
    );
  }

  if (!businessProfile) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto">
        <Card className="text-center shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-8 pb-8">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {isHebrew ? "נדרש פרופיל עסקי" : "Business Profile Required"}
            </h2>
            <p className="text-gray-600 mb-4">
              {isHebrew 
                ? "אנא הגדר תחילה את הפרופיל העסקי שלך כדי ליצור אווטארים מופעלי AI."
                : "Please set up your business profile first to create AI-powered avatars."
              }
            </p>
            <Button 
              onClick={() => navigate(createPageUrl("BusinessProfile"))}
              className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700"
            >
              <Building2 className="w-4 h-4 mr-2" />
              {isHebrew ? "הגדר פרופיל עסקי" : "Set Up Business Profile"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const headerActions = (
    <div className={`flex flex-col gap-3 sm:flex-row ${isRTL ? 'sm:flex-row-reverse' : ''} flex-shrink-0`}>
      <Button
        onClick={() => setShowGenerateModal(true)}
        className={`w-full sm:w-auto bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white h-14 px-4 sm:px-6 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 ${isRTL ? 'flex-row-reverse' : ''} whitespace-nowrap touch-optimized hover-optimized`}
      >
        <Sparkles className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
        {t('personas.generateAI')}
      </Button>

      <Button
        onClick={() => setShowCreateModal(true)}
        variant="outline"
        className={`w-full sm:w-auto border-2 border-sky-200 hover:bg-sky-50 text-sky-700 h-14 px-4 sm:px-6 rounded-xl font-medium transition-all duration-300 ${isRTL ? 'flex-row-reverse' : ''} whitespace-nowrap touch-optimized hover-optimized`}
      >
        <User className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
        {t('personas.createManual')}
      </Button>
    </div>
  );

  const personaGridClasses = personas.length >= 3
    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 mx-auto responsive-grid-3"
    : personas.length === 2
      ? "grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mx-auto max-w-4xl responsive-grid-2"
      : "grid grid-cols-1 gap-4 sm:gap-6 mx-auto max-w-3xl";

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8 avatar-page-desktop-shift laptop-spacing laptop-lg-spacing desktop-spacing desktop-lg-spacing">
        <PageHeader
          icon={<Users className="w-8 h-8" />}
          title={t('personas.title')}
          subtitle={t('personas.subtitle')}
          actions={headerActions}
          isRTL={isRTL}
          className="max-w-5xl mx-auto"
          showOnMobile={false}
        />

      <div className="block md:hidden">
        {headerActions}
      </div>

      {personas.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={personaGridClasses}
        >
          <AnimatePresence>
            {personas.map((persona, index) => (
              <PersonaCard
                key={persona.id}
                persona={persona}
                index={index}
                onEdit={handlePersonaEdit}
                onDelete={handlePersonaDelete}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center py-16"
        >
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 bg-gradient-to-r from-sky-100 to-sky-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-12 h-12 text-sky-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Avatars Yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first customer avatar to start analyzing market perception
            </p>
            <div className="flex justify-center gap-3 flex-col sm:flex-row">
              <Button
                onClick={() => setShowGenerateModal(true)}
                className="h-14 w-full sm:w-auto px-6 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate with AI
              </Button>
              <Button
                onClick={() => setShowCreateModal(true)}
                variant="outline"
                className="h-14 w-full sm:w-auto px-6"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Manually
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      <CreatePersonaModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingPersona(null);
        }}
        onPersonaCreated={handlePersonaCreated}
        editingPersona={editingPersona}
        businessId={currentBusinessId}
      />

      <GeneratePersonasModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onPersonasGenerated={handlePersonaCreated}
        businessId={currentBusinessId}
      />


        {deleteModal.isOpen && deleteModal.persona && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {isHebrew ? "מחיקת אווטאר" : "Delete Avatar"}
                </h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                {isHebrew 
                  ? (
                    <>
                      האם אתה בטוח שברצונך למחוק את האווטאר "{deleteModal.persona.name}"?{" "}
                      <span className="font-semibold text-red-600">פעולה זו לא ניתנת לביטול.</span>
                    </>
                  )
                  : (
                    <>
                      Are you sure you want to delete the avatar "{deleteModal.persona.name}"?<br></br>
                      <span className="font-semibold text-red-600">This action cannot be undone.</span>
                    </>
                  )
                }
              </p>
              
              <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Button
                  onClick={cancelDelete}
                  variant="outline"
                  className="flex-1"
                  disabled={deleteModal.isDeleting}
                >
                  {isHebrew ? "ביטול" : "Cancel"}
                </Button>
                <Button
                  onClick={confirmDelete}
                  variant="destructive"
                  className="flex-1"
                  disabled={deleteModal.isDeleting}
                >
                  {deleteModal.isDeleting ? (
                    <span className="flex items-center gap-2">
                      {isHebrew ? (
                        <>
                          <Lordicon size="sm" variant="white" />
                          מוחק...
                        </>
                      ) : (
                        <>
                          <Lordicon size="sm" variant="white" />
                          Deleting...
                        </>
                      )}
                    </span>
                  ) : (
                    isHebrew ? "מחק" : "Delete"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
