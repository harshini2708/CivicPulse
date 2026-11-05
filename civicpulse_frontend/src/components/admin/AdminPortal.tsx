import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useComplaints } from '../../context/ComplaintContext';
import { Dashboard } from './Dashboard';
import { ComplaintManagement } from './ComplaintManagement';
import { CivicIntelligence } from './CivicIntelligence';
import { ResolutionAccountability } from './ResolutionAccountability';
import { Complaint } from '../../types';

export const AdminPortal: React.FC = () => {
  const { setPortalMode, logout } = useAuth();
  const { complaints } = useComplaints();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'complaints' | 'intelligence' | 'resolution'>('dashboard');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(complaints[0] || null);

  const pendingCount = complaints.filter((c) => c.status === 'Pending').length;
  const reviewCount = complaints.filter((c) => c.status === 'Evidence Submitted' || c.status === 'Under Verification').length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', badge: null },
    { id: 'complaints', label: 'Complaint Management', icon: 'inbox', badge: pendingCount > 0 ? pendingCount : null },
    { id: 'intelligence', label: 'Civic Intelligence', icon: 'insights', badge: null },
    { id: 'resolution', label: 'Resolution & Accountability', icon: 'verified', badge: reviewCount > 0 ? reviewCount : null },
  ] as const;

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface antialiased flex">
      {/* Fixed Sidebar matching Stitch Municipal Admin */}
      <aside className="fixed left-0 top-0 h-screen w-64 md:w-72 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-r border-surface-container z-50 flex flex-col justify-between">
        <div className="p-space-lg flex flex-col gap-space-lg">
          {/* Logo & Mode Pill */}
          <div className="flex flex-col gap-space-xs">
            <button
              onClick={() => setPortalMode('landing')}
              className="flex items-center gap-space-sm text-left group"
            >
              <div className="w-9 h-9 rounded-lg overflow-hidden bg-white flex items-center justify-center shadow-xs border border-outline-variant/30">
                <img src="/logo.png" alt="CityResolve Logo" className="w-full h-full object-contain p-0.5" />
              </div>
              <span className="font-headline text-headline-sm font-bold text-on-surface tracking-tight">
                CityResolve
              </span>
            </button>
            <div className="flex items-center gap-space-xs pl-space-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container animate-pulse"></span>
              <span className="font-body text-[11px] uppercase tracking-wider text-on-tertiary-container bg-tertiary-fixed/20 px-space-xs py-0.5 rounded font-semibold">
                Municipal Admin Mode
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center justify-between px-space-md py-2.5 rounded-lg font-body text-[13px] transition-all text-left ${
                    isActive
                      ? 'bg-primary-container text-on-primary font-semibold shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== null && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-secondary text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card at bottom of sidebar */}
        <div className="p-space-md m-space-md rounded-xl bg-surface-container-low border border-surface-container flex flex-col gap-space-sm">
          <div className="flex items-center gap-space-sm">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 text-on-primary">
              <span className="material-symbols-outlined text-[18px]">person</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-headline text-[13px] font-bold text-on-surface truncate">
                Authorized Officer
              </span>
              <span className="font-body text-[11px] text-on-surface-variant truncate">
                District 4 Operations
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-surface-container text-[11px]">
            <button
              onClick={() => setPortalMode('landing')}
              className="text-secondary hover:text-on-secondary-container transition-colors font-medium"
            >
              Switch Mode
            </button>
            <button
              onClick={logout}
              className="text-error hover:text-on-error-container transition-colors flex items-center gap-0.5 font-medium"
            >
              <span className="material-symbols-outlined text-[13px]">logout</span>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Admin Workspace (offset by 72px) */}
      <div className="pl-64 md:pl-72 flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="fixed top-0 left-64 md:left-72 right-0 h-16 bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-surface-container z-40 flex items-center justify-between px-space-lg">
          <div className="flex items-center gap-space-sm">
            <span className="font-body text-[12px] bg-surface-container-high text-on-surface px-space-sm py-0.5 rounded-full font-semibold">
              Jurisdiction: Sector 4 North
            </span>
            <span className="font-body text-[12px] text-on-surface-variant hidden sm:inline">
              Operational Feed: Active
            </span>
          </div>

          <div className="flex items-center gap-space-md">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined text-[18px]">person</span>
            </div>
          </div>
        </header>

        {/* Dynamic Viewport */}
        <main className="pt-20 px-space-lg flex-1">
          {activeTab === 'dashboard' && (
            <Dashboard
              onSelectComplaint={(c) => setSelectedComplaint(c)}
              onNavigateTab={(t) => setActiveTab(t as any)}
            />
          )}
          {activeTab === 'complaints' && (
            <ComplaintManagement
              selectedComplaint={selectedComplaint}
              onSelectComplaint={(c) => setSelectedComplaint(c)}
            />
          )}
          {activeTab === 'intelligence' && <CivicIntelligence />}
          {activeTab === 'resolution' && <ResolutionAccountability />}
        </main>
      </div>
    </div>
  );
};
