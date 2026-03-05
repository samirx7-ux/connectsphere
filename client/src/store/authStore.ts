import { create } from 'zustand';
import api from '../services/api';
import { connectSocket, disconnectSocket } from '../lib/socket';
import type { User } from '../types';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (data: any) => Promise<void>;
    logout: () => Promise<void>;
    fetchUser: () => Promise<void>;
    updateProfile: (data: Partial<User>) => Promise<void>;
    setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,

    login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        if (data.accessToken) {
            localStorage.setItem('accessToken', data.accessToken);
            connectSocket(data.accessToken);
        }
        set({ user: data.user, isAuthenticated: true });
    },

    signup: async (formData) => {
        const { data } = await api.post('/auth/signup', formData);
        if (data.accessToken) {
            localStorage.setItem('accessToken', data.accessToken);
            connectSocket(data.accessToken);
        }
        set({ user: data.user, isAuthenticated: true });
    },

    logout: async () => {
        try { await api.post('/auth/logout'); } catch { }
        localStorage.removeItem('accessToken');
        disconnectSocket();
        set({ user: null, isAuthenticated: false });
    },

    fetchUser: async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                set({ isLoading: false });
                return;
            }
            const { data } = await api.get('/auth/me');
            connectSocket(token);
            set({ user: data.user, isAuthenticated: true, isLoading: false });
        } catch {
            localStorage.removeItem('accessToken');
            set({ user: null, isAuthenticated: false, isLoading: false });
        }
    },

    updateProfile: async (updates) => {
        const { data } = await api.put('/users/profile', updates);
        set({ user: data.user });
    },

    setUser: (user) => set({ user })
}));
