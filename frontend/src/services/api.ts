const getApiUrl = () => {
  let url = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api").trim();
  url = url.replace(/\/+$/, "");
  if (!url.endsWith("/api")) {
    url = `${url}/api`;
  }
  return url;
};

const API_URL = getApiUrl();

interface RequestOptions extends RequestInit {
  body?: any;
}

const getHeaders = (isFormData: boolean = false) => {
  const headers: HeadersInit = {};
  
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  return headers;
};

const handleResponse = async (response: Response) => {
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    if (!response.ok) {
      data = { success: false, message: `Server is warming up (Status ${response.status}). Please try again in 5 seconds.` };
    } else {
      data = { success: false, message: "Invalid JSON response from server" };
    }
  }


  if (!response.ok) {
    // Handle unauthorized/session expired automatically
    if (response.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Optionally redirect to login, but we'll let the AuthContext handle this
    }
    const errorMsg = data.message || "Something went wrong";
    return Promise.reject(new Error(errorMsg));
  }

  return data;
};

export const api = {
  get: async (endpoint: string, options: RequestInit = {}) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "GET",
      headers: getHeaders(),
      ...options
    });
    return handleResponse(response);
  },

  post: async (endpoint: string, body: any, options: RequestOptions = {}) => {
    const isFormData = body instanceof FormData;
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: getHeaders(isFormData),
      body: isFormData ? body : JSON.stringify(body),
      ...options
    });
    return handleResponse(response);
  },

  put: async (endpoint: string, body: any, options: RequestOptions = {}) => {
    const isFormData = body instanceof FormData;
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "PUT",
      headers: getHeaders(isFormData),
      body: isFormData ? body : JSON.stringify(body),
      ...options
    });
    return handleResponse(response);
  },

  delete: async (endpoint: string, options: RequestInit = {}) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "DELETE",
      headers: getHeaders(),
      ...options
    });
    return handleResponse(response);
  }
};
