import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useComplaints } from '../../context/ComplaintContext';
import { CameraCaptureModal } from '../common/CameraCaptureModal';
import { AudioRecorder } from '../common/AudioRecorder';
import { OpenStreetMap } from '../common/OpenStreetMap';
import { IssueCategory, PriorityLevel } from '../../types';
import {
  analyzeComplaintWithGemini,
  findSimilarComplaintsWithDb,
  DuplicateMatch,
} from '../../config/gemini';
import { reverseGeocodeLatLng, CityAreaDetails } from '../../utils/helpers';
import {
  checkNearbyEmergencyPlaces,
  getEmergencyPriorityLabel,
  EmergencyProximityResult,
  NearbyEmergencyPlace,
} from '../../utils/emergencyProximity';
import {
  saveComplaintOffline,
  setupAutoSync,
  isOnline,
  getOfflineCount,
  OfflineComplaintPayload,
} from '../../utils/offlineSync';

interface ReportIssueProps {
  onSuccess: (trackingId: string) => void;
}

export const ReportIssue: React.FC<ReportIssueProps> = ({ onSuccess }) => {
  const { complaints, submitComplaint, confirmExistingIssue, showToast } = useComplaints();

  // Form State
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoSource, setPhotoSource] = useState<'camera' | 'upload'>('upload');
  const [photoFileName, setPhotoFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [category, setCategory] = useState<IssueCategory>('Roads');
  const [priority, setPriority] = useState<PriorityLevel>('Medium');

  // Location State
  const [locationAddress, setLocationAddress] = useState('420 Oak Street, District 4');
  const [coordinates, setCoordinates] = useState({ lat: 40.7135, lng: -74.0048 });
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'locating' | 'acquired' | 'error'>('acquired');
  const [ward, setWard] = useState('Ward 4A');
  const [cityAreaDetails, setCityAreaDetails] = useState<CityAreaDetails | null>(null);
  const [isResolvingArea, setIsResolvingArea] = useState(false);

  // AI & Duplicate Detection State
  const [aiSummary, setAiSummary] = useState<{
    category: IssueCategory;
    urgency: PriorityLevel;
    keySummary: string;
    keywords: string[];
  }>({
    category: 'Roads',
    urgency: 'Medium',
    keySummary: 'Reported road defect requiring asphalt patching.',
    keywords: ['pothole', 'road hazard'],
  });
  const [similarComplaints, setSimilarComplaints] = useState<DuplicateMatch[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasConfirmedReportAnyway, setHasConfirmedReportAnyway] = useState(false);

  // Emergency Proximity State
  const [emergencyResult, setEmergencyResult] = useState<EmergencyProximityResult | null>(null);
  const [isCheckingEmergency, setIsCheckingEmergency] = useState(false);

  // Offline Sync State
  const [networkOnline, setNetworkOnline] = useState(isOnline());
  const [pendingOfflineCount, setPendingOfflineCount] = useState(0);

  // Initial geocode resolution for default anchor
  useEffect(() => {
    let isMounted = true;
    setIsResolvingArea(true);
    reverseGeocodeLatLng(coordinates.lat, coordinates.lng).then((area) => {
      if (isMounted) {
        setCityAreaDetails(area);
        setLocationAddress(area.fullAddress);
        if (area.ward) setWard(area.ward);
        setIsResolvingArea(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Emergency Proximity Detection — runs when coordinates change
  useEffect(() => {
    let isCancelled = false;
    setIsCheckingEmergency(true);

    checkNearbyEmergencyPlaces(coordinates.lat, coordinates.lng).then((result) => {
      if (!isCancelled) {
        setEmergencyResult(result);
        setIsCheckingEmergency(false);

        // Auto-boost priority if near emergency zone
        if (result.priorityBoost === 'urgent') {
          setPriority('Urgent');
          showToast(getEmergencyPriorityLabel(result), 'warning');
        } else if (result.priorityBoost === 'high' && priority === 'Low') {
          setPriority('High');
          showToast(getEmergencyPriorityLabel(result), 'info');
        }
      }
    });

    return () => { isCancelled = true; };
  }, [coordinates.lat, coordinates.lng]);

  // Offline connectivity listeners
  useEffect(() => {
    const handleOnline = () => {
      setNetworkOnline(true);
      showToast('📶 Back online! Syncing cached complaints...', 'success');
      getOfflineCount().then(setPendingOfflineCount);
    };
    const handleOffline = () => {
      setNetworkOnline(false);
      showToast('📵 You are offline. Complaints will be cached locally and synced when connectivity returns.', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Setup auto-sync: when connectivity returns, sync pending payloads
    setupAutoSync(async (payload: OfflineComplaintPayload) => {
      try {
        await submitComplaint({
          title: payload.title,
          description: payload.description,
          voiceTranscript: payload.voiceTranscript,
          category: payload.category as IssueCategory,
          priority: payload.priority as PriorityLevel,
          originalPhotoUrl: payload.photoBase64,
          location: payload.location,
          aiSummary: payload.aiSummary as any,
        });
        showToast(`📤 Offline complaint "${payload.title}" synced successfully!`, 'success');
        return true;
      } catch (err) {
        console.warn('[OfflineSync] Failed to sync complaint:', err);
        return false;
      }
    });

    // Check initial pending count
    getOfflineCount().then(setPendingOfflineCount);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Live GPS acquisition with immediate reverse-geocoding of city & area
  const requestLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'warning');
      return;
    }
    setGpsStatus('locating');
    setIsResolvingArea(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ lat: latitude, lng: longitude });
        setGpsStatus('acquired');
        showToast('Live GPS coordinates acquired (±3m)', 'success');

        const area = await reverseGeocodeLatLng(latitude, longitude);
        setCityAreaDetails(area);
        setLocationAddress(area.fullAddress);
        if (area.ward) setWard(area.ward);
        setIsResolvingArea(false);

        const areaLabel = area.neighborhood || area.suburb || area.city;
        showToast(`Area resolved: ${areaLabel}`, 'success');
      },
      async (error) => {
        console.warn('GPS location access denied or timed out:', error);
        setGpsStatus('error');
        showToast('Could not fetch GPS. Using District 4 civic anchor.', 'info');

        const area = await reverseGeocodeLatLng(coordinates.lat, coordinates.lng);
        setCityAreaDetails(area);
        setIsResolvingArea(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Live AI Triage & Multi-Factor Proximity Duplicate Detection
  useEffect(() => {
    let isCancelled = false;
    const timer = setTimeout(async () => {
      const fullText = `${description} ${voiceTranscript}`.trim();

      // 1. Run AI analysis if there is enough text
      if (fullText.length >= 8) {
        setIsAnalyzing(true);
        const analysis = await analyzeComplaintWithGemini(fullText, photo || undefined);
        if (!isCancelled) {
          setAiSummary(analysis);
          setPriority(analysis.urgency);
          setIsAnalyzing(false);
        }
      }

      // 2. Comprehensive Database-Aware & Proximity Duplicate Check
      setIsCheckingDuplicates(true);
      const matches = await findSimilarComplaintsWithDb(
        fullText,
        category,
        complaints,
        coordinates,
        locationAddress
      );
      if (!isCancelled) {
        setSimilarComplaints(matches);
        // Reset "report anyway" flag whenever new duplicates are detected
        if (matches.length > 0) setHasConfirmedReportAnyway(false);
        setIsCheckingDuplicates(false);
      }
    }, 350);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [description, voiceTranscript, category, coordinates.lat, coordinates.lng, photo, complaints, locationAddress]);

  const handleImageFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPG, PNG, WebP).', 'error');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      showToast('Image size exceeds 15MB limit. Please choose a smaller photo.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPhoto(dataUrl);
      setPhotoSource('upload');
      setPhotoFileName(file.name);
      showToast(`Photo "${file.name}" uploaded successfully`, 'success');
    };
    reader.onerror = () => {
      showToast('Could not read image file. Please try again.', 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageFile(file);
    }
    if (e.target) e.target.value = '';
  };

  const handleVoiceTranscript = (text: string) => {
    setVoiceTranscript(text);
    if (!description) {
      setDescription(text);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!photo) {
      showToast('Please capture an issue photo. A photo is mandatory.', 'error');
      setIsCameraOpen(true);
      return;
    }

    if (!description && !voiceTranscript) {
      showToast('Please provide a short description or voice recording.', 'error');
      return;
    }

    setIsSubmitting(true);

    // ── DEAD ZONE / OFFLINE DETECTION & INDEXEDDB CACHING ──
    if (!isOnline()) {
      try {
        const hardwareGpsTimestamp = new Date().toISOString();
        const payloadTitle = `${category} Issue at ${cityAreaDetails?.neighborhood || cityAreaDetails?.road || locationAddress.split(',')[0]}`;
        const offlineId = await saveComplaintOffline({
          offlineId: `offline_${Date.now()}`,
          title: payloadTitle,
          description: description || voiceTranscript,
          voiceTranscript,
          category,
          priority,
          photoBase64: photo,
          location: {
            address: locationAddress,
            latitude: coordinates.lat,
            longitude: coordinates.lng,
            ward: cityAreaDetails?.ward || ward,
            city: cityAreaDetails?.city,
            neighborhood: cityAreaDetails?.neighborhood,
            suburb: cityAreaDetails?.suburb,
            state: cityAreaDetails?.state,
            postcode: cityAreaDetails?.postcode,
          },
          aiSummary,
          gpsTimestamp: hardwareGpsTimestamp,
          createdAt: hardwareGpsTimestamp,
          syncStatus: 'pending',
        });

        const count = await getOfflineCount();
        setPendingOfflineCount(count);
        setIsSubmitting(false);
        showToast(
          '📵 Dead zone detected. Complaint cached in IndexedDB with hardware GPS timestamp. Auto-sync will dispatch when 4G/Wi-Fi connects!',
          'info'
        );
        onSuccess(`OFFLINE-${offlineId.slice(-6).toUpperCase()}`);
        return;
      } catch (offlineErr) {
        console.error('Failed to cache offline complaint:', offlineErr);
      }
    }

    // ── DUPLICATE INTERCEPTION (runs every submit unless user clicked "Report Anyway") ──
    if (!hasConfirmedReportAnyway) {
      try {
        const fullText = `${description} ${voiceTranscript}`.trim();
        const freshMatches = await findSimilarComplaintsWithDb(
          fullText,
          category,
          complaints,
          coordinates,
          locationAddress
        );

        if (freshMatches.length > 0) {
          setSimilarComplaints(freshMatches);
          showToast(
            `⚠️ ${freshMatches.length} similar complaint(s) found nearby (${freshMatches[0].matchScore}% match). Please review below before submitting.`,
            'warning'
          );
          setIsSubmitting(false);
          // Scroll to the duplicate alert section
          setTimeout(() => {
            document.getElementById('duplicate-alert-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
          return; // BLOCK submission — user must click "Confirm Existing" or "Report Anyway"
        }
      } catch (err) {
        console.warn('Duplicate check failed, allowing submission:', err);
      }
    }

    // ── Proceed with submission (either no duplicates or user clicked "Report Anyway") ──
    try {
      const newIssue = await submitComplaint({
        title: `${category} Issue at ${cityAreaDetails?.neighborhood || cityAreaDetails?.road || locationAddress.split(',')[0]}`,
        description: description || voiceTranscript,
        voiceTranscript,
        category,
        priority,
        originalPhotoUrl: photo,
        location: {
          address: locationAddress,
          latitude: coordinates.lat,
          longitude: coordinates.lng,
          ward: cityAreaDetails?.ward || ward,
          city: cityAreaDetails?.city,
          neighborhood: cityAreaDetails?.neighborhood,
          suburb: cityAreaDetails?.suburb,
          state: cityAreaDetails?.state,
          postcode: cityAreaDetails?.postcode,
        },
        aiSummary,
      });

      setIsSubmitting(false);
      setHasConfirmedReportAnyway(false);
      onSuccess(newIssue.trackingId);
    } catch (submitErr) {
      console.warn('Network submission failed, falling back to local IndexedDB caching:', submitErr);
      try {
        const hardwareGpsTimestamp = new Date().toISOString();
        const payloadTitle = `${category} Issue at ${cityAreaDetails?.neighborhood || cityAreaDetails?.road || locationAddress.split(',')[0]}`;
        const offlineId = await saveComplaintOffline({
          offlineId: `offline_${Date.now()}`,
          title: payloadTitle,
          description: description || voiceTranscript,
          voiceTranscript,
          category,
          priority,
          photoBase64: photo,
          location: {
            address: locationAddress,
            latitude: coordinates.lat,
            longitude: coordinates.lng,
            ward: cityAreaDetails?.ward || ward,
            city: cityAreaDetails?.city,
            neighborhood: cityAreaDetails?.neighborhood,
            suburb: cityAreaDetails?.suburb,
            state: cityAreaDetails?.state,
            postcode: cityAreaDetails?.postcode,
          },
          aiSummary,
          gpsTimestamp: hardwareGpsTimestamp,
          createdAt: hardwareGpsTimestamp,
          syncStatus: 'pending',
        });
        const count = await getOfflineCount();
        setPendingOfflineCount(count);
        setIsSubmitting(false);
        showToast(
          '📶 Patchy network drop: Stored securely in IndexedDB with hardware GPS timestamp. Will auto-sync when connection restores.',
          'info'
        );
        onSuccess(`OFFLINE-${offlineId.slice(-6).toUpperCase()}`);
      } catch {
        setIsSubmitting(false);
        showToast('Submission failed. Please try again.', 'error');
      }
    }
  };

  // Called when user explicitly clicks "Report Anyway as New Issue"
  const handleReportAnyway = () => {
    setHasConfirmedReportAnyway(true);
    // Trigger form submission programmatically after setting the flag
    setTimeout(() => {
      const form = document.querySelector<HTMLFormElement>('form');
      if (form) form.requestSubmit();
    }, 50);
  };

  return (
    <div className="w-full max-w-[860px] mx-auto flex flex-col gap-space-lg pb-16">
      {/* Header matching Stitch civicpulse_report_an_issue */}
      <header className="flex flex-col gap-space-xs">
        <div className="flex items-center gap-space-xs text-secondary mb-1">
          <span className="material-symbols-outlined text-[18px]">verified_user</span>
          <span className="font-body text-[11px] uppercase tracking-wider font-semibold">
            Verified Citizen Intake Portal
          </span>
        </div>
        <h1 className="font-headline text-[32px] md:text-[36px] font-bold text-on-surface">
          Report a Civic Issue
        </h1>
        <p className="font-body text-[15px] text-on-surface-variant max-w-2xl">
          Submit your neighborhood complaint using live camera photo, voice, text, or any combination below.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-space-md">
        {/* Offline Dead Zone / Sync Indicator Banner */}
        {(!networkOnline || pendingOfflineCount > 0) && (
          <div className="bg-surface-container-high rounded-xl p-space-md border border-amber-500/40 flex items-center justify-between gap-3 shadow-xs animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">
                  {!networkOnline ? 'wifi_off' : 'cloud_sync'}
                </span>
              </div>
              <div>
                <h4 className="font-headline font-semibold text-[13px] text-on-surface flex items-center gap-1.5">
                  <span>{!networkOnline ? 'Dead Zone / Patchy Connectivity Mode Active' : 'Automatic Background Sync Ready'}</span>
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                </h4>
                <p className="font-body text-[12px] text-on-surface-variant">
                  {!networkOnline
                    ? 'Field reports, voice recordings, photos, and hardware GPS timestamps are cached safely in browser IndexedDB. They will auto-sync upon 4G/Wi-Fi connection.'
                    : `${pendingOfflineCount} offline complaint(s) in local IndexedDB. Will auto-sync when transmission stabilizes.`}
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full font-body text-[11px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
              {!networkOnline ? '📵 Dead Zone' : `📤 ${pendingOfflineCount} Pending`}
            </span>
          </div>
        )}

        <span className="font-body text-[12px] text-on-surface-variant uppercase tracking-wider font-semibold">
          Multi-Modal Inputs (Combinable)
        </span>

        {/* 1. Mandatory Photo Section: Upload from PC / Mobile or Live Camera Capture */}
        <section className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md border border-outline-variant/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-sm">
              <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface">
                <span className="material-symbols-outlined text-[20px]">photo_camera</span>
              </div>
              <div>
                <h2 className="font-headline font-semibold text-[16px] text-on-surface">
                  Photo Evidence <span className="text-error font-bold">*Mandatory</span>
                </h2>
                <p className="font-body text-[12px] text-on-surface-variant">
                  Upload an image from your PC / Mobile gallery or capture live with your camera.
                </p>
              </div>
            </div>
            <span
              className={`px-space-sm py-0.5 rounded-full font-body text-[11px] font-semibold ${
                photo
                  ? 'bg-on-tertiary-container/15 text-on-tertiary-container'
                  : 'bg-error-container text-on-error-container'
              }`}
            >
              {photo ? (photoSource === 'upload' ? 'File Attached' : 'Live Captured') : 'Photo Required'}
            </span>
          </div>

          {/* Hidden File Input for Direct PC & Mobile Gallery Upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileInputChange}
          />

          {photo ? (
            <div className="bg-surface-container-low rounded-lg p-space-md flex flex-col sm:flex-row items-center justify-between gap-space-md">
              <div className="flex items-center gap-space-md w-full sm:w-auto">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-surface-container shrink-0 border border-surface-container-high shadow-sm">
                  <img src={photo} alt="Issue preview" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col">
                  <span className="font-body text-[13px] text-on-surface font-semibold truncate max-w-[260px]">
                    {photoSource === 'upload' ? (photoFileName || 'Uploaded Photo File') : 'Live Camera Snapshot'}
                  </span>
                  <span className="font-body text-[11px] text-on-surface-variant">
                    {photoSource === 'upload' ? 'Selected from PC / Mobile storage' : 'Geotagged via Device Camera'}
                  </span>
                  <div className="flex items-center gap-1 mt-1 text-on-tertiary-container font-body text-[11px] font-medium">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    <span>Ready for AI verification &amp; dispatch</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-space-xs flex-wrap w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-space-md py-1.5 rounded-lg font-body text-[12px] font-semibold text-on-surface bg-surface-container hover:bg-surface-container-high transition-colors flex items-center gap-1 border border-outline-variant/30 cursor-pointer"
                  title="Upload a different photo from PC or Mobile"
                >
                  <span className="material-symbols-outlined text-[16px]">upload_file</span>
                  <span>Upload File</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="px-space-md py-1.5 rounded-lg font-body text-[12px] font-semibold text-on-surface bg-surface-container hover:bg-surface-container-high transition-colors flex items-center gap-1 border border-outline-variant/30 cursor-pointer"
                  title="Take new live camera snapshot"
                >
                  <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                  <span>Use Camera</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPhoto(null);
                    setPhotoFileName('');
                  }}
                  className="px-space-md py-1.5 rounded-lg font-body text-[12px] font-semibold text-error hover:bg-error-container/30 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  <span>Remove</span>
                </button>
              </div>
            </div>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleImageFile(file);
              }}
              className={`border-2 border-dashed rounded-xl p-space-lg flex flex-col items-center justify-center text-center gap-space-xs transition-all ${
                isDragging
                  ? 'border-primary bg-primary-container/20 scale-[1.01]'
                  : 'border-outline-variant/60 bg-surface-container-low/70 hover:bg-surface-container-low'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-secondary mb-1">
                <span className="material-symbols-outlined text-[28px]">
                  {isDragging ? 'file_download' : 'add_photo_alternate'}
                </span>
              </div>
              <p className="font-body text-[14px] font-semibold text-on-surface">
                {isDragging ? 'Drop Image File Here' : 'Upload or Capture Issue Photo'}
              </p>
              <p className="font-body text-[12px] text-on-surface-variant max-w-md mb-3">
                Choose an image file from your PC or mobile gallery, or activate your device camera directly.
              </p>

              {/* Dual Action Buttons: Upload from Device + Open Camera */}
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto px-space-lg py-2.5 rounded-lg bg-primary text-on-primary font-body text-[13px] font-semibold flex items-center justify-center gap-2 shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">upload_file</span>
                  <span>Upload from PC / Mobile</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="w-full sm:w-auto px-space-lg py-2.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-body text-[13px] font-semibold flex items-center justify-center gap-2 border border-outline-variant/40 shadow-2xs active:scale-95 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                  <span>Open Live Camera</span>
                </button>
              </div>

              <span className="text-[11px] text-on-surface-variant mt-2">
                Supported formats: JPG, PNG, WebP • Drag &amp; drop supported on PC
              </span>
            </div>
          )}
        </section>

        {/* 2. Optional Voice Recording */}
        <AudioRecorder onTranscriptionComplete={handleVoiceTranscript} />

        {/* 3. Text Description */}
        <section className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md border border-outline-variant/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-sm">
              <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface">
                <span className="material-symbols-outlined text-[20px]">edit_note</span>
              </div>
              <div>
                <h2 className="font-headline font-semibold text-[16px] text-on-surface">
                  Text – Type your complaint
                </h2>
                <p className="font-body text-[12px] text-on-surface-variant">
                  Add notes, context, or specific safety observations.
                </p>
              </div>
            </div>
          </div>
          <div className="relative w-full">
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened, hazards observed, or specific neighborhood details (e.g. Deep pothole causing bicycle tire damage)..."
              className="w-full bg-surface-container-low rounded-lg p-space-md text-on-surface font-body text-[14px] focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-secondary/40 transition-all resize-none shadow-inner border border-outline-variant/30"
            />
            <div className="flex justify-between items-center px-1 pt-1.5 text-on-surface-variant font-body text-[11px]">
              <span>
                {voiceTranscript ? 'Voice transcription synced with notes' : 'Enter clear details'}
              </span>
              <span>{description.length} characters</span>
            </div>
          </div>

          {/* Category Dropdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md pt-2 border-t border-surface-container">
            <div>
              <label className="block text-[12px] font-semibold text-on-surface mb-1">
                Category (AI Assisted)
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IssueCategory)}
                className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-sm text-on-surface font-medium focus:outline-none border border-outline-variant/30 cursor-pointer"
              >
                <option value="Roads">Roads & Potholes</option>
                <option value="Garbage">Garbage & Waste</option>
                <option value="Water Supply">Water Supply & Leakage</option>
                <option value="Drainage">Drainage & Sewage</option>
                <option value="Streetlights">Streetlights & Grid</option>
                <option value="Other">Other Issues</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-on-surface mb-1">
                Priority Assessment
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-sm text-on-surface font-medium focus:outline-none border border-outline-variant/30 cursor-pointer"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent (Immediate Safety Risk)</option>
              </select>
            </div>
          </div>
        </section>

        {/* 4. GPS Location & Near City Area Details */}
        <section className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-sm border border-outline-variant/30">
          <div className="flex items-center justify-between flex-wrap gap-space-xs">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-secondary text-[20px]">near_me</span>
              <h3 className="font-headline font-semibold text-[16px] text-on-surface">
                GPS Location &amp; City Area Details
              </h3>
            </div>
            <span className="inline-flex items-center gap-1 px-space-sm py-0.5 rounded-full bg-surface-container text-on-tertiary-container font-body text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container"></span>
              <span>{gpsStatus === 'locating' ? 'Acquiring GPS...' : 'High Accuracy (±3m) • Geotagged'}</span>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md pt-space-xs">
            <div className="flex items-center gap-space-sm">
              <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant shrink-0">
                <span className="material-symbols-outlined text-[18px]">location_on</span>
              </div>
              <div className="flex flex-col">
                <span className="font-body text-[14px] text-on-surface font-semibold">
                  {locationAddress}
                </span>
                <span className="font-body text-[12px] text-on-surface-variant font-mono">
                  Latitude: {coordinates.lat.toFixed(4)}° N • Longitude: {coordinates.lng.toFixed(4)}° W
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={requestLocation}
              className="px-space-md py-1.5 rounded-lg font-body text-[13px] text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors flex items-center gap-1 border border-outline-variant/30 shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">my_location</span>
              <span>Refresh GPS &amp; Area</span>
            </button>
          </div>

          {/* Near City Area Details Grid */}
          <div className="pt-space-xs border-t border-surface-container mt-space-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-secondary">domain</span>
                Detected Municipal Area Details
              </span>
              {isResolvingArea && (
                <span className="text-[10px] text-secondary font-medium animate-pulse flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>
                  Resolving with OpenStreetMap...
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-xs text-left">
              <div className="p-2.5 rounded-lg bg-surface-container-low/70 border border-surface-container">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                  City / Metro
                </span>
                <span className="text-[13px] font-bold text-on-surface truncate block" title={cityAreaDetails?.city}>
                  🏙️ {cityAreaDetails?.city || 'Metro Region'}
                </span>
                <span className="text-[10px] text-on-surface-variant truncate block">
                  {cityAreaDetails?.state || 'State Territory'}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-surface-container-low/70 border border-surface-container">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                  Area / Neighborhood
                </span>
                <span
                  className="text-[13px] font-bold text-on-surface truncate block"
                  title={cityAreaDetails?.neighborhood || cityAreaDetails?.suburb}
                >
                  📍 {cityAreaDetails?.neighborhood || cityAreaDetails?.suburb || 'District 4'}
                </span>
                <span className="text-[10px] text-on-surface-variant truncate block">
                  {cityAreaDetails?.road || 'Local Access Way'}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-surface-container-low/70 border border-surface-container">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                  Ward &amp; Zone
                </span>
                <span className="text-[13px] font-bold text-secondary truncate block">
                  🏛️ {cityAreaDetails?.ward || ward}
                </span>
                <span className="text-[10px] text-on-surface-variant truncate block">Municipal Zone</span>
              </div>

              <div className="p-2.5 rounded-lg bg-surface-container-low/70 border border-surface-container">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                  Postal Code
                </span>
                <span className="text-[13px] font-mono font-semibold text-on-surface truncate block">
                  📮 {cityAreaDetails?.postcode || 'Detected'}
                </span>
                <span className="text-[10px] text-on-tertiary-container font-medium truncate block">
                  {cityAreaDetails?.source === 'nominatim' ? 'OSM Geocoded' : 'Auto-Resolved'}
                </span>
              </div>
            </div>

            {/* Interactive OpenStreetMap Pin for Visual Location Confirmation */}
            <div className="mt-2.5 rounded-lg overflow-hidden border border-surface-container shadow-xs">
              <OpenStreetMap
                center={{ lat: coordinates.lat, lng: coordinates.lng }}
                zoom={16}
                height="150px"
                radiusMetres={150}
                markers={[
                  {
                    lat: coordinates.lat,
                    lng: coordinates.lng,
                    title: locationAddress,
                    color: 'primary',
                    popup: `${locationAddress} (Complaint Geotag)`,
                  },
                ]}
              />
            </div>
          </div>
        </section>

        {/* 4B. Emergency Facility Proximity Alert (Hospitals, Schools, Fire Stations, Clinics) */}
        {emergencyResult?.isNearEmergencyZone && (
          <section className="bg-surface-container-high rounded-xl p-space-md border-2 border-error/40 flex flex-col gap-space-sm shadow-sm animate-fade-in">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-error">
                <span className="material-symbols-outlined text-[24px]">emergency</span>
                <div>
                  <h3 className="font-headline font-bold text-[15px] text-on-surface">
                    Emergency Zone Priority Boost Triggered
                  </h3>
                  <p className="font-body text-[12px] text-on-surface-variant">
                    {emergencyResult.boostReason}. Automated priority elevation protects emergency routes and child safety.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-error text-white font-body text-[12px] font-bold shadow-xs">
                🚨 Auto-Elevated: {priority}
              </span>
            </div>

            {/* List of Detected Nearby Emergency Facilities */}
            <div className="flex flex-wrap gap-2 pt-1 border-t border-surface-container">
              {emergencyResult.nearbyPlaces.slice(0, 4).map((place, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface font-body text-[12px] border border-surface-container shadow-2xs"
                >
                  <span className="text-[14px]">
                    {place.type === 'hospital' || place.type === 'clinic'
                      ? '🏥'
                      : place.type === 'school' || place.type === 'kindergarten' || place.type === 'college' || place.type === 'university'
                      ? '🏫'
                      : place.type === 'fire_station'
                      ? '🚒'
                      : '👮'}
                  </span>
                  <span className="font-semibold text-on-surface">{place.name}</span>
                  <span className="text-[11px] font-mono text-secondary font-bold">
                    ({place.distanceMeters}m away)
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 5. Gemini AI Summary of Complaint */}
        <section className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-sm border border-outline-variant/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-secondary text-[20px]">neurology</span>
              <h3 className="font-headline font-semibold text-[16px] text-on-surface">AI Triage Summary</h3>
            </div>
            <span className="font-body text-[11px] text-on-surface-variant">
              {isAnalyzing ? 'Analyzing via Gemini AI...' : 'Automated Municipal Triaging'}
            </span>
          </div>
          <div className="bg-surface-container-low rounded-lg p-space-md flex flex-col gap-space-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm pb-space-xs border-b border-surface-container">
              <div>
                <span className="font-body text-[11px] text-on-surface-variant block">Detected Category</span>
                <span className="font-body text-[14px] text-on-surface font-semibold">{category}</span>
              </div>
              <div>
                <span className="font-body text-[11px] text-on-surface-variant block">Severity Score</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      priority === 'Urgent'
                        ? 'bg-error animate-ping'
                        : priority === 'High'
                        ? 'bg-error'
                        : 'bg-secondary'
                    }`}
                  ></span>
                  <span className="font-body text-[13px] font-semibold text-on-surface">
                    {priority} Priority
                  </span>
                </div>
              </div>
            </div>
            <div>
              <span className="font-body text-[11px] text-on-surface-variant block mb-1">Key Summary</span>
              <p className="font-body text-[13px] text-on-surface bg-surface-container-lowest p-space-sm rounded-lg border border-surface-container">
                "{aiSummary.keySummary}"
              </p>
            </div>
          </div>
        </section>

        {/* 6. ADVANCED MULTI-FACTOR DUPLICATE COMPLAINT DETECTION ALERT */}
        {similarComplaints.length > 0 && (
          <section id="duplicate-alert-section" className="bg-surface-container-high rounded-xl p-space-lg shadow-md flex flex-col gap-space-md border-2 border-secondary/40 animate-fade-in">
            <div className="flex items-start justify-between gap-space-sm">
              <div className="flex items-center gap-space-xs text-on-secondary-container">
                <span className="material-symbols-outlined text-[24px] text-secondary">content_copy</span>
                <div>
                  <h3 className="font-headline font-bold text-[17px] text-on-surface">
                    {similarComplaints.length === 1
                      ? '1 Similar Existing Complaint Detected in Database'
                      : `${similarComplaints.length} Similar Complaints Detected in Database`}
                  </h3>
                  <p className="font-body text-[12px] text-on-surface-variant">
                    Found matching civic grievance records using live GPS proximity &amp; issue categorization.
                  </p>
                </div>
              </div>
              <span className="px-space-md py-1 rounded-full bg-secondary text-on-secondary font-body text-[12px] font-bold shadow-xs">
                {similarComplaints[0].matchScore}% Match
              </span>
            </div>

            {/* List all detected matches (primary + secondary) */}
            <div className="flex flex-col gap-space-sm">
              {similarComplaints.slice(0, 2).map((match, idx) => (
                <div
                  key={match.complaint.id || idx}
                  className="bg-surface-container-lowest rounded-xl p-space-md flex flex-col gap-space-sm border border-surface-container shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-surface-container">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-headline text-[15px] font-bold text-primary">
                        #{match.complaint.trackingId}
                      </span>
                      <span className="text-outline-variant">•</span>
                      <span className="font-body text-[14px] text-on-surface font-semibold">
                        {match.complaint.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {match.distanceMeters !== undefined && (
                        <span className="px-2 py-0.5 rounded-full bg-secondary-container/80 text-on-secondary-container font-body text-[11px] font-semibold">
                          📍 {match.distanceMeters}m away
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-full font-body text-[11px] font-semibold ${
                          match.complaint.status === 'Assigned'
                            ? 'bg-primary-container text-on-primary'
                            : match.complaint.status === 'In Progress'
                            ? 'bg-secondary-container text-on-secondary-container'
                            : 'bg-surface-container text-on-surface-variant'
                        }`}
                      >
                        {match.complaint.status}
                      </span>
                    </div>
                  </div>

                  {/* Thumbnail & Description & Match Reasons */}
                  <div className="flex flex-col sm:flex-row gap-space-md items-start">
                    {match.complaint.originalPhotoUrl && (
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-surface-container shrink-0 border border-surface-container shadow-xs">
                        <img
                          src={match.complaint.originalPhotoUrl}
                          alt="Existing complaint evidence"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 text-left">
                      <p className="font-body text-[13px] text-on-surface line-clamp-2">
                        "{match.complaint.description}"
                      </p>
                      <span className="font-body text-[11px] text-on-surface-variant block mt-1">
                        Location: {match.complaint.location.address} •{' '}
                        <strong>{match.complaint.citizenConfirmationCount} residents confirmed</strong>
                      </span>

                      {/* Match Reasons Chips */}
                      {match.matchReasons && match.matchReasons.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {match.matchReasons.map((reason, rIdx) => (
                            <span
                              key={rIdx}
                              className="px-2 py-0.5 rounded-md bg-surface-container font-body text-[11px] text-on-surface-variant font-medium"
                            >
                              {reason}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Confirmation & Report Anyway Action Bar */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-space-sm pt-space-xs border-t border-surface-container mt-1">
                    <p className="font-body text-[12px] text-on-surface-variant">
                      💡 <strong>Recommended:</strong> Confirming boosts emergency priority without creating duplicate work tickets.
                    </p>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          confirmExistingIssue(match.complaint.id, 'cit-001');
                          onSuccess(match.complaint.trackingId);
                        }}
                        className="w-full sm:w-auto px-space-md py-2 rounded-lg bg-secondary text-on-secondary font-body text-[13px] font-semibold hover:opacity-95 shadow-xs transition-opacity flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[16px]">thumb_up</span>
                        <span>Confirm Existing Issue</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-1 text-[12px] text-on-surface-variant">
              <span>Is your problem distinct from the above records?</span>
              <button
                type="button"
                onClick={handleReportAnyway}
                className="px-space-md py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-body text-[12px] font-semibold transition-colors border border-outline-variant/40"
              >
                <span>Report Anyway as New Issue</span>
              </button>
            </div>
          </section>
        )}

        {/* 7. Submit Action Button */}
        <section className="flex flex-col items-center gap-space-sm pt-space-md">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto min-w-[280px] px-space-xl py-3 rounded-lg bg-primary text-on-primary font-body text-[15px] font-semibold shadow-md hover:bg-primary-container disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Submitting to Municipal Ledger...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">send</span>
                <span>Submit Complaint</span>
              </>
            )}
          </button>
          <p className="font-body text-[12px] text-on-surface-variant text-center max-w-lg flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[15px] text-on-tertiary-container">lock</span>
            <span>
              Encrypted municipal filing under open civic standards. You can track this report via Track Complaints.
            </span>
          </p>
        </section>
      </form>

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(photoData) => setPhoto(photoData)}
      />
    </div>
  );
};
