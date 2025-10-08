import {
  getStoredData,
  setStoredData,
  initializeMockData,
  STORAGE_KEYS
} from './mockData.js';
import {
  BusinessProfileAPI,
  transformBusinessProfileData,
  PersonaAPI,
  transformPersonaData,
  UserDataProfileAPI,
  transformUserDataProfile,
  AiPromptAPI,
  transformAiPromptData,
  CompetitorAPI,
  transformCompetitorData,
  BusinessAPI
} from './firebaseClient.js';
import { getCurrentUserUid } from './userContext.js';

// Initialize mock data on first load
initializeMockData();

// Generic CRUD operations
const createEntity = (storageKey, data) => {
  const entities = getStoredData(storageKey);
  const newEntity = {
    ...data,
    id: Date.now().toString(),
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString()
  };
  entities.push(newEntity);
  setStoredData(storageKey, entities);
  return newEntity;
};

const listEntities = (storageKey, sortBy = null) => {
  let entities = getStoredData(storageKey);
  
  if (sortBy) {
    const isDesc = sortBy.startsWith('-');
    const field = isDesc ? sortBy.substring(1) : sortBy;
    
    entities.sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];
      
      if (aVal < bVal) return isDesc ? 1 : -1;
      if (aVal > bVal) return isDesc ? -1 : 1;
      return 0;
    });
  }
  
  return entities;
};

const getEntity = (storageKey, id) => {
  const entities = getStoredData(storageKey);
  return entities.find(entity => entity.id === id);
};

const updateEntity = (storageKey, id, data) => {
  const entities = getStoredData(storageKey);
  const index = entities.findIndex(entity => entity.id === id);
  
  if (index !== -1) {
    entities[index] = {
      ...entities[index],
      ...data,
      updated_date: new Date().toISOString()
    };
    setStoredData(storageKey, entities);
    return entities[index];
  }
  
  throw new Error(`Entity with id ${id} not found`);
};

const deleteEntity = (storageKey, id) => {
  const entities = getStoredData(storageKey);
  const filteredEntities = entities.filter(entity => entity.id !== id);
  setStoredData(storageKey, filteredEntities);
  return true;
};

// Business Profile API - Connected to Firebase
export const BusinessProfile = {
  list: async (sortBy) => {
    // For now, return empty array since we don't have a list endpoint
    // In the future, you might want to implement a list endpoint in Firebase
    return [];
  },
  
  get: async (id) => {
    try {
      const result = await BusinessProfileAPI.get(id);
      return transformBusinessProfileData.toFrontend(result);
    } catch (error) {
      console.error('Error fetching business profile:', error);
      throw error;
    }
  },
  
  create: async (data, businessId = null) => {
    try {
      const backendData = transformBusinessProfileData.toBackend(data);
      
      // הוסף את businessId רק אם זה עסק משני (לא ראשי)
      if (businessId) {
        backendData.businessId = businessId;
        console.log('BusinessProfile.create - Adding businessId for secondary business:', businessId);
      } else {
        console.log('BusinessProfile.create - Creating primary business (no businessId)');
      }
      
      console.log('BusinessProfile.create - Sending data to server:', backendData);
      const result = await BusinessProfileAPI.create(backendData);
      return transformBusinessProfileData.toFrontend(result);
    } catch (error) {
      console.error('Error creating business profile:', error);
      throw error;
    }
  },
  
  update: async (id, data, businessId = null) => {
    try {
      const backendData = transformBusinessProfileData.toBackend(data);
      
      // הוסף את businessId רק אם זה עסק משני (לא ראשי)
      if (businessId) {
        backendData.businessId = businessId;
        console.log('BusinessProfile.update - Adding businessId for secondary business:', businessId);
      } else {
        console.log('BusinessProfile.update - Updating primary business (no businessId)');
      }
      
      console.log('BusinessProfile.update - Sending data to server:', backendData);
      const result = await BusinessProfileAPI.update(id, backendData);
      return transformBusinessProfileData.toFrontend(result);
    } catch (error) {
      console.error('Error updating business profile:', error);
      throw error;
    }
  },
  
  delete: async (id) => {
    try {
      await BusinessProfileAPI.delete(id);
      return true;
    } catch (error) {
      console.error('Error deleting business profile:', error);
      throw error;
    }
  },

  // Check if business profile exists for current user
  checkExists: async (businessId = null) => {
    try {
      const uid = getCurrentUserUid();
      const result = await UserDataProfileAPI.getUserData(uid);

      const transformed = transformUserDataProfile.toFrontend(result);
      
      if (businessId === null) {
        // Check if primary business profile exists
        const exists = transformed.businessProfile !== null;
        return exists;
      } else {
        // Check if secondary business exists
        const secondaryBusiness = transformed.secondaryBusinesses?.find(b => b.id === businessId);
        return secondaryBusiness !== null;
      }
    } catch (error) {
      console.error('Error checking business profile existence:', error);
      return false;
    }
  },

  // Get business profile for current user
  getCurrentUser: async (businessId = null) => {
    try {
      const uid = getCurrentUserUid();
      const result = await UserDataProfileAPI.getUserData(uid);

      const transformed = transformUserDataProfile.toFrontend(result);
      
      if (businessId === null) {
        // Return primary business profile
        return transformed.businessProfile;
      } else {
        // Return secondary business profile
        const secondaryBusiness = transformed.secondaryBusinesses?.find(b => b.id === businessId);
        return secondaryBusiness || null;
      }
    } catch (error) {
      console.error('Error getting current user business profile:', error);
      return null;
    }
  }
};

// Persona API - Connected to Firebase
export const Persona = {
  list: async (sortBy, businessId = null) => {
    try {
      const uid = getCurrentUserUid();
      console.log('Fetching user data for uid:', uid, 'businessId:', businessId);
      const result = await UserDataProfileAPI.getUserData(uid);
      console.log('Raw getUserData result:', result);

      const transformed = transformUserDataProfile.toFrontend(result);
      console.log('Transformed data:', transformed);

      let personas = [];
      
      if (businessId === null) {
        // Primary business personas - try both locations
        personas = transformed.businessProfile?.personas || transformed.personas || [];
      } else {
        // Secondary business personas
        const secondaryBusiness = transformed.secondaryBusinesses?.find(b => b.id === businessId);
        personas = secondaryBusiness?.personas || [];
      }
      
      console.log('Personas from transformed data:', personas);
      console.log('Business profile personas:', transformed.businessProfile?.personas);
      console.log('Top level personas:', transformed.personas);

      // Sort if requested
      if (sortBy) {
        const isDesc = sortBy.startsWith('-');
        const field = isDesc ? sortBy.substring(1) : sortBy;

        personas.sort((a, b) => {
          const aVal = a[field];
          const bVal = b[field];

          if (aVal < bVal) return isDesc ? 1 : -1;
          if (aVal > bVal) return isDesc ? -1 : 1;
          return 0;
        });
      }

      console.log('Final personas list:', personas);
      return personas;
    } catch (error) {
      console.error('Error getting personas:', error);
      // Don't fall back to mock data for onboarding check - return empty array
      return [];
    }
  },

  get: async (id) => {
    // For now, return mock data since we don't have a get endpoint
    return getEntity(STORAGE_KEYS.PERSONAS, id);
  },

  create: async (data, businessId = null) => {
    try {
      const uid = getCurrentUserUid();
      const backendData = transformPersonaData.toBackendManual(data, uid);
      
      // Add businessId if provided (for secondary businesses)
      if (businessId) {
        backendData.businessId = businessId;
      }
      
      const result = await PersonaAPI.createManual(backendData);
      return transformPersonaData.toFrontend(result);
    } catch (error) {
      console.error('Error creating persona:', error);
      throw error;
    }
  },

  update: async (id, data, businessId = null) => {
    try {
      const uid = getCurrentUserUid();
      const backendData = transformPersonaData.toBackendEdit(data);
      
      // Add businessId if provided (for secondary businesses)
      if (businessId) {
        backendData.businessId = businessId;
      }
      
      const result = await PersonaAPI.edit(uid, id, backendData);
      return transformPersonaData.toFrontend(result);
    } catch (error) {
      console.error('Error updating persona:', error);
      throw error;
    }
  },

  delete: async (id, businessId = null) => {
    try {
      const uid = getCurrentUserUid();
      
      // Add businessId to the URL if provided (for secondary businesses)
      const url = businessId 
        ? `https://deletepersona-thg3z73fma-uc.a.run.app/personas/${id}?businessId=${businessId}`
        : `https://deletepersona-thg3z73fma-uc.a.run.app/personas/${id}`;
      
      await PersonaAPI.delete(uid, id, url);
      return true;
    } catch (error) {
      console.error('Error deleting persona:', error);
      throw error;
    }
  },

  // Create AI personas
  createAI: async (count = 5, businessId = null) => {
    try {
      const uid = getCurrentUserUid();
      console.log('Calling PersonaAPI.createAI with uid:', uid, 'count:', count, 'businessId:', businessId);
      
      const data = { uid, count };
      if (businessId) {
        data.businessId = businessId;
      }
      
      const result = await PersonaAPI.createAI(uid, count, data);
      console.log('Raw API response from createAI:', result);

      // Check if the API returned an error
      if (result.ok === false) {
        const errorMsg = result.error || 'Failed to create AI personas';
        console.error('API error response:', errorMsg);
        console.error('Full API response:', JSON.stringify(result));
        throw new Error(errorMsg);
      }

      // Get the personas array from the response
      const personasArray = result.personas || result;

      // Transform the result to frontend format
      if (Array.isArray(personasArray)) {
        console.log('Transforming personas array:', personasArray);
        const transformed = personasArray.map(persona => transformPersonaData.toFrontend(persona));
        console.log('Transformed personas:', transformed);
        return transformed;
      }
      const transformed = [transformPersonaData.toFrontend(personasArray)];
      console.log('Transformed single persona:', transformed);
      return transformed;
    } catch (error) {
      console.error('Error creating AI personas:', error);
      throw error;
    }
  }
};

// Prompt API with Firebase integration
export const Prompt = {
  list: async (sortBy, businessId = null) => {
    try {
      const uid = getCurrentUserUid();
      const result = await UserDataProfileAPI.getUserData(uid);

      const transformed = transformUserDataProfile.toFrontend(result);

      let prompts = [];
      
      if (businessId === null) {
        // Primary business prompts - filter by personas of primary business
        const primaryPersonas = transformed.businessProfile?.personas || [];
        const primaryPersonaIds = primaryPersonas.map(p => p.id || p.personaId);
        
        console.log('Prompt.list - Primary business personas:', primaryPersonas);
        console.log('Prompt.list - Primary business personaIds:', primaryPersonaIds);
        
        prompts = (transformed.prompts || []).filter(prompt => {
          // Include prompts that belong to primary business personas
          // or prompts without personaId (backward compatibility)
          return !prompt.personaId || primaryPersonaIds.includes(prompt.personaId);
        });
      } else {
        // For secondary businesses, get prompts directly from the business
        const secondaryBusiness = transformed.secondaryBusinesses?.find(b => b.id === businessId);
        console.log('Prompt.list - Secondary business found:', secondaryBusiness);
        
        if (secondaryBusiness && secondaryBusiness.prompts) {
          // Prompts are stored directly in the secondary business
          prompts = secondaryBusiness.prompts;
          console.log('Prompt.list - Found prompts in secondary business:', prompts);
        } else {
          // Fallback: try to filter global prompts by businessId or personaId
          const secondaryPersonas = secondaryBusiness?.personas || [];
          const secondaryPersonaIds = secondaryPersonas.map(p => p.id || p.personaId);
          
          console.log('Prompt.list - Secondary business personas:', secondaryPersonas);
          console.log('Prompt.list - Secondary business personaIds:', secondaryPersonaIds);
          console.log('Prompt.list - All prompts before filtering:', transformed.prompts);
          
          // Debug each prompt's personaId and businessId
          transformed.prompts.forEach((prompt, index) => {
            console.log(`Prompt.list - Prompt ${index} personaId:`, prompt.personaId);
            console.log(`Prompt.list - Prompt ${index} personaId type:`, typeof prompt.personaId);
            console.log(`Prompt.list - Prompt ${index} businessId:`, prompt.businessId);
            console.log(`Prompt.list - Prompt ${index} businessId type:`, typeof prompt.businessId);
            console.log(`Prompt.list - Prompt ${index} personaId in secondaryPersonaIds:`, secondaryPersonaIds.includes(prompt.personaId));
            console.log(`Prompt.list - Prompt ${index} businessId matches:`, prompt.businessId === businessId);
          });
          
          prompts = (transformed.prompts || []).filter(prompt => {
            // Filter by businessId if it exists, otherwise fall back to personaId filtering
            if (prompt.businessId) {
              return prompt.businessId === businessId;
            } else {
              return prompt.personaId && secondaryPersonaIds.includes(prompt.personaId);
            }
          });
        }
      }

      // Sort if requested
      if (sortBy) {
        const isDesc = sortBy.startsWith('-');
        const field = isDesc ? sortBy.substring(1) : sortBy;

        prompts.sort((a, b) => {
          const aVal = a[field];
          const bVal = b[field];

          if (aVal < bVal) return isDesc ? 1 : -1;
          if (aVal > bVal) return isDesc ? -1 : 1;
          return 0;
        });
      }

      console.log('Prompt.list - businessId:', businessId);
      console.log('Prompt.list - filtered prompts:', prompts);
      return prompts;
    } catch (error) {
      console.error('Error getting prompts:', error);
      // Fallback to mock data
      return listEntities(STORAGE_KEYS.PROMPTS, sortBy);
    }
  },

  get: (id) => getEntity(STORAGE_KEYS.PROMPTS, id),

  create: async (data, businessId = null) => {
    try {
      console.log('Prompt.create - data:', data);
      console.log('Prompt.create - businessId:', businessId);
      
      const uid = getCurrentUserUid();
      const frontendData = {
        ...data,
        uid
      };
      
      console.log('Prompt.create - frontendData before transform:', frontendData);
      
      const backendData = transformAiPromptData.toBackend(frontendData);
      console.log('Prompt.create - backendData after transform:', backendData);

      // Add businessId if provided (for secondary businesses)
      if (businessId) {
        backendData.businessId = businessId;
        console.log('Prompt.create - Added businessId to backendData:', backendData);
      }

      console.log('Prompt.create - Final backendData being sent:', backendData);
      const result = await AiPromptAPI.create(backendData);
      console.log('Prompt.create - Result from backend:', result);

      const frontendResult = transformAiPromptData.toFrontend(result);
      console.log('Prompt.create - Final frontend result:', frontendResult);
      return frontendResult;
    } catch (error) {
      console.error('Error creating AI prompt:', error);
      throw error;
    }
  },

  update: (id, data) => updateEntity(STORAGE_KEYS.PROMPTS, id, data),
  delete: (id) => deleteEntity(STORAGE_KEYS.PROMPTS, id)
};

// User preferences helper
export const UserPreferences = {
  get: async () => {
    try {
      const uid = getCurrentUserUid();
      const result = await UserDataProfileAPI.getUserData(uid);
      const transformed = transformUserDataProfile.toFrontend(result);
      return transformed.userProfile;
    } catch (error) {
      console.error('Error loading user preferences:', error);
      return null;
    }
  }
};

// Mock AI/LLM integration
export const InvokeLLM = {
  invoke: async (prompt, options = {}) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Generate mock response based on prompt content
    const responses = [
      "Based on the analysis, this solution offers significant value for your use case. The key benefits include improved efficiency, cost reduction, and enhanced user experience.",
      "The data suggests strong market potential with growing demand in this sector. Key opportunities include expanding into new markets and developing complementary services.",
      "Our research indicates that customers in this segment prioritize reliability, ease of use, and comprehensive support. These factors should be emphasized in your strategy.",
      "The competitive landscape shows several players, but there's room for differentiation through innovation and superior customer service.",
      "Market trends point to increasing adoption of similar solutions, with particular growth in the enterprise segment over the next 12-18 months."
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    return {
      response: randomResponse,
      tokens_used: Math.floor(Math.random() * 1000) + 500,
      processing_time: Math.floor(Math.random() * 2000) + 1000
    };
  }
};

// Mock email integration
export const SendEmail = {
  send: async (to, subject, body) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true, messageId: `mock-${Date.now()}` };
  }
};

// Mock file upload
export const UploadFile = {
  upload: async (file) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      success: true,
      fileId: `file-${Date.now()}`,
      url: `https://mock-cdn.com/files/${Date.now()}`,
      size: file.size,
      type: file.type
    };
  }
};

// Mock image generation
export const GenerateImage = {
  generate: async (prompt) => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
      success: true,
      imageUrl: `https://picsum.photos/512/512?random=${Date.now()}`,
      prompt: prompt
    };
  }
};

// Mock data extraction
export const ExtractDataFromUploadedFile = {
  extract: async (fileId) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      success: true,
      extractedData: {
        text: "Sample extracted text from document",
        metadata: {
          pages: 5,
          words: 1250,
          language: "en"
        }
      }
    };
  }
};

// Mock signed URL creation
export const CreateFileSignedUrl = {
  create: async (fileId) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      success: true,
      signedUrl: `https://mock-storage.com/signed/${fileId}?expires=${Date.now() + 3600000}`
    };
  }
};

// Mock private file upload
export const UploadPrivateFile = {
  upload: async (file) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      success: true,
      fileId: `private-${Date.now()}`,
      url: `https://private-storage.com/files/${Date.now()}`,
      size: file.size,
      type: file.type
    };
  }
};

// Mock Core integration
export const Core = {
  InvokeLLM,
  SendEmail,
  UploadFile,
  GenerateImage,
  ExtractDataFromUploadedFile,
  CreateFileSignedUrl,
  UploadPrivateFile
};

// Competitor API with Firebase integration
export const Competitor = {
  list: async (businessId = null) => {
    try {
      const uid = getCurrentUserUid();
      const result = await UserDataProfileAPI.getUserData(uid);

      const transformed = transformUserDataProfile.toFrontend(result);

      let competitors = [];
      
      if (businessId === null) {
        // Primary business competitors
        competitors = transformed.competitors || [];
      } else {
        // Secondary business competitors
        const secondaryBusiness = transformed.secondaryBusinesses?.find(b => b.id === businessId);
        competitors = secondaryBusiness?.competitors || [];
      }

      return competitors;
    } catch (error) {
      console.error('Error getting competitors:', error);
      // Fallback to mock data
      return listEntities(STORAGE_KEYS.BUSINESS_PROFILES, null).map(profile =>
        profile.competitors || []
      ).flat();
    }
  },

  create: async (data, businessId = null) => {
    try {
      const uid = getCurrentUserUid();
      const backendData = transformCompetitorData.toBackend({
        ...data,
        uid
      });

      // Add businessId if provided (for secondary businesses)
      if (businessId) {
        backendData.businessId = businessId;
      }

      const result = await CompetitorAPI.create(backendData);

      return transformCompetitorData.toFrontend(result);
    } catch (error) {
      console.error('Error creating competitor:', error);
      throw error;
    }
  },

  delete: async (data, businessId = null) => {
    try {
      const uid = getCurrentUserUid();

      // Try different data formats to match Firebase function expectations
      const backendData = {
        uid: uid,
        name: data.name
      };

      // Add businessId if provided (for secondary businesses)
      if (businessId) {
        backendData.businessId = businessId;
      }

      // Try to ensure the name is a string
      if (typeof data.name !== 'string') {
        console.warn('Name is not a string, converting...');
        backendData.name = String(data.name);
      }

      // Try to ensure uid is a string
      if (typeof uid !== 'string') {
        console.warn('UID is not a string, converting...');
        backendData.uid = String(uid);
      }

      // Log the final data being sent

      const result = await CompetitorAPI.delete(backendData);

      return result;
    } catch (error) {
      console.error('Error deleting competitor:', error);
      console.error('Error details:', error.message);
      throw error;
    }
  },

  // Bulk operations for competitors
  createBulk: async (competitors, businessId = null) => {
    try {
      const uid = getCurrentUserUid();
      
      const backendData = {
        competitors: competitors.map(competitor => ({ name: competitor.name })),
        businessId: businessId || undefined
      };

      const result = await CompetitorAPI.createBulk(backendData);
      return result;
    } catch (error) {
      console.error('Error creating competitors in bulk:', error);
      throw error;
    }
  },

  deleteBulk: async (competitors, businessId = null) => {
    try {
      const uid = getCurrentUserUid();
      
      // Send each competitor individually in the same format as single delete
      const results = [];
      for (const competitor of competitors) {
        const backendData = {
          uid: uid,
          name: competitor.name
        };

        // Add businessId if provided (for secondary businesses)
        if (businessId) {
          backendData.businessId = businessId;
        }

        const result = await CompetitorAPI.delete(backendData);
        results.push(result);
      }

      return results;
    } catch (error) {
      console.error('Error deleting competitors in bulk:', error);
      throw error;
    }
  }
};

// Business API with Firebase integration
export const Business = {
  // Delete secondary business
  delete: async (businessId) => {
    try {
      const uid = getCurrentUserUid();
      const backendData = {
        uid: uid,
        businessId: businessId
      };

      const result = await BusinessAPI.delete(backendData);
      return result;
    } catch (error) {
      console.error('Error deleting business:', error);
      throw error;
    }
  }
};

// Mock User/Auth (simplified for local development)
export const User = {
  getCurrentUser: () => ({
    id: "mock-user-1",
    name: "Demo User",
    email: "demo@example.com"
  }),
  isAuthenticated: () => true
};
