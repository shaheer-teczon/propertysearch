const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return `${import.meta.env.VITE_API_URL}`;
  }

  if (import.meta.env.MODE === "development") {
    return "http://localhost:8000";
  }

  return "/api";
};

export const API_URL = getBaseUrl();
