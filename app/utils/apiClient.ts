import axios, {
    InternalAxiosRequestConfig,
    AxiosResponse,
    AxiosError,
  } from 'axios';
  
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || '';
  
  const apiClient = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
  });
  
  // Automatically attach token to every request
  apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: AxiosError) => Promise.reject(error),
  );
  
  // Response interceptor: e.g. auto‐refresh / logout on 401
  apiClient.interceptors.response.use(
    (res: AxiosResponse) => res,
    async (error: AxiosError) => {
      if (error.response?.status === 401 || error.response?.status === 403) {
        // token expired or invalid
        alert("Session expired. Please log in again.");
        localStorage.removeItem('token');
        window.location.href = '/';
      }
      return Promise.reject(error);
    },
  );
  
  export default apiClient;
  
  // Generic helpers
  export async function get<T>(url: string, params?: any): Promise<T> {
    const res = await apiClient.get<T>(url, { params });
    return res.data;
  }
  
  export async function post<T, U = any>(
    url: string,
    body: U,
  ): Promise<T> {
    const res = await apiClient.post<T>(url, body);
    return res.data;
  }
  
  export async function put<T, U = any>(
    url: string,
    body: U,
  ): Promise<T> {
    const res = await apiClient.put<T>(url, body);
    return res.data;
  }
  
  export async function del<T>(url: string): Promise<T> {
    const res = await apiClient.delete<T>(url);
    return res.data;
  }
  