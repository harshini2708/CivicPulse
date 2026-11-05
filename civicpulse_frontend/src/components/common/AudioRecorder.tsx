import React, { useState, useRef, useEffect } from 'react';

interface AudioRecorderProps {
  onTranscriptionComplete: (transcript: string) => void;
}

type VoiceLang = 'en-US' | 'te-IN' | 'hi-IN';

const VOICE_LANGUAGES: { code: VoiceLang; label: string; flag: string }[] = [
  { code: 'en-US', label: 'English', flag: '🇺🇸' },
  { code: 'te-IN', label: 'తెలుగు (Telugu)', flag: '🇮🇳' },
  { code: 'hi-IN', label: 'हिन्दी (Hindi)', flag: '🇮🇳' },
];

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onTranscriptionComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedTime, setRecordedTime] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [selectedLang, setSelectedLang] = useState<VoiceLang>('en-US');
  const [showLangPicker, setShowLangPicker] = useState(false);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<number | null>(null);

  // Initialize or reinitialize speech recognition when language changes
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      // Stop any existing recognition
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLang;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            final += result[0].transcript + ' ';
          } else {
            interim += result[0].transcript;
          }
        }
        const transcript = (final + interim).trim();
        setLiveTranscript(transcript);
        onTranscriptionComplete(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('[AudioRecorder] Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setIsRecording(false);
        }
      };

      recognition.onend = () => {
        // Auto-restart if still recording (handles Chrome's ~60s timeout)
        if (isRecording && recognitionRef.current) {
          try { recognitionRef.current.start(); } catch {}
        } else {
          setIsRecording(false);
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, [selectedLang]);

  const startRecording = () => {
    setRecordedTime(0);
    setLiveTranscript('');
    setIsRecording(true);
    setHasRecording(false);

    // Start timer
    timerRef.current = window.setInterval(() => {
      setRecordedTime((prev) => {
        if (prev >= 60) {
          stopRecording();
          return 60;
        }
        return prev + 1;
      });
    }, 1000);

    // Start speech recognition with selected language
    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = selectedLang;
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Speech recognition start failed:', err);
      }
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
    setHasRecording(true);

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
  };

  const discardRecording = () => {
    stopRecording();
    setHasRecording(false);
    setRecordedTime(0);
    setLiveTranscript('');
    setIsPlaying(false);
  };

  const togglePlayback = () => {
    if (!isPlaying) {
      setIsPlaying(true);
      setTimeout(() => {
        setIsPlaying(false);
      }, recordedTime * 1000 || 2000);
    } else {
      setIsPlaying(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentLangInfo = VOICE_LANGUAGES.find((l) => l.code === selectedLang) || VOICE_LANGUAGES[0];

  return (
    <section className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md border border-outline-variant/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-sm">
          <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface">
            <span className="material-symbols-outlined text-[20px]">mic</span>
          </div>
          <div>
            <h2 className="font-headline font-semibold text-[16px] text-on-surface">
              Voice – Record your complaint
            </h2>
            <p className="font-body text-[12px] text-on-surface-variant">
              Speak in English, తెలుగు (Telugu), or हिन्दी (Hindi). Auto-transcribed for dispatch.
            </p>
          </div>
        </div>
        <span
          className={`px-space-sm py-0.5 rounded-full font-body text-[11px] font-semibold flex items-center gap-1 ${
            isRecording
              ? 'bg-error-container text-on-error-container animate-pulse'
              : hasRecording
              ? 'bg-on-tertiary-container/15 text-on-tertiary-container'
              : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          {isRecording ? 'Recording Live...' : hasRecording ? 'Audio Recorded' : 'Ready to Record'}
        </span>
      </div>

      {/* Language Selector */}
      <div className="flex items-center gap-space-sm flex-wrap">
        <span className="font-body text-[12px] text-on-surface-variant font-semibold uppercase tracking-wider">
          Voice Language:
        </span>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowLangPicker(!showLangPicker)}
            disabled={isRecording}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body text-[13px] font-semibold border border-outline-variant/40 transition-colors disabled:opacity-50"
          >
            <span>{currentLangInfo.flag}</span>
            <span>{currentLangInfo.label}</span>
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
              {showLangPicker ? 'expand_less' : 'expand_more'}
            </span>
          </button>
          {showLangPicker && (
            <div className="absolute top-full left-0 mt-1 bg-surface-container-lowest rounded-lg shadow-lg border border-outline-variant/30 z-20 min-w-[180px] overflow-hidden">
              {VOICE_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setSelectedLang(lang.code);
                    setShowLangPicker(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 font-body text-[13px] hover:bg-surface-container transition-colors text-left ${
                    selectedLang === lang.code
                      ? 'bg-primary-container/30 text-primary font-semibold'
                      : 'text-on-surface'
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                  {selectedLang === lang.code && (
                    <span className="material-symbols-outlined text-[16px] text-primary ml-auto">check</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        {selectedLang !== 'en-US' && (
          <span className="px-2 py-0.5 rounded-full bg-secondary-container/50 text-on-secondary-container font-body text-[11px] font-medium">
            {selectedLang === 'te-IN' ? 'తెలుగు mode active' : 'हिन्दी mode active'}
          </span>
        )}
      </div>

      <div className="bg-surface-container-low rounded-lg p-space-md flex flex-col sm:flex-row items-center justify-between gap-space-md">
        <div className="flex items-center gap-space-md w-full sm:w-auto">
          {!isRecording && !hasRecording ? (
            <button
              type="button"
              onClick={startRecording}
              className="w-11 h-11 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md hover:opacity-90 active:scale-95 transition-all flex-shrink-0"
              title="Start voice recording"
            >
              <span className="material-symbols-outlined text-[22px]">mic</span>
            </button>
          ) : isRecording ? (
            <button
              type="button"
              onClick={stopRecording}
              className="w-11 h-11 rounded-full bg-error text-white flex items-center justify-center shadow-md animate-pulse active:scale-95 transition-all flex-shrink-0"
              title="Stop recording"
            >
              <span className="material-symbols-outlined text-[22px]">stop</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={togglePlayback}
              className="w-11 h-11 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md hover:opacity-90 active:scale-95 transition-all flex-shrink-0"
              title={isPlaying ? 'Pause playback' : 'Play recording'}
            >
              <span className="material-symbols-outlined text-[22px]">
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>
          )}

          <div className="flex flex-col gap-1 w-full min-w-[200px]">
            <div className="flex items-center justify-between font-body text-[12px] text-on-surface-variant">
              <span className="text-on-surface font-semibold">
                {isRecording
                  ? `Recording in ${currentLangInfo.label}... ${formatSeconds(recordedTime)}`
                  : hasRecording
                  ? `${formatSeconds(recordedTime)} recorded • Audio clear`
                  : `Click mic to speak in ${currentLangInfo.label}`}
              </span>
              <span>{formatSeconds(recordedTime)} / 1:00</span>
            </div>

            {/* Waveform Visualizer */}
            <div className="h-6 flex items-center gap-1 overflow-hidden">
              {[3, 6, 2, 7, 4, 8, 3, 6, 5, 2, 6, 4, 7, 2, 5, 8, 4, 3, 6, 3].map((height, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-150 ${
                    isRecording
                      ? 'bg-secondary animate-pulse'
                      : hasRecording
                      ? 'bg-secondary/70'
                      : 'bg-surface-container-high'
                  }`}
                  style={{
                    height: isRecording
                      ? `${Math.max(4, (height * 3) + Math.sin(Date.now() / 200 + i) * 6)}px`
                      : `${height * 2.5}px`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-space-sm w-full sm:w-auto justify-end">
          {hasRecording && (
            <>
              <button
                type="button"
                onClick={startRecording}
                className="px-space-md py-1.5 rounded-lg font-body text-[13px] text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                <span>Re-record</span>
              </button>
              <button
                type="button"
                onClick={discardRecording}
                className="px-space-md py-1.5 rounded-lg font-body text-[13px] text-error hover:bg-error-container/30 transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                <span>Discard</span>
              </button>
            </>
          )}
        </div>
      </div>

      {liveTranscript && (
        <div className="bg-surface-container-lowest border border-surface-container p-2.5 rounded-lg text-xs text-on-surface flex items-start gap-2">
          <span className="material-symbols-outlined text-secondary text-[16px] shrink-0 mt-0.5">
            transcribe
          </span>
          <div className="flex-1">
            <span className="font-semibold text-on-surface-variant">
              Live Transcription ({currentLangInfo.label}):{' '}
            </span>
            <span>"{liveTranscript}"</span>
          </div>
        </div>
      )}
    </section>
  );
};
