import React from 'react';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { useLanguage } from './LanguageProvider';

export default function LanguageToggle() {
  const { language, setLanguage, isRTL, clearLanguageCache } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'he' : 'en');
  };

  const handleClearCache = () => {
    clearLanguageCache();
    // Reload the page to force re-initialization
    window.location.reload();
  };

  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="ghost" 
        size="sm"
        onClick={toggleLanguage}
        className={`flex items-center gap-2 hover:bg-white/10 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm font-medium">
          {language === 'en' ? 'עברית' : 'English'}
        </span>
      </Button>
      <Button 
        variant="outline" 
        size="sm"
        onClick={handleClearCache}
        className="text-xs"
        title="Clear language cache and reload from Firestore"
      >
        🔄
      </Button>
    </div>
  );
}