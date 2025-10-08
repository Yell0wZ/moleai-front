import { useState, useCallback } from 'react';
import { useLanguage } from '@/components/common/LanguageProvider';

/**
 * Custom hook for form validation with i18n support
 * Provides validation functions and error state management
 */
export const useFormValidation = () => {
  const { t } = useLanguage();
  const [errors, setErrors] = useState({});

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Clear specific field error
  const clearFieldError = useCallback((fieldName) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  // Set error for specific field
  const setFieldError = useCallback((fieldName, errorMessage) => {
    setErrors(prev => ({
      ...prev,
      [fieldName]: errorMessage
    }));
  }, []);

  // Validation functions
  const validateRequired = useCallback((value, fieldName, customMessage) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return customMessage || t('validation.required');
    }
    return null;
  }, [t]);

  const validateEmail = useCallback((value, fieldName, customMessage) => {
    if (!value) {
      return customMessage || t('validation.emailRequired');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return customMessage || t('validation.email');
    }
    return null;
  }, [t]);

  const validatePassword = useCallback((value, fieldName, customMessage) => {
    if (!value) {
      return customMessage || t('validation.passwordRequired');
    }
    if (value.length < 6) {
      return customMessage || t('validation.password');
    }
    return null;
  }, [t]);

  const validatePasswordMatch = useCallback((password, confirmPassword, customMessage) => {
    if (password !== confirmPassword) {
      return customMessage || t('validation.passwordMismatch');
    }
    return null;
  }, [t]);

  const validateAge = useCallback((value, fieldName, customMessage) => {
    if (!value) {
      return customMessage || t('validation.ageRequired');
    }
    const age = parseInt(value);
    if (isNaN(age) || age < 1 || age > 120) {
      return customMessage || t('validation.ageInvalid');
    }
    return null;
  }, [t]);


  const validatePhone = useCallback((value, fieldName, customMessage) => {
    if (!value) {
      return customMessage || t('validation.required');
    }
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,}$/;
    if (!phoneRegex.test(value)) {
      return customMessage || t('validation.phoneInvalid');
    }
    return null;
  }, [t]);

  // Generic validation function
  const validateField = useCallback((fieldName, value, rules = {}) => {
    const {
      required = false,
      email = false,
      password = false,
      age = false,
      phone = false,
      minLength = null,
      maxLength = null,
      customMessage = null
    } = rules;

    // Required validation
    if (required) {
      const requiredError = validateRequired(value, fieldName, customMessage);
      if (requiredError) return requiredError;
    }

    // Email validation
    if (email) {
      const emailError = validateEmail(value, fieldName, customMessage);
      if (emailError) return emailError;
    }

    // Password validation
    if (password) {
      const passwordError = validatePassword(value, fieldName, customMessage);
      if (passwordError) return passwordError;
    }

    // Age validation
    if (age) {
      const ageError = validateAge(value, fieldName, customMessage);
      if (ageError) return ageError;
    }


    // Phone validation
    if (phone) {
      const phoneError = validatePhone(value, fieldName, customMessage);
      if (phoneError) return phoneError;
    }

    // Length validations
    if (minLength && value && value.length < minLength) {
      return customMessage || t('validation.required');
    }

    if (maxLength && value && value.length > maxLength) {
      return customMessage || t('validation.required');
    }

    return null;
  }, [t, validateRequired, validateEmail, validatePassword, validateAge, validatePhone]);

  // Validate multiple fields at once
  const validateFields = useCallback((fieldValidations) => {
    const newErrors = {};
    let hasErrors = false;

    Object.entries(fieldValidations).forEach(([fieldName, rules]) => {
      const error = validateField(fieldName, rules.value, rules);
      if (error) {
        newErrors[fieldName] = error;
        hasErrors = true;
      }
    });

    setErrors(newErrors);
    return !hasErrors;
  }, [validateField]);

  // Get error for specific field
  const getFieldError = useCallback((fieldName) => {
    return errors[fieldName] || null;
  }, [errors]);

  // Check if field has error
  const hasFieldError = useCallback((fieldName) => {
    return !!errors[fieldName];
  }, [errors]);

  // Check if form has any errors
  const hasErrors = Object.keys(errors).length > 0;

  return {
    errors,
    hasErrors,
    clearErrors,
    clearFieldError,
    setFieldError,
    validateField,
    validateFields,
    getFieldError,
    hasFieldError,
    // Individual validation functions
    validateRequired,
    validateEmail,
    validatePassword,
    validatePasswordMatch,
    validateAge,
    validatePhone
  };
};
