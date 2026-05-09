import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import axios from 'axios';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { toast } from 'sonner';

interface AuthContextType {
  user: any;
  role: 'admin' | 'user' | null;
  loading: boolean;
  login: (token: string, username: string, refreshToken?: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  login: () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<'admin' | 'user' | null>(null);
  const [loading, setLoading] = useState(true);

  // Setup axios interceptor to auto-refresh JWT on 401
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Only retry once, and only when a refresh token exists
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          localStorage.getItem('refresh_token')
        ) {
          originalRequest._retry = true;
          try {
            const refreshToken = localStorage.getItem('refresh_token');
            const res = await axios.post('http://localhost:8000/api/token/refresh/', {
              refresh: refreshToken,
            });
            const newAccessToken = res.data.access;
            localStorage.setItem('access_token', newAccessToken);
            axios.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
            // Retry the original request with the new token
            return axios(originalRequest);
          } catch (refreshError) {
            // Refresh also failed — clear everything and force re-login
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('username');
            delete axios.defaults.headers.common['Authorization'];
            setUser(null);
            setRole(null);
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  useEffect(() => {
    // 1. Check for Django Admin token
    const token = localStorage.getItem('access_token');
    const username = localStorage.getItem('username');

    if (token && username) {
      setUser({ username });
      setRole('admin');
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setLoading(false);
      return; // If admin is logged in, skip firebase listener
    }

    // 2. Listen for Firebase User Auth
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setRole('user');
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Admin login via Django — now also stores the refresh token
  const login = (token: string, username: string, refreshToken?: string) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('username', username);
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser({ username });
    setRole('admin');
  };

  const logout = async () => {
    try {
      if (role === 'admin') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('username');
        delete axios.defaults.headers.common['Authorization'];
      } else if (role === 'user') {
        await signOut(auth);
      }
      setUser(null);
      setRole(null);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
