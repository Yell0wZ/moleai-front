import Layout from "./Layout.jsx";

import BusinessProfile from "./BusinessProfile";

import Analytics from "./Analytics";

import Persona from "./Persona";

import Prompt from "./Prompt";

import Competitor from "./Competitor";
import Profile from "./Profile";

import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';

const PAGES = {
    
    BusinessProfile: BusinessProfile,
    
    Analytics: Analytics,
    
    Avatar: Persona,
    
    Prompt: Prompt,
    
    Competitor: Competitor,
    Profile: Profile,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    
    // Handle root path - should be BusinessProfile
    if (url === '' || url === '/') {
        return 'BusinessProfile';
    }
    
    // Handle new URL structure: /businessId/tab
    const urlParts = url.split('/').filter(part => part !== '');
    
    // If we have 2 parts, it's /businessId/tab
    if (urlParts.length >= 2) {
        const tab = urlParts[urlParts.length - 1];
        if (tab.includes('?')) {
            const cleanTab = tab.split('?')[0];
            const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === cleanTab.toLowerCase());
            return pageName || 'BusinessProfile';
        }
        const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === tab.toLowerCase());
        return pageName || 'BusinessProfile';
    }
    
    // Handle single part URLs like /businessprofile, /analytics, etc.
    if (urlParts.length === 1) {
        const tab = urlParts[0];
        if (tab.includes('?')) {
            const cleanTab = tab.split('?')[0];
            const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === cleanTab.toLowerCase());
            return pageName || 'BusinessProfile';
        }
        const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === tab.toLowerCase());
        return pageName || 'BusinessProfile';
    }
    
    // Fallback to old logic for backward compatibility
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || 'BusinessProfile';
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    // Extract businessId from URL
    const pathParts = location.pathname.split('/').filter(part => part !== '');
    const businessId = pathParts.length >= 2 ? pathParts[0] : null;
    
    return (
        <Layout currentPageName={currentPage} businessId={businessId}>
            <Routes>            

                <Route path="/" element={<Navigate to="/businessprofile" replace />} />
                

                <Route path="/businessprofile" element={<BusinessProfile businessId={businessId} />} />
                <Route path="/analytics" element={<Analytics businessId={businessId} />} />
                <Route path="/avatar" element={<Persona businessId={businessId} />} />
                <Route path="/prompt" element={<Prompt businessId={businessId} />} />
                <Route path="/competitor" element={<Competitor businessId={businessId} />} />
                <Route path="/profile" element={<Profile businessId={businessId} />} />
                

                <Route path="/BusinessProfile" element={<Navigate to="/businessprofile" replace />} />
                <Route path="/Analytics" element={<Navigate to="/analytics" replace />} />
                <Route path="/Prompt" element={<Navigate to="/prompt" replace />} />
                <Route path="/Competitor" element={<Navigate to="/competitor" replace />} />
                <Route path="/Profile" element={<Navigate to="/profile" replace />} />
                

                <Route path="/:businessId/businessprofile" element={<BusinessProfile businessId={businessId} />} />
                <Route path="/:businessId/analytics" element={<Analytics businessId={businessId} />} />
                <Route path="/:businessId/avatar" element={<Persona businessId={businessId} />} />
                <Route path="/:businessId/prompt" element={<Prompt businessId={businessId} />} />
                <Route path="/:businessId/competitor" element={<Competitor businessId={businessId} />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}
