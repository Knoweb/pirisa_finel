import { axiosInstance } from '../config/axios';
import { LoginRequest, LoginResponse } from '../types/auth.types';

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await axiosInstance.post<LoginResponse>('/login', credentials);
    return response.data;
  },
};