export type UserRole =
  | 'flight_surgeon'
  | 'mission_director'
  | 'medical_officer'
  | 'biomedical_engineer'
  | 'astronaut_crew'
  | 'ground_controller'
  | 'cadet_student'
  | 'educator_content_creator'
  | 'system_administrator'
  | 'auditor_compliance';

export interface User {
  id: number;
  uuid: string;
  name: string;
  email: string;
  avatar_path?: string | null;
  avatar_url?: string | null;
  is_active: boolean;
  last_login_at?: string | null;
  roles: UserRole[];
  permissions: string[];
  astronaut_id?: number | null;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  hasPermission: (permission: string | string[]) => boolean;
}
