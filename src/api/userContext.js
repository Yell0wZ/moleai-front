// User context management
import { getUserIdentifier, getCurrentUserInfo } from '../utils/authUtils';

// Fallback UID for development/testing

// Get current user UID
export const getCurrentUserUid = () => {
  // Try to get the Firebase UID first (recommended for production)
  const uid = getUserIdentifier();
  if (uid) {
    return uid;
  }

  // Fallback to stored UID or default
  const storedUid = localStorage.getItem('current_user_uid');
  return storedUid;
};

// Set current user UID (for testing purposes)
export const setCurrentUserUid = (uid) => {
  // In a real app, this would be handled by your auth system
  localStorage.setItem('current_user_uid', uid);
};

// Get current user UID from storage or default
export const getStoredUserUid = () => {
  return localStorage.getItem('current_user_uid');
};

// Check if user is authenticated
export const isUserAuthenticated = () => {
  const userInfo = getCurrentUserInfo();
  return userInfo !== null;
};

// Get user info
export const getCurrentUser = () => {
  const userInfo = getCurrentUserInfo();
  if (userInfo) {
    return {
      uid: userInfo.uid,
      email: userInfo.email,
      displayName: userInfo.displayName,
      phone: userInfo.phone,
      isAuthenticated: true
    };
  }

  // Fallback for non-authenticated state
  return {
    uid: getStoredUserUid(),
    isAuthenticated: false
  };
};
