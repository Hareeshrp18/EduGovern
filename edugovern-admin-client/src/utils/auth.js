const TOKEN_KEY = 'edugovern_admin_token';


export const getToken = () => {
  return sessionStorage.getItem(TOKEN_KEY);
};

/**
 * Store JWT token in sessionStorage
 * @param {string} token - JWT token
 */
export const setToken = (token) => {
  sessionStorage.setItem(TOKEN_KEY, token);
};

/**
 * Remove JWT token from sessionStorage
 */
export const removeToken = () => {
  sessionStorage.removeItem(TOKEN_KEY);
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if token exists
 */
export const isAuthenticated = () => {
  return !!getToken();
};

