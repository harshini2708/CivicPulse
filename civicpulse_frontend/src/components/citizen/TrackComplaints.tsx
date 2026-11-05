import React, { useState } from 'react';
import { useComplaints } from '../../context/ComplaintContext';
import { Complaint, ComplaintStatus } from '../../types';
import { formatDate } from '../../utils/helpers';
import { OpenStreetMap } from '../common/OpenStreetMap';

interface TrackComplaintsProps {
  initialTrackingId?: string;
}

const LIFECYCLE_STEPS: { status: ComplaintStatus; label: string; desc: string }[] = [
  { status: 'Pending', label: '1. Submitted', desc: 'Complaint ingested & AI categorised' },
  { status: 'Assigned', label: '2. Reviewed & Assigned', desc: 'Routed to relevant municipal department' },
  { status: 'In Progress', label: '3. Work In Progress', desc: 'Field crew unit dispatched on-site' },
  { status: 'Evidence Submitted', label: '4. Evidence Submitted', desc: 'After-repair photo & GPS uploaded by worker' },
  { status: 'Under Verification', label: '5. Under Verification', desc: 'Gemini AI & inspector evidence comparison' },
  { status: 'Resolved', label: '6. Resolved', desc: 'Official administrative sign-off passed' },
];

export const TrackComplaints: React.FC<TrackComplaintsProps> = ({ initialTrackingId }) => {
  const { complaints, reopenComplaint, submitFeedback } = useComplaints();

  const [searchTrackingId, setSearchTrackingId] = useState(initialTrackingId || '');
  const [selectedIssue, setSelectedIssue] = useState<Complaint>(() => {
    if (initialTrackingId) {
      const match = complaints.find((c) => c.trackingId.toLowerCase() === initialTrackingId.toLowerCase());
      if (match) return match;
    }
    return complaints[0];
  });

  // Reopen Modal State
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');

  // Feedback State
  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Filter complaints matching search or citizen submissions
  const citizenComplaints = complaints.filter(
    (c) =>
      c.citizenId === 'cit-001' ||
      c.trackingId.toLowerCase().includes(searchTrackingId.toLowerCase()) ||
      c.title.toLowerCase().includes(searchTrackingId.toLowerCase())
  );

  const activeIssue = selectedIssue || citizenComplaints[0];

  const getStepProgressIndex = (status: ComplaintStatus): number => {
    switch (status) {
      case 'Pending':
        return 0;
      case 'Assigned':
        return 1;
      case 'In Progress':
        return 2;
      case 'Evidence Submitted':
        return 3;
      case 'Under Verification':
        return 4;
      case 'Resolved':
        return 5;
      case 'Reopened':
        return 1; // Returns back to administrative review
      default:
        return 0;
    }
  };

  const currentStepIdx = activeIssue ? getStepProgressIndex(activeIssue.status) : 0;

  const handleReopenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopenReason.trim() || !activeIssue) return;
    reopenComplaint(activeIssue.id, reopenReason);
    setIsReopenModalOpen(false);
    setReopenReason('');
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeIssue) return;
    submitFeedback(activeIssue.id, rating, feedbackComment);
    setFeedbackSubmitted(true);
  };

  return (
    <div className="max-w-[1340px] w-full mx-auto flex flex-col pb-16">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-space-lg mb-space-lg">
        <div className="max-w-2xl">
          <div className="flex items-center gap-space-xs text-on-surface-variant font-body text-[11px] uppercase tracking-wider mb-1 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
            <span>Citizen Tracking Portal</span>
            <span className="text-outline-variant">•</span>
            <span>Transparent Accountability</span>
          </div>
          <h1 className="font-headline text-[32px] md:text-[36px] font-bold text-on-surface tracking-tight">
            Track Complaints
          </h1>
          <p className="font-body text-[14px] text-on-surface-variant">
            Follow real-time status, worker evidence submissions, and official resolutions with open audit records.
          </p>
        </div>

        {/* Search by Tracking ID */}
        <div className="relative w-full md:w-80">
          <span className="material-symbols-outlined text-[18px] text-outline absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchTrackingId}
            onChange={(e) => setSearchTrackingId(e.target.value)}
            placeholder="Search by Tracking ID (e.g. CP-2026-8841)..."
            className="w-full h-10 pl-9 pr-3 bg-surface-container-lowest text-on-surface rounded-lg font-body text-[13px] border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-secondary/40 shadow-xs"
          />
        </div>
      </header>

      {/* Master-Detail Layout (Left: 5 cols, Right: 7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Left Column: List of Citizen Complaints */}
        <section className="lg:col-span-5 flex flex-col gap-space-sm">
          <div className="flex items-center justify-between px-1 mb-1 text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider">
            <span>My Submitted Issues ({citizenComplaints.length})</span>
            <span className="text-[11px] text-secondary lowercase font-normal">click to track</span>
          </div>

          {citizenComplaints.length === 0 ? (
            <div className="bg-surface-container-lowest p-space-lg rounded-xl text-center text-on-surface-variant border border-outline-variant/30">
              <span className="material-symbols-outlined text-[32px] text-outline mb-1">
                inventory_2
              </span>
              <p className="font-body text-[13px]">No matching complaints found.</p>
            </div>
          ) : (
            citizenComplaints.map((issue) => {
              const isSelected = activeIssue?.id === issue.id;
              return (
                <article
                  key={issue.id}
                  onClick={() => setSelectedIssue(issue)}
                  className={`p-space-md rounded-xl cursor-pointer transition-all relative overflow-hidden border ${
                    isSelected
                      ? 'bg-surface-container-lowest shadow-md border-secondary/50'
                      : 'bg-surface-container-lowest/80 hover:bg-surface-container-lowest shadow-xs border-outline-variant/30'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary"></div>
                  )}
                  <div className="flex items-start justify-between gap-space-sm pl-1">
                    <div className="flex items-center gap-space-xs">
                      <span className="font-body text-[12px] text-on-surface-variant font-bold tracking-wide">
                        #{issue.trackingId}
                      </span>
                      <span className="text-outline-variant">•</span>
                      <span className="font-body text-[12px] text-on-surface-variant">
                        {formatDate(issue.createdAt).split('•')[0]}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-body text-[11px] font-semibold ${
                        issue.status === 'Resolved'
                          ? 'bg-tertiary-fixed/30 text-on-tertiary-container'
                          : issue.status === 'In Progress'
                          ? 'bg-secondary-container/50 text-on-secondary-container'
                          : issue.status === 'Reopened'
                          ? 'bg-error-container text-on-error-container'
                          : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      {issue.status === 'Resolved' && (
                        <span className="material-symbols-outlined text-[13px] text-on-tertiary-container">
                          check_circle
                        </span>
                      )}
                      <span>{issue.status}</span>
                    </span>
                  </div>

                  <h2 className="font-headline text-[15px] font-bold text-on-surface mt-2 pl-1 line-clamp-1">
                    {issue.title}
                  </h2>

                  <div className="flex items-center justify-between mt-2 pt-1.5 pl-1 border-t border-surface-container text-[12px] text-on-surface-variant">
                    <div className="flex items-center gap-1 truncate max-w-[200px]">
                      <span className="material-symbols-outlined text-[15px]">location_on</span>
                      <span className="truncate">{issue.location.address}</span>
                    </div>
                    <span className="text-secondary font-semibold shrink-0">
                      {issue.assignedDepartmentName || 'Awaiting Routing'}
                    </span>
                  </div>
                </article>
              );
            })
          )}
        </section>

        {/* Right Column: Active Complaint Detail Pane */}
        {activeIssue && (
          <main className="lg:col-span-7 flex flex-col gap-space-lg">
            {/* Header Card */}
            <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-md border border-outline-variant/30">
              <div className="flex flex-wrap items-center justify-between gap-space-sm pb-space-sm border-b border-surface-container">
                <div className="flex items-center gap-space-xs">
                  <span className="font-headline text-[14px] font-bold tracking-wider text-on-surface bg-surface-container px-2 py-0.5 rounded">
                    #{activeIssue.trackingId}
                  </span>
                  <span className="text-outline-variant">•</span>
                  <span className="font-body text-[12px] text-on-surface-variant font-medium">
                    {activeIssue.assignedDepartmentName || 'Pending Department Assignment'}
                  </span>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-body text-[12px] font-semibold ${
                    activeIssue.status === 'Resolved'
                      ? 'bg-tertiary-fixed/30 text-on-tertiary-container'
                      : activeIssue.status === 'Reopened'
                      ? 'bg-error-container text-on-error-container'
                      : 'bg-surface-container-high text-on-surface'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      activeIssue.status === 'Resolved'
                        ? 'bg-on-tertiary-container'
                        : activeIssue.status === 'Reopened'
                        ? 'bg-error'
                        : 'bg-secondary'
                    }`}
                  ></span>
                  <span>Status: {activeIssue.status}</span>
                </span>
              </div>

              <h2 className="font-headline text-[22px] font-bold text-on-surface mt-space-sm">
                {activeIssue.title}
              </h2>

              {/* Citizen Description & Original Photo */}
              <div className="mt-space-md">
                <h3 className="font-body text-[12px] text-on-surface-variant uppercase font-semibold tracking-wider">
                  Citizen Description
                </h3>
                <p className="font-body text-[14px] text-on-surface mt-1 bg-surface-container-low/60 p-space-md rounded-lg border border-surface-container leading-relaxed">
                  "{activeIssue.description}"
                </p>

                <div className="mt-space-md flex items-center gap-space-md">
                  <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 shadow-sm border border-surface-container">
                    <img
                      src={activeIssue.originalPhotoUrl}
                      alt="Resident photo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="font-body text-[13px] font-semibold text-on-surface">
                      Original Resident Evidence
                    </span>
                    <p className="font-body text-[11px] text-on-surface-variant">
                      Reported {formatDate(activeIssue.createdAt)}
                    </p>
                    <span className="font-body text-[11px] text-secondary font-medium">
                      GPS Tagged: {activeIssue.location.address}
                    </span>
                  </div>
                </div>

                {/* OSM Location Map */}
                <div className="mt-space-md rounded-xl overflow-hidden border border-outline-variant/30 shadow-sm">
                  <OpenStreetMap
                    center={{
                      lat: activeIssue.location.latitude,
                      lng: activeIssue.location.longitude,
                    }}
                    zoom={16}
                    height="200px"
                    radiusMetres={100}
                    markers={[
                      {
                        lat: activeIssue.location.latitude,
                        lng: activeIssue.location.longitude,
                        title: activeIssue.title,
                        trackingId: activeIssue.trackingId,
                        color: activeIssue.priority === 'Urgent' ? 'error' : 'primary',
                        popup: `${activeIssue.category} — ${activeIssue.status}`,
                      },
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* 7-Stage Progress Timeline */}
            <section className="p-space-lg rounded-xl bg-surface-container-lowest shadow-md border border-outline-variant/30">
              <div className="flex items-center justify-between pb-space-sm border-b border-surface-container mb-space-md">
                <h3 className="font-headline text-[17px] font-bold text-on-surface">
                  Lifecycle Progress Timeline
                </h3>
                <span className="font-body text-[12px] text-on-tertiary-container bg-surface-container px-2.5 py-0.5 rounded-full font-semibold">
                  {activeIssue.status === 'Resolved'
                    ? '100% Resolved'
                    : `Stage ${currentStepIdx + 1} of 6`}
                </span>
              </div>

              {/* Timeline Track with Vertical Line */}
              <div className="relative pl-6 space-y-5">
                <div className="absolute left-[19px] top-2 bottom-4 w-0.5 bg-surface-container-highest"></div>

                {LIFECYCLE_STEPS.map((step, idx) => {
                  const isCompleted = idx <= currentStepIdx;
                  const isCurrent = idx === currentStepIdx;

                  return (
                    <div key={step.status} className="relative flex items-start gap-space-md">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 shadow-xs font-body text-[12px] font-bold ${
                          isCompleted
                            ? 'bg-primary text-on-primary'
                            : 'bg-surface-container-highest text-on-surface-variant'
                        } ${isCurrent ? 'ring-4 ring-secondary-container/40' : ''}`}
                      >
                        {isCompleted ? (
                          <span className="material-symbols-outlined text-[16px]">check</span>
                        ) : (
                          <span>{idx + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <span
                            className={`font-body text-[13px] font-bold ${
                              isCurrent ? 'text-secondary' : 'text-on-surface'
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                        <p className="font-body text-[12px] text-on-surface-variant">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Resolved State & Repair Evidence Proof Showcase */}
            {activeIssue.repairEvidence && (
              <section className="p-space-lg rounded-xl bg-surface-container-lowest shadow-md border border-outline-variant/30">
                <div className="flex items-center justify-between mb-space-md">
                  <div>
                    <h3 className="font-headline text-[17px] font-bold text-on-surface">
                      After-Repair Resolution Proof
                    </h3>
                    <p className="font-body text-[12px] text-on-surface-variant">
                      Official photo evidence submitted by field crew and verified by AI.
                    </p>
                  </div>
                  <span className="font-body text-[11px] px-2.5 py-1 rounded bg-surface-container font-semibold text-on-surface">
                    {activeIssue.repairEvidence.workerName}
                  </span>
                </div>

                {/* Evidence Comparison Card */}
                <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col md:flex-row gap-space-lg items-center border border-surface-container">
                  <div className="w-full md:w-56 h-40 rounded-lg overflow-hidden shrink-0 shadow-sm relative border border-surface-container">
                    <img
                      src={activeIssue.repairEvidence.afterPhotoUrl}
                      alt="After repair evidence"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 bg-primary/85 text-on-primary text-[10px] font-body px-2 py-0.5 rounded backdrop-blur-xs font-semibold">
                      After-Repair Photo
                    </div>
                  </div>

                  <div className="flex flex-col justify-between h-full w-full">
                    <div>
                      <div className="flex items-center gap-1.5 text-on-tertiary-container font-body text-[13px] font-semibold">
                        <span className="material-symbols-outlined text-[18px]">verified_user</span>
                        <span>Field Inspection Verified</span>
                      </div>
                      <div className="font-body text-[11px] text-on-surface-variant mt-0.5">
                        Submitted: {formatDate(activeIssue.repairEvidence.serverTimestamp)}
                      </div>
                      <p className="font-body text-[13px] text-on-surface mt-2 bg-surface-container-lowest p- space-sm p-3 rounded-lg border border-surface-container italic">
                        "{activeIssue.repairEvidence.repairNotes}"
                      </p>
                    </div>

                    <div className="flex items-center gap-1 text-on-tertiary-container font-body text-[11px] font-semibold mt-2">
                      <span className="material-symbols-outlined text-[15px]">psychology</span>
                      <span>
                        AI Verification: {activeIssue.repairEvidence.aiVerification.status} (
                        {activeIssue.repairEvidence.aiVerification.confidenceScore}% confidence)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Citizen Feedback Rating or Reopen Complaint */}
                <div className="mt-space-lg pt-space-md border-t border-surface-container flex flex-col sm:flex-row items-center justify-between gap-space-md">
                  <button
                    type="button"
                    onClick={() => setIsReopenModalOpen(true)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-space-md py-2.5 rounded-lg bg-surface-container text-error hover:bg-error-container/40 transition-colors font-body text-[13px] font-semibold"
                  >
                    <span className="material-symbols-outlined text-[18px]">report_problem</span>
                    <span>Not Fixed? Reopen Complaint</span>
                  </button>

                  {!feedbackSubmitted && !activeIssue.feedback ? (
                    <form
                      onSubmit={handleFeedbackSubmit}
                      className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2"
                    >
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className="text-amber-500 hover:scale-110 transition-transform"
                          >
                            <span
                              className="material-symbols-outlined text-[20px]"
                              style={{ fontVariationSettings: rating >= star ? "'FILL' 1" : "'FILL' 0" }}
                            >
                              star
                            </span>
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={feedbackComment}
                        onChange={(e) => setFeedbackComment(e.target.value)}
                        placeholder="Leave citizen rating..."
                        className="h-9 px-3 bg-surface-container-low rounded-lg text-xs border border-outline-variant/30"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold"
                      >
                        Submit Feedback
                      </button>
                    </form>
                  ) : (
                    <div className="text-[12px] text-on-tertiary-container font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      <span>Feedback recorded. Thank you for rating!</span>
                    </div>
                  )}
                </div>
              </section>
            )}
          </main>
        )}
      </div>

      {/* Reopen Complaint Modal */}
      {isReopenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container-lowest rounded-xl max-w-md w-full p-space-lg shadow-2xl border border-outline-variant/40 flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-error">
                <span className="material-symbols-outlined">report_problem</span>
                <h3 className="font-headline font-bold text-[18px] text-on-surface">
                  Reopen Complaint #{activeIssue?.trackingId}
                </h3>
              </div>
              <button
                onClick={() => setIsReopenModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <p className="font-body text-[13px] text-on-surface-variant">
              If the problem was not adequately solved, tell the municipal administrator what remains unaddressed. This complaint will immediately return to administrative review.
            </p>

            <form onSubmit={handleReopenSubmit} className="flex flex-col gap-space-sm">
              <textarea
                required
                rows={3}
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="Explain what is still not fixed (e.g. Grate is clean but asphalt surrounding it is still sunken)..."
                className="w-full p-3 bg-surface-container-low rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-error/40 border border-outline-variant/30"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReopenModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-surface-container text-on-surface font-body text-[13px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-error text-white font-body text-[13px] font-semibold shadow-sm hover:opacity-90"
                >
                  Confirm & Reopen Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
