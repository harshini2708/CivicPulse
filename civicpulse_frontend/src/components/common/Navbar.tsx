import React from 'react';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  tabs?: { id: string; label: string; icon?: string }[];
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, tabs }) => {
  const { portalMode, setPortalMode, currentUser } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-surface-container-high/60">
      <div className="h-16 max-w-[1340px] mx-auto px-margin flex items-center justify-between gap-gutter">
        {/* Brand */}
        <div className="flex items-center gap-space-md">
          <button
            onClick={() => setPortalMode('landing')}
            className="flex items-center gap-space-sm text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-tertiary-fixed shadow-sm group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[20px]">account_balance</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline text-headline-sm font-bold tracking-tight text-on-surface">
                CityResolve
              </span>
            </div>
          </button>

          <div className="hidden sm:flex items-center gap-space-xs px-space-sm py-0.5 rounded-full bg-surface-container-low border border-surface-container-high">
            <span className="w-2 h-2 rounded-full bg-on-tertiary-container animate-pulse"></span>
            <span className="font-body text-[11px] text-on-surface-variant font-medium">
              Municipal Network Active
            </span>
          </div>

          {portalMode !== 'landing' && (
            <span className="hidden lg:inline-flex items-center px-space-sm py-0.5 rounded-full bg-surface-container text-on-surface-variant font-body text-[11px] uppercase font-semibold tracking-wider">
              Mode: {portalMode}
            </span>
          )}
        </div>

        {/* Center Portal Navigation Tabs */}
        {tabs && tabs.length > 0 && setActiveTab && (
          <nav className="hidden md:flex items-center gap-space-xs">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-space-md py-space-xs rounded-lg font-body text-[14px] transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'text-on-surface bg-surface-container font-semibold shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low font-normal'
                  }`}
                >
                  {tab.icon && (
                    <span className="material-symbols-outlined text-[17px]">{tab.icon}</span>
                  )}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-space-md">
          {portalMode !== 'landing' ? (
            <button
              onClick={() => setPortalMode('landing')}
              className="inline-flex items-center gap-1 font-body text-[13px] text-on-surface-variant hover:text-on-surface bg-surface-container-low hover:bg-surface-container px-space-md py-1.5 rounded-lg transition-colors border border-outline-variant/40"
            >
              <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
              <span>Switch Mode</span>
            </button>
          ) : (
            <span className="text-[13px] text-on-surface-variant font-medium hidden sm:inline">
              Citizen Gateway 2026
            </span>
          )}

          <div
            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-sm text-on-primary"
            title={`${currentUser.name} (${currentUser.role})`}
          >
            <span className="material-symbols-outlined text-[18px]">person</span>
          </div>
        </div>
      </div>
    </header>
  );
};
