import axios, { AxiosError, AxiosRequestConfig } from 'axios';

// Define API service URLs using relative paths to work with the proxy
const API_URLS = {
    AUTH: '/api/auth',
    POSTS: '/api/posts',
    FRIENDS: '/api/friendships'  // Use relative path for Vite proxy
};

// Create axios instances for each service
const createAxiosInstance = (baseURL: string) => {
    const instance = axios.create({
        baseURL,
        headers: {
            'Content-Type': 'application/json',
        },
        // Important: allow cookies to be sent with requests
        withCredentials: true,
    });

    // Response interceptor for handling errors
    instance.interceptors.response.use(
        (response) => response,
        (error: AxiosError) => {
            // Handle 401 Unauthorized errors
            if (error.response?.status === 401 && !error.config?.url?.includes('/login') && !error.config?.url?.includes('/register')) {
                console.log("Authentication error:", error.response?.status);
            }
            return Promise.reject(error);
        }
    );

    return instance;
};

// Create API services - using proxy for all services
export const authApi = createAxiosInstance(API_URLS.AUTH);
export const postsApi = createAxiosInstance(API_URLS.POSTS);
export const friendsApi = createAxiosInstance(API_URLS.FRIENDS);

// For debugging
console.log('API base URLs:', {
    auth: API_URLS.AUTH,
    posts: API_URLS.POSTS,
    friends: API_URLS.FRIENDS
});

// Generic GET request function with proper typing
export const fetchData = async <T>(
    apiInstance: typeof authApi | typeof postsApi | typeof friendsApi,
    endpoint: string,
    config?: AxiosRequestConfig
): Promise<T> => {
    // Always ensure withCredentials is set for cross-domain cookie sharing
    const finalConfig = {
        ...config,
        withCredentials: true
    };
    const response = await apiInstance.get<T>(endpoint, finalConfig);
    return response.data;
};

// Generic POST request function
export const postData = async <T, D>(
    apiInstance: typeof authApi | typeof postsApi | typeof friendsApi,
    endpoint: string,
    data: D,
    config?: AxiosRequestConfig
): Promise<T> => {
    // Always ensure withCredentials is set for cross-domain cookie sharing
    const finalConfig = {
        ...config,
        withCredentials: true
    };
    const response = await apiInstance.post<T>(endpoint, data, finalConfig);
    return response.data;
};

// Generic POST form data function (for file uploads)
export const postFormData = async <T>(
    apiInstance: typeof authApi | typeof postsApi | typeof friendsApi,
    endpoint: string,
    formData: FormData,
    config?: AxiosRequestConfig
): Promise<T> => {
    // Set proper headers for form data
    const finalConfig = {
        ...config,
        withCredentials: true,
        headers: {
            ...config?.headers,
            'Content-Type': 'multipart/form-data',
        },
    };
    const response = await apiInstance.post<T>(endpoint, formData, finalConfig);
    return response.data;
};

// Generic PUT request function
export const putData = async <T, D>(
    apiInstance: typeof authApi | typeof postsApi | typeof friendsApi,
    endpoint: string,
    data: D,
    config?: AxiosRequestConfig
): Promise<T> => {
    // Always ensure withCredentials is set for cross-domain cookie sharing
    const finalConfig = {
        ...config,
        withCredentials: true
    };
    const response = await apiInstance.put<T>(endpoint, data, finalConfig);
    return response.data;
};

// Generic DELETE request function
export const deleteData = async <T>(
    apiInstance: typeof authApi | typeof postsApi | typeof friendsApi,
    endpoint: string,
    config?: AxiosRequestConfig
): Promise<T> => {
    // Always ensure withCredentials is set for cross-domain cookie sharing
    const finalConfig = {
        ...config,
        withCredentials: true
    };
    const response = await apiInstance.delete<T>(endpoint, finalConfig);
    return response.data;
};