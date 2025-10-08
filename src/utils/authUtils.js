import { auth } from '../firebase';

export const getAuthToken = async () => {
  try {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      return token;
    }
    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

export const getAuthHeaders = async () => {
  const token = await getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
};

export const getCurrentUserInfo = () => {
  const user = auth.currentUser;
  if (user) {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      phone: user.phoneNumber,
      isEmailVerified: user.emailVerified
    };
  }
  return null;
};

export const getUserIdentifier = () => {
  const user = auth.currentUser;
  if (user) {
    return user.uid;
  }
  return null;
};