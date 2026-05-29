import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: 'http://10.0.2.2:3000/api/v1',
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
        const { data } = await axios.post('http://10.0.2.2:3000/api/v1/auth/refresh', {
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
