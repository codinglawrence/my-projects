import request from '../utils/request';

export interface User {
  id: number;
  username: string;
  role: string;
  created_at: string;
}

export interface AuthResult {
  token: string;
  user: User;
}

export const authApi = {
  register: (username: string, password: string) =>
    request.post<any, { data: AuthResult }>('/auth/register', { username, password }),

  login: (username: string, password: string) =>
    request.post<any, { data: AuthResult }>('/auth/login', { username, password }),

  changePassword: (old_password: string, new_password: string) =>
    request.put('/auth/password', { old_password, new_password }),

  getMe: () => request.get<any, { data: User }>('/user/me'),
};
