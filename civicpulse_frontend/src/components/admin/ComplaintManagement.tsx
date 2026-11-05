import React, { useState } from 'react';
import { useComplaints } from '../../context/ComplaintContext';
import { Complaint, ComplaintStatus } from '../../types';
import { formatDate } from '../../utils/helpers';

interface ComplaintManagementProps {
  selectedComplaint: Complaint | null;
  onSelectComplaint: (complaint: Complaint) => void;
}

export const ComplaintManagement: React.FC<ComplaintManagementProps> = ({
  selectedComplaint,
  onSelectComplaint,
}) => {
  const { complaints, departments, history, assignDepartmentAndWorker, updateStatus } = useComplaints();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | ComplaintStatus>('All');

  // Action Controls State
  const [selectedDeptId, setSelectedDeptId] = useState('dpw');
  const [selectedWorkerName, setSelectedWorkerName] = useState('Field Crew Unit #14 (D. Vance)');
  const [newStatus, setNewStatus] = useState<ComplaintStatus>('Assigned');
  const [auditNote, setAuditNote] = useState('');

  const activeIssue = selectedComplaint || complaints[0];

  const filteredIssues = complaints.filter((c) => {
    const matchesFilter = statusFilter === 'All' || c.status === statusFilter;
    const matchesSearch =
      c.trackingId.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.location.address.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleSaveAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeIssue) return;

    const dept = departments.find((d) => d.id === selectedDeptId) || departments[0];

    // Assign and update status
    assignDepartmentAndWorker(
      activeIssue.id,
      dept.id,
      dept.name,
      'WRK-14',
      selectedWorkerName,
      auditNote || `Officer assigned case to ${dept.name}.`
    );

    if (newStatus !== activeIssue.status) {
      updateStatus(activeIssue.id, newStatus, auditNote);
    }

    setAuditNote('');
  };

  const relevantHistory = history.filter((h) => h.complaintId === activeIssue?.id);

  return (
    <div className="flex flex-col gap-space-lg w-full max-w-[1340px] mx-auto pb-16">
      {/* Header & Controls Bar */}
      <div className="flex flex-col gap-space-sm">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
          <div>
            <div className="flex items-center gap-space-xs text-on-surface-variant font-body text-[11px] uppercase tracking-wider font-semibold">
              <span>Municipal Operations</span>
              <span>/</span>
              <span className="text-secondary">District 4 Grievance Desk</span>
            </div>
            <h1 className="font-headline text-[28px] md:text-[32px] font-bold text-on-surface tracking-tight mt-0.5">
              Complaint Management
            </h1>
            <p className="font-body text-[14px] text-on-surface-variant">
              Review citizen reports, assign departmental work units, and log operational status updates.
            </p>
          </div>
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-md pt-2">
          <div className="relative flex-1 max-w-xl">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search complaints by ID, title, or street..."
              className="w-full h-10 pl-10 pr-3 bg-surface-container-lowest text-on-surface font-body text-[13px] rounded-lg border border-outline-variant/40 shadow-xs focus:outline-none focus:ring-2 focus:ring-secondary/40"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 no-scrollbar">
            {['All', 'Pending', 'Assigned', 'In Progress', 'Evidence Submitted', 'Resolved', 'Reopened'].map(
              (f) => {
                const isActive = statusFilter === f;
                const count =
                  f === 'All' ? complaints.length : complaints.filter((c) => c.status === f).length;
                return (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f as any)}
                    className={`px-3 py-1.5 rounded-full font-body text-[12px] font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-primary text-on-primary shadow-xs'
                        : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface border border-outline-variant/30'
                    }`}
                  >
                    <span>{f}</span>
                    <span className="ml-1 opacity-80 text-[10px]">({count})</span>
                  </button>
                );
              }
            )}
          </div>
        </div>
      </div>

      {/* Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Left Column: Complaint Directory (5 cols) */}
        <section className="lg:col-span-5 flex flex-col gap-space-sm">
          <div className="flex items-center justify-between px-1 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
            <span>District Intake ({filteredIssues.length} Shown)</span>
            <span className="text-secondary font-normal">auto-synced</span>
          </div>

          {filteredIssues.map((issue) => {
            const isSelected = activeIssue?.id === issue.id;
            return (
              <article
                key={issue.id}
                onClick={() => onSelectComplaint(issue)}
                className={`p-space-md rounded-xl cursor-pointer transition-all border relative overflow-hidden ${
                  isSelected
                    ? 'bg-surface-container-lowest shadow-md border-secondary/50'
                    : 'bg-surface-container-lowest/80 hover:bg-surface-container-lowest shadow-xs border-outline-variant/30'
                }`}
              >
                {isSelected && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary"></div>
                )}
                <div className="flex flex-col gap-1.5 pl-1">
                  <div className="flex items-center justify-between gap-space-sm">
                    <span className="font-headline text-[13px] font-bold text-on-surface">
                      #{issue.trackingId}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full font-body text-[11px] font-semibold ${
                        issue.priority === 'Urgent'
                          ? 'bg-error-container text-on-error-container'
                          : issue.status === 'Resolved'
                          ? 'bg-tertiary-fixed/30 text-on-tertiary-container'
                          : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      {issue.status}
                    </span>
                  </div>

                  <h3 className="font-headline text-[14px] font-bold text-on-surface line-clamp-1">
                    {issue.title}
                  </h3>

                  <div className="flex items-center gap-1 text-[12px] text-on-surface-variant truncate">
                    <span className="material-symbols-outlined text-[15px] text-secondary">
                      location_on
                    </span>
                    <span className="truncate">{issue.location.address}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-surface-container text-[11px] text-on-surface-variant">
                    <span>{formatDate(issue.createdAt).split('•')[0]}</span>
                    <span className="font-semibold text-secondary">
                      {issue.assignedDepartmentName || 'Pending Routing'}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        {/* Right Column: Active Complaint Case Review (7 cols) */}
        {activeIssue && (
          <section className="lg:col-span-7 bg-surface-container-lowest rounded-xl shadow-md p-space-lg border border-outline-variant/30 flex flex-col gap-space-lg">
            {/* Header info */}
            <div className="flex flex-col gap-space-sm">
              <div className="flex flex-wrap items-center justify-between gap-space-xs">
                <div className="flex items-center gap-space-xs">
                  <span className="font-headline text-[15px] font-bold text-on-surface">
                    #{activeIssue.trackingId}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface text-[11px] font-semibold">
                    {activeIssue.category}
                  </span>
                  {activeIssue.priority === 'Urgent' && (
                    <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container text-[11px] font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-error animate-ping"></span>
                      <span>Urgent Priority</span>
                    </span>
                  )}
                </div>
                <div className="text-[12px] text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">schedule</span>
                  <span>Submitted {formatDate(activeIssue.createdAt)}</span>
                </div>
              </div>

              <h2 className="font-headline text-[22px] font-bold text-on-surface leading-tight mt-1">
                {activeIssue.title}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm p-space-md rounded-lg bg-surface-container-low border border-surface-container">
                <div className="flex items-center gap-space-sm">
                  <div className="w-9 h-9 rounded-lg bg-surface-container-highest flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-secondary text-[20px]">pin_drop</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant">
                      Incident Site
                    </span>
                    <span className="text-[13px] font-semibold text-on-surface truncate">
                      {activeIssue.location.address}
                    </span>
                    <span className="font-mono text-[10px] text-outline">
                      Lat: {activeIssue.location.latitude}°, Lng: {activeIssue.location.longitude}°
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-space-sm">
                  <div className="w-9 h-9 rounded-lg bg-surface-container-highest flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-secondary text-[20px]">verified</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant">
                      Citizen Verifications
                    </span>
                    <span className="text-[13px] font-semibold text-on-surface">
                      {activeIssue.citizenConfirmationCount} Confirmed Residents
                    </span>
                    <span className="text-[11px] text-on-tertiary-container font-medium">
                      High Neighborhood Priority
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Constituent Statement & Photo */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
                Constituent Statement & Evidence
              </span>
              <p className="p-space-md rounded-lg bg-surface-bright text-on-surface text-[14px] leading-relaxed border border-surface-container">
                "{activeIssue.description}"
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm pt-1">
                <div className="h-40 rounded-lg overflow-hidden border border-surface-container relative">
                  <img
                    src={activeIssue.originalPhotoUrl}
                    alt="Defect photo"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-primary-container/90 text-on-primary text-[10px] font-semibold">
                    Citizen Photo Evidence
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-surface-container flex flex-col justify-between border border-surface-container-high">
                  <div>
                    <span className="text-[11px] font-bold text-on-surface block">AI Triage Assessment</span>
                    <p className="text-[12px] text-on-surface-variant mt-1 leading-snug">
                      "{activeIssue.aiSummary.keySummary}"
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {activeIssue.aiSummary.keywords.map((k) => (
                      <span
                        key={k}
                        className="px-2 py-0.5 rounded bg-surface-container-lowest text-[10px] font-semibold text-on-surface-variant"
                      >
                        #{k}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* OFFICIAL ACTION CONTROLS FORM matching Stitch */}
            <form onSubmit={handleSaveAction} className="flex flex-col gap-space-md p-space-lg rounded-xl bg-surface-container-low border border-surface-container shadow-xs">
              <div className="flex items-center justify-between pb-1 border-b border-surface-container">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    admin_panel_settings
                  </span>
                  <span className="font-headline font-bold text-[16px] text-on-surface">
                    Official Action Controls
                  </span>
                </div>
                <span className="font-body text-[11px] text-on-surface-variant">
                  Authorized Sign-off: Officer #882
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                {/* Assign Department */}
                <div>
                  <label className="block text-[12px] font-semibold text-on-surface mb-1">
                    Assign Department
                  </label>
                  <select
                    value={selectedDeptId}
                    onChange={(e) => setSelectedDeptId(e.target.value)}
                    className="w-full h-10 px-3 rounded bg-surface-container-lowest text-on-surface text-[13px] border border-outline-variant/40 focus:outline-none cursor-pointer"
                  >
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} ({dept.activeWorkerCount} workers active)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Assign Worker */}
                <div>
                  <label className="block text-[12px] font-semibold text-on-surface mb-1">
                    Assign Field Worker
                  </label>
                  <select
                    value={selectedWorkerName}
                    onChange={(e) => setSelectedWorkerName(e.target.value)}
                    className="w-full h-10 px-3 rounded bg-surface-container-lowest text-on-surface text-[13px] border border-outline-variant/40 focus:outline-none cursor-pointer"
                  >
                    <option value="Field Crew Unit #14 (D. Vance)">Field Crew Unit #14 (D. Vance)</option>
                    <option value="Lineman K. Rajesh (Squad 4)">Lineman K. Rajesh (Squad 4)</option>
                    <option value="Sanitation Crew #3 (T. Rao)">Sanitation Crew #3 (T. Rao)</option>
                    <option value="Road Repair Squad 2">Road Repair Squad 2</option>
                  </select>
                </div>
              </div>

              {/* Update Status */}
              <div>
                <label className="block text-[12px] font-semibold text-on-surface mb-1">
                  Update Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ComplaintStatus)}
                  className="w-full h-10 px-3 rounded bg-surface-container-lowest text-on-surface text-[13px] border border-outline-variant/40 focus:outline-none cursor-pointer font-medium"
                >
                  <option value="Pending">Pending</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Evidence Submitted">Evidence Submitted</option>
                  <option value="Under Verification">Under Verification</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Reopened">Reopened</option>
                </select>
              </div>

              {/* Add Note */}
              <div>
                <label className="block text-[12px] font-semibold text-on-surface mb-1">
                  Administrative Update Note
                </label>
                <textarea
                  rows={2}
                  value={auditNote}
                  onChange={(e) => setAuditNote(e.target.value)}
                  placeholder="Enter official dispatch instructions, crew vehicle IDs, or citizen advisory updates..."
                  className="w-full p-3 rounded bg-surface-container-lowest text-on-surface text-[13px] border border-outline-variant/40 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1 text-[11px] text-on-surface-variant font-medium">
                  <span className="material-symbols-outlined text-[15px] text-on-tertiary-container">
                    verified
                  </span>
                  <span>Encrypted on Municipal Ledger</span>
                </div>
                <button
                  type="submit"
                  className="px-space-lg py-2 rounded-lg bg-primary-container text-on-primary font-body text-[13px] font-semibold shadow-sm hover:bg-on-secondary-fixed transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>Save & Update Complaint</span>
                </button>
              </div>
            </form>

            {/* Operational Audit Log */}
            <div className="flex flex-col gap-2 pt-2 border-t border-surface-container">
              <span className="text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
                Operational Audit History
              </span>
              <div className="space-y-2">
                {relevantHistory.length === 0 ? (
                  <p className="text-[12px] text-on-surface-variant italic">
                    Intake logged. Status is {activeIssue.status}.
                  </p>
                ) : (
                  relevantHistory.map((h) => (
                    <div
                      key={h.historyId}
                      className="p-2.5 rounded-lg bg-surface-bright border border-surface-container flex items-start gap-2.5 text-[12px]"
                    >
                      <span className="material-symbols-outlined text-secondary text-[16px] shrink-0 mt-0.5">
                        history
                      </span>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-on-surface">{h.action}</span>
                          <span className="text-[10px] text-outline">{formatDate(h.timestamp)}</span>
                        </div>
                        <p className="text-on-surface-variant mt-0.5">{h.note}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
