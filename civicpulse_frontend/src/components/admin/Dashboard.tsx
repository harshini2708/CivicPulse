import React, { useState } from 'react';
import { useComplaints } from '../../context/ComplaintContext';
import { Complaint } from '../../types';
import { formatRelativeTime } from '../../utils/helpers';

interface DashboardProps {
  onSelectComplaint: (complaint: Complaint) => void;
  onNavigateTab: (tabId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectComplaint, onNavigateTab }) => {
  const { complaints, deleteComplaint } = useComplaints();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const total = complaints.length;
  const pending = complaints.filter((c) => c.status === 'Pending').length;
  const resolved = complaints.filter((c) => c.status === 'Resolved').length;
  const urgent = complaints.filter((c) => c.priority === 'Urgent').length;

  const recent = complaints.slice(0, 6);

  // Category counts
  const categories = ['Roads', 'Garbage', 'Water Supply', 'Drainage', 'Streetlights', 'Other'] as const;
  const categoryCounts = categories.map((cat) => ({
    name: cat,
    count: complaints.filter((c) => c.category === cat).length,
    percentage: Math.round((complaints.filter((c) => c.category === cat).length / (total || 1)) * 100),
  }));

  return (
    <div className="flex flex-col gap-space-lg w-full max-w-[1340px] mx-auto pb-16">
      {/* Top Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-space-xs text-on-surface-variant font-body text-[11px] tracking-wide uppercase font-semibold">
            <span className="w-2 h-2 rounded-full bg-on-tertiary-container animate-pulse"></span>
            <span>District 4 Command & Triage Centre</span>
          </div>
          <h1 className="font-headline text-[32px] md:text-[36px] font-bold text-on-surface tracking-tight">
            Municipal Operations Dashboard
          </h1>
          <p className="font-body text-[14px] text-on-surface-variant">
            Live municipal grievance intake, urgency tracking, and dispatch overview for Sector 4.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-lowest rounded-lg border border-outline-variant/30 text-[12px] font-semibold text-on-surface">
            <span className="material-symbols-outlined text-[16px] text-secondary">calendar_today</span>
            <span>Today, Nov 2026</span>
          </div>
        </div>
      </div>

      {/* 4 Real Metric Cards Grid matching Stitch */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        {/* Total Complaints */}
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-body text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
                Total Complaints
              </span>
              <span className="font-headline text-[36px] text-on-surface tracking-tight font-extrabold mt-1">
                {total}
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[22px]">inventory_2</span>
            </div>
          </div>
          <div className="pt-space-md mt-space-sm flex items-center justify-between text-[12px] border-t border-surface-container">
            <span className="text-on-tertiary-container font-semibold flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              <span>100% Firestore Synced</span>
            </span>
            <span className="text-on-surface-variant">District-wide</span>
          </div>
        </div>

        {/* Pending Complaints */}
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-body text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
                Pending Complaints
              </span>
              <span className="font-headline text-[36px] text-on-surface tracking-tight font-extrabold mt-1">
                {pending}
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-secondary-fixed/50 flex items-center justify-center text-on-secondary-fixed-variant">
              <span className="material-symbols-outlined text-[22px]">pending_actions</span>
            </div>
          </div>
          <div className="pt-space-md mt-space-sm flex items-center justify-between text-[12px] border-t border-surface-container">
            <span className="text-secondary font-semibold">Awaiting Triage / Dispatch</span>
            <span className="text-on-surface-variant">Queue active</span>
          </div>
        </div>

        {/* Resolved Complaints */}
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-body text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
                Resolved Complaints
              </span>
              <span className="font-headline text-[36px] text-on-tertiary-container tracking-tight font-extrabold mt-1">
                {resolved}
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-tertiary-fixed/30 flex items-center justify-center text-on-tertiary-container">
              <span className="material-symbols-outlined text-[22px]">task_alt</span>
            </div>
          </div>
          <div className="pt-space-md mt-space-sm flex items-center justify-between text-[12px] border-t border-surface-container">
            <span className="text-on-tertiary-container font-semibold">
              {Math.round((resolved / (total || 1)) * 100)}% Resolution Rate
            </span>
            <span className="text-on-tertiary-container font-medium">Verified</span>
          </div>
        </div>

        {/* Urgent Complaints */}
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-error/30 flex flex-col justify-between bg-gradient-to-br from-error-container/20 to-surface-container-lowest">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-body text-[11px] uppercase tracking-wider text-error font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-error animate-ping"></span>
                <span>Urgent Complaints</span>
              </span>
              <span className="font-headline text-[36px] text-error tracking-tight font-extrabold mt-1">
                {urgent}
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-error-container flex items-center justify-center text-error">
              <span className="material-symbols-outlined text-[22px]">warning</span>
            </div>
          </div>
          <div className="pt-space-md mt-space-sm flex items-center justify-between text-[12px] border-t border-error/20">
            <span className="text-error font-bold">Critical Hazard</span>
            <span className="text-error font-medium">Immediate</span>
          </div>
        </div>
      </div>

      {/* Main Content Split (Recent Complaints & Category Overview) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Left: Recent Complaints List (7 cols) */}
        <section className="lg:col-span-7 bg-surface-container-lowest rounded-xl shadow-sm p-space-lg border border-outline-variant/30 flex flex-col gap-space-md">
          <div className="flex items-center justify-between pb-space-sm border-b border-surface-container">
            <div>
              <h2 className="font-headline text-[18px] font-bold text-on-surface">Recent Grievances</h2>
              <p className="font-body text-[12px] text-on-surface-variant">Live constituent intake feed</p>
            </div>
            <button
              onClick={() => onNavigateTab('complaints')}
              className="text-secondary font-body text-[13px] font-semibold hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>

          <div className="flex flex-col gap-space-sm">
            {recent.map((issue) => (
              <div
                key={issue.id}
                onClick={() => {
                  onSelectComplaint(issue);
                  onNavigateTab('complaints');
                }}
                className="p-3 rounded-lg bg-surface-container-low hover:bg-surface-container transition-all cursor-pointer flex items-center justify-between gap-space-md border border-surface-container/60"
              >
                <div className="flex items-center gap-space-md min-w-0">
                  <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-surface-container">
                    <img src={issue.originalPhotoUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-body text-[11px] font-bold text-on-surface">
                        #{issue.trackingId}
                      </span>
                      <span className="text-outline-variant">•</span>
                      <span className="font-body text-[11px] text-on-surface-variant">
                        {issue.category}
                      </span>
                    </div>
                    <span className="font-headline text-[14px] font-bold text-on-surface truncate">
                      {issue.title}
                    </span>
                    <span className="font-body text-[11px] text-on-surface-variant truncate">
                      {issue.location.address}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`px-2 py-0.5 rounded-full font-body text-[11px] font-semibold ${
                        issue.priority === 'Urgent'
                          ? 'bg-error-container text-on-error-container'
                          : issue.status === 'Resolved'
                          ? 'bg-tertiary-fixed/30 text-on-tertiary-container'
                          : 'bg-surface-container-high text-on-surface'
                      }`}
                    >
                      {issue.status}
                    </span>
                    <span className="font-body text-[10px] text-on-surface-variant">
                      {formatRelativeTime(issue.createdAt)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmId(issue.id);
                    }}
                    className="p-1.5 rounded-lg hover:bg-error-container text-on-surface-variant hover:text-error transition-colors"
                    title="Delete complaint (Admin Only)"
                  >
                    <span className="material-symbols-outlined text-[17px]">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right: Category Distribution & Resolution Progress (5 cols) */}
        <section className="lg:col-span-5 bg-surface-container-lowest rounded-xl shadow-sm p-space-lg border border-outline-variant/30 flex flex-col gap-space-md">
          <div className="flex items-center justify-between pb-space-sm border-b border-surface-container">
            <div>
              <h2 className="font-headline text-[18px] font-bold text-on-surface">Category Distribution</h2>
              <p className="font-body text-[12px] text-on-surface-variant">Volume by municipal service</p>
            </div>
            <span className="material-symbols-outlined text-secondary text-[22px]">pie_chart</span>
          </div>

          <div className="space-y-4 pt-2">
            {categoryCounts.map((cat) => (
              <div key={cat.name} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[13px] font-medium text-on-surface">
                  <span>{cat.name}</span>
                  <span className="font-bold">{cat.count} cases ({cat.percentage}%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                  <div
                    className="h-full bg-secondary rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(8, cat.percentage)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-space-md rounded-xl bg-surface-container-low border border-surface-container flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-[22px] text-secondary">insights</span>
            <div className="text-[12px] text-on-surface-variant leading-snug">
              <strong>Live Telemetry:</strong> All figures reflect active Firestore records with real-time audit trail syncing.
            </div>
          </div>
        </section>
      </div>

      {/* Admin Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container-lowest rounded-xl max-w-sm w-full p-space-lg shadow-2xl border border-outline-variant/40 flex flex-col gap-space-md text-left">
            <div className="flex items-center gap-2 text-error">
              <span className="material-symbols-outlined text-[24px]">warning</span>
              <h3 className="font-headline font-bold text-[18px] text-on-surface">Delete Complaint?</h3>
            </div>
            <p className="font-body text-[13px] text-on-surface-variant leading-relaxed">
              Are you sure you want to permanently delete this complaint from the municipal ledger? This administrative action is irreversible.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-container">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const idToDelete = deleteConfirmId;
                  setDeleteConfirmId(null);
                  await deleteComplaint(idToDelete);
                }}
                className="px-4 py-1.5 rounded-lg bg-error text-white text-[13px] font-semibold hover:opacity-90 shadow-sm transition-opacity flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
