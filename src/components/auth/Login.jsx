import React, { useState, useEffect } from 'react';
import { signInWithPopup, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { auth, googleProvider } from '../../firebase';
import { Mail, ArrowLeft, Check, Brain, BarChart3, Users, MessageSquare } from 'lucide-react';
import { useFormValidation } from '../../hooks/useFormValidation';
import { useLanguage } from '../common/LanguageProvider';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailLinkSent, setEmailLinkSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t, isRTL } = useLanguage();
  const { 
    errors, 
    clearErrors, 
    clearFieldError, 
    validateFields, 
    getFieldError
  } = useFormValidation();

  // Handle email link verification on component mount
  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      // Retrieve the email from local storage
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        // Prompt the user to enter their email if not available
        email = window.prompt('Please provide your email for confirmation');
      }
      
      if (email) {
        signInWithEmailLink(auth, email, window.location.href)
          .then((result) => {
            // Clear the email from local storage
            window.localStorage.removeItem('emailForSignIn');
            // User is signed in - the AuthContext will handle the redirect
            console.log('User signed in:', result.user);
          })
          .catch((error) => {
            console.error('Error signing in with email link:', error);
            setError('Invalid or expired sign-in link. Please try again.');
            setTimeout(() => setError(''), 5000);
          });
      }
    }
  }, []);

  const handlePasswordlessAuth = async (e) => {
    e.preventDefault();
    setError('');
    clearErrors();

    // Validate email field
    const validationRules = {
      email: { 
        value: email, 
        required: true,
        email: true,
        customMessage: t('validation.emailRequired')
      }
    };

    const isValid = validateFields(validationRules);

    if (!isValid) {
      return;
    }

    setLoading(true);

    try {
      const actionCodeSettings = {
        url: window.location.origin + '/login',
        handleCodeInApp: true,
      };

      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      
      // Save the email locally to complete sign-in after redirection
      window.localStorage.setItem('emailForSignIn', email);
      setEmailLinkSent(true);
    } catch (error) {
      console.error('Error sending email link:', error);
      setError('Error sending sign-in link. Please try again.');
      setTimeout(() => setError(''), 5000);
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

  const resetForm = () => {
    setEmail('');
    setError('');
    setShowEmailForm(false);
    setEmailLinkSent(false);
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
              {emailLinkSent 
                ? 'Check your email'
                : showEmailForm 
                  ? 'Sign in to your account'
                  : 'Welcome to Mole.AI'
              }
            </h1>
            {emailLinkSent && (
              <p className="reset-success-message">
                We've sent a sign-in link to {email}. Click the link in your email to sign in.
              </p>
            )}
            {showEmailForm && !emailLinkSent && (
              <p className="login-subtitle">
                Enter your email address to receive a secure sign-in link
              </p>
            )}
          </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {!showEmailForm && !emailLinkSent && (
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
              onClick={() => setShowEmailForm(true)}
              className="auth-button email-button"
              disabled={loading}
            >
              <Mail className="w-5 h-5" />
              Continue with email
            </button>
          </div>
        )}

        {emailLinkSent ? (
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
          showEmailForm && (
            <>
              <form onSubmit={handlePasswordlessAuth} className="login-form">
                <div className="form-group">
                  <input
                    id="email"
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
                  {loading ? 'Sending...' : 'Send sign-in link'}
                </button>
              </form>
              
              <div className="auth-switch">
                <button
                  type="button"
                  onClick={() => {setShowEmailForm(false); setEmail(''); setError('');}}
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