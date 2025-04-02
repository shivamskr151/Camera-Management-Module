export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  name: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  change?: number;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export interface Camera {
  id: string;
  name: string;
  status: 'online' | 'offline';
}

export interface CameraConfiguration {
  resolution: string;
  fps: number;
  bitrate: string;
  [key: string]: unknown;
}

export interface CameraConfig extends Camera {
  jsonName: string;
  configuration: Partial<CameraConfiguration>;
}

export interface CameraConfigurationProps {
  onConfigUpdate?: (config: CameraConfig) => void;
  onError?: (error: Error) => void;
}
