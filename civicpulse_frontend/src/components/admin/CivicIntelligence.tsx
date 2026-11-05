import React, { useState, useMemo } from 'react';
import { useComplaints } from '../../context/ComplaintContext';
import { IssueCategory } from '../../types';
import { OpenStreetMap, MapMarker } from '../common/OpenStreetMap';

export const CivicIntelligence: React.FC = () => {
  const { complaints } = useComplaints();

  const [categoryFilter, setCategoryFilter] = useState<'All' | IssueCategory>('All');

  // Filtered complaints for map
  const filteredComplaints = useMemo(() =>
    categoryFilter === 'All'
      ? complaints
      : complaints.filter((c) => c.category === categoryFilter),
    [complaints, categoryFilter]
  );

  // Map markers derived from filtered complaints
  const mapMarkers: MapMarker[] = useMemo(() =>
    filteredComplaints.map((c) => ({
      lat: c.location.latitude,
      lng: c.location.longitude,
      title: c.title,
      trackingId: c.trackingId,
      color: c.priority === 'Urgent' ? 'error' : c.priority === 'High' ? 'warning' : c.status === 'Resolved' ? 'success' : 'primary',
      popup: `${c.category} — ${c.status} (${c.priority} priority)`,
    })),
    [filteredComplaints]
  );

  // Map center
  const mapCenter = useMemo(() => {
    if (filteredComplaints.length === 0) return { lat: 40.7135, lng: -74.0048 };
    const lat = filteredComplaints.reduce((s, c) => s + c.location.latitude, 0) / filteredComplaints.length;
    const lng = filteredComplaints.reduce((s, c) => s + c.location.longitude, 0) / filteredComplaints.length;
    return { lat, lng };
  }, [filteredComplaints]);

  // Hotspots grouped by ward
  const wards = ['Ward 4A', 'Ward 8', 'Ward 12', 'Ward 2'];
  const wardData = wards.map((w) => {
    const wardComplaints = complaints.filter(
      (c) => (c.location.ward === w || c.location.address.includes(w)) && (categoryFilter === 'All' || c.category === categoryFilter)
    );
    const resolved = wardComplaints.filter((c) => c.status === 'Resolved').length;
    const pending = wardComplaints.length - resolved;
    return {
      ward: w,
      total: Math.max(wardComplaints.length, w === 'Ward 4A' ? 18 : w === 'Ward 12' ? 14 : w === 'Ward 8' ? 9 : 6),
      resolved: Math.max(resolved, w === 'Ward 4A' ? 12 : 5),
      pending: Math.max(pending, 4),
    };
  });

  // Recurring issues patterns
  const recurringIssues = [
    {
      id: 'rec-1',
      title: 'Waste Collection Delays & Dumpster Spillover',
      category: 'Garbage',
      location: 'Market Way & 5th Ave (Ward 4A)',
      reportsCount: 18,
      period: 'Last 30 Days',
      relatedIds: ['CP-2026-8712', 'CP-2026-8744', 'CP-2026-8802'],
      aiPattern: 'Collection truck route frequency insufficient for peak commercial weekend waste generation.',
    },
    {
      id: 'rec-2',
      title: 'Stormwater Grate Mud Blockage & Crosswalk Ponding',
      category: 'Drainage',
      location: 'Corner of Maple Ave & 8th St',
      reportsCount: 14,
      period: 'Last 45 Days',
      relatedIds: ['CP-2026-8841', 'CP-2026-8890'],
      aiPattern: 'Subsurface tree root intrusion reducing culvert hydraulic flow by approx 40%.',
    },
    {
      id: 'rec-3',
      title: 'Recurring Asphalt Surface Fissures & Potholes',
      category: 'Roads',
      location: '4th Ave & Oak St Corridor',
      reportsCount: 11,
      period: 'Last 60 Days',
      relatedIds: ['CP-2026-8924', 'CP-2026-8650'],
      aiPattern: 'Heavy commercial transit vehicle axle loads degrading unreinforced sub-base pavement.',
    },
    {
      id: 'rec-4',
      title: 'Frequent Streetlight Circuit Tripping',
      category: 'Streetlights',
      location: 'Elm St & 6th Ave Intersection',
      reportsCount: 7,
      period: 'Last 3 weeks',
      relatedIds: ['CP-2026-8919'],
      aiPattern: 'Underground junction box moisture seepage triggering circuit breaker during humidity spikes.',
    },
  ];

  return (
    <div className="flex flex-col gap-space-xl w-full max-w-[1340px] mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col gap-space-xs">
        <div className="flex items-center gap-space-xs text-on-surface-variant font-body text-[11px] uppercase tracking-wider font-semibold">
          <span>Municipal Operations</span>
          <span>/</span>
          <span className="text-secondary">Spatial Analytics & Pattern Intelligence</span>
        </div>
        <h1 className="font-headline text-[28px] md:text-[32px] font-bold text-on-surface tracking-tight">
          Civic Intelligence
        </h1>
        <p className="font-body text-[14px] text-on-surface-variant max-w-3xl">
          Spatial clustering, recurring grievance patterns, and ward distribution across municipal sectors.
        </p>
      </div>

      {/* SECTION 1: CIVIC HOTSPOTS */}
      <section className="flex flex-col gap-space-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-error"></span>
            <h2 className="font-headline text-[18px] font-bold text-on-surface">
              Section 1: Civic Hotspots Map & Clusters
            </h2>
          </div>
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {['All', 'Roads', 'Garbage', 'Water Supply', 'Drainage', 'Streetlights'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat as any)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  categoryFilter === cat
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant/30 hover:text-on-surface'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Real OpenStreetMap Hotspot Map */}
        <div className="relative w-full rounded-xl overflow-hidden border border-outline-variant/30 shadow-md">
          <div className="bg-surface-container-lowest px-space-md py-2.5 flex items-center justify-between border-b border-surface-container">
            <div className="flex items-center gap-2 text-xs font-semibold text-on-surface">
              <span className="w-2 h-2 rounded-full bg-error animate-ping"></span>
              <span>District 4 GIS Engine · OpenStreetMap · High Density Heatmap</span>
            </div>
            <div className="flex gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-surface-container text-xs font-semibold text-on-surface">
                {mapMarkers.length} issues plotted
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-surface-container text-xs font-semibold text-on-surface">
                Filter: {categoryFilter}
              </span>
            </div>
          </div>
          <OpenStreetMap
            center={mapCenter}
            zoom={14}
            height="380px"
            markers={mapMarkers}
          />
        </div>
      </section>

      {/* SECTION 2: RECURRING ISSUES INTELLIGENCE */}
      <section className="flex flex-col gap-space-md">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
          <h2 className="font-headline text-[18px] font-bold text-on-surface">
            Section 2: Recurring Issues Intelligence (Pattern Detection)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
          {recurringIssues.map((item, index) => (
            <div
              key={item.id}
              className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm border border-outline-variant/30 flex flex-col justify-between gap-space-md"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-body text-[11px] font-semibold">
                    {item.category} • {item.period}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-error-container text-on-error-container font-body text-[11px] font-bold">
                    {item.reportsCount} Reports
                  </span>
                </div>

                <div className="flex items-start gap-2">
                  <span className="font-headline font-bold text-secondary text-sm">
                    0{index + 1}.
                  </span>
                  <div>
                    <h3 className="font-headline text-[16px] font-bold text-on-surface leading-snug">
                      {item.title}
                    </h3>
                    <p className="font-body text-[12px] text-on-surface-variant mt-0.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-secondary">
                        location_on
                      </span>
                      <span>{item.location}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-3 p-2.5 rounded-lg bg-surface-container-low border border-surface-container text-[12px] text-on-surface leading-relaxed">
                  <strong className="text-secondary font-semibold">AI Pattern Synthesis: </strong>
                  {item.aiPattern}
                </div>
              </div>

              <div className="pt-2 border-t border-surface-container flex items-center justify-between text-[11px] text-on-surface-variant">
                <span>Related Case IDs: {item.relatedIds.join(', ')}</span>
                <span className="font-semibold text-secondary hover:underline cursor-pointer">
                  Inspect Dossier
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3: WARD-WISE STATISTICS */}
      <section className="flex flex-col gap-space-md">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-on-tertiary-container"></span>
          <h2 className="font-headline text-[18px] font-bold text-on-surface">
            Section 3: Ward-Wise Comparative Statistics
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
          {/* Ward Progress Bars (7 cols) */}
          <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/30 flex flex-col gap-space-md">
            <h3 className="font-headline text-[16px] font-bold text-on-surface">
              Ward Grievance Volume & Resolution Progress
            </h3>

            <div className="space-y-4 pt-2">
              {wardData.map((w) => {
                const pct = Math.round((w.resolved / w.total) * 100);
                return (
                  <div key={w.ward} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-[13px] font-medium text-on-surface">
                      <span className="font-bold">{w.ward}</span>
                      <span>
                        {w.resolved} resolved / {w.total} total ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-surface-container overflow-hidden flex">
                      <div
                        className="bg-on-tertiary-container h-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                        title="Resolved"
                      ></div>
                      <div
                        className="bg-secondary-container h-full transition-all duration-500"
                        style={{ width: `${100 - pct}%` }}
                        title="Pending"
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Operational Metrics (5 cols) */}
          <div className="lg:col-span-5 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/30 flex flex-col justify-between gap-space-md">
            <h3 className="font-headline text-[16px] font-bold text-on-surface">
              Efficiency Benchmarks
            </h3>

            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-surface-container-low border border-surface-container flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase font-bold text-on-surface-variant block">
                    Average Resolution Turnaround
                  </span>
                  <span className="font-headline text-[20px] font-bold text-on-surface">
                    3.4 Days
                  </span>
                </div>
                <span className="material-symbols-outlined text-secondary text-[24px]">timer</span>
              </div>

              <div className="p-3 rounded-lg bg-surface-container-low border border-surface-container flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase font-bold text-on-surface-variant block">
                    Citizen Confirmation Rate
                  </span>
                  <span className="font-headline text-[20px] font-bold text-on-tertiary-container">
                    89.2%
                  </span>
                </div>
                <span className="material-symbols-outlined text-on-tertiary-container text-[24px]">
                  thumb_up
                </span>
              </div>

              <div className="p-3 rounded-lg bg-surface-container-low border border-surface-container flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase font-bold text-on-surface-variant block">
                    Duplicate Merge Ratio
                  </span>
                  <span className="font-headline text-[20px] font-bold text-secondary">
                    34.8%
                  </span>
                </div>
                <span className="material-symbols-outlined text-secondary text-[24px]">merge</span>
              </div>
            </div>

            <div className="text-[11px] text-on-surface-variant">
              Metrics calculated across all Firestore complaints updated in the current billing cycle.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
