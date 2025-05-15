// src/utils/useSecureFetch.js
export const useSecureFetch = () => {
    const secureFetch = async (url, options = {}) => {
      const token = localStorage.getItem("token");
  
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
  
      try {
        const response = await fetch(url, options);
  
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          window.location.href = "/login"; // ✅ More reliable than useNavigate inside async
          return null;
        }
  
        return response;
      } catch (error) {
        console.error("secureFetch error:", error);
        return null;
      }
    };
  
    return secureFetch;
  };
  