import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, User, Edit, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/common/LanguageProvider";

export default function PersonaCard({ persona, index, onEdit, onDelete }) {
  const { t, isRTL, isHebrew } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -5 }}
    >
      <Card className="h-full shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white/90 backdrop-blur-sm overflow-hidden group persona-card responsive-card hover-optimized" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="h-2 bg-gradient-to-r from-sky-400 to-blue-500"></div>
        
        <CardHeader className="pb-4 card-header">
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Badge variant="outline" className={`bg-sky-50 text-sky-700 border-sky-200 text-center min-w-[80px] flex items-center justify-center ${isRTL ? 'order-1' : 'order-2'}`}>
              {persona.age} {isHebrew ? 'שנים' : 'Years'}
            </Badge>
            <div className={`flex items-start gap-3 ${isRTL ? 'order-2' : 'order-1'}`}>
              <div className="relative flex-shrink-0">
                {persona.avatar_url ? (
                  <img 
                    src={persona.avatar_url} 
                    alt={persona.name}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-100"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-r from-sky-400 to-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
                {persona.is_ai_generated && (
                  <div className={`absolute -top-1 w-4 h-4 bg-sky-500 rounded-full flex items-center justify-center ${isRTL ? '-left-1' : '-right-1'}`}>
                    <Sparkles className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </div>
              <div className={`flex flex-col flex-1 ${isRTL ? 'text-right' : ''}`}>
                <h3 className="font-bold text-gray-900 text-base leading-tight mb-0.5">{persona.name}</h3>
                {(persona.job_title || persona.jobTitle) && (
                  <p className="text-xs text-gray-500 font-normal leading-relaxed" style={{ display: 'block' }}>
                    {(persona.job_title || persona.jobTitle).trim() || ''}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 w-full card-content">
          <div className="space-y-3 w-full">
            <div className={`w-full ${isRTL ? 'text-right' : ''}`}>
              <h4 className="text-sm font-semibold text-gray-700 mb-1">
                {isHebrew ? 'מטרות' : 'Goals'}
              </h4>
              <p className="text-sm text-gray-600 line-clamp-2 w-full">{persona.goals}</p>
            </div>
            
            <div className={`w-full ${isRTL ? 'text-right' : ''}`}>
              <h4 className="text-sm font-semibold text-gray-700 mb-1">
                {isHebrew ? 'נקודות כאב' : 'Pain Points'}
              </h4>
              <p className="text-sm text-gray-600 line-clamp-2 w-full">
                {persona.pain_points || persona.painPoints || (isHebrew ? 'אין מידע' : 'No information')}
              </p>
            </div>
            
            <div className={`w-full ${isRTL ? 'text-right' : ''}`}>
              <h4 className="text-sm font-semibold text-gray-700 mb-1">
                {isHebrew ? 'סגנון חיים' : 'Lifestyle'}
              </h4>
              <p className="text-sm text-gray-600 line-clamp-2 w-full">{persona.lifestyle}</p>
            </div>
          </div>


          <div className={`flex gap-2 pt-4 border-t border-gray-100 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {onEdit && (
              <Button
                onClick={() => onEdit(persona)}
                variant="outline"
                size="sm"
                className={`flex-1 ${isRTL ? 'flex-row-reverse' : ''} hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300`}
              >
                <Edit className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {isHebrew ? 'ערוך' : 'Edit'}
              </Button>
            )}
            {onDelete && (
              <Button
                onClick={() => onDelete(persona.id)}
                variant="outline"
                size="sm"
                className={`flex-1 ${isRTL ? 'flex-row-reverse' : ''} hover:bg-red-50 hover:text-red-700 hover:border-red-300`}
              >
                <Trash2 className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {isHebrew ? 'מחק' : 'Delete'}
              </Button>
            )}
          </div>

        </CardContent>
      </Card>
    </motion.div>
  );
}
