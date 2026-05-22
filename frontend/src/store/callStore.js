import { create } from 'zustand';

export const useCallStore = create((set, get) => ({
  // Call State
  callState: 'idle', // 'idle' | 'calling' | 'incoming' | 'active'
  activeCallInfo: null, // { callId, targetUserId, targetUsername, type: 'audio' | 'video', direction: 'outgoing' | 'incoming' }
  
  // Media State
  localStream: null,
  remoteStream: null,
  isMuted: false,
  isCameraOff: false,
  
  // Call Duration
  callDuration: 0,
  
  // Persistence
  isRestoringCall: false,
  
  // Actions
  setCallState: (state) => set({ callState: state }),
  
  setActiveCallInfo: (info) => set({ activeCallInfo: info }),
  
  setLocalStream: (stream) => set({ localStream: stream }),
  
  setRemoteStream: (stream) => set({ remoteStream: stream }),
  
  setIsMuted: (muted) => set({ isMuted: muted }),
  
  setIsCameraOff: (off) => set({ isCameraOff: off }),
  
  setCallDuration: (duration) => set({ callDuration: duration }),
  
  setIsRestoringCall: (restoring) => set({ isRestoringCall: restoring }),
  
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  
  toggleCamera: () => set((state) => ({ isCameraOff: !state.isCameraOff })),
  
  resetCall: () => set({
    callState: 'idle',
    activeCallInfo: null,
    localStream: null,
    remoteStream: null,
    isMuted: false,
    isCameraOff: false,
    callDuration: 0,
  }),
  
  // Selectors
  getCallState: () => get().callState,
  getActiveCallInfo: () => get().activeCallInfo,
  getLocalStream: () => get().localStream,
  getRemoteStream: () => get().remoteStream,
  getIsMuted: () => get().isMuted,
  getIsCameraOff: () => get().isCameraOff,
  getCallDuration: () => get().callDuration,
}));
