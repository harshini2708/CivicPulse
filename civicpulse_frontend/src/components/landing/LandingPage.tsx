import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useComplaints } from '../../context/ComplaintContext';

export const LandingPage: React.FC = () => {
  const { setPortalMode, loginAsWorker, loginAsAdmin } = useAuth();
  const { complaints } = useComplaints();

  // Quick modals for Worker & Admin login from landing
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  // Worker login fields
  const [workerEmail, setWorkerEmail] = useState('');
  const [workerPassword, setWorkerPassword] = useState('');
  // Admin login fields
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const resolvedCount = complaints.filter((c) => c.status === 'Resolved').length;
  const pendingCount = complaints.filter((c) => c.status === 'Pending').length;
  const inProgressCount = complaints.filter((c) => c.status === 'In Progress' || c.status === 'Assigned').length;

  const handleWorkerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginAsWorker(workerEmail, workerPassword);
    setShowWorkerModal(false);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginAsAdmin(adminEmail, adminPassword);
    setShowAdminModal(false);
  };

  return (
    <div className="min-h-screen bg-background font-body text-on-surface relative selection:bg-secondary-container selection:text-on-secondary-container">
      {/* Ambient gradient backdrops matching Stitch Civic Horizon */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-secondary-fixed/40 via-surface-container-low/20 to-transparent blur-3xl opacity-70"></div>
        <div className="absolute top-1/3 -right-64 w-[500px] h-[500px] bg-tertiary-fixed/15 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-surface-container-high/60">
        <div className="h-16 max-w-[1340px] mx-auto px-margin flex items-center justify-between gap-gutter">
          <div className="flex items-center gap-space-md">
            <div className="flex items-center gap-space-sm">
              <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-tertiary-fixed shadow-sm">
                <span className="material-symbols-outlined text-[20px]">account_balance</span>
              </div>
              <span className="font-headline text-headline-sm font-bold tracking-tight text-on-surface">
                CivicPulse
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-space-xs px-space-sm py-0.5 rounded-full bg-surface-container-low border border-surface-container-high">
              <span className="w-2 h-2 rounded-full bg-on-tertiary-container animate-pulse"></span>
              <span className="font-body text-[11px] text-on-surface-variant font-medium">
                Municipal Network Active
              </span>
            </div>
          </div>

          <div className="flex items-center gap-space-sm">
            <button
              onClick={() => setShowWorkerModal(true)}
              className="font-body text-[13px] text-on-surface-variant hover:text-on-surface px-3 py-1.5 rounded-lg hover:bg-surface-container-low transition-colors"
            >
              Worker Portal
            </button>
            <button
              onClick={() => setShowAdminModal(true)}
              className="font-body text-[13px] font-semibold text-primary bg-surface-container hover:bg-surface-container-high px-3.5 py-1.5 rounded-lg shadow-xs transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
              <span>Admin Portal</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero & Portals */}
      <main className="relative z-10 w-full pt-20 pb-16">
        <div className="max-w-[1340px] mx-auto px-margin py-space-md">
          {/* Top Hero & Identity Anchor */}
          <div className="relative w-full overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm mb-space-xl p-space-lg md:p-space-xl text-center flex flex-col items-center border border-outline-variant/30">
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[680px] h-[260px] bg-gradient-to-b from-secondary-fixed/50 via-tertiary-fixed/10 to-transparent blur-3xl opacity-60 pointer-events-none"></div>

            {/* Live Status Ticker */}
            <div className="relative z-10 inline-flex items-center gap-space-sm px-space-md py-1 rounded-full bg-surface-container-low mb-space-md shadow-xs border border-surface-container">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-on-tertiary-container animate-pulse"></span>
              <span className="font-body text-[11px] text-on-surface-variant font-semibold tracking-wider uppercase">
                Public Civic Engine • Municipal Gateway 2026
              </span>
            </div>

            {/* Official Emblem */}
            <div className="relative z-10 w-20 h-20 rounded-2xl bg-primary-container text-tertiary-fixed flex items-center justify-center p-3 shadow-md mb-space-sm">
              <span className="material-symbols-outlined text-[44px]">shield</span>
            </div>

            {/* Tagline */}
            <h1 className="relative z-10 max-w-3xl font-headline text-[38px] md:text-[48px] font-extrabold text-on-surface tracking-tight leading-tight mb-space-sm">
              Your City. Your Voice.{' '}
              <span className="bg-gradient-to-r from-secondary to-on-tertiary-container bg-clip-text text-transparent">
                Better Governance.
              </span>
            </h1>

            {/* Narrative */}
            <p className="relative z-10 max-w-2xl font-body text-[16px] text-on-surface-variant leading-relaxed mb-space-lg">
              CivicPulse connects residents, municipal workers, and city administration with AI-powered grievance
              triage, duplicate grouping, field evidence verification, and transparent complaint tracking.
            </p>

            {/* Verified Live Metrics Strip */}
            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-space-md w-full max-w-3xl pt-space-md border-t border-surface-container">
              <div className="flex flex-col items-center p-space-sm rounded-lg bg-surface-container-low/60 border border-surface-container/60">
                <span className="font-headline text-[22px] text-on-surface font-bold">98.4%</span>
                <span className="font-body text-[11px] text-on-surface-variant font-medium">Audit Rate</span>
              </div>
              <div className="flex flex-col items-center p-space-sm rounded-lg bg-surface-container-low/60 border border-surface-container/60">
                <span className="font-headline text-[22px] text-on-surface font-bold">{complaints.length}</span>
                <span className="font-body text-[11px] text-on-surface-variant font-medium">Active Cases</span>
              </div>
              <div className="flex flex-col items-center p-space-sm rounded-lg bg-surface-container-low/60 border border-surface-container/60">
                <span className="font-headline text-[22px] text-on-tertiary-container font-bold">{resolvedCount}</span>
                <span className="font-body text-[11px] text-on-surface-variant font-medium">Verified Resolved</span>
              </div>
              <div className="flex flex-col items-center p-space-sm rounded-lg bg-surface-container-low/60 border border-surface-container/60">
                <span className="font-headline text-[22px] text-secondary font-bold">District 4</span>
                <span className="font-body text-[11px] text-on-surface-variant font-medium">Regional Sector</span>
              </div>
            </div>
          </div>

          {/* Gateway Selector Header */}
          <div className="flex flex-col items-center text-center mb-space-lg">
            <div className="inline-flex items-center gap-space-xs font-body text-[12px] text-secondary tracking-widest uppercase font-semibold">
              <span className="material-symbols-outlined text-[16px]">touch_app</span>
              <span>Select Portal Access Point</span>
            </div>
            <h2 className="font-headline text-[26px] text-on-surface font-bold tracking-tight mt-1">
              Choose Your Civic Engagement Path
            </h2>
          </div>

          {/* Three Portals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg w-full mb-space-xl">
            {/* 1. Citizen Portal Card */}
            <div className="group relative flex flex-col justify-between rounded-xl bg-surface-container-lowest p-space-lg shadow-sm hover:shadow-xl transition-all duration-300 border border-outline-variant/40 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-secondary via-secondary-container to-on-tertiary-container"></div>
              <div>
                <div className="flex items-center justify-between gap-space-md mb-space-md">
                  <div className="w-12 h-12 rounded-xl bg-surface-container-low text-secondary flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[28px]">groups</span>
                  </div>
                  <span className="px-space-sm py-0.5 rounded-full bg-surface-container-low font-body text-[11px] text-on-surface font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container"></span>
                    <span>Resident Access</span>
                  </span>
                </div>
                <h3 className="font-headline text-[22px] text-on-surface font-bold tracking-tight mb-1">
                  Citizen Portal
                </h3>
                <p className="font-body text-[13px] text-on-surface-variant mb-space-md leading-relaxed">
                  Report potholes, overflowing garbage, and broken streetlights with live camera, audio notes, and GPS.
                </p>

                {/* Features List */}
                <div className="space-y-2 mb-space-lg text-left">
                  <div className="flex items-center gap-2 text-[13px] text-on-surface">
                    <span className="material-symbols-outlined text-secondary text-[18px]">photo_camera</span>
                    <span>Live Camera & Voice Capture</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-on-surface">
                    <span className="material-symbols-outlined text-secondary text-[18px]">near_me</span>
                    <span>Nearby Issues & Confirmations</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-on-surface">
                    <span className="material-symbols-outlined text-secondary text-[18px]">checklist</span>
                    <span>7-Stage Real-Time Tracking</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setPortalMode('citizen')}
                className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-body text-[14px] font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <span>Enter Citizen Portal</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>

            {/* 2. Worker Portal Card */}
            <div className="group relative flex flex-col justify-between rounded-xl bg-surface-container-lowest p-space-lg shadow-sm hover:shadow-xl transition-all duration-300 border border-outline-variant/40 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-secondary to-primary-container"></div>
              <div>
                <div className="flex items-center justify-between gap-space-md mb-space-md">
                  <div className="w-12 h-12 rounded-xl bg-surface-container-low text-primary flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[28px]">engineering</span>
                  </div>
                  <span className="px-space-sm py-0.5 rounded-full bg-surface-container-low font-body text-[11px] text-on-surface font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    <span>Field Operations</span>
                  </span>
                </div>
                <h3 className="font-headline text-[22px] text-on-surface font-bold tracking-tight mb-1">
                  Worker Portal
                </h3>
                <p className="font-body text-[13px] text-on-surface-variant mb-space-md leading-relaxed">
                  Authorized field crew access to inspect assigned tasks and submit photographic repair evidence.
                </p>

                {/* Features List */}
                <div className="space-y-2 mb-space-lg text-left">
                  <div className="flex items-center gap-2 text-[13px] text-on-surface">
                    <span className="material-symbols-outlined text-secondary text-[18px]">assignment</span>
                    <span>Assigned Complaints Queue</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-on-surface">
                    <span className="material-symbols-outlined text-secondary text-[18px]">camera_enhance</span>
                    <span>Live After-Repair Photo Proof</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-on-surface">
                    <span className="material-symbols-outlined text-secondary text-[18px]">pin_drop</span>
                    <span>GPS & Server Timestamp Audit</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowWorkerModal(true)}
                className="w-full py-2.5 rounded-lg bg-surface-container-high hover:bg-surface-dim text-on-surface font-body text-[14px] font-semibold flex items-center justify-center gap-2 shadow-xs transition-all border border-outline-variant/60"
              >
                <span>Worker Operations Login</span>
                <span className="material-symbols-outlined text-[16px]">login</span>
              </button>
            </div>

            {/* 3. Admin Portal Card */}
            <div className="group relative flex flex-col justify-between rounded-xl bg-surface-container-lowest p-space-lg shadow-sm hover:shadow-xl transition-all duration-300 border border-outline-variant/40 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary-container via-secondary to-on-tertiary-container"></div>
              <div>
                <div className="flex items-center justify-between gap-space-md mb-space-md">
                  <div className="w-12 h-12 rounded-xl bg-primary-container text-tertiary-fixed flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[28px]">admin_panel_settings</span>
                  </div>
                  <span className="px-space-sm py-0.5 rounded-full bg-surface-container-low font-body text-[11px] text-on-surface font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container"></span>
                    <span>Authorized Admins</span>
                  </span>
                </div>
                <h3 className="font-headline text-[22px] text-on-surface font-bold tracking-tight mb-1">
                  Admin Portal
                </h3>
                <p className="font-body text-[13px] text-on-surface-variant mb-space-md leading-relaxed">
                  Municipal command centre for grievance triage, department dispatch, and Gemini AI verification review.
                </p>

                {/* Features List */}
                <div className="space-y-2 mb-space-lg text-left">
                  <div className="flex items-center gap-2 text-[13px] text-on-surface">
                    <span className="material-symbols-outlined text-secondary text-[18px]">dashboard</span>
                    <span>District Command Dashboard</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-on-surface">
                    <span className="material-symbols-outlined text-secondary text-[18px]">hub</span>
                    <span>Department & Worker Dispatch</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-on-surface">
                    <span className="material-symbols-outlined text-secondary text-[18px]">smart_toy</span>
                    <span>Gemini AI Verification & Sign-off</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowAdminModal(true)}
                className="w-full py-2.5 rounded-lg bg-primary-container hover:bg-on-secondary-fixed text-on-primary font-body text-[14px] font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <span>Municipal Admin Access</span>
                <span className="material-symbols-outlined text-[16px]">vpn_key</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Worker Login Modal */}
      {showWorkerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container-lowest rounded-xl max-w-sm w-full p-space-lg shadow-2xl border border-outline-variant/40 flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">engineering</span>
                <h3 className="font-headline font-bold text-[18px] text-on-surface">Worker Login</h3>
              </div>
              <button onClick={() => setShowWorkerModal(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <p className="font-body text-[12px] text-on-surface-variant">
              Enter any email and password to access the field worker portal.
            </p>
            <form onSubmit={handleWorkerLogin} className="flex flex-col gap-space-sm">
              <div>
                <label className="block text-[12px] font-semibold text-on-surface mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={workerEmail}
                  onChange={(e) => setWorkerEmail(e.target.value)}
                  placeholder="worker@civicpulse.in"
                  className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40 border border-outline-variant/30"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-on-surface mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={workerPassword}
                  onChange={(e) => setWorkerPassword(e.target.value)}
                  placeholder="Any password"
                  className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40 border border-outline-variant/30"
                />
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-on-surface-variant bg-surface-container-low px-2.5 py-1.5 rounded-lg">
                <span className="material-symbols-outlined text-[14px] text-secondary">info</span>
                <span>Any email &amp; password accepted for demo</span>
              </div>
              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-primary text-on-primary font-body text-[13px] font-semibold mt-1 shadow-sm hover:opacity-95"
              >
                Access Assigned Tasks
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Admin Login Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container-lowest rounded-xl max-w-sm w-full p-space-lg shadow-2xl border border-outline-variant/40 flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container">account_balance</span>
                <h3 className="font-headline font-bold text-[18px] text-on-surface">Admin Access</h3>
              </div>
              <button onClick={() => setShowAdminModal(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <p className="font-body text-[12px] text-on-surface-variant">
              Enter your municipal administrator credentials to access District 4 Command &amp; Triage.
            </p>
            <form onSubmit={handleAdminLogin} className="flex flex-col gap-space-sm">
              <div>
                <label className="block text-[12px] font-semibold text-on-surface mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@civicpulse.in"
                  className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40 border border-outline-variant/30"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-on-surface mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Any password"
                  className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40 border border-outline-variant/30"
                />
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-on-surface-variant bg-surface-container-low px-2.5 py-1.5 rounded-lg">
                <span className="material-symbols-outlined text-[14px] text-secondary">info</span>
                <span>Any email &amp; password accepted for demo</span>
              </div>
              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-primary text-on-primary font-body text-[13px] font-semibold mt-1 shadow-sm hover:opacity-95"
              >
                Access Admin Dashboard
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full bg-surface-container-lowest/90 border-t border-surface-container py-space-md mt-auto">
        <div className="max-w-[1340px] mx-auto px-margin flex flex-col sm:flex-row items-center justify-between gap-space-md text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-headline text-headline-sm font-bold text-on-surface">CivicPulse</span>
            <span className="text-on-surface-variant text-xs">• Municipal Democratic Platform</span>
          </div>
          <p className="font-body text-[12px] text-on-surface-variant">
            © 2026 Municipal Governance Alliance. Designed for accountable public service.
          </p>
        </div>
      </footer>
    </div>
  );
};
