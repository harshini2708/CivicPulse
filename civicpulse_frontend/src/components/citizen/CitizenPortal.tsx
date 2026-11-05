import React, { useState } from 'react';
import { Navbar } from '../common/Navbar';
import { ReportIssue } from './ReportIssue';
import { NearbyIssues } from './NearbyIssues';
import { TrackComplaints } from './TrackComplaints';

export const CitizenPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'report' | 'nearby' | 'track'>('report');
  const [lastSubmittedId, setLastSubmittedId] = useState<string>('');

  const handleReportSuccess = (trackingId: string) => {
    setLastSubmittedId(trackingId);
    setActiveTab('track');
  };

  const tabs = [
    { id: 'report', label: 'Report an Issue', icon: 'edit_document' },
    { id: 'nearby', label: 'Nearby Issues', icon: 'near_me' },
    { id: 'track', label: 'Track Complaints', icon: 'checklist' },
  ];

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col">
      {/* Top Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={(t) => setActiveTab(t as any)} tabs={tabs} />

      {/* Main Content Area */}
      <main className="flex-1 w-full pt-20 px-margin">
        {/* Mobile Sub-Navigation Pill Tabs */}
        <div className="md:hidden flex items-center justify-center p-1 my-3 bg-surface-container rounded-xl max-w-sm mx-auto shadow-xs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'report' && <ReportIssue onSuccess={handleReportSuccess} />}
        {activeTab === 'nearby' && <NearbyIssues />}
        {activeTab === 'track' && <TrackComplaints initialTrackingId={lastSubmittedId} />}
      </main>
    </div>
  );
};
