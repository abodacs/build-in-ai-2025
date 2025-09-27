/**
 * Audio Input Component
 * MediaRecorder API integration with recording controls per Design Document Section 4.4
 */

import React, { useState, useRef, useCallback, useEffect, useReducer } from 'react';
import { Mic, Square, Play, Pause, Download, X, AlertCircle, MicOff } from 'lucide-react';
import {
  processAudioBlob,
  formatDuration,
  isMediaRecorderSupported,
  getSupportedRecordingFormats,
  cleanupObjectUrl
} from '../utils/fileProcessing';
import type { AudioInputData, AudioRecordingState } from '../types';

// Recording state management with useReducer
type RecordingAction =
  | { type: 'START_RECORDING' }
  | { type: 'STOP_RECORDING' }
  | { type: 'RECORDING_SUCCESS'; payload: AudioInputData }
  | { type: 'RECORDING_ERROR'; payload: string }
  | { type: 'RESET' }
  | { type: 'SET_DURATION'; payload: number };

function recordingReducer(state: AudioRecordingState, action: RecordingAction): AudioRecordingState {
  switch (action.type) {
    case 'START_RECORDING':
      return {
        ...state,
        status: 'recording',
        error: null
      };
    case 'STOP_RECORDING':
      return {
        ...state,
        status: 'processing'
      };
    case 'RECORDING_SUCCESS':
      return {
        ...state,
        status: 'success',
        error: null
      };
    case 'RECORDING_ERROR':
      return {
        ...state,
        status: 'error',
        error: action.payload
      };
    case 'RESET':
      return {
        ...state,
        status: 'idle',
        duration: 0,
        error: null
      };
    case 'SET_DURATION':
      return {
        ...state,
        duration: action.payload
      };
    default:
      return state;
  }
}

interface AudioInputProps {
  onAudioSelect: (audioData: AudioInputData | null) => void;
  onError?: (error: string) => void;
  maxDuration?: number; // in seconds
  disabled?: boolean;
  className?: string;
  showWaveform?: boolean;
}

export function AudioInput({
  onAudioSelect,
  onError,
  maxDuration = 300, // 5 minutes default
  disabled = false,
  className = '',
  showWaveform = false
}: AudioInputProps) {
  const [recordingState, dispatch] = useReducer(recordingReducer, {
    status: 'idle',
    duration: 0,
    error: null,
    isSupported: isMediaRecorderSupported()
  });

  const [recordedAudio, setRecordedAudio] = useState<AudioInputData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Refs for MediaRecorder and audio management
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      cleanupResources();
    };
  }, []);

  // Clean up resources
  const cleanupResources = useCallback(() => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (recordedAudio?.url) {
      cleanupObjectUrl(recordedAudio.url);
    }
  }, [recordedAudio]);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!recordingState.isSupported || disabled) return;

    try {
      dispatch({ type: 'START_RECORDING' });

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      audioStreamRef.current = stream;

      // Get supported format
      const supportedFormats = getSupportedRecordingFormats();
      const mimeType = supportedFormats[0] || 'audio/webm';

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = async () => {
        try {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          const audioData = await processAudioBlob(blob, mimeType);

          setRecordedAudio(audioData);
          onAudioSelect(audioData);
          dispatch({ type: 'RECORDING_SUCCESS', payload: audioData });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to process recording';
          dispatch({ type: 'RECORDING_ERROR', payload: errorMessage });
          onError?.(errorMessage);
        }
      };

      // Start recording
      mediaRecorder.start(100); // Record in 100ms chunks

      // Start timer
      let duration = 0;
      recordingTimerRef.current = setInterval(() => {
        duration += 0.1;
        dispatch({ type: 'SET_DURATION', payload: duration });

        // Auto-stop at max duration
        if (duration >= maxDuration) {
          stopRecording();
        }
      }, 100);

    } catch (error) {
      let errorMessage = 'Failed to start recording';

      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Microphone access denied. Please allow microphone permissions.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No microphone found. Please check your device settings.';
        }
      }

      dispatch({ type: 'RECORDING_ERROR', payload: errorMessage });
      onError?.(errorMessage);
      cleanupResources();
    }
  }, [recordingState.isSupported, disabled, maxDuration, onAudioSelect, onError]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      dispatch({ type: 'STOP_RECORDING' });
      mediaRecorderRef.current.stop();
    }

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
  }, []);

  // Play/pause audio
  const togglePlayback = useCallback(() => {
    if (!recordedAudio || !audioElementRef.current) return;

    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current.play();
      setIsPlaying(true);
    }
  }, [recordedAudio, isPlaying]);

  // Reset recording
  const resetRecording = useCallback(() => {
    cleanupResources();
    setRecordedAudio(null);
    setIsPlaying(false);
    onAudioSelect(null);
    dispatch({ type: 'RESET' });
  }, [cleanupResources, onAudioSelect]);

  // Download audio
  const downloadAudio = useCallback(() => {
    if (!recordedAudio) return;

    const link = document.createElement('a');
    link.href = recordedAudio.url;
    link.download = `recording-${Date.now()}.webm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [recordedAudio]);

  // Handle audio element events
  const handleAudioEnded = useCallback(() => {
    setIsPlaying(false);
  }, []);

  if (!recordingState.isSupported) {
    return (
      <div className={`p-6 border border-border rounded-lg bg-muted/50 ${className}`}>
        <div className="text-center space-y-3">
          <MicOff className="w-8 h-8 mx-auto text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Audio Recording Not Supported</p>
            <p className="text-xs text-muted-foreground">
              Your browser doesn't support audio recording. Please use a modern browser.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Recording Controls */}
      <div className="p-6 border border-border rounded-lg">
        <div className="text-center space-y-4">
          {/* Status Display */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              {recordingState.status === 'recording' && (
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              )}
              <h3 className="text-lg font-semibold">
                {recordingState.status === 'idle' && 'Ready to Record'}
                {recordingState.status === 'recording' && 'Recording...'}
                {recordingState.status === 'processing' && 'Processing...'}
                {recordingState.status === 'success' && 'Recording Complete'}
                {recordingState.status === 'error' && 'Recording Failed'}
              </h3>
            </div>

            {recordingState.status === 'recording' && (
              <div className="space-y-1">
                <p className="text-2xl font-mono">{formatDuration(recordingState.duration)}</p>
                <p className="text-xs text-muted-foreground">
                  Max: {formatDuration(maxDuration)}
                </p>
              </div>
            )}
          </div>

          {/* Recording Button */}
          <div className="flex justify-center gap-3">
            {recordingState.status === 'idle' ? (
              <button
                onClick={startRecording}
                disabled={disabled}
                className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Mic className="w-5 h-5" />
                Start Recording
              </button>
            ) : recordingState.status === 'recording' ? (
              <button
                onClick={stopRecording}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
              >
                <Square className="w-5 h-5" />
                Stop Recording
              </button>
            ) : null}

            {recordingState.status === 'success' && (
              <button
                onClick={resetRecording}
                className="flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {recordingState.error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
          <p className="text-sm text-red-800 dark:text-red-200">{recordingState.error}</p>
        </div>
      )}

      {/* Audio Playback */}
      {recordedAudio && (
        <div className="p-4 border border-border rounded-lg bg-muted/50">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Recorded Audio</h4>
              <span className="text-sm text-muted-foreground">
                {formatDuration(recordedAudio.duration)}
              </span>
            </div>

            {/* Hidden audio element */}
            <audio
              ref={audioElementRef}
              src={recordedAudio.url}
              onEnded={handleAudioEnded}
              className="hidden"
            />

            {/* Playback Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlayback}
                className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isPlaying ? 'Pause' : 'Play'}
              </button>

              <button
                onClick={downloadAudio}
                className="flex items-center gap-2 px-3 py-2 border border-border rounded-md hover:bg-muted transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>

            {/* Simple Waveform Visualization (placeholder) */}
            {showWaveform && (
              <div className="h-16 bg-muted rounded flex items-center justify-center">
                <div className="flex items-end gap-1 h-8">
                  {Array.from({ length: 20 }, (_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-primary rounded-t"
                      style={{
                        height: `${Math.random() * 100}%`,
                        opacity: isPlaying ? 0.8 : 0.4
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      {recordingState.status === 'idle' && !recordedAudio && (
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Click "Start Recording" to begin audio capture</p>
          <p>• Maximum recording duration: {formatDuration(maxDuration)}</p>
          <p>• Ensure your microphone is connected and permitted</p>
        </div>
      )}
    </div>
  );
}