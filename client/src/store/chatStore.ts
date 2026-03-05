import { create } from 'zustand';
import api from '../services/api';
import type { Conversation, Message } from '../types';

interface ChatState {
    conversations: Conversation[];
    activeConversation: string | null;
    messages: Record<string, Message[]>;
    typingUsers: Record<string, string[]>;
    fetchConversations: () => Promise<void>;
    fetchMessages: (conversationId: string) => Promise<void>;
    addMessage: (conversationId: string, message: Message) => void;
    setActiveConversation: (id: string | null) => void;
    setTyping: (conversationId: string, userId: string, isTyping: boolean) => void;
    createConversation: (participantId: string) => Promise<Conversation>;
}

export const useChatStore = create<ChatState>((set, get) => ({
    conversations: [],
    activeConversation: null,
    messages: {},
    typingUsers: {},

    fetchConversations: async () => {
        const { data } = await api.get('/messages/conversations');
        set({ conversations: data.conversations });
    },

    fetchMessages: async (conversationId) => {
        const { data } = await api.get(`/messages/${conversationId}`);
        set((state) => ({
            messages: { ...state.messages, [conversationId]: data.messages }
        }));
    },

    addMessage: (conversationId, message) => {
        set((state) => {
            const existing = state.messages[conversationId] || [];
            const alreadyExists = existing.some(m => m._id === message._id);
            if (alreadyExists) return state;

            return {
                messages: {
                    ...state.messages,
                    [conversationId]: [...existing, message]
                },
                conversations: state.conversations.map(c =>
                    c._id === conversationId ? { ...c, lastMessage: message, updatedAt: new Date().toISOString() } : c
                ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            };
        });
    },

    setActiveConversation: (id) => set({ activeConversation: id }),

    setTyping: (conversationId, userId, isTyping) => {
        set((state) => {
            const current = state.typingUsers[conversationId] || [];
            const updated = isTyping
                ? [...new Set([...current, userId])]
                : current.filter(id => id !== userId);
            return { typingUsers: { ...state.typingUsers, [conversationId]: updated } };
        });
    },

    createConversation: async (participantId) => {
        const { data } = await api.post('/messages/conversations', { participantId });
        set((state) => {
            const exists = state.conversations.find(c => c._id === data.conversation._id);
            if (!exists) {
                return { conversations: [data.conversation, ...state.conversations] };
            }
            return state;
        });
        return data.conversation;
    }
}));
