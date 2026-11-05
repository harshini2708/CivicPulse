import React, { useRef, useState, useEffect } from 'react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (photoBase64: string) => void;
  title?: string;
  subtitle?: string;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  title = 'Live Camera Capture',
  subtitle = 'Position the civic issue clearly within the viewfinder frame.',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedPhoto(null);
      setCameraError(null);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setIsLoading(true);
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera MediaDevices API is not supported in this browser environment.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsLoading(false);
    } catch (err: any) {
      console.warn('[Camera] Live webcam unavailable:', err);
      setCameraError(
        err.message || 'Unable to access device camera. Please allow camera permissions or use device capture.'
      );
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedPhoto(dataUrl);
      stopCamera();
    }
  };

  const retake = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  const confirmPhoto = () => {
    if (capturedPhoto) {
      onCapture(capturedPhoto);
      onClose();
    }
  };

  // Fallback file input if camera is physically absent or denied
  const handleFallbackFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        setCapturedPhoto(result);
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-container-lowest rounded-xl max-w-lg w-full shadow-2xl overflow-hidden border border-outline-variant/40 flex flex-col">
        {/* Header */}
        <div className="p-space-md border-b border-surface-container flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-secondary text-[22px]">photo_camera</span>
            <div>
              <h3 className="font-headline font-bold text-on-surface text-[17px]">{title}</h3>
              <p className="font-body text-[12px] text-on-surface-variant">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Viewport Area */}
        <div className="relative bg-surface-container h-80 sm:h-96 flex items-center justify-center overflow-hidden">
          {capturedPhoto ? (
            <div className="relative w-full h-full">
              <img src={capturedPhoto} alt="Captured issue" className="w-full h-full object-cover" />
              <div className="absolute top-3 left-3 bg-on-tertiary-container text-white px-2.5 py-1 rounded-full font-body text-[11px] font-semibold flex items-center gap-1 shadow-md">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                <span>Photo Captured</span>
              </div>
            </div>
          ) : cameraError ? (
            <div className="p-space-lg flex flex-col items-center text-center gap-space-sm max-w-sm">
              <span className="material-symbols-outlined text-secondary text-[36px]">videocam_off</span>
              <p className="font-body text-[13px] text-on-surface-variant">{cameraError}</p>
              <label className="mt-2 inline-flex items-center gap-2 px-space-md py-2.5 rounded-lg bg-primary text-on-primary font-body text-[13px] font-semibold cursor-pointer shadow-sm hover:opacity-90">
                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                <span>Select Image from PC / Mobile</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFallbackFile}
                />
              </label>
            </div>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-surface-container-high/80 backdrop-blur-xs">
                  <div className="flex flex-col items-center gap-2">
                    <span className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin"></span>
                    <span className="font-body text-[12px] text-on-surface font-medium">
                      Initializing camera...
                    </span>
                  </div>
                </div>
              )}
              {/* Viewfinder Grid Overlay */}
              <div className="absolute inset-6 border border-white/40 rounded-lg pointer-events-none flex flex-col justify-between p-2">
                <div className="flex justify-between">
                  <span className="w-4 h-4 border-t-2 border-l-2 border-white"></span>
                  <span className="w-4 h-4 border-t-2 border-r-2 border-white"></span>
                </div>
                <div className="flex justify-between">
                  <span className="w-4 h-4 border-b-2 border-l-2 border-white"></span>
                  <span className="w-4 h-4 border-b-2 border-r-2 border-white"></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Action Buttons */}
        <div className="p-space-md bg-surface-container-lowest border-t border-surface-container flex items-center justify-between">
          {capturedPhoto ? (
            <>
              <button
                type="button"
                onClick={retake}
                className="px-space-md py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body text-[13px] font-medium flex items-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                <span>Retake</span>
              </button>
              <button
                type="button"
                onClick={confirmPhoto}
                className="px-space-lg py-2 rounded-lg bg-primary text-on-primary font-body text-[13px] font-semibold flex items-center gap-1.5 shadow-sm hover:opacity-95 transition-opacity"
              >
                <span className="material-symbols-outlined text-[16px]">check</span>
                <span>Use This Photo</span>
              </button>
            </>
          ) : (
            <>
              <label className="px-space-md py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body text-[12px] font-semibold cursor-pointer flex items-center gap-1.5 border border-outline-variant/30 transition-colors">
                <span className="material-symbols-outlined text-[16px]">upload_file</span>
                <span>Upload from Device / Gallery</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFallbackFile}
                />
              </label>
              <button
                type="button"
                disabled={Boolean(cameraError) || isLoading}
                onClick={takeSnapshot}
                className="px-space-lg py-2 rounded-lg bg-primary text-on-primary font-body text-[13px] font-semibold flex items-center gap-1.5 shadow-sm hover:opacity-95 disabled:opacity-50 transition-opacity cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">lens</span>
                <span>Capture Snapshot</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
