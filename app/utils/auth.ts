// src/utils/auth.ts
import axios from 'axios';
import apiClient from './apiClient';

export type Role = 'ADMIN' | 'EMPLOYEE';

export interface AdminLoginPayload {
  email: string;
  password: string;
}
export interface EmployeeLoginPayload {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  message: string;
  email: string;
  token: string;
}

export interface EmployeeLoginResponse {
  token: string;
  employeeEmail: string;
}

export type LoginResponse = AdminLoginResponse | EmployeeLoginResponse;

/**
 * Log in as either an admin or an employee.
 * @param role  “admin” or “employee”
 * @param payload  { email, password }
 */
export async function login(
  role: Role,
  payload: Role extends 'ADMIN' ? AdminLoginPayload : EmployeeLoginPayload
): Promise<LoginResponse> {
  const url =
    role === 'ADMIN'
      ? '/api/auth/admin/login'
      : '/api/auth/employee/login';

  const { data } = await apiClient.post<LoginResponse>(url, payload);
  return data;
}
