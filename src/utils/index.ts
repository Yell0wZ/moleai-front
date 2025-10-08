export function createPageUrl(pageName: string, businessId?: string, isPrimary?: boolean) {
    // Handle special case for BusinessProfile
    let baseUrl;
    if (pageName === 'BusinessProfile') {
        baseUrl = '/businessprofile';
    } else {
        baseUrl = '/' + pageName.toLowerCase().replace(/ /g, '-');
    }
    
    // Primary business doesn't need ID in URL
    if (isPrimary) {
        return baseUrl;
    }
    
    // Secondary businesses need ID in URL
    if (businessId) {
        return `/${businessId}${baseUrl}`;
    }
    
    return baseUrl;
}
