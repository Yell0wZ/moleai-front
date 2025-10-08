import React from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/common/LanguageProvider';

/**
 * Reusable FormField component with validation styling and error display
 */
export const FormField = ({ 
  children, 
  error, 
  className = '',
  isRTL = false,
  ...props 
}) => {
  return (
    <div className={cn("space-y-1", className)} {...props}>
      {children}
      {error && (
        <p className={cn(
          "text-sm font-medium text-red-600",
          isRTL ? "text-right" : "text-left"
        )}>
          {error}
        </p>
      )}
    </div>
  );
};

/**
 * Enhanced Input component with validation styling
 */
export const ValidatedInput = React.forwardRef(({ 
  error, 
  isRTL = false,
  className = '',
  ...props 
}, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        error && "border-red-500 focus:border-red-500 focus:ring-red-500 ring-red-500",
        isRTL && "text-right",
        className
      )}
      {...props}
    />
  );
});
ValidatedInput.displayName = "ValidatedInput";

/**
 * Enhanced Textarea component with validation styling
 */
export const ValidatedTextarea = React.forwardRef(({ 
  error, 
  isRTL = false,
  className = '',
  ...props 
}, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        error && "border-red-500 focus:border-red-500 focus:ring-red-500 ring-red-500",
        isRTL && "text-right",
        className
      )}
      {...props}
    />
  );
});
ValidatedTextarea.displayName = "ValidatedTextarea";

/**
 * Enhanced Select component with validation styling
 */
export const ValidatedSelect = React.forwardRef(({ 
  error, 
  isRTL = false,
  className = '',
  children,
  ...props 
}, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        error && "border-red-500 focus:border-red-500 focus:ring-red-500 ring-red-500",
        isRTL && "text-right",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
});
ValidatedSelect.displayName = "ValidatedSelect";
