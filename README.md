# 🌐 ConnectSphere

> **Connect. Play. Stream.** — A full-stack iOS-style social web application built as a mobile-first PWA.

![ConnectSphere](https://img.shields.io/badge/Status-In%20Development-blue)
![Node.js](https://img.shields.io/badge/Node.js-v20+-green)
![React](https://img.shields.io/badge/React-v19-blue)
![Socket.IO](https://img.shields.io/badge/Socket.IO-v4-black)

## ✨ Features

### 🏠 Social Feed
- Personalized home feed with posts from followed users and communities
- Stories (24hr expiry, Instagram-style)
- Post reactions, comments, and sharing
- Live streams section

### 🎲 Random Match
- Tinder/Omegle-style random matching with gender filters
- Interest-based matching algorithm
- Text chat, voice calls, and video calls with matches
- Safety features (report, block)

### 🎮 Gamer Communities
- Create and join gaming communities
- Text channels (Discord-style)
- LFG (Looking For Group) system
- Community events and leaderboards

### 💬 Real-Time Messaging
- iMessage-style chat bubbles
- Typing indicators and read receipts
- Image, voice message, and GIF support
- Group chats (up to 50 people)

### 📞 Voice & Video Calling
- WebRTC-powered peer-to-peer calls
- iOS-style incoming call screen
- Picture-in-Picture mode
- Screen sharing

### 📡 Live Streaming
- Go Live from anywhere
- Real-time comments and reactions
- Viewer count tracking

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 |
| Animations | Framer Motion |
| State | Zustand |
| Real-time | Socket.IO |
| Calls/Stream | WebRTC (simple-peer) |
| Backend | Node.js, Express |
| Database | MongoDB + Mongoose |
| Auth | JWT (access + refresh tokens) |

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- MongoDB (local or Atlas)
- Redis (optional, for matchmaking queue)

### 1. Start Database
```bash
docker-compose up -d
```

### 2. Setup Backend
```bash
cd server
cp .env.example .env
# Edit .env with your values
npm install
node index.js
```

### 3. Setup Frontend
```bash
cd client
npm install
npm run dev
```

### 4. Open in Browser
Navigate to `http://localhost:5173`

## 📁 Project Structure
```
connectsphere/
├── client/           # React frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── store/       # Zustand state stores
│   │   ├── services/    # API client
│   │   ├── lib/         # Socket.IO, WebRTC setup
│   │   └── types/       # TypeScript interfaces
│   └── ...
├── server/           # Express backend
│   ├── models/       # Mongoose schemas
│   ├── routes/       # REST API endpoints
│   ├── socket/       # Socket.IO event handlers
│   ├── middleware/    # Auth, upload, error handling
│   └── config/       # JWT, DB configuration
└── docker-compose.yml
```

## 🎨 iOS Design System
- SF Pro Display font family
- Background: #F2F2F7 (light) / #000000 (dark)  
- Accent: #007AFF (iOS Blue)
- Frosted glass effects (backdrop-filter: blur)
- Spring animations (stiffness: 300, damping: 30)
- Safe area support for notch devices
- Bottom tab navigation

## 📄 License
MIT
