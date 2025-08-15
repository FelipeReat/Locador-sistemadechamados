import { User } from '@shared/schema';

interface AuthUser extends Omit<User, 'password'> {
  teams?: Array<{
    id: string;
    name: string;
    roles: string[];
  }>;
}

class AuthService {
  private user: AuthUser | null = null;
  private token: string | null = null;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const token = localStorage.getItem('auth-token');
    const userData = localStorage.getItem('auth-user');

    if (token && userData) {
      this.token = token;
      try {
        this.user = JSON.parse(userData);
      } catch {
        this.logout();
      }
    }
  }

  private saveToStorage() {
    if (this.token && this.user) {
      localStorage.setItem('auth-token', this.token);
      localStorage.setItem('auth-user', JSON.stringify(this.user));
    } else {
      localStorage.removeItem('auth-token');
      localStorage.removeItem('auth-user');
    }
  }

  async login(username: string, password: string): Promise<void> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro no login');
    }

    const data = await response.json();
    this.setToken(data.token);
    this.setUser(data.user);

    // Fetch full user data with teams
    await this.fetchUserData();

    return this.user;
  }

  async register(username: string, password: string, name: string, orgName: string, orgDomain: string): Promise<void> {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password, name, orgName, orgDomain }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro no registro');
    }

    const data = await response.json();
    this.setToken(data.token);
    this.setUser(data.user);

    // Fetch full user data with teams
    await this.fetchUserData();

    return this.user;
  }

  async fetchUserData() {
    if (!this.token) return null;

    try {
      const response = await fetch('/api/me', {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        this.user = await response.json();
        this.saveToStorage();
        return this.user;
      } else if (response.status === 401 || response.status === 403) {
        // Token is invalid, logout
        this.logout();
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      throw error;
    }

    return this.user;
  }

  // Method to set the token
  setToken(token: string | null) {
    this.token = token;
  }

  // Method to set the user
  setUser(user: AuthUser | null) {
    this.user = user;
  }

  logout() {
    this.user = null;
    this.token = null;
    this.saveToStorage();
  }

  getUser(): AuthUser | null {
    return this.user;
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return !!(this.user && this.token);
  }

  hasRole(role: string): boolean {
    if (!this.user?.teams) return false;
    return this.user.teams.some(team => team.roles.includes(role));
  }

  hasAnyRole(roles: string[]): boolean {
    if (!this.user?.teams) return false;
    const userRoles = this.user.teams.flatMap(team => team.roles);
    return roles.some(role => userRoles.includes(role));
  }

  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  isAgent(): boolean {
    return this.hasAnyRole(['ADMIN', 'AGENT']);
  }
}

export const authService = new AuthService();