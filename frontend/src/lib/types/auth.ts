export interface User {
  id: string;
  name: string;
  email: string;
  organization_id: string;
}

export interface Project {
  id: string;
  name: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface RegisterRequest {
  name: string;
  email_prefix: string;
  password: string;
}

export interface LoginRequest {
  email_prefix: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface CreateProjectRequest {
  name: string;
}
