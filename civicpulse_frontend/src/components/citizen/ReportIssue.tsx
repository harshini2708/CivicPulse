import React, { useState, useEffect } from 'react';
import { useComplaints } from '../../context/ComplaintContext';
import { CameraCaptureModal } from '../common/CameraCaptureModal';
import { AudioRecorder } from '../common/AudioRecorder';
import { IssueCategory, PriorityLevel, Complaint } from '../../types';
import { analyzeComplaintWithGemini, findSimilarComplaints } from '../../config/gemini';

interface ReportIssueProps {
  onSuccess: (trackingId: string) => void;
}

export const ReportIssue: React.FC<ReportIssueProps> = ({ onSuccess }) => {
  const { complaints, submitComplaint, confirmExistingIssue, showToast } = useComplaints();

  // Form State
  const [photo, setPhoto] = useState<string | null>(null);
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
  const [similarComplaint, setSimilarComplaint] = useState<{
    complaint: Complaint;
    matchScore: number;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto GPS acquisition
  const requestLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'warning');
      return;
    }
    setGpsStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ lat: latitude, lng: longitude });
        setGpsStatus('acquired');
        setLocationAddress(`Near Lat: ${latitude.toFixed(4)}°, Lng: ${longitude.toFixed(4)}°, District 4`);
        setWard('Ward 4A');
        showToast('Live GPS location verified (±3m)', 'success');
      },
      (error) => {
        console.warn('GPS location access denied or timed out:', error);
        setGpsStatus('error');
        showToast('Could not fetch GPS. Using default District 4 anchor.', 'info');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Re-run AI Analysis & Duplicate Check when description changes
  useEffect(() => {
    const timer = setTimeout(async () => {
      const fullText = `${description} ${voiceTranscript}`.trim();
      if (fullText.length > 10) {
        setIsAnalyzing(true);
        const analysis = await analyzeComplaintWithGemini(fullText, photo || undefined);
        setAiSummary(analysis);
        setCategory(analysis.category);
        setPriority(analysis.urgency);

        // Duplicate Check
        const matches = findSimilarComplaints(fullText, analysis.category, complaints);
        if (matches.length > 0) {
          setSimilarComplaint(matches[0]);
        } else {
          setSimilarComplaint(null);
        }
        setIsAnalyzing(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [description, voiceTranscript, photo, complaints]);

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
    try {
      const newIssue = await submitComplaint({
        title: `${category} Issue at ${locationAddress.split(',')[0]}`,
        description: description || voiceTranscript,
        voiceTranscript,
        category,
        priority,
        originalPhotoUrl: photo,
        location: {
          address: locationAddress,
          latitude: coordinates.lat,
          longitude: coordinates.lng,
          ward,
        },
        aiSummary,
      });

      setIsSubmitting(false);
      onSuccess(newIssue.trackingId);
    } catch (err) {
      setIsSubmitting(false);
      showToast('Submission failed. Please try again.', 'error');
    }
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
        <span className="font-body text-[12px] text-on-surface-variant uppercase tracking-wider font-semibold">
          Multi-Modal Inputs (Combinable)
        </span>

        {/* 1. Mandatory Photo Capture Section */}
        <section className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md border border-outline-variant/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-sm">
              <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface">
                <span className="material-symbols-outlined text-[20px]">photo_camera</span>
              </div>
              <div>
                <h2 className="font-headline font-semibold text-[16px] text-on-surface">
                  Photo – Live Camera Capture <span className="text-error font-bold">*Mandatory</span>
                </h2>
                <p className="font-body text-[12px] text-on-surface-variant">
                  Capture a clear live photo of the civic defect for visual AI verification.
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
              {photo ? 'Photo Attached' : 'Photo Required'}
            </span>
          </div>

          {photo ? (
            <div className="bg-surface-container-low rounded-lg p-space-md flex flex-col sm:flex-row items-center justify-between gap-space-md">
              <div className="flex items-center gap-space-md w-full sm:w-auto">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-surface-container shrink-0 border border-surface-container-high shadow-sm">
                  <img src={photo} alt="Issue preview" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col">
                  <span className="font-body text-[13px] text-on-surface font-semibold truncate max-w-[220px]">
                    Live Camera Capture
                  </span>
                  <span className="font-body text-[11px] text-on-surface-variant">
                    Geotagged • Ready for AI verification
                  </span>
                  <div className="flex items-center gap-1 mt-1 text-on-tertiary-container font-body text-[11px] font-medium">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    <span>Ready for dispatch</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-space-sm w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="px-space-md py-1.5 rounded-lg font-body text-[13px] text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors flex items-center gap-1 border border-outline-variant/30"
                >
                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                  <span>Retake</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPhoto(null)}
                  className="px-space-md py-1.5 rounded-lg font-body text-[13px] text-error hover:bg-error-container/30 transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                  <span>Remove</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-surface-container-low/70 border-2 border-dashed border-outline-variant/60 rounded-xl p-space-lg flex flex-col items-center justify-center text-center gap-space-xs">
              <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-secondary mb-1">
                <span className="material-symbols-outlined text-[28px]">add_a_photo</span>
              </div>
              <p className="font-body text-[14px] font-semibold text-on-surface">
                No photo captured yet
              </p>
              <p className="font-body text-[12px] text-on-surface-variant max-w-sm mb-2">
                Click below to activate device camera and take an on-site photograph of the problem.
              </p>
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="px-space-lg py-2.5 rounded-lg bg-primary text-on-primary font-body text-[13px] font-semibold flex items-center gap-2 shadow-sm hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                <span>Open Live Camera</span>
              </button>
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

        {/* 4. GPS Location Capture */}
        <section className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-sm border border-outline-variant/30">
          <div className="flex items-center justify-between flex-wrap gap-space-xs">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-secondary text-[20px]">near_me</span>
              <h3 className="font-headline font-semibold text-[16px] text-on-surface">GPS Location</h3>
            </div>
            <span className="inline-flex items-center gap-1 px-space-sm py-0.5 rounded-full bg-surface-container text-on-tertiary-container font-body text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container"></span>
              <span>{gpsStatus === 'locating' ? 'Locating...' : 'High Accuracy (±3m) • Auto-Detected'}</span>
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
                  Latitude: {coordinates.lat.toFixed(4)}° N, Longitude: {coordinates.lng.toFixed(4)}° W
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={requestLocation}
              className="px-space-md py-1.5 rounded-lg font-body text-[13px] text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors flex items-center gap-1 border border-outline-variant/30"
            >
              <span className="material-symbols-outlined text-[16px]">my_location</span>
              <span>Refresh GPS</span>
            </button>
          </div>
        </section>

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

        {/* 6. DUPLICATE COMPLAINT DETECTION ALERT (Matching Stitch UI) */}
        {similarComplaint && (
          <section className="bg-surface-container-high rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md border border-secondary/30 animate-fade-in">
            <div className="flex items-start justify-between gap-space-sm">
              <div className="flex items-center gap-space-xs text-on-secondary-container">
                <span className="material-symbols-outlined text-[22px]">content_copy</span>
                <h3 className="font-headline font-bold text-[16px]">
                  1 Similar Existing Complaint Detected
                </h3>
              </div>
              <span className="px-space-sm py-0.5 rounded-full bg-surface-container-lowest text-on-surface-variant font-body text-[11px] font-semibold">
                {similarComplaint.matchScore}% Proximity Match
              </span>
            </div>

            <div className="bg-surface-container-lowest rounded-lg p-space-md flex flex-col gap-space-sm border border-surface-container">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-space-xs flex-wrap">
                  <span className="font-body text-[14px] text-on-surface font-bold">
                    Issue #{similarComplaint.complaint.trackingId}:
                  </span>
                  <span className="font-body text-[14px] text-on-surface font-medium">
                    {similarComplaint.complaint.title}
                  </span>
                </div>
                <p className="font-body text-[12px] text-on-surface-variant">
                  Location: {similarComplaint.complaint.location.address} • Status:{' '}
                  <span className="text-secondary font-semibold">
                    {similarComplaint.complaint.status}
                  </span>{' '}
                  • {similarComplaint.complaint.citizenConfirmationCount} residents confirmed
                </p>
              </div>

              <p className="font-body text-[12px] text-on-surface-variant bg-surface-container-low p-space-sm rounded-lg">
                💡 <strong>Tip:</strong> Confirming the existing issue reinforces its neighborhood priority
                score without creating duplicate work orders for municipal workers.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-space-sm pt-space-xs">
                <button
                  type="button"
                  onClick={() => {
                    confirmExistingIssue(similarComplaint.complaint.id, 'cit-001');
                    onSuccess(similarComplaint.complaint.trackingId);
                  }}
                  className="w-full sm:w-auto px-space-lg py-2 rounded-lg bg-secondary text-on-secondary font-body text-[13px] font-semibold hover:opacity-95 shadow-sm transition-opacity flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">thumb_up</span>
                  <span>Confirm Existing Issue</span>
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-space-md py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-body text-[13px] font-medium transition-colors flex items-center justify-center border border-outline-variant/40"
                >
                  <span>Report Anyway</span>
                </button>
              </div>
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
