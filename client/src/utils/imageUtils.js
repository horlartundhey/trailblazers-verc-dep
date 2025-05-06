export const getFullImagePath = (relativePath) => {
    if (!relativePath) return '/default-profile.png';
    if (relativePath.startsWith('http')) return relativePath;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseUrl}${relativePath.startsWith('/') ? '' : '/'}${relativePath}`;
  };