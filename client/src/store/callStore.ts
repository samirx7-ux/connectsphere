import { create } from 'zustand';
import type { CallData } from '../types';

interface CallState {
    activeCall: CallData | null;
    incomingCall: CallData | null;
    isMuted: boolean;
    isSpeaker: boolean;
    isCameraOn: boolean;
    setActiveCall: (call: CallData | null) => void;
    setIncomingCall: (call: CallData | null) => void;
    toggleMute: () => void;
    toggleSpeaker: () => void;
    toggleCamera: () => void;
}

export const useCallStore = create<CallState>((set) => ({
    activeCall: null,
    incomingCall: null,
    isMuted: false,
    isSpeaker: false,
    isCameraOn: true,
    setActiveCall: (call) => set({ activeCall: call }),
    setIncomingCall: (call) => set({ incomingCall: call }),
    toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
    toggleSpeaker: () => set((s) => ({ isSpeaker: !s.isSpeaker })),
    toggleCamera: () => set((s) => ({ isCameraOn: !s.isCameraOn }))
}));
