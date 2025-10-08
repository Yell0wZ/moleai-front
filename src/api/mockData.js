// Mock data for local development
export const mockBusinessProfiles = [
  {
    id: "1",
    business_name: "TechCorp Solutions",
    description: "Leading technology solutions provider specializing in AI and automation",
    products_services: "AI consulting, automation services, cloud solutions, data analytics",
    target_market: "Mid to large enterprises, startups, government agencies",
    competitors: ["TechGiant Inc", "InnovateNow", "FutureTech"],
    industry: "Technology",
    website: "https://techcorp.com",
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString()
  }
];

export const mockPersonas = [
  {
    id: "1",
    name: "Sarah Chen",
    age: "32",
    job_title: "CTO",
    lifestyle: "Tech-savvy, works long hours, values efficiency",
    goals: "Scale technology infrastructure, improve team productivity",
    pain_points: "Legacy systems, integration challenges, budget constraints",
    motivations: "Innovation, competitive advantage, team growth",
    purchasing_habits: "Research-heavy, ROI-focused, prefers demos",
    backstory: "Started as a developer, moved up through technical leadership roles",
    avatar_url: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    prompt_template: "As a CTO at a growing company, I need to understand how [PRODUCT/SERVICE] can help us scale our technology infrastructure while maintaining security and performance standards.",
    is_ai_generated: true,
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString()
  },
  {
    id: "2",
    name: "Michael Rodriguez",
    age: "28",
    job_title: "Product Manager",
    lifestyle: "Data-driven, collaborative, customer-focused",
    goals: "Improve user experience, increase product adoption",
    pain_points: "Limited user feedback, unclear market needs",
    motivations: "User satisfaction, product success, career growth",
    purchasing_habits: "Trial-based, feature comparison, team consensus",
    backstory: "MBA graduate with 5 years in product management",
    avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    prompt_template: "As a Product Manager, I'm evaluating solutions that can help us better understand our users and improve our product roadmap. What insights can you provide about [TOPIC]?",
    is_ai_generated: true,
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString()
  }
];

export const mockPrompts = [
  // Empty array - will use only real data from database
];

// Local storage keys
export const STORAGE_KEYS = {
  BUSINESS_PROFILES: 'mole_ai_business_profiles',
  PERSONAS: 'mole_ai_personas',
  PROMPTS: 'mole_ai_prompts'
};

// Helper functions for local storage
export const getStoredData = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return [];
  }
};

export const setStoredData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error writing to localStorage:', error);
  }
};

// Initialize mock data if not exists
export const initializeMockData = () => {
  if (!getStoredData(STORAGE_KEYS.BUSINESS_PROFILES).length) {
    setStoredData(STORAGE_KEYS.BUSINESS_PROFILES, mockBusinessProfiles);
  }
  if (!getStoredData(STORAGE_KEYS.PERSONAS).length) {
    setStoredData(STORAGE_KEYS.PERSONAS, mockPersonas);
  }
  if (!getStoredData(STORAGE_KEYS.PROMPTS).length) {
    setStoredData(STORAGE_KEYS.PROMPTS, mockPrompts);
  }
};
