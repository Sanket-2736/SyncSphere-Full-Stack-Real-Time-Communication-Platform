import { useEffect, useRef } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { useAuth } from '../context/AuthContext';
import { useCallStore } from '../store/callStore';

const ICE_CONFIG = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export function useWebRTC(conversationId) {
  const { isConnected, subscribe, publish, unsubscribe } = useWebSocket();
  const { user } = useAuth();
  
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const signalSubscriptionRef = useRef(null);
  const callTimerRef = useRef(null);

  const setCallState = useCallStore((s) => s.setCallState);
  const setActiveCallInfo = useCallStore((s) => s.setActiveCallInfo);
  const setLocalStream = useCallStore((s) => s.setLocalStream);
  const setRemoteStream = useCallStore((s) => s.setRemoteStream);
  const setIsMuted = useCallStore((s) => s.setIsMuted);
  const setIsCameraOff = useCallStore((s) => s.setIsCameraOff);
  const setCallDuration = useCallStore((s) => s.setCallDuration);
  const resetCall = useCallStore((s) => s.resetCall);
  const getCallState = useCallStore((s) => s.getCallState);
  const getActiveCallInfo = useCallStore((s) => s.getActiveCallInfo);
  const getIsMuted = useCallStore((s) => s.getIsMuted);
  const getIsCameraOff = useCallStore((s) => s.getIsCameraOff);

  // Subscribe to signaling messages
  useEffect(() => {
    if (!isConnected || !conversationId) return;

    if (signalSubscriptionRef.current) {
      unsubscribe('/user/queue/signal');
      signalSubscriptionRef.current = null;
    }

    signalSubscriptionRef.current = subscribe('/user/queue/signal', async (signal) => {
      await handleSignal(signal);
    });

    return () => {
      if (signalSubscriptionRef.current) {
        unsubscribe('/user/queue/signal');
        signalSubscriptionRef.current = null;
      }
    };
  }, [isConnected, conversationId, subscribe, unsubscribe]);

  // Handle incoming signals
  const handleSignal = async (signal) => {
    try {
      switch (signal.type) {
        case 'call-request':
          handleIncomingAudioCall(signal);
          break;
        case 'video-call-request':
          handleIncomingVideoCall(signal);
          break;
        case 'call-accepted':
        case 'video-call-accepted':
          await handleCallAccepted(signal);
          break;
        case 'call-rejected':
        case 'video-call-rejected':
          handleCallRejected(signal);
          break;
        case 'offer':
          await handleOffer(signal);
          break;
        case 'answer':
          await handleAnswer(signal);
          break;
        case 'ice-candidate':
          await handleIceCandidate(signal);
          break;
        case 'call-ended':
        case 'video-call-ended':
          handleCallEnded(signal);
          break;
        default:
          console.warn('Unknown signal type:', signal.type);
      }
    } catch (error) {
      console.error('Error handling signal:', error);
    }
  };

  // Incoming audio call
  const handleIncomingAudioCall = (signal) => {
    setActiveCallInfo({
      callId: signal.callId,
      targetUserId: signal.senderId,
      targetUsername: signal.senderUsername,
      type: 'audio',
      direction: 'incoming',
    });
    setCallState('incoming');
    playRingtone();
  };

  // Incoming video call
  const handleIncomingVideoCall = (signal) => {
    setActiveCallInfo({
      callId: signal.callId,
      targetUserId: signal.senderId,
      targetUsername: signal.senderUsername,
      type: 'video',
      direction: 'incoming',
    });
    setCallState('incoming');
    playRingtone();
  };

  // Call accepted by callee
  const handleCallAccepted = async (signal) => {
    setCallState('active');
    await setupPeerConnection(signal.type === 'video-call-accepted');
  };

  // Call rejected by callee
  const handleCallRejected = (signal) => {
    resetCall();
  };

  // Offer received
  const handleOffer = async (signal) => {
    if (!pcRef.current) {
      await setupPeerConnection(signal.type === 'video-call-request');
    }

    try {
      await pcRef.current.setRemoteDescription(
        new RTCSessionDescription({ type: 'offer', sdp: signal.sdp })
      );

      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);

      publish('/app/signal', {
        type: 'answer',
        targetUserId: signal.senderId,
        callId: signal.callId,
        sdp: answer.sdp,
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  // Answer received
  const handleAnswer = async (signal) => {
    if (!pcRef.current) return;

    try {
      await pcRef.current.setRemoteDescription(
        new RTCSessionDescription({ type: 'answer', sdp: signal.sdp })
      );
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };

  // ICE candidate received
  const handleIceCandidate = async (signal) => {
    if (!pcRef.current || !signal.candidate) return;

    try {
      await pcRef.current.addIceCandidate(
        new RTCIceCandidate(JSON.parse(signal.candidate))
      );
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  };

  // Call ended
  const handleCallEnded = (signal) => {
    cleanupCall();
  };

  // Setup peer connection
  const setupPeerConnection = async (isVideo = false) => {
    try {
      // Create peer connection
      pcRef.current = new RTCPeerConnection({ iceServers: ICE_CONFIG.iceServers });

      // Get local media
      const constraints = isVideo
        ? { audio: true, video: { width: 1280, height: 720 } }
        : { audio: true };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);

      // Add local tracks to peer connection
      stream.getTracks().forEach((track) => {
        pcRef.current.addTrack(track, stream);
      });

      // Handle remote stream
      pcRef.current.ontrack = (event) => {
        console.log('Received remote track:', event.track.kind);
        if (!remoteStreamRef.current) {
          remoteStreamRef.current = new MediaStream();
          setRemoteStream(remoteStreamRef.current);
        }
        remoteStreamRef.current.addTrack(event.track);
      };

      // Handle ICE candidates
      pcRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          const callInfo = getActiveCallInfo();
          publish('/app/signal', {
            type: 'ice-candidate',
            targetUserId: callInfo.targetUserId,
            callId: callInfo.callId,
            candidate: JSON.stringify(event.candidate),
          });
        }
      };

      // Handle connection state changes
      pcRef.current.onconnectionstatechange = () => {
        console.log('Connection state:', pcRef.current.connectionState);
        if (pcRef.current.connectionState === 'failed' || pcRef.current.connectionState === 'disconnected') {
          cleanupCall();
        }
      };

      // If caller, create and send offer
      const callInfo = getActiveCallInfo();
      if (callInfo.direction === 'outgoing') {
        const offer = await pcRef.current.createOffer();
        await pcRef.current.setLocalDescription(offer);

        publish('/app/signal', {
          type: isVideo ? 'offer' : 'offer',
          targetUserId: callInfo.targetUserId,
          callId: callInfo.callId,
          sdp: offer.sdp,
        });
      }

      setCallState('active');
      startCallTimer();
    } catch (error) {
      console.error('Error setting up peer connection:', error);
      resetCall();
    }
  };

  // Start audio call
  const startAudioCall = async (targetUserId, targetUsername) => {
    console.log('🔵 [AUDIO_CALL] Starting audio call with:', { targetUserId, targetUsername });
    console.log('🔵 [AUDIO_CALL] Current user:', user);
    console.log('🔵 [AUDIO_CALL] WebSocket connected:', isConnected);
    
    if (!user) {
      console.error('❌ [AUDIO_CALL] User object is null or undefined');
      console.error('❌ [AUDIO_CALL] Auth context may not be initialized yet');
      return;
    }
    
    const userId = user.id || user.userId;
    if (!userId) {
      console.error('❌ [AUDIO_CALL] User ID is missing:', user);
      return;
    }
    
    if (!isConnected) {
      console.error('❌ [AUDIO_CALL] WebSocket not connected');
      return;
    }

    const callId = generateCallId();
    console.log('📞 [AUDIO_CALL] Generated callId:', callId);
    
    setActiveCallInfo({
      callId,
      targetUserId,
      targetUsername,
      type: 'audio',
      direction: 'outgoing',
    });
    setCallState('calling');

    publish('/app/signal', {
      type: 'call-request',
      targetUserId,
      callId,
    });
    console.log('✅ [AUDIO_CALL] Call request published');
  };

  // Start video call
  const startVideoCall = async (targetUserId, targetUsername) => {
    console.log('🔵 [VIDEO_CALL] Starting video call with:', { targetUserId, targetUsername });
    console.log('🔵 [VIDEO_CALL] Current user:', user);
    console.log('🔵 [VIDEO_CALL] WebSocket connected:', isConnected);
    
    if (!user) {
      console.error('❌ [VIDEO_CALL] User object is null or undefined');
      console.error('❌ [VIDEO_CALL] Auth context may not be initialized yet');
      return;
    }
    
    const userId = user.id || user.userId;
    if (!userId) {
      console.error('❌ [VIDEO_CALL] User ID is missing:', user);
      return;
    }
    
    if (!isConnected) {
      console.error('❌ [VIDEO_CALL] WebSocket not connected');
      return;
    }

    const callId = generateCallId();
    console.log('📹 [VIDEO_CALL] Generated callId:', callId);
    
    setActiveCallInfo({
      callId,
      targetUserId,
      targetUsername,
      type: 'video',
      direction: 'outgoing',
    });
    setCallState('calling');

    publish('/app/signal', {
      type: 'video-call-request',
      targetUserId,
      callId,
    });
    console.log('✅ [VIDEO_CALL] Call request published');
  };

  // Accept call
  const acceptCall = async () => {
    const callInfo = getActiveCallInfo();
    if (!callInfo) return;

    const isVideo = callInfo.type === 'video';
    const signalType = isVideo ? 'video-call-accepted' : 'call-accepted';

    publish('/app/signal', {
      type: signalType,
      targetUserId: callInfo.targetUserId,
      callId: callInfo.callId,
    });

    await setupPeerConnection(isVideo);
  };

  // Reject call
  const rejectCall = () => {
    const callInfo = getActiveCallInfo();
    if (!callInfo) return;

    const signalType = callInfo.type === 'video' ? 'video-call-rejected' : 'call-rejected';

    publish('/app/signal', {
      type: signalType,
      targetUserId: callInfo.targetUserId,
      callId: callInfo.callId,
    });

    resetCall();
  };

  // End call
  const endCall = () => {
    const callInfo = getActiveCallInfo();
    if (!callInfo) return;

    const signalType = callInfo.type === 'video' ? 'video-call-ended' : 'call-ended';

    publish('/app/signal', {
      type: signalType,
      targetUserId: callInfo.targetUserId,
      callId: callInfo.callId,
    });

    cleanupCall();
  };

  // Toggle mute
  const toggleMute = () => {
    if (!localStreamRef.current) return;

    const isMuted = getIsMuted();
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = isMuted;
    });
    setIsMuted(!isMuted);
  };

  // Toggle camera
  const toggleCamera = () => {
    if (!localStreamRef.current) return;

    const isCameraOff = getIsCameraOff();
    localStreamRef.current.getVideoTracks().forEach((track) => {
      track.enabled = isCameraOff;
    });
    setIsCameraOff(!isCameraOff);
  };

  // Cleanup call
  const cleanupCall = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current = null;
    }

    resetCall();
  };

  // Start call timer
  const startCallTimer = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }

    let duration = 0;
    callTimerRef.current = setInterval(() => {
      duration += 1;
      setCallDuration(duration);
    }, 1000);
  };

  // Play ringtone using Web Audio API
  const playRingtone = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error('Error playing ringtone:', error);
    }
  };

  // Generate call ID
  const generateCallId = () => {
    try {
      const userId = user?.id || user?.userId;
      if (!userId) {
        console.warn('⚠️ [CALL_ID] User ID not available, generating fallback ID');
        return `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
      const callId = `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      console.log('✅ [CALL_ID] Generated callId:', callId);
      return callId;
    } catch (error) {
      console.error('❌ [CALL_ID] Error generating call ID:', error);
      return `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupCall();
    };
  }, []);

  return {
    startAudioCall,
    startVideoCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
  };
}
