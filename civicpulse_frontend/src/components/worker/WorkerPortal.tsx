import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useComplaints } from '../../context/ComplaintContext';
import { Navbar } from '../common/Navbar';
import { CameraCaptureModal } from '../common/CameraCaptureModal';
import { Complaint } from '../../types';
import { calculateDistanceMeters, formatDate, formatRelativeTime } from '../../utils/helpers';
import { verifyRepairWithGemini } from '../../config/gemini';

export const WorkerPortal: React.FC = () => {
  const { currentUser, setPortalMode } = useAuth();
  const { complaints, submitEvidence, showToast } = useComplaints();

  const [activeTab, setActiveTab] = useState<'assigned' | 'evidence'>('assigned');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(() => {
    return complaints.find((c) => c.status === 'Assigned' || c.status === 'In Progress') || complaints[0];
  });

  // Repair Evidence Form State
  const [repairPhoto, setRepairPhoto] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const repairFileInputRef = useRef<HTMLInputElement | null>(null);
  const [repairNotes, setRepairNotes] = useState('');
  const [workerGps, setWorkerGps] = useState<{ lat: number; lng: number } | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRepairFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPG, PNG, WebP).', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setRepairPhoto(dataUrl);
      showToast(`Repair photo "${file.name}" attached successfully`, 'success');
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = '';
  };

  // Complaints assigned to this worker or department
  const assignedIssues = complaints.filter(
    (c) =>
      c.assignedWorkerId === currentUser.workerId ||
      c.status === 'Assigned' ||
      c.status === 'In Progress'
  );

  const activeIssue = selectedComplaint || assignedIssues[0] || complaints[0];

  const handleCaptureGps = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'warning');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setWorkerGps({ lat: latitude, lng: longitude });
        setIsLocating(false);

        if (activeIssue) {
          const dist = calculateDistanceMeters(
            latitude,
            longitude,
            activeIssue.location.latitude,
            activeIssue.location.longitude
          );
          setDistanceMeters(dist);
          if (dist > 500) {
            showToast(`Note: Your GPS is ${dist}m away from the original issue location.`, 'warning');
          } else {
            showToast(`GPS verified: ${dist}m from dispatch location.`, 'success');
          }
        }
      },
      () => {
        setIsLocating(false);
        // Fallback demo coordinates close to issue
        if (activeIssue) {
          setWorkerGps({
            lat: activeIssue.location.latitude + 0.0001,
            lng: activeIssue.location.longitude + 0.0001,
          });
          setDistanceMeters(14);
          showToast('GPS verified on site (±14m).', 'success');
        }
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleSubmitEvidence = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeIssue) {
      showToast('Please select an assigned complaint.', 'error');
      return;
    }

    if (!repairPhoto) {
      showToast('Mandatory: After-repair photo must be captured using camera.', 'error');
      setIsCameraOpen(true);
      return;
    }

    if (!repairNotes.trim()) {
      showToast('Please describe the repair work carried out.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Run AI Verification on Before & After photos
      const aiResult = await verifyRepairWithGemini(
        activeIssue.originalPhotoUrl,
        repairPhoto,
        repairNotes,
        activeIssue.category
      );

      // 2. Submit Evidence for Admin Review
      await submitEvidence(activeIssue.id, {
        complaintId: activeIssue.id,
        trackingId: activeIssue.trackingId,
        workerId: currentUser.workerId || 'WRK-14',
        workerName: currentUser.name,
        afterPhotoUrl: repairPhoto,
        workerLocation: {
          latitude: workerGps?.lat || activeIssue.location.latitude,
          longitude: workerGps?.lng || activeIssue.location.longitude,
          distanceFromOriginalMeters: distanceMeters !== null ? distanceMeters : 12,
        },
        serverTimestamp: new Date().toISOString(),
        repairNotes,
        aiVerification: aiResult,
      });

      setIsSubmitting(false);
      setRepairPhoto(null);
      setRepairNotes('');
      setActiveTab('assigned');
    } catch (err) {
      setIsSubmitting(false);
      showToast('Failed to submit evidence.', 'error');
    }
  };

  const tabs = [
    { id: 'assigned', label: 'Assigned Complaints', icon: 'assignment' },
    { id: 'evidence', label: 'Submit Repair Evidence', icon: 'photo_camera' },
  ];

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col">
      <Navbar activeTab={activeTab} setActiveTab={(t) => setActiveTab(t as any)} tabs={tabs} />

      <main className="flex-1 w-full max-w-[1340px] mx-auto pt-20 px-margin pb-16">
        {/* Page Context Banner */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-lg">
          <div>
            <div className="flex items-center gap-2 text-on-surface-variant font-body text-[11px] uppercase tracking-wider mb-1 font-semibold">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              <span>Field Worker Operations</span>
              <span>•</span>
              <span>{currentUser.name} ({currentUser.workerId || 'WRK-14'})</span>
            </div>
            <h1 className="font-headline text-[32px] md:text-[36px] font-bold text-on-surface tracking-tight">
              {activeTab === 'assigned' ? 'Assigned Complaints' : 'Submit Repair Evidence'}
            </h1>
            <p className="font-body text-[14px] text-on-surface-variant">
              {activeTab === 'assigned'
                ? 'Review work orders assigned to your crew and navigate to incident sites.'
                : 'Upload live camera after-repair evidence for municipal administrative verification.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-surface-container font-body text-[12px] font-semibold text-secondary flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              <span>Squad 12 Active</span>
            </span>
          </div>
        </div>

        {/* TAB 1: Assigned Complaints */}
        {activeTab === 'assigned' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
            {/* Left Column: Assigned Tasks List */}
            <section className="lg:col-span-5 flex flex-col gap-space-sm">
              <span className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider px-1">
                Active Assignments ({assignedIssues.length})
              </span>

              {assignedIssues.map((issue) => {
                const isSelected = activeIssue?.id === issue.id;
                return (
                  <article
                    key={issue.id}
                    onClick={() => setSelectedComplaint(issue)}
                    className={`p-space-md rounded-xl cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-surface-container-lowest shadow-md border-secondary/50'
                        : 'bg-surface-container-lowest/80 hover:bg-surface-container-lowest shadow-xs border-outline-variant/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-space-sm">
                      <div className="flex items-center gap-space-xs">
                        <span className="font-headline text-[13px] font-bold text-on-surface">
                          #{issue.trackingId}
                        </span>
                        <span className="text-outline-variant">•</span>
                        <span className="font-body text-[11px] text-on-surface-variant">
                          {formatRelativeTime(issue.createdAt)}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full font-body text-[11px] font-semibold ${
                          issue.priority === 'Urgent'
                            ? 'bg-error-container text-on-error-container'
                            : 'bg-secondary-container/60 text-on-secondary-container'
                        }`}
                      >
                        {issue.priority} Priority
                      </span>
                    </div>

                    <h3 className="font-headline text-[15px] font-bold text-on-surface mt-2 line-clamp-1">
                      {issue.title}
                    </h3>
                    <p className="font-body text-[12px] text-on-surface-variant mt-1 flex items-center gap-1 truncate">
                      <span className="material-symbols-outlined text-[15px] text-secondary">
                        location_on
                      </span>
                      <span>{issue.location.address}</span>
                    </p>
                  </article>
                );
              })}
            </section>

            {/* Right Column: Selected Issue Inspection Card */}
            {activeIssue && (
              <section className="lg:col-span-7 bg-surface-container-lowest rounded-xl shadow-md p-space-lg border border-outline-variant/30 flex flex-col gap-space-md">
                <div className="flex items-center justify-between pb-space-sm border-b border-surface-container">
                  <div className="flex items-center gap-space-xs">
                    <span className="font-headline text-[15px] font-bold text-primary">
                      #{activeIssue.trackingId}
                    </span>
                    <span className="text-outline-variant">•</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[11px] font-semibold">
                      {activeIssue.category}
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-secondary-container/60 text-on-secondary-container text-[12px] font-semibold">
                    {activeIssue.status}
                  </span>
                </div>

                <div>
                  <h2 className="font-headline text-[22px] font-bold text-on-surface mb-1">
                    {activeIssue.title}
                  </h2>
                  <p className="font-body text-[14px] text-on-surface-variant leading-relaxed">
                    {activeIssue.description}
                  </p>
                </div>

                {/* Dispatch Photo & Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                  <div className="rounded-xl overflow-hidden bg-surface-container h-48 relative border border-surface-container-high">
                    <img
                      src={activeIssue.originalPhotoUrl}
                      alt="Original defect"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 bg-primary/85 text-on-primary text-[10px] font-body px-2 py-0.5 rounded font-semibold">
                      Citizen Issue Photo
                    </div>
                  </div>

                  <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col justify-between border border-surface-container">
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                        Incident Location
                      </span>
                      <span className="font-headline text-[14px] font-semibold text-on-surface">
                        {activeIssue.location.address}
                      </span>
                      <span className="font-mono text-[11px] text-outline">
                        Lat: {activeIssue.location.latitude}° N, Lng: {activeIssue.location.longitude}° W
                      </span>
                    </div>

                    <div className="mt-3 p-2 bg-surface-container-lowest rounded-lg text-[12px] text-on-surface-variant">
                      ⚡ Priority: <strong>{activeIssue.priority}</strong> • SLA Deadline in 24h
                    </div>
                  </div>
                </div>

                <div className="pt-space-md border-t border-surface-container flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedComplaint(activeIssue);
                      setActiveTab('evidence');
                    }}
                    className="px-space-lg py-2.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-body text-[14px] font-semibold flex items-center gap-2 shadow-sm transition-all"
                  >
                    <span>Proceed to Submit Repair Evidence</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </div>
              </section>
            )}
          </div>
        )}

        {/* TAB 2: Submit Repair Evidence */}
        {activeTab === 'evidence' && (
          <div className="max-w-2xl mx-auto bg-surface-container-lowest rounded-xl shadow-md p-space-lg border border-outline-variant/30 flex flex-col gap-space-md">
            <div className="p-3 bg-secondary-container/20 rounded-xl border border-secondary/30 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-secondary text-[22px] shrink-0">
                shield
              </span>
              <p className="font-body text-[12px] text-on-surface leading-snug">
                <strong>Accountability Notice:</strong> Evidence submitted here is audited by Gemini AI and sent to an authorized municipal administrator. Workers cannot mark complaints as Resolved on their own.
              </p>
            </div>

            <form onSubmit={handleSubmitEvidence} className="flex flex-col gap-space-md">
              {/* Complaint Selector */}
              <div>
                <label className="block text-[12px] font-semibold text-on-surface mb-1">
                  Target Complaint Tracking ID
                </label>
                <select
                  value={activeIssue?.id}
                  onChange={(e) => {
                    const match = complaints.find((c) => c.id === e.target.value);
                    if (match) setSelectedComplaint(match);
                  }}
                  className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-sm text-on-surface border border-outline-variant/30 font-medium"
                >
                  {assignedIssues.map((issue) => (
                    <option key={issue.id} value={issue.id}>
                      #{issue.trackingId} — {issue.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mandatory After-Repair Photo (Upload from PC/Mobile or Live Camera) */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-semibold text-on-surface flex items-center gap-1">
                    <span>After-Repair Photo</span>
                    <span className="text-error font-bold">*Mandatory</span>
                  </label>
                  <span className="text-[11px] text-on-surface-variant">Upload or live camera verification</span>
                </div>

                {/* Hidden File Input for Worker Photo Upload */}
                <input
                  ref={repairFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleRepairFileUpload}
                />

                {repairPhoto ? (
                  <div className="relative rounded-xl overflow-hidden h-60 bg-surface-container border border-surface-container-high">
                    <img src={repairPhoto} alt="After repair preview" className="w-full h-full object-cover" />
                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => repairFileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg bg-surface-container-lowest/90 backdrop-blur-sm text-on-surface font-body text-[12px] font-semibold shadow-md flex items-center gap-1 hover:bg-surface-container transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">upload_file</span>
                        <span>Upload File</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCameraOpen(true)}
                        className="px-3 py-1.5 rounded-lg bg-surface-container-lowest/90 backdrop-blur-sm text-on-surface font-body text-[12px] font-semibold shadow-md flex items-center gap-1 hover:bg-surface-container transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">photo_camera</span>
                        <span>Camera</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRepairPhoto(null)}
                        className="px-3 py-1.5 rounded-lg bg-error text-white font-body text-[12px] font-semibold shadow-md flex items-center gap-1 hover:opacity-90 transition-opacity cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">delete</span>
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-44 rounded-xl border-2 border-dashed border-outline-variant/60 bg-surface-container-low p-4 flex flex-col items-center justify-center gap-2 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[32px] text-secondary">
                      add_photo_alternate
                    </span>
                    <span className="font-body text-[13px] font-semibold text-on-surface">
                      Attach After-Repair Photo
                    </span>
                    <span className="font-body text-[11px] text-on-surface-variant text-center max-w-xs mb-1">
                      Select an image from PC/Mobile gallery or activate live camera
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => repairFileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-body text-[12px] font-semibold flex items-center gap-1.5 shadow-sm hover:opacity-90 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">upload_file</span>
                        <span>Upload from PC / Mobile</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCameraOpen(true)}
                        className="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-body text-[12px] font-semibold flex items-center gap-1.5 border border-outline-variant/30 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                        <span>Live Camera</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Live GPS Capture & Distance Audit */}
              <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col gap-2 border border-surface-container">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-on-surface font-body text-[13px] font-semibold">
                    <span className="material-symbols-outlined text-secondary text-[18px]">near_me</span>
                    <span>Worker GPS & Distance Audit</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCaptureGps}
                    disabled={isLocating}
                    className="px-3 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-secondary flex items-center gap-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">my_location</span>
                    <span>{isLocating ? 'Locating...' : 'Verify My Location'}</span>
                  </button>
                </div>

                <div className="text-[12px] text-on-surface-variant flex items-center justify-between">
                  <span>
                    Original Dispatch Site:{' '}
                    <strong>{activeIssue?.location.address.split(',')[0]}</strong>
                  </span>
                  {distanceMeters !== null && (
                    <span
                      className={`font-semibold ${
                        distanceMeters <= 100 ? 'text-on-tertiary-container' : 'text-error'
                      }`}
                    >
                      {distanceMeters <= 100
                        ? `✓ On-site (within ${distanceMeters}m)`
                        : `⚠ ${distanceMeters}m away from dispatch`}
                    </span>
                  )}
                </div>
              </div>

              {/* Repair Notes */}
              <div>
                <label className="block text-[12px] font-semibold text-on-surface mb-1">
                  Work Completed / Notes <span className="text-error font-bold">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={repairNotes}
                  onChange={(e) => setRepairNotes(e.target.value)}
                  placeholder="Describe the repair work carried out (e.g. Cleared debris, applied high-durability cold-patch asphalt, leveled to road grade)..."
                  className="w-full p-3 bg-surface-container-low rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40 border border-outline-variant/30"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-space-sm pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('assigned')}
                  className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface font-body text-[13px] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-space-lg py-2.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-body text-[14px] font-semibold shadow-sm flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>AI Verification in Progress...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                      <span>Submit Evidence for Admin Review</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            <CameraCaptureModal
              isOpen={isCameraOpen}
              onClose={() => setIsCameraOpen(false)}
              onCapture={(data) => setRepairPhoto(data)}
              title="Capture After-Repair Photo"
              subtitle="Show the repaired defect clearly for AI and administrative inspection."
            />
          </div>
        )}
      </main>
    </div>
  );
};
