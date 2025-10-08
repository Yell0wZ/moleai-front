// Firebase Cloud Functions API Client
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getAuthHeaders } from '../utils/authUtils';

const FIREBASE_BASE_URL = 'https://us-central1-moleai-testing.cloudfunctions.net';

// Generic API call function
const apiCall = async (endpoint, method = 'GET', data = null) => {
  try {
    // Support absolute URLs (Cloud Run) and relative paths (fallback to Firebase)
    const url = endpoint.startsWith('http') ? endpoint : `${FIREBASE_BASE_URL}${endpoint}`;

    // Get authenticated headers with JWT token
    const headers = await getAuthHeaders();

    const options = {
      method,
      headers,
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
      console.log('apiCall - Request body:', options.body);
    }


    const response = await fetch(url, options);
    
    // Debug response headers
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    // Check for content-length header
    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      console.log('Content-Length header:', contentLength);
    }
    
    if (!response.ok) {
      // Try to get the error response body
      let errorBody = '';
      try {
        errorBody = await response.text();
        console.error('Error response body:', errorBody);
      } catch (e) {
        console.error('Could not read error response body');
      }
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
    }

    // Get response text first to debug
    const responseText = await response.text();
    console.log('Raw response text length:', responseText.length);
    console.log('Raw response text preview:', responseText.substring(0, 200) + '...');
    
    // Check if response is truncated
    if (responseText.length < 1000) {
      console.log('WARNING: Response seems too short, might be truncated');
      console.log('Full response text:', responseText);
    }
    
    // Parse JSON
    let result;
    try {
      result = JSON.parse(responseText);
      console.log('API Response received:', result);
      console.log('API Response size:', JSON.stringify(result).length);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.log('Response text that failed to parse:', responseText);
      throw parseError;
    }
    
    // Debug specific responses if they exist
    if (result.prompts && result.prompts.length > 0) {
      console.log('First prompt responses:', result.prompts[0]?.responses);
      if (result.prompts[0]?.responses) {
        Object.entries(result.prompts[0].responses).forEach(([key, value]) => {
          console.log(`Response ${key} length:`, value ? value.length : 'undefined');
          console.log(`Response ${key} preview:`, value ? value.substring(0, 100) + '...' : 'undefined');
        });
      }
    }
    
    return result;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

// Business Profile API
export const BusinessProfileAPI = {
  // Create business profile
  create: async (profileData) => {
    const endpoint = 'https://businessprofiledata-thg3z73fma-uc.a.run.app/business-profile';
    return await apiCall(endpoint, 'POST', profileData);
  },

  // Get business profile (if you have a GET endpoint)
  get: async (id) => {
    try {
      if (!id) {
        throw new Error('Business profile id is required');
      }

      const docRef = doc(db, 'clients', id);
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        throw new Error('Business profile not found');
      }

      const data = snapshot.data();
      const profile = data?.business_profile || data?.businessProfile;

      if (!profile) {
        throw new Error('Business profile not found');
      }

      return profile;
    } catch (error) {
      console.error('Failed to fetch business profile from Firestore:', error);
      throw error;
    }
  },

  // Update business profile (backend currently expects POST)
  update: async (id, profileData) => {
    const endpoint = `https://businessprofiledata-thg3z73fma-uc.a.run.app/business-profile/`;
    return await apiCall(endpoint, 'POST', profileData);
  },

  // Delete business profile (if you have a DELETE endpoint)
  delete: async (id) => {
    const endpoint = `https://businessprofiledata-thg3z73fma-uc.a.run.app/business-profile/`;
    return await apiCall(endpoint, 'DELETE');
  },

  // Check if business profile exists for a uid
  // Since we don't have a dedicated check endpoint, we'll try to get the profile
  // and handle the case where it doesn't exist
  checkExists: async (uid) => {
    try {
      // Try to get the business profile - if it exists, return it
      const endpoint = `https://businessprofiledata-thg3z73fma-uc.a.run.app/business-profile/`;
      const result = await apiCall(endpoint, 'GET');
      return {
        exists: true,
        business_profile: result
      };
    } catch (error) {
      // If we get a 404 or similar error, the profile doesn't exist
      if (error.message.includes('404') || error.message.includes('not found')) {
        return {
          exists: false,
          business_profile: null
        };
      }
      // For other errors, re-throw them
      throw error;
    }
  }
};

// User Data Profile API
export const UserDataProfileAPI = {
  // Get all user data (business profile + personas)
  getUserData: async (uid) => {
    console.log('UserDataProfileAPI.getUserData - uid:', uid);
    const endpoint = `https://getuserdataprofile-thg3z73fma-uc.a.run.app/user-data-profile/${uid}`;
    console.log('UserDataProfileAPI.getUserData - endpoint:', endpoint);
    const result = await apiCall(endpoint, 'GET');
    console.log('UserDataProfileAPI.getUserData - result:', result);
    console.log('UserDataProfileAPI.getUserData - result keys:', Object.keys(result || {}));
    return result;
  }
};

// Persona API
export const PersonaAPI = {
  // Create manual persona
  createManual: async (personaData) => {
    const endpoint = 'https://createmanualpersona-thg3z73fma-uc.a.run.app/personas/manual';
    return await apiCall(endpoint, 'POST', personaData);
  },

  // Edit persona
  edit: async (uid, personaId, personaData) => {
    const endpoint = `https://editpersona-thg3z73fma-uc.a.run.app/personas/${personaId}`;
    return await apiCall(endpoint, 'POST', personaData);
  },

  // Delete persona
  delete: async (uid, personaId, customUrl = null) => {
    const endpoint = customUrl || `https://deletepersona-thg3z73fma-uc.a.run.app/personas/${personaId}`;
    return await apiCall(endpoint, 'DELETE');
  },

  // Create AI personas
  createAI: async (uid, count, data = null) => {
    const endpoint = 'https://createaipersona-thg3z73fma-uc.a.run.app';
    const requestData = data || { uid, count };
    const result = await apiCall(endpoint, 'POST', requestData);
    return result;
  }
};

// AI Prompt API
export const AiPromptAPI = {
  // Create AI prompt
  create: async (promptData) => {
    console.log('AiPromptAPI.create - promptData:', promptData);
    const endpoint = 'https://aipromts-thg3z73fma-uc.a.run.app';
    console.log('AiPromptAPI.create - endpoint:', endpoint);
    const result = await apiCall(endpoint, 'POST', promptData);
    console.log('AiPromptAPI.create - result:', result);
    return result;
  }
};

// Competitor API
export const CompetitorAPI = {
  // Create competitor
  create: async (competitorData) => {
    const endpoint = 'https://createcompetitor-thg3z73fma-uc.a.run.app/competitors';
    const result = await apiCall(endpoint, 'POST', competitorData);
    return result;
  },

  // Create multiple competitors (bulk operation)
  createBulk: async (competitorsData) => {
    const endpoint = 'https://createcompetitor-thg3z73fma-uc.a.run.app/competitors';
    const result = await apiCall(endpoint, 'POST', competitorsData);
    return result;
  },

  // Delete competitor
  delete: async (competitorData) => {
    const endpoint = 'https://deletecompetitor-thg3z73fma-uc.a.run.app/competitors/delete';
    
    const result = await apiCall(endpoint, 'POST', competitorData);
    return result;
  },

  // Delete multiple competitors (bulk operation)
  deleteBulk: async (competitorsData) => {
    const endpoint = 'https://deletecompetitor-thg3z73fma-uc.a.run.app/competitors/delete';
    
    const result = await apiCall(endpoint, 'POST', competitorsData);
    return result;
  }
};

// Business API
export const BusinessAPI = {
  // Delete secondary business
  delete: async (businessData) => {
    const endpoint = 'https://deletebuisness-thg3z73fma-uc.a.run.app/business/delete';
    const result = await apiCall(endpoint, 'POST', businessData);
    return result;
  }
};

// Helper function to transform data between frontend and backend formats
export const transformBusinessProfileData = {
  // Transform frontend data to backend format
  toBackend: (frontendData) => {
    return {
      uid: frontendData.uid || "",
      businessName: frontendData.business_name,
      industry: frontendData.industry,
      website: frontendData.website,
      businessDescription: frontendData.description,
      productsServices: Array.isArray(frontendData.products_services)
        ? frontendData.products_services
        : frontendData.products_services?.split(',').map(item => item.trim()) || [],
      targetMarket: frontendData.target_market,
      competitors: frontendData.competitors || []
    };
  },

  // Transform backend data to frontend format
  toFrontend: (backendData) => {
    const stableId = backendData.id
      || backendData.profileId
      || backendData.documentId
      || backendData.uid
      || 'business-profile';

    return {
      id: stableId,
      business_name: backendData.businessName,
      industry: backendData.industry,
      website: backendData.website,
      description: backendData.businessDescription,
      products_services: Array.isArray(backendData.productsServices)
        ? backendData.productsServices.join(', ')
        : backendData.productsServices || "",
      target_market: backendData.targetMarket,
      competitors: backendData.competitors || [],
      uid: backendData.uid || "",
      created_date: backendData.created_date || new Date().toISOString(),
      updated_date: backendData.updated_date || new Date().toISOString()
    };
  }
};

// Helper function to transform Competitor data
export const transformCompetitorData = {
  // Transform frontend data to backend format
  toBackend: (frontendData) => {
    return {
      uid: frontendData.uid,
      name: frontendData.name
    };
  },

  // Transform backend data to frontend format
  toFrontend: (backendData) => {
    return {
      id: backendData.id || backendData._id,
      name: backendData.name,
      uid: backendData.uid,
      created_date: backendData.createdAt ? new Date(backendData.createdAt._seconds * 1000) : new Date(),
      updated_date: backendData.updatedAt ? new Date(backendData.updatedAt._seconds * 1000) : new Date()
    };
  }
};

// Helper function to transform AI Prompt data
export const transformAiPromptData = {
  // Transform frontend data to backend format
  toBackend: (frontendData) => {
    const backendData = {
      uid: frontendData.uid,
      prompt: frontendData.prompt,
      personaId: frontendData.personaId,
      models: frontendData.models || ["openai", "claude", "perplexity", "gemini"]
    };
    
    // Include businessId if provided (for secondary businesses)
    if (frontendData.businessId) {
      backendData.businessId = frontendData.businessId;
    }
    
    return backendData;
  },

  // Transform backend data to frontend format
  toFrontend: (backendData) => {
    // Debug logging for responses
    console.log('Backend data responses:', backendData.responses);
    console.log('Backend data keys:', Object.keys(backendData));
    console.log('Backend data businessId:', backendData.businessId);
    console.log('Backend data personaId:', backendData.personaId);
    
    const transformed = {
      id: backendData.id || backendData._id,
      uid: backendData.uid,
      prompt: backendData.prompt,
      personaId: backendData.personaId,
      personaName: backendData.personaName,
      businessId: backendData.businessId, // Include businessId in transformed data
      models: backendData.models,
      status: 'completed', // Always completed since we get full data
      responses: backendData.responses || {},
      sources: backendData.sources || {},
      counts: backendData.counts || {},
      brandAnalysis: backendData.brandAnalysis || {},
      businessNameMentions: backendData.counts?.businessNameMentions || 0,
      competitorsMentions: backendData.counts?.competitorsMentions || 0,
      industryMentions: backendData.counts?.industryMentions || 0,
      productsServicesMentions: backendData.counts?.productsServicesMentions || 0,
      usage: backendData.usage || {},
      created_date: backendData.createdAt ? new Date(backendData.createdAt._seconds * 1000) : new Date(),
      updated_date: backendData.updatedAt ? new Date(backendData.updatedAt._seconds * 1000) : new Date()
    };

    console.log('Transformed responses:', transformed.responses);
    console.log('Transformed sources:', transformed.sources);
    return transformed;
  }
};

export const transformUserDataProfile = {
  // Transform backend user data to frontend format
  toFrontend: (backendData) => {
    console.log('transformUserDataProfile.toFrontend - backendData:', backendData);
    console.log('transformUserDataProfile.toFrontend - backendData.ok:', backendData.ok);
    
    if (!backendData.ok) {
      console.log('transformUserDataProfile.toFrontend - backendData.ok is false, returning empty data');
      return {
        businessProfile: null,
        secondaryBusinesses: [],
        personas: [],
        prompts: [],
        competitors: []
      };
    }

    // Handle both formats: backendData.data (old) and direct properties (new)
    const dataSource = backendData.data || backendData;
    console.log('transformUserDataProfile.toFrontend - dataSource:', dataSource);
    const { business_profile, secondary_buisness, personas, prompts, competitors, user_profile } = dataSource;
    
    console.log('transformUserDataProfile.toFrontend - business_profile:', business_profile);
    console.log('transformUserDataProfile.toFrontend - secondary_buisness:', secondary_buisness);
    console.log('transformUserDataProfile.toFrontend - personas:', personas);
    console.log('transformUserDataProfile.toFrontend - prompts:', prompts);
    console.log('transformUserDataProfile.toFrontend - competitors:', competitors);

    // Handle competitors - they might be strings or objects
    let transformedCompetitors = [];
    if (competitors) {
      transformedCompetitors = competitors.map((competitor, index) => {
        if (typeof competitor === 'string') {
          // If competitor is a string, create an object with name property
          return {
            id: competitor, // Use the string as ID
            name: competitor,
            uid: backendData.uid || '',
            created_date: new Date(),
            updated_date: new Date()
          };
        } else {
          // If competitor is an object, transform it
          return transformCompetitorData.toFrontend(competitor);
        }
      });
    }

    // Transform secondary businesses
    let transformedSecondaryBusinesses = [];
    if (secondary_buisness && Array.isArray(secondary_buisness)) {
      transformedSecondaryBusinesses = secondary_buisness.map(business => ({
        id: business.id || business.businessId || business.business_id || `secondary-${Date.now()}`,
        businessName: business.businessName || business.business_name || business.name || '',
        businessId: business.id || business.businessId || business.business_id,
        isPrimaryBusiness: false,
        competitors: business.competitors || [],
        personas: business.personas || [],
        prompts: business.prompts ? business.prompts.map(prompt => transformAiPromptData.toFrontend(prompt)) : []
      }));
    }

    const transformedData = {
      userProfile: user_profile ? {
        name: user_profile.first_name || user_profile.name || "",
        language: (user_profile.language || user_profile.preferred_language || "english").toLowerCase()
      } : null,
      businessProfile: business_profile ? {
        ...transformBusinessProfileData.toFrontend(business_profile),
        isPrimaryBusiness: true,
        personas: business_profile.personas || []
      } : null,
      secondaryBusinesses: transformedSecondaryBusinesses,
      personas: personas ? personas.map(persona => transformPersonaData.toFrontend(persona)) : [],
      prompts: prompts ? prompts.map(prompt => transformAiPromptData.toFrontend(prompt)) : [],
      competitors: transformedCompetitors
    };
    
    console.log('transformUserDataProfile.toFrontend - final transformed data:', transformedData);
    console.log('transformUserDataProfile.toFrontend - transformed prompts count:', transformedData.prompts.length);
    console.log('transformUserDataProfile.toFrontend - transformed secondary businesses count:', transformedData.secondaryBusinesses.length);
    
    return transformedData;
  }
};

// Helper function to transform Persona data between frontend and backend formats
export const transformPersonaData = {
  // Transform frontend data to backend format for manual creation
  toBackendManual: (frontendData, uid) => {
    return {
      uid: uid || "",
      name: frontendData.name,
      age: parseInt(frontendData.age) || 0,
      jobTitle: frontendData.job_title,
      goals: frontendData.goals,
      painPoints: frontendData.pain_points,
      lifestyle: frontendData.lifestyle,
      motivations: frontendData.motivations,
      purchasingHabits: frontendData.purchasing_habits,
      backstory: frontendData.backstory,
      aiPrompt: frontendData.prompt_template || ""
    };
  },

  // Transform frontend data to backend format for editing
  toBackendEdit: (frontendData) => {
    const editData = {};
    if (frontendData.name) editData.name = frontendData.name;
    if (frontendData.job_title) editData.jobTitle = frontendData.job_title;
    if (frontendData.goals) editData.goals = frontendData.goals;
    if (frontendData.pain_points) editData.painPoints = frontendData.pain_points;
    if (frontendData.lifestyle) editData.lifestyle = frontendData.lifestyle;
    if (frontendData.motivations) editData.motivations = frontendData.motivations;
    if (frontendData.purchasing_habits) editData.purchasingHabits = frontendData.purchasing_habits;
    if (frontendData.backstory) editData.backstory = frontendData.backstory;
    return editData;
  },

  // Transform backend data to frontend format
  toFrontend: (backendData) => {
    return {
      id: backendData.id || Date.now().toString(),
      name: backendData.name,
      age: backendData.age?.toString() || "",
      job_title: backendData.jobTitle,
      goals: backendData.goals,
      pain_points: backendData.painPoints,
      lifestyle: backendData.lifestyle,
      motivations: backendData.motivations,
      purchasing_habits: backendData.purchasingHabits,
      backstory: backendData.backstory,
      prompt_template: backendData.aiPrompt || "",
      avatar_url: backendData.avatar_url || "",
      is_ai_generated: backendData.is_ai_generated || false,
      created_date: backendData.created_date || new Date().toISOString(),
      updated_date: backendData.updated_date || new Date().toISOString()
    };
  }
};
