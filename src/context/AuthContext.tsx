import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

import { User, UserRole } from '../types/index.js';
import { api } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;

  login: (
    email: string,
    pass: string,
    expectedRole?: UserRole
  ) => Promise<void>;

  register: (data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }) => Promise<void>;

  forgotPassword: (email: string) => Promise<string>;

  logout: () => void;

  quickSwitchRole: (role: UserRole) => Promise<void>;

  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


// --------------------------------------------------
// Convert .NET numeric role → React UserRole
// --------------------------------------------------

const normalizeUserRole = (role: unknown): UserRole => {
  if (
    role === 1 ||
    role === '1' ||
    role === 'Admin' || 
    role === "Admin"
  ) {
    return 'Admin';
  }

  if (
    role === 2 ||
    role === '2' ||
    role === 'Teacher' ||
    role === "Teacher" 
  ) {
    return 'Teacher';
  }

  if (
    role === 3 ||
    role === '3' ||
    role === 'Student' || 
    role === "Student"
  ) {
    return 'Student';
  }

  throw new Error(
    `Invalid user role received from backend: ${role}`
  );
};


export const AuthProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  // --------------------------------------------------
  // Restore authentication from localStorage
  // --------------------------------------------------

  useEffect(() => {
    const savedToken = localStorage.getItem('jwt_token');
    const savedUser = localStorage.getItem('auth_user');

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);

        const normalizedUser: User = {
          ...parsedUser,
          role: normalizeUserRole(parsedUser.role),
        };

        setToken(savedToken);
        setUser(normalizedUser);

      } catch (e) {
        console.error(
          '[AUTH] Failed to restore saved user:',
          e
        );

        localStorage.removeItem('auth_user');
        localStorage.removeItem('jwt_token');
      }
    }

    setLoading(false);
  }, []);


  // --------------------------------------------------
  // Login
  // --------------------------------------------------

  const login = async (
    email: string,
    pass: string,
    expectedRole?: UserRole
  ) => {

    setError(null);

    try {
      const res = await api.login(
        email,
        pass,
        expectedRole
      );

      if (res.success && res.data) {

        // IMPORTANT:
        // .NET returns role as 1 / 2 / 3.
        // React expects Admin / Teacher / Student.
        const normalizedUser: User = {
          ...res.data.user,
          role: normalizeUserRole(
            res.data.user.role
          ),
        };

        console.log(
          '[AUTH] Login successful:',
          normalizedUser
        );

        setToken(res.data.token);
        setUser(normalizedUser);

        localStorage.setItem(
          'jwt_token',
          res.data.token
        );

        localStorage.setItem(
          'auth_user',
          JSON.stringify(normalizedUser)
        );

      } else {
        throw new Error(
          res.message || 'Login failed'
        );
      }

    } catch (err: any) {

      console.error('[AUTH] Login failed:', err);

      setError(
        err.message || 'Login failed'
      );

      throw err;
    }
  };


  // --------------------------------------------------
  // Register
  // --------------------------------------------------

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }) => {

    setError(null);

    try {
      const res = await api.register(data);

      if (res.success && res.data) {

        const normalizedUser: User = {
          ...res.data.user,
          role: normalizeUserRole(
            res.data.user.role
          ),
        };

        setToken(res.data.token);
        setUser(normalizedUser);

        localStorage.setItem(
          'jwt_token',
          res.data.token
        );

        localStorage.setItem(
          'auth_user',
          JSON.stringify(normalizedUser)
        );

      } else {
        throw new Error(
          res.message || 'Registration failed'
        );
      }

    } catch (err: any) {

      setError(
        err.message || 'Registration failed'
      );

      throw err;
    }
  };


  // --------------------------------------------------
  // Forgot password
  // --------------------------------------------------

  const forgotPassword = async (
    email: string
  ): Promise<string> => {

    setError(null);

    try {
      const res = await api.forgotPassword(email);

      return (
        res.message ||
        'Reset link sent successfully'
      );

    } catch (err: any) {

      setError(
        err.message ||
        'Password reset request failed'
      );

      throw err;
    }
  };


  // --------------------------------------------------
  // Logout
  // --------------------------------------------------

  const logout = () => {
    setUser(null);
    setToken(null);

    localStorage.removeItem('jwt_token');
    localStorage.removeItem('auth_user');
  };


  // --------------------------------------------------
  // Quick role switch
  // --------------------------------------------------

  const quickSwitchRole = async (role: UserRole) => {
    let email = 'admin@school.edu';
    let pass = 'Admin123!';
  
    if (role === 'Teacher') {
      email = 'john.doe@school.edu';
      pass = 'Teacher123!';
    } else if (role === 'Student') {
      email = 'alex.jones@student.edu';
      pass = 'Student123!';
    }
  
    await login(email, pass);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        forgotPassword,
        logout,
        quickSwitchRole,
        error,
        clearError: () => setError(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = () => {

  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider'
    );
  }

  return context;
};
