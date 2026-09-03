// src/features/communication/hooks/useCallManager.js
//
// Owns the entire lifecycle of a single 1-to-1 audio/video call:
// signalling (via the existing CommunicationSocket connection — no
// second socket, no separate signalling server), the RTCPeerConnection,
// local/remote MediaStreams, and the call state machine described in
// the project brief (§5): IDLE, CALLING, RINGING, CONNECTING,
// CONNECTED, RECONNECTING, ENDED, DECLINED, BUSY, MISSED, TIMEOUT,
// FAILED.
//
// Mounted ONCE near the top of the Communication page (not per
// conversation) so an incoming call can be received even if the
// recipient has a different conversation open — mirrors how
// useCommunicationSocket owns the connection for the whole page.
//
// Signalling messages (offer/answer/ICE) are relayed by the backend
// (communicationSocketService.js) after verifying both users are the
// legitimate participants of the call — this hook never trusts a
// callId it didn't get from a server-relayed event.

import { useCallback, useEffect, useRef, useState } from "react";
import CommunicationSocket from "../services/communicationSocket";
import { SOCKET_EVENTS } from "../utils/socketEvents";

function resolveIceServers() {
  try {
    const raw = typeof import.meta !== "undefined" && import.meta.env?.VITE_COMMUNICATION_ICE_SERVERS;
    if (raw) return JSON.parse(raw);
  } catch {
    // fall through to default
  }
  // Public STUN only — NAT traversal will fail for some network pairs
  // without a TURN server. See .env.example for how to configure one
  // for production (documented, not silently degraded).
  return [{ urls: "stun:stun.l.google.com:19302" }];
}

const ICE_SERVERS = resolveIceServers();
const RECONNECT_GRACE_MS = 12000;

function friendlyMediaError(err, callType) {
  if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
    return callType === "VIDEO"
      ? "Camera or microphone access was denied. Please allow access and try again."
      : "Microphone access was denied. Please allow access and try again.";
  }
  if (err?.name === "NotFoundError" || err?.name === "DevicesNotFoundError") {
    return callType === "VIDEO" ? "No camera or microphone was found on this device." : "No microphone was found on this device.";
  }
  if (err?.name === "NotReadableError") {
    return "Your camera or microphone is already in use by another application.";
  }
  return "Could not access your camera/microphone.";
}

export function useCallManager() {
  const [callState, setCallState] = useState("IDLE");
  const [incomingCall, setIncomingCall] = useState(null); // { callId, conversationId, callType, caller }
  const [activeCall, setActiveCall] = useState(null); // { callId, conversationId, callType, direction, otherUser }
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const cameraTrackRef = useRef(null); // saved so screen-share can restore it
  const callRef = useRef(null); // authoritative current call (avoids stale closures in socket handlers)
  const incomingCallRef = useRef(null);
  const remoteCandidateQueueRef = useRef([]);
  const durationTimerRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const connectedAtRef = useRef(null);

  useEffect(() => {
    incomingCallRef.current = incomingCall;
  }, [incomingCall]);

  const stopDurationTimer = () => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
  };

  const cleanup = useCallback(() => {
    stopDurationTimer();
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    cameraTrackRef.current = null;
    remoteCandidateQueueRef.current = [];
    connectedAtRef.current = null;
    callRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setActiveCall(null);
    setIncomingCall(null);
    setMuted(false);
    setCameraOff(false);
    setScreenSharing(false);
    setDurationSeconds(0);
  }, []);

  const endWithState = useCallback(
    (finalState, message) => {
      if (message) setErrorMessage(message);
      setCallState(finalState);
      cleanup();
      // Give the UI a moment to show the terminal state (e.g. "Declined",
      // "Missed", "Call ended") before snapping back to idle.
      setTimeout(() => setCallState((s) => (s === finalState ? "IDLE" : s)), 2500);
    },
    [cleanup]
  );

  const createPeerConnection = useCallback(
    () => {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      pc.onicecandidate = (e) => {
        if (e.candidate && callRef.current) {
          CommunicationSocket.emit(SOCKET_EVENTS.CALL_ICE_CANDIDATE, {
            callId: callRef.current.callId,
            candidate: e.candidate,
          });
        }
      };

      pc.ontrack = (e) => {
        setRemoteStream(e.streams[0] || null);
      };

      pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;
        if (state === "connected" || state === "completed") {
          if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
          }
          if (!connectedAtRef.current) {
            connectedAtRef.current = Date.now();
            durationTimerRef.current = setInterval(() => {
              setDurationSeconds(Math.floor((Date.now() - connectedAtRef.current) / 1000));
            }, 1000);
          }
          setCallState("CONNECTED");
        } else if (state === "disconnected") {
          setCallState("RECONNECTING");
          if (!reconnectTimerRef.current) {
            reconnectTimerRef.current = setTimeout(async () => {
              reconnectTimerRef.current = null;
              if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") return;
              // Only the original caller attempts an ICE restart, to avoid
              // both sides renegotiating simultaneously ("glare").
              if (callRef.current?.direction === "outgoing" && pc.signalingState === "stable") {
                try {
                  const offer = await pc.createOffer({ iceRestart: true });
                  await pc.setLocalDescription(offer);
                  CommunicationSocket.emit(SOCKET_EVENTS.CALL_OFFER, { callId: callRef.current.callId, sdp: offer });
                  return;
                } catch {
                  // fall through to failure below
                }
              }
              endWithState("FAILED", "Call connection failed");
            }, RECONNECT_GRACE_MS);
          }
        } else if (state === "failed") {
          endWithState("FAILED", "Call connection failed");
        }
      };

      return pc;
    },
    [endWithState]
  );

  const flushRemoteCandidates = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) return;
    const queued = remoteCandidateQueueRef.current;
    remoteCandidateQueueRef.current = [];
    for (const candidate of queued) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        // A late/duplicate candidate failing to add is not fatal.
      }
    }
  }, []);

  const acquireMedia = useCallback(async (callType) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: callType === "VIDEO" ? { width: 640, height: 480 } : false,
    });
    localStreamRef.current = stream;
    cameraTrackRef.current = stream.getVideoTracks()[0] || null;
    setLocalStream(stream);
    return stream;
  }, []);

  // ── Outgoing call ────────────────────────────────────────────────
  const startCall = useCallback(
    async (conversationId, otherUser, callType) => {
      if (callRef.current) return; // one active call at a time (client-side guard; server also enforces it)
      setErrorMessage(null);
      setCallState("CALLING");

      let stream;
      try {
        stream = await acquireMedia(callType);
      } catch (err) {
        setCallState("FAILED");
        setErrorMessage(friendlyMediaError(err, callType));
        setTimeout(() => setCallState("IDLE"), 2500);
        return;
      }

      CommunicationSocket.emit(SOCKET_EVENTS.CALL_INVITE, { conversationId, callType }, (ack) => {
        if (!ack?.success) {
          stream.getTracks().forEach((t) => t.stop());
          localStreamRef.current = null;
          setLocalStream(null);
          if (ack?.reason === "busy") endWithState("BUSY", "This user is currently on another call");
          else if (ack?.reason === "offline") endWithState("FAILED", "This user is currently offline");
          else if (ack?.reason === "self-busy") endWithState("FAILED", "You already have an active call");
          else endWithState("FAILED", ack?.message || "Could not start the call");
          return;
        }

        callRef.current = {
          callId: ack.callId,
          conversationId,
          callType,
          direction: "outgoing",
          otherUser,
        };
        setActiveCall(callRef.current);

        const pc = createPeerConnection();
        pcRef.current = pc;
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      });
    },
    [acquireMedia, createPeerConnection, endWithState]
  );

  // ── Incoming call ────────────────────────────────────────────────
  const acceptCall = useCallback(async () => {
    const invite = incomingCallRef.current;
    if (!invite) return;

    let stream;
    try {
      stream = await acquireMedia(invite.callType);
    } catch (err) {
      CommunicationSocket.emit(SOCKET_EVENTS.CALL_DECLINE, { callId: invite.callId });
      setIncomingCall(null);
      setCallState("FAILED");
      setErrorMessage(friendlyMediaError(err, invite.callType));
      setTimeout(() => setCallState("IDLE"), 2500);
      return;
    }

    callRef.current = {
      callId: invite.callId,
      conversationId: invite.conversationId,
      callType: invite.callType,
      direction: "incoming",
      otherUser: invite.caller,
    };
    setActiveCall(callRef.current);
    setIncomingCall(null);
    setCallState("CONNECTING");

    const pc = createPeerConnection();
    pcRef.current = pc;
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    CommunicationSocket.emit(SOCKET_EVENTS.CALL_ACCEPT, { callId: invite.callId });
  }, [acquireMedia, createPeerConnection]);

  const declineCall = useCallback(() => {
    const invite = incomingCallRef.current;
    if (!invite) return;
    CommunicationSocket.emit(SOCKET_EVENTS.CALL_DECLINE, { callId: invite.callId });
    setIncomingCall(null);
  }, []);

  const cancelCall = useCallback(() => {
    if (!callRef.current) return;
    CommunicationSocket.emit(SOCKET_EVENTS.CALL_CANCEL, { callId: callRef.current.callId });
    endWithState("IDLE", null);
  }, [endWithState]);

  const endCall = useCallback(() => {
    if (!callRef.current) return;
    CommunicationSocket.emit(SOCKET_EVENTS.CALL_END, { callId: callRef.current.callId });
    endWithState("ENDED", null);
  }, [endWithState]);

  // ── In-call controls ─────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const next = !muted;
    stream.getAudioTracks().forEach((t) => (t.enabled = !next));
    setMuted(next);
  }, [muted]);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const next = !cameraOff;
    stream.getVideoTracks().forEach((t) => (t.enabled = !next));
    setCameraOff(next);
  }, [cameraOff]);

  const toggleScreenShare = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) return;
    const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");

    if (!screenSharing) {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = displayStream.getVideoTracks()[0];
        if (sender) await sender.replaceTrack(screenTrack);
        screenTrack.onended = () => toggleScreenShare();
        setScreenSharing(true);
        setLocalStream((prev) => new MediaStream([...(prev?.getAudioTracks() || []), screenTrack]));
      } catch {
        setErrorMessage("Screen sharing was cancelled or is not supported in this browser.");
        setTimeout(() => setErrorMessage(null), 3000);
      }
    } else {
      const camTrack = cameraTrackRef.current;
      if (sender && camTrack) await sender.replaceTrack(camTrack);
      setScreenSharing(false);
      setLocalStream(localStreamRef.current);
    }
  }, [screenSharing]);

  // ── Global signalling listeners (mounted once) ──────────────────
  useEffect(() => {
    const offInvite = CommunicationSocket.on(SOCKET_EVENTS.CALL_INVITE, (payload) => {
      // Reject a second incoming call while one is already ringing/active —
      // matches the server's "one active call per user" guarantee.
      if (callRef.current || incomingCallRef.current) return;
      setIncomingCall(payload);
      setCallState("RINGING");
    });

    const offAccept = CommunicationSocket.on(SOCKET_EVENTS.CALL_ACCEPT, async ({ callId }) => {
      if (callRef.current?.callId !== callId || callRef.current.direction !== "outgoing") return;
      setCallState("CONNECTING");
      const pc = pcRef.current;
      if (!pc) return;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      CommunicationSocket.emit(SOCKET_EVENTS.CALL_OFFER, { callId, sdp: offer });
    });

    const offOffer = CommunicationSocket.on(SOCKET_EVENTS.CALL_OFFER, async ({ callId, sdp }) => {
      const pc = pcRef.current;
      if (callRef.current?.callId !== callId || !pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      await flushRemoteCandidates();
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      CommunicationSocket.emit(SOCKET_EVENTS.CALL_ANSWER, { callId, sdp: answer });
    });

    const offAnswer = CommunicationSocket.on(SOCKET_EVENTS.CALL_ANSWER, async ({ callId, sdp }) => {
      const pc = pcRef.current;
      if (callRef.current?.callId !== callId || !pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      await flushRemoteCandidates();
    });

    const offIce = CommunicationSocket.on(SOCKET_EVENTS.CALL_ICE_CANDIDATE, async ({ callId, candidate }) => {
      const pc = pcRef.current;
      if (callRef.current?.callId !== callId || !pc || !candidate) return;
      if (pc.remoteDescription) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch {
          // ignore
        }
      } else {
        remoteCandidateQueueRef.current.push(candidate);
      }
    });

    const offDecline = CommunicationSocket.on(SOCKET_EVENTS.CALL_DECLINE, ({ callId }) => {
      if (callRef.current?.callId === callId) endWithState("DECLINED", "Call declined");
    });

    const offCancel = CommunicationSocket.on(SOCKET_EVENTS.CALL_CANCEL, ({ callId }) => {
      if (incomingCallRef.current?.callId === callId) {
        setIncomingCall(null);
        setCallState("IDLE");
      }
    });

    const offBusy = CommunicationSocket.on(SOCKET_EVENTS.CALL_BUSY, ({ callId }) => {
      if (callRef.current?.callId === callId) endWithState("BUSY", "This user is currently on another call");
    });

    const offEnd = CommunicationSocket.on(SOCKET_EVENTS.CALL_END, ({ callId }) => {
      if (callRef.current?.callId === callId) endWithState("ENDED", null);
    });

    const offTimeout = CommunicationSocket.on(SOCKET_EVENTS.CALL_TIMEOUT, ({ callId }) => {
      if (callRef.current?.callId === callId) {
        endWithState("TIMEOUT", "No answer");
      } else if (incomingCallRef.current?.callId === callId) {
        setIncomingCall(null);
        setCallState("MISSED");
        setTimeout(() => setCallState((s) => (s === "MISSED" ? "IDLE" : s)), 2500);
      }
    });

    return () => {
      offInvite();
      offAccept();
      offOffer();
      offAnswer();
      offIce();
      offDecline();
      offCancel();
      offBusy();
      offEnd();
      offTimeout();
    };
  }, [flushRemoteCandidates, endWithState]);

  // Belt-and-suspenders: release camera/mic if the component unmounts mid-call.
  useEffect(() => () => cleanup(), [cleanup]);

  return {
    callState,
    incomingCall,
    activeCall,
    localStream,
    remoteStream,
    muted,
    cameraOff,
    screenSharing,
    durationSeconds,
    errorMessage,
    startCall,
    acceptCall,
    declineCall,
    cancelCall,
    endCall,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
  };
}

export default useCallManager;
