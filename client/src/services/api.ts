import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://connectsphere-backend-demo.onrender.com/api',
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' }
});

const getMockData = (url: string = '') => {
    const d = new Date().toISOString();
    if (url.includes('/posts/react')) return { success: true };
    if (url.includes('/posts')) return {
        posts: [
            { _id: '1', content: 'Welcome to ConnectSphere! 🚀\nThis is a Demo Mode post to show you what the UI looks like.', author: { _id: 's', username: 'system', displayName: 'System Admin', isVerified: true }, reactions: { like: ['d'], love: ['d'], fire: ['x', 'y'] }, commentCount: 3, totalReactions: 4, createdAt: d },
            { _id: '2', content: 'Exploring the new iOS design system. The blurred glass effects are amazing! 🧊', author: { _id: 'd', username: 'designer_pro', displayName: 'Alex Designer' }, reactions: { wow: ['d'], fire: ['x'] }, comments: [], commentCount: 0, totalReactions: 2, createdAt: d, media: [{ url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000', type: 'image' }] }
        ], hasMore: false
    };
    if (url.includes('/stories')) return {
        storyGroups: [
            { user: { _id: 's', displayName: 'System', avatar: 'https://ui-avatars.com/api/?name=S&background=007AFF&color=fff' }, stories: [{ _id: '1', mediaUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500', mediaType: 'image' }], hasUnviewed: true },
            { user: { _id: 'd', displayName: 'Alex', avatar: 'https://ui-avatars.com/api/?name=Alex&background=FF2D55&color=fff' }, stories: [{ _id: '2', mediaUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=500', mediaType: 'image' }], hasUnviewed: true }
        ]
    };
    if (url.includes('/streams')) return {
        streams: [
            { _id: 's1', title: 'Late Night Coding 💻', viewerCount: 142, streamer: { displayName: 'DevMaster' } },
            { _id: 's2', title: 'Valorant Ranked Push', viewerCount: 89, streamer: { displayName: 'xX_Sniper_Xx' } }
        ]
    };
    if (url.includes('/communities')) return {
        communities: [
            { _id: 'c1', name: 'General Lounge', slug: 'general', memberCount: 1042, category: 'All', featured: true, banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1000' },
            { _id: 'c2', name: 'FPS Gamers', slug: 'fps', memberCount: 850, category: 'FPS', icon: '🎯' },
            { _id: 'c3', name: 'UI/UX Design', slug: 'design', memberCount: 512, category: 'Tech', icon: '🎨' }
        ]
    };
    if (url.includes('/users/suggested')) return {
        users: [
            { _id: 'u1', username: 'gamer_girl', displayName: 'Gamer Girl', bio: 'Love FPS games', interests: ['Gaming', 'Music'], isVerified: true },
            { _id: 'u2', username: 'dev_guy', displayName: 'Code Master', bio: 'Building cool things', interests: ['Tech', 'Coding'] }
        ]
    };
    if (url.includes('/messages/conversations')) return {
        conversations: [
            { _id: 'conv1', type: 'dm', participants: [{ _id: 'other1', displayName: 'Alex Designer', username: 'designer_pro', isOnline: true }], lastMessage: { content: 'Hey, are we still playing later?' }, unreadCount: { demo: 2 }, updatedAt: d }
        ]
    };
    if (url.includes('/messages/')) return {
        messages: [
            { _id: 'm1', content: 'What time are you getting online?', sender: { _id: 'other1', displayName: 'Alex' }, createdAt: new Date(Date.now() - 3600000).toISOString() },
            { _id: 'm2', content: 'Hey, are we still playing later?', sender: { _id: 'other1', displayName: 'Alex' }, createdAt: d }
        ]
    };
    if (url.includes('/notifications')) return {
        notifications: [
            { _id: 'n1', type: 'follow', content: 'started following you', sender: { displayName: 'Gamer Girl' }, isRead: false, createdAt: d },
            { _id: 'n2', type: 'like', content: 'liked your post', sender: { displayName: 'Alex Designer' }, isRead: true, createdAt: new Date(Date.now() - 86400000).toISOString() }
        ]
    };
    if (url.includes('/auth/me')) return { user: { _id: 'demo', username: 'demo_user', displayName: 'Demo Explorer', bio: 'Checking out the ConnectSphere UI!', interests: ['Gaming', 'Tech'], followers: [], following: [], settings: { theme: 'system' } } };

    return { success: true };
};

// Request interceptor
api.interceptors.request.use((config) => {
    if (localStorage.getItem('demoMode') === 'true') {
        config.adapter = async (conf) => {
            return {
                data: getMockData(conf.url),
                status: 200,
                statusText: 'OK',
                headers: {} as any,
                config: conf,
                request: {}
            };
        };
    }

    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor
api.interceptors.response.use(
    (res) => res,
    async (error) => {
        if (localStorage.getItem('demoMode') === 'true') {
            return Promise.resolve({ data: { success: true } });
        }

        const originalRequest = error.config;
        if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED' && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
                if (data.accessToken) {
                    localStorage.setItem('accessToken', data.accessToken);
                    originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                localStorage.removeItem('accessToken');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
