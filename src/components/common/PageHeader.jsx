import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function PageHeader({
  icon,
  title,
  subtitle,
  actions,
  isRTL = false,
  className,
  iconContainerClassName,
  stackOnMobile = true,
  showOnMobile = true,
}) {
  const layoutClasses = stackOnMobile
    ? cn(
        'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
        isRTL ? 'sm:flex-row-reverse' : ''
      )
    : cn(
        'flex flex-wrap items-center gap-4',
        isRTL ? 'flex-row-reverse justify-start' : 'justify-between'
      );

  return (
    <motion.header
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('w-full page-header', showOnMobile ? '' : 'hidden md:block', className)}
    >
      <div
        className={cn(
          'w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col gap-4',
          isRTL ? 'text-right' : 'text-left'
        )}
        style={isRTL ? { position: 'relative' } : {}}
      >
        <div 
          className={layoutClasses}
          style={isRTL ? { 
            flexDirection: 'row-reverse', 
            direction: 'rtl',
            justifyContent: 'space-between',
            alignItems: 'center'
          } : {}}
        >
          <div
            className={cn(
              'flex items-center gap-4',
              isRTL ? 'flex-row-reverse justify-end' : 'justify-start'
            )}
            style={isRTL ? { 
              justifyContent: 'flex-end', 
              direction: 'rtl',
              order: 2
            } : {}}
          >
            <div className={isRTL ? 'text-right' : 'text-left'}>
              <h1 className={`text-2xl sm:text-3xl font-bold bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent ${isRTL ? 'text-right' : 'text-left'}`}>
                {title}
              </h1>
              {subtitle && (
                <p className={`text-gray-600 text-sm sm:text-base mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {actions && (
            <div
              className={cn(
                'flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-stretch sm:items-center flex-shrink-0 actions',
                isRTL ? 'sm:flex-row-reverse justify-end' : 'justify-end'
              )}
              style={isRTL ? { 
                justifyContent: 'flex-start', 
                direction: 'rtl',
                order: 1,
                marginLeft: 0,
                marginRight: 0,
                alignSelf: 'flex-start'
              } : {}}
            >
              {actions}
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
}
