import React, { useState } from 'react';
import { signInWithEmailAndPassword, signInWithPopup, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, googleProvider } from '../../firebase';
import { Mail, ArrowLeft, Check, Brain, BarChart3, Users, MessageSquare } from 'lucide-react';
import { useFormValidation } from '../../hooks/useFormValidation';
import { useLanguage } from '../common/LanguageProvider';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t, isRTL } = useLanguage();
  const { 
    errors, 
    clearErrors, 
    clearFieldError, 
    validateFields, 
    getFieldError,
    validatePasswordMatch
  } = useFormValidation();

  const handleEmailPasswordAuth = async (e) => {
    e.preventDefault();
    setError('');
    clearErrors();

    // Validate form fields
    const validationRules = {
      email: { 
        value: email, 
        required: true,
        email: true,
        customMessage: t('validation.emailRequired')
      },
      password: { 
        value: password, 
        required: true,
        password: true,
        customMessage: t('validation.passwordRequired')
      }
    };

    // Add confirm password validation for sign up
    if (isSignUp) {
      validationRules.confirmPassword = { 
        value: confirmPassword, 
        required: true,
        customMessage: t('validation.confirmPasswordRequired')
      };
    }

    const isValid = validateFields(validationRules);

    // Additional password match validation for sign up
    if (isSignUp && isValid) {
      const passwordMatchError = validatePasswordMatch(password, confirmPassword);
      if (passwordMatchError) {
        setError(passwordMatchError);
        setTimeout(() => setError(''), 3000);
        return;
      }
    }

    if (!isValid) {
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      if (!isSignUp && (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-login-credentials')) {
        setError('Email or password is incorrect');
      } else {
        setError('Error, please try again');
      }
      setTimeout(() => setError(''), 3000);
    }
    
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      setError('Error, please try again');
      setTimeout(() => setError(''), 3000);
    }
    
    setLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setError('');
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setResetEmailSent(true);
    } catch (error) {
      setError('Error, please try again');
      setTimeout(() => setError(''), 3000);
    }
    
    setLoading(false);
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setIsSignUp(false);
    setShowEmailForm(false);
    setIsForgotPassword(false);
    setResetEmailSent(false);
  };

  return (
    <div className="login-container">
      <div className="login-left-panel">
        <div className="login-left-content">
          <h2>Mole.AI</h2>
          <p>Transform your business insights with advanced AI analytics and personalized recommendations.</p>
          
          <div className="login-features">
            <div className="feature-item">
              <div className="feature-icon">
                <Brain className="w-6 h-6" />
              </div>
              <div className="feature-text">
                <h3>Smart Analytics</h3>
                <p>Get deep insights into your market position and competitor analysis</p>
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon">
                <Users className="w-6 h-6" />
              </div>
              <div className="feature-text">
                <h3>Customer Avatars</h3>
                <p>Create detailed customer profiles with AI-driven behavioral analysis</p>
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="feature-text">
                <h3>AI Prompts</h3>
                <p>Generate compelling content and strategies with intelligent prompts</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="login-right-panel">
        <div className="login-content">
          <div className="logo-container">
            <div className="logo-icon">
              <div className="logo-shape"></div>
              <div className="logo-shape-accent"></div>
            </div>
          </div>
          
          <div className="login-header">
            <h1>
              {isForgotPassword 
                ? (resetEmailSent ? 'Check your email' : 'Reset password')
                : showEmailForm 
                  ? (isSignUp ? 'Create your account' : 'Sign in to your account')
                  : 'Welcome to Mole.AI'
              }
            </h1>
            {isForgotPassword && resetEmailSent && (
              <p className="reset-success-message">
                We've sent a password reset link to {email}
              </p>
            )}
            {showEmailForm && !isForgotPassword && (
              <p className="login-subtitle">
                {isSignUp 
                  ? 'Join Mole.AI to unlock powerful AI-driven insights'
                  : 'Enter your credentials to access your dashboard'
                }
              </p>
            )}
          </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {!isForgotPassword && !showEmailForm && (
          <div className="login-buttons">
            <button 
              onClick={handleGoogleSignIn}
              className="auth-button google-button"
              disabled={loading}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <button 
              onClick={() => {setShowEmailForm(true); setIsSignUp(false);}}
              className="auth-button email-button"
              disabled={loading}
            >
              <Mail className="w-5 h-5" />
              Continue with email
            </button>
          </div>
        )}

        {isForgotPassword ? (
          <>
            {resetEmailSent ? (
              <div className="reset-success">
                <div className="success-icon">
                  <Check className="w-8 h-8" />
                </div>
                <div className="auth-switch">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="link-button"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to login
                  </button>
                </div>
              </div>
            ) : (
              <>
                <form onSubmit={handleForgotPassword} className="login-form">
                  <div className="form-group">
                    <input
                      id="reset-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      required
                      disabled={loading}
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="auth-button submit-button"
                    disabled={loading}
                  >
                    {loading ? 'Sending...' : 'Send reset link'}
                  </button>
                </form>
                
                <div className="auth-switch">
                  <button
                    type="button"
                    onClick={() => {setIsForgotPassword(false); setError('');}}
                    className="link-button"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to login
                  </button>
                </div>
              </>
            )}
          </>
        ) : (
          showEmailForm && (
            <>
              <form onSubmit={handleEmailPasswordAuth} className="login-form">
                <div className="form-group">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                    minLength="6"
                  />
                </div>

                {isSignUp && (
                  <div className="form-group">
                    <input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      required
                      disabled={loading}
                      minLength="6"
                    />
                  </div>
                )}

                <div className="forgot-password">
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="link-button forgot-link"
                    disabled={loading}
                  >
                    Forgot password?
                  </button>
                </div>

                <button 
                  type="submit" 
                  className="auth-button submit-button"
                  disabled={loading}
                >
                  {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                </button>
                
                {!isSignUp && (
                  <div className="signup-prompt-inline">
                    <button
                      type="button"
                      onClick={() => {setIsSignUp(true); setError('');}}
                      className="signup-button-inline"
                      disabled={loading}
                    >
                      New here? Sign Up
                    </button>
                  </div>
                )}
              </form>
              
              <div className="auth-switch">
                <button
                  type="button"
                  onClick={() => {setShowEmailForm(false); setEmail(''); setPassword(''); setConfirmPassword(''); setError('');}}
                  className="link-button"
                  disabled={loading}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to options
                </button>
              </div>
            </>
          )
        )}
        </div>
      </div>
    </div>
  );
};

export default Login;