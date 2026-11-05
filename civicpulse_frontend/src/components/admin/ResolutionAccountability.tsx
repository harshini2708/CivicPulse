import React, { useState } from 'react';
import { useComplaints } from '../../context/ComplaintContext';
import { Complaint } from '../../types';
import { calculateSlaRemaining, formatDate } from '../../utils/helpers';

export const ResolutionAccountability: React.FC = () => {
  const { complaints, reviewEvidenceDecision } = useComplaints();

  // Find complaints with evidence or in need of review
  const evidenceComplaints = complaints.filter(
    (c) => c.repairEvidence || c.status === 'Evidence Submitted' || c.status === 'Resolved' || c.status === 'Reopened'
  );

  const [selectedCase, setSelectedCase] = useState<Complaint>(
    evidenceComplaints[0] || complaints[0]
  );
  const [adminNote, setAdminNote] = useState('');
  const [viewMode, setViewMode] = useState<'side-by-side' | 'toggle'>('side-by-side');
  const [activeToggleImg, setActiveToggleImg] = useState<'before' | 'after'>('after');

  const activeCase = selectedCase || evidenceComplaints[0] || complaints[0];
  const evidence = activeCase?.repairEvidence;

  const handleDecision = (decision: 'Approved' | 'Rejected' | 'More Evidence Requested') => {
    if (!activeCase) return;
    reviewEvidenceDecision(activeCase.id, decision, adminNote || `Decision recorded as ${decision} by Admin.`);
    setAdminNote('');
  };

  return (
    <div className="flex flex-col gap-space-lg w-full max-w-[1340px] mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-space-xs text-on-surface-variant font-body text-[11px] uppercase tracking-wider font-semibold">
            <span>Municipal Operations</span>
            <span>/</span>
            <span className="text-secondary">Audit, Verification & Compliance</span>
          </div>
          <h1 className="font-headline text-[28px] md:text-[32px] font-bold text-on-surface tracking-tight mt-0.5">
            Resolution & Accountability
          </h1>
          <p className="font-body text-[14px] text-on-surface-variant max-w-3xl">
            Verified completion audits, Gemini AI before-and-after comparison, citizen feedback, and SLA compliance monitoring.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-on-tertiary-container/15 text-on-tertiary-container font-body text-[12px] font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-on-tertiary-container"></span>
            <span>Human-Governed AI Active</span>
          </span>
        </div>
      </div>

      {/* KPI Pulse Overview Strip matching Stitch */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-xs border border-outline-variant/30 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-body text-[11px] text-on-surface-variant uppercase font-semibold">
              Audits Completed (7D)
            </span>
            <span className="font-headline text-[26px] font-bold text-on-surface mt-0.5">
              {complaints.filter((c) => c.status === 'Resolved').length}
            </span>
            <span className="font-body text-[11px] text-on-tertiary-container mt-1 font-semibold flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[13px]">arrow_upward</span>
              <span>100% Passed</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface">
            <span className="material-symbols-outlined text-[20px]">fact_check</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-xs border border-outline-variant/30 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-body text-[11px] text-on-surface-variant uppercase font-semibold">
              AI Vision Confidence
            </span>
            <span className="font-headline text-[26px] font-bold text-on-surface mt-0.5">
              96.8%
            </span>
            <span className="font-body text-[11px] text-secondary mt-1 font-semibold flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[13px]">psychology</span>
              <span>Gemini Vision v1.5</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-secondary-container/40 flex items-center justify-center text-on-secondary-container">
            <span className="material-symbols-outlined text-[20px]">document_scanner</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-xs border border-outline-variant/30 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-body text-[11px] text-on-surface-variant uppercase font-semibold">
              Citizen CSAT Rating
            </span>
            <span className="font-headline text-[26px] font-bold text-on-surface mt-0.5">
              4.8 / 5
            </span>
            <span className="font-body text-[11px] text-on-surface-variant mt-1">
              Verified Public Feedback
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface">
            <span className="material-symbols-outlined text-[20px]">star</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-xs border border-outline-variant/30 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-body text-[11px] text-on-surface-variant uppercase font-semibold">
              Active SLA Compliance
            </span>
            <span className="font-headline text-[26px] font-bold text-on-surface mt-0.5">
              94.2%
            </span>
            <span className="font-body text-[11px] text-on-tertiary-container mt-1 font-semibold flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[13px]">check_circle</span>
              <span>0 Critical Breaches</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface">
            <span className="material-symbols-outlined text-[20px]">schedule</span>
          </div>
        </div>
      </div>

      {/* Master Detail Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
        {/* LEFT COLUMN: Detailed Complaint Audit & Visual Comparison (8 cols) */}
        <div className="xl:col-span-8 flex flex-col gap-space-lg">
          {/* Section: Before & After Photo Comparison */}
          {activeCase && (
            <section className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg border border-outline-variant/30 flex flex-col gap-space-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-sm border-b border-surface-container">
                <div>
                  <div className="flex items-center gap-space-sm">
                    <span className="font-headline text-[13px] font-bold bg-primary-container text-on-primary px-2.5 py-0.5 rounded">
                      CASE #{activeCase.trackingId}
                    </span>
                    <span className="font-body text-[11px] bg-surface-container-high text-on-surface-variant px-2.5 py-0.5 rounded font-semibold">
                      {activeCase.assignedDepartmentName || activeCase.category}
                    </span>
                    <span className="font-body text-[11px] text-on-surface-variant">
                      {activeCase.location.ward}
                    </span>
                  </div>
                  <h2 className="font-headline text-[20px] font-bold text-on-surface tracking-tight mt-1">
                    {activeCase.title}
                  </h2>
                </div>

                <div className="flex items-center gap-space-xs">
                  <button
                    onClick={() =>
                      setViewMode(viewMode === 'side-by-side' ? 'toggle' : 'side-by-side')
                    }
                    className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body text-[12px] font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">compare</span>
                    <span>{viewMode === 'side-by-side' ? 'Toggle View' : 'Side-by-Side'}</span>
                  </button>
                </div>
              </div>

              {/* Visual Comparison Canvas */}
              {viewMode === 'side-by-side' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-surface-container p-2 rounded-xl">
                  {/* Before */}
                  <div className="relative bg-surface-container-lowest rounded-lg overflow-hidden flex flex-col border border-surface-container">
                    <div className="relative h-60 overflow-hidden bg-surface-container">
                      <img
                        src={activeCase.originalPhotoUrl}
                        alt="Before repair"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-0.5 rounded bg-error text-white font-body text-[10px] font-bold uppercase shadow-sm">
                          Original Complaint (Before)
                        </span>
                      </div>
                      <div className="absolute bottom-2 left-2 bg-primary-container/85 text-on-primary backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                        <span>{formatDate(activeCase.createdAt)}</span>
                      </div>
                    </div>
                    <div className="p-2.5 bg-surface-container-low text-[12px] text-on-surface-variant flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-[15px] text-outline shrink-0 mt-0.5">
                        info
                      </span>
                      <p className="line-clamp-2">Reported: {activeCase.description}</p>
                    </div>
                  </div>

                  {/* After */}
                  <div className="relative bg-surface-container-lowest rounded-lg overflow-hidden flex flex-col border border-surface-container">
                    <div className="relative h-60 overflow-hidden bg-surface-container flex items-center justify-center">
                      {evidence ? (
                        <>
                          <img
                            src={evidence.afterPhotoUrl}
                            alt="After repair"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 left-2">
                            <span className="px-2 py-0.5 rounded bg-on-tertiary-container text-white font-body text-[10px] font-bold uppercase shadow-sm">
                              Worker Evidence (After)
                            </span>
                          </div>
                          <div className="absolute bottom-2 left-2 bg-primary-container/85 text-on-primary backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">engineering</span>
                            <span>{formatDate(evidence.serverTimestamp)}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center text-center p-4 text-on-surface-variant">
                          <span className="material-symbols-outlined text-[36px] text-outline mb-1">
                            hourglass_top
                          </span>
                          <span className="text-[13px] font-semibold">
                            Awaiting Field Worker Submission
                          </span>
                          <span className="text-[11px]">Worker has not yet uploaded completion proof.</span>
                        </div>
                      )}
                    </div>
                    <div className="p-2.5 bg-surface-container-low text-[12px] text-on-surface-variant flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-[15px] text-on-tertiary-container shrink-0 mt-0.5">
                        verified
                      </span>
                      <p className="line-clamp-2">
                        {evidence ? `Worker Note: ${evidence.repairNotes}` : 'No repair notes submitted yet.'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Toggle View */
                <div className="relative rounded-xl overflow-hidden h-72 bg-surface-container border border-surface-container">
                  <img
                    src={
                      activeToggleImg === 'before'
                        ? activeCase.originalPhotoUrl
                        : evidence?.afterPhotoUrl || activeCase.originalPhotoUrl
                    }
                    alt="Comparison toggle"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 left-3 flex gap-1.5 bg-surface-container-lowest/90 backdrop-blur-sm p-1 rounded-lg border border-surface-container">
                    <button
                      onClick={() => setActiveToggleImg('before')}
                      className={`px-3 py-1 rounded text-xs font-semibold ${
                        activeToggleImg === 'before' ? 'bg-error text-white' : 'text-on-surface'
                      }`}
                    >
                      Show Before
                    </button>
                    <button
                      onClick={() => setActiveToggleImg('after')}
                      className={`px-3 py-1 rounded text-xs font-semibold ${
                        activeToggleImg === 'after'
                          ? 'bg-on-tertiary-container text-white'
                          : 'text-on-surface'
                      }`}
                    >
                      Show After
                    </button>
                  </div>
                </div>
              )}

              {/* Field Audit & Distance Verification Card */}
              {evidence && (
                <div className="bg-surface-container-low p-space-md rounded-xl border border-surface-container flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-headline text-[13px] font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-secondary text-[18px]">
                        pin_drop
                      </span>
                      <span>Location & Timestamp Verification</span>
                    </span>
                    <span className="font-body text-[11px] font-semibold text-on-tertiary-container bg-tertiary-fixed/30 px-2 py-0.5 rounded">
                      GPS Match Verified
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[12px] pt-1 border-t border-surface-container/60">
                    <div>
                      <span className="text-on-surface-variant block text-[11px]">Field Worker</span>
                      <strong className="text-on-surface">{evidence.workerName}</strong>
                    </div>
                    <div>
                      <span className="text-on-surface-variant block text-[11px]">GPS Separation</span>
                      <strong className="text-on-surface">
                        {evidence.workerLocation.distanceFromOriginalMeters}m from original pin
                      </strong>
                    </div>
                    <div>
                      <span className="text-on-surface-variant block text-[11px]">Official Timestamp</span>
                      <strong className="text-on-surface">{formatDate(evidence.serverTimestamp)}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Verification Section (Gemini Vision Engine) */}
              {evidence?.aiVerification && (
                <div className="p-space-md rounded-xl bg-surface-container-lowest border border-secondary/30 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-[22px]">
                        psychology
                      </span>
                      <div>
                        <h4 className="font-headline font-bold text-[15px] text-on-surface">
                          Gemini AI Evidence Verification Suggestion
                        </h4>
                        <span className="font-body text-[11px] text-on-surface-variant">
                          AI assists; authorized administrator holds final sign-off authority.
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-bold text-on-surface">
                        {evidence.aiVerification.confidenceScore}% Confidence
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-body text-[11px] font-bold ${
                          evidence.aiVerification.status === 'Verified'
                            ? 'bg-tertiary-fixed/40 text-on-tertiary-container'
                            : evidence.aiVerification.status === 'Needs Review'
                            ? 'bg-secondary-container/60 text-on-secondary-container'
                            : 'bg-error-container text-on-error-container'
                        }`}
                      >
                        {evidence.aiVerification.status}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-surface-container-low border border-surface-container text-[13px] text-on-surface leading-relaxed mt-1">
                    <strong className="text-secondary">AI Inspection Findings: </strong>
                    {evidence.aiVerification.explanation}
                  </div>
                </div>
              )}

              {/* Official Admin Sign-off Actions */}
              <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-headline font-bold text-[14px] text-on-surface">
                    Administrative Decision
                  </span>
                  <span className="text-[11px] text-on-surface-variant">
                    Logged under Admin ID: #adm-882
                  </span>
                </div>

                <input
                  type="text"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Enter administrative sign-off remarks or reasons..."
                  className="w-full h-10 px-3 bg-surface-container-lowest rounded-lg text-xs border border-outline-variant/30 focus:outline-none"
                />

                <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleDecision('More Evidence Requested')}
                    className="px-3 py-2 rounded-lg bg-surface-container text-on-surface font-body text-[12px] font-semibold hover:bg-surface-container-high transition-colors"
                  >
                    Request Additional Evidence
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecision('Rejected')}
                    className="px-3.5 py-2 rounded-lg bg-error text-white font-body text-[12px] font-semibold shadow-xs hover:opacity-90 transition-opacity"
                  >
                    Reject Evidence
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecision('Approved')}
                    className="px-4 py-2 rounded-lg bg-on-tertiary-container text-white font-body text-[12px] font-bold shadow-sm hover:opacity-95 transition-opacity flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span>Approve Resolution</span>
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* RIGHT COLUMN: Evidence Queue & SLA Monitoring (4 cols) */}
        <div className="xl:col-span-4 flex flex-col gap-space-lg">
          {/* Evidence Queue */}
          <section className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg border border-outline-variant/30 flex flex-col gap-space-sm">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container">
              <h3 className="font-headline text-[15px] font-bold text-on-surface">
                Evidence Awaiting Review ({evidenceComplaints.length})
              </h3>
              <span className="text-[11px] text-secondary font-semibold">Priority Queue</span>
            </div>

            <div className="flex flex-col gap-2">
              {evidenceComplaints.map((item) => {
                const isSelected = activeCase?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedCase(item)}
                    className={`p-2.5 rounded-lg cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-surface-container-low border-secondary shadow-xs'
                        : 'bg-surface-bright hover:bg-surface-container border-surface-container'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-bold text-on-surface">#{item.trackingId}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-semibold ${
                          item.status === 'Resolved'
                            ? 'bg-tertiary-fixed/30 text-on-tertiary-container'
                            : item.status === 'Reopened'
                            ? 'bg-error-container text-on-error-container'
                            : 'bg-secondary-container/50 text-on-secondary-container'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <span className="font-headline text-[13px] font-bold text-on-surface line-clamp-1 mt-1">
                      {item.title}
                    </span>
                    <span className="text-[11px] text-on-surface-variant truncate block mt-0.5">
                      {item.location.address}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* SLA Deadlines & Escalation Alerts */}
          <section className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg border border-outline-variant/30 flex flex-col gap-space-sm">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container">
              <h3 className="font-headline text-[15px] font-bold text-on-surface">SLA Monitoring</h3>
              <span className="material-symbols-outlined text-[18px] text-secondary">timer</span>
            </div>

            <div className="space-y-2">
              {complaints.slice(0, 4).map((c) => {
                const sla = calculateSlaRemaining(c.slaDeadline);
                return (
                  <div
                    key={c.id}
                    className="p-2 rounded-lg bg-surface-container-low border border-surface-container flex items-center justify-between text-[11px]"
                  >
                    <div className="flex flex-col truncate pr-2">
                      <span className="font-bold text-on-surface">#{c.trackingId}</span>
                      <span className="text-on-surface-variant truncate">{c.title}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded font-bold shrink-0 ${sla.badgeClass}`}>
                      {sla.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
