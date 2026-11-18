const defaultApiUrl =
  process.env.NODE_ENV === 'development'
    ? 'http://127.0.0.1:8000/api/'
    : 'https://canteen-api.coderanwar.online/api/';

export const API_BACKEND_URL = (
  process.env.API_BACKEND_URL || defaultApiUrl
).replace(/\/?$/, '/');
