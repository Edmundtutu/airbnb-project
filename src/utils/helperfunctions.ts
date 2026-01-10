/**
 * Helper function to get full image URL
 */
export const getImageUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    
    // If URL is already absolute (starts with http:// or https://), use it directly
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    
    const apiBaseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    
    // If relative URL starting with /storage
    if (url.startsWith('/storage/')) {
        const result = `${apiBaseUrl}${url}`;
        console.log('🖼️ Image URL (with /storage/):', url, '→', result);
        return result;
    }
    
    // If relative URL starting with storage (no leading slash)
    if (url.startsWith('storage/')) {
        const result = `${apiBaseUrl}/${url}`;
        console.log('🖼️ Image URL (with storage/):', url, '→', result);
        return result;
    }
    
    // If it's just a filename or path, assume it's in storage
    // This handles cases where backend returns just the filename or relative path
    if (url && !url.includes('://')) {
        // If it doesn't already start with storage, prepend /storage/
        const path = url.startsWith('/') ? url : `/${url}`;
        const result = `${apiBaseUrl}/storage${path}`;
        console.log('🖼️ Image URL (other format):', url, '→', result);
        return result;
    }
    
    // If none of the above patterns match, return null
    console.warn('⚠️ Invalid image URL format:', url);
    return null;
};
