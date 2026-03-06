export interface User {
  id: number;
  email: string;
  role: UserRole;
  createdAt: string;
}

export enum UserRole {
  USER = 'user',
  FC_LEADER = 'fc_leader',
  ADMIN = 'admin',
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: number; email: string };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}
