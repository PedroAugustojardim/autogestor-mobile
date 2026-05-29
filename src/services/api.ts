import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PROD_URL = 'https://autogestor-api-production.up.railway.app/api/v1';
const DEV_URL = 'http://10.0.2.2:3000/api/v1';

const api = axios.create({
  baseURL: __DEV__ ? DEV_URL : PROD_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('@autogestor:token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await AsyncStorage.getItem('@autogestor:refreshToken');
        const { data } = await axios.post(`${__DEV__ ? DEV_URL : PROD_URL}/auth/refresh`, {
          refreshToken,
        });
        await AsyncStorage.setItem('@autogestor:token', data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch {
        await AsyncStorage.multiRemove(['@autogestor:token', '@autogestor:refreshToken']);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
