export const getFullImagePath = (relativePath) => {
    if (!relativePath) return '/default-profile.png';
    if (relativePath.startsWith('http')) return relativePath;
    const baseUrl = import.meta.env.VITE_API_URL || 'https://trailblazers-verc-server.vercel.app';
    // const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'; // For local development
    return `${baseUrl}${relativePath.startsWith('/') ? '' : '/'}${relativePath}`;
  };