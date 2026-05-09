const BACKEND_URL = 'http://localhost:8000';

export const getImageUrl = (path: string | null | undefined): string => {
  if (!path) return 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800'; // Fallback
  
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Local media path (e.g., products/image.jpg)
  // Ensure we don't double the slash
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Django's MEDIA_URL is /media/
  if (cleanPath.startsWith('media/')) {
    return `${BACKEND_URL}/${cleanPath}`;
  }
  
  return `${BACKEND_URL}/media/${cleanPath}`;
};
