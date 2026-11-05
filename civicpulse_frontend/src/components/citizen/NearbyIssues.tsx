import React, { useState, useMemo } from 'react';
import { useComplaints } from '../../context/ComplaintContext';
import { Complaint } from '../../types';
import { formatRelativeTime } from '../../utils/helpers';
import { OpenStreetMap, MapMarker } from '../common/OpenStreetMap';

export const NearbyIssues: React.FC = () => {
  const { complaints, confirmExistingIssue } = useComplaints();

  const [selectedIssue, setSelectedIssue] = useState<Complaint>(
    complaints[0] || null
  );
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'in-progress' | 'review'>('all');
  const [sortBy, setSortBy] = useState<'distance' | 'recency' | 'confirmations'>('distance');

  // User anchor – default to first complaint location, or fallback
  const anchor = useMemo(() => {
    if (complaints.length > 0) {
      return { lat: complaints[0].location.latitude, lng: complaints[0].location.longitude };
    }
    return { lat: 40.7135, lng: -74.0048 };
  }, [complaints]);

  // Build map markers from filtered list
  const mapMarkers: MapMarker[] = useMemo(() =>
    complaints.map((c) => ({
      lat: c.location.latitude,
      lng: c.location.longitude,
      title: c.title,
      trackingId: c.trackingId,
      color: c.priority === 'Urgent' ? 'error' : c.status === 'Resolved' ? 'success' : 'primary',
      popup: `${c.category} — ${c.status}`,
    })),
    [complaints]
  );

  // Filter complaints
  const filteredIssues = useMemo(() => {
    let list = [...complaints];
    if (filter === 'scheduled') {
      list = list.filter((c) => c.status === 'Assigned');
    } else if (filter === 'in-progress') {
      list = list.filter((c) => c.status === 'In Progress' || c.status === 'Evidence Submitted');
    } else if (filter === 'review') {
      list = list.filter((c) => c.status === 'Pending' || c.status === 'Under Verification');
    }

    if (sortBy === 'confirmations') {
      list.sort((a, b) => b.citizenConfirmationCount - a.citizenConfirmationCount);
    } else if (sortBy === 'recency') {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return list;
  }, [complaints, filter, sortBy]);

  const activeSelected = selectedIssue || filteredIssues[0];

  return (
    <div className="max-w-[1340px] w-full mx-auto flex flex-col pb-16">
      {/* Top Context Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-lg">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-space-xs px-space-sm py-0.5 rounded-full bg-surface-container text-on-surface-variant font-body text-[11px] font-semibold">
            <span className="material-symbols-outlined text-[15px] text-on-tertiary-container">
              my_location
            </span>
            <span>Geotagged Anchor: 420 Oak Street, District 4</span>
          </div>
          <h1 className="font-headline text-[32px] md:text-[36px] font-bold text-on-surface tracking-tight">
            Nearby Issues
          </h1>
          <p className="font-body text-[14px] text-on-surface-variant">
            Civic complaints reported within 1.5 km of your location in District 4.
          </p>
        </div>

        {/* Quick Radius Metric Capsule */}
        <div className="flex items-center gap-space-sm bg-surface-container-lowest p-space-sm px-space-md rounded-xl shadow-xs border border-outline-variant/30 self-start md:self-auto">
          <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined text-[20px]">radar</span>
          </div>
          <div>
            <span className="block font-body text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
              Search Radius
            </span>
            <span className="font-headline text-[15px] font-bold text-on-surface">
              1.5 km <span className="font-normal text-on-surface-variant">({complaints.length} active)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Sort Bar matching Stitch nearby issues */}
      <div className="bg-surface-container-lowest rounded-xl p-space-sm shadow-xs border border-outline-variant/30 mb-space-lg flex flex-wrap items-center justify-between gap-space-sm">
        <div className="flex flex-wrap items-center gap-space-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-space-md py-1.5 rounded-lg font-body text-[13px] font-semibold transition-all ${
              filter === 'all'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
            }`}
          >
            All ({complaints.length})
          </button>
          <button
            onClick={() => setFilter('scheduled')}
            className={`px-space-md py-1.5 rounded-lg font-body text-[13px] font-semibold transition-all ${
              filter === 'scheduled'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Scheduled for Repair ({complaints.filter((c) => c.status === 'Assigned').length})
          </button>
          <button
            onClick={() => setFilter('in-progress')}
            className={`px-space-md py-1.5 rounded-lg font-body text-[13px] font-semibold transition-all ${
              filter === 'in-progress'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
            }`}
          >
            In Progress ({complaints.filter((c) => c.status === 'In Progress' || c.status === 'Evidence Submitted').length})
          </button>
          <button
            onClick={() => setFilter('review')}
            className={`px-space-md py-1.5 rounded-lg font-body text-[13px] font-semibold transition-all ${
              filter === 'review'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Under Review ({complaints.filter((c) => c.status === 'Pending').length})
          </button>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="font-body text-[12px] text-on-surface-variant hidden sm:inline">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-surface-container-low font-body text-[13px] text-on-surface px-3 py-1.5 rounded-lg focus:outline-none cursor-pointer border border-outline-variant/30 font-medium"
          >
            <option value="distance">Distance (Closest)</option>
            <option value="recency">Recency (Newest)</option>
            <option value="confirmations">Citizen Confirmations (Highest)</option>
          </select>
        </div>
      </div>

      {/* Full-width OSM overview map showing all issues */}
      <div className="mb-space-lg rounded-xl overflow-hidden border border-outline-variant/30 shadow-sm">
        <div className="bg-surface-container-lowest px-space-md py-2.5 flex items-center justify-between border-b border-surface-container">
          <span className="font-body text-[12px] font-semibold text-on-surface-variant flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px] text-secondary">map</span>
            Live Issues Map — OpenStreetMap
          </span>
          <span className="font-body text-[11px] text-on-surface-variant">{complaints.length} pins loaded</span>
        </div>
        <OpenStreetMap
          center={anchor}
          zoom={14}
          height="260px"
          radiusMetres={1500}
          markers={mapMarkers}
          onMarkerClick={(m) => {
            const found = complaints.find(
              (c) => c.location.latitude === m.lat && c.location.longitude === m.lng
            );
            if (found) setSelectedIssue(found);
          }}
        />
      </div>

      {/* Two-Column Primary View (Left: 5 cols, Right: 7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Left Column: Issue List */}
        <div className="lg:col-span-5 flex flex-col gap-space-sm">
          {filteredIssues.map((issue) => {
            const isSelected = activeSelected?.id === issue.id;
            return (
              <article
                key={issue.id}
                onClick={() => setSelectedIssue(issue)}
                className={`cursor-pointer p-space-md rounded-xl transition-all relative overflow-hidden group border ${
                  isSelected
                    ? 'bg-surface-container-lowest shadow-md border-secondary/50'
                    : 'bg-surface-container-lowest/80 hover:bg-surface-container-lowest shadow-xs border-outline-variant/30'
                }`}
              >
                {isSelected && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary"></div>
                )}
                <div className="flex gap-space-md">
                  <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-surface-container relative">
                    <img
                      src={issue.originalPhotoUrl}
                      alt={issue.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="flex flex-col justify-between flex-1 min-w-0">
                    <div>
                      <div className="flex items-center justify-between gap-space-xs mb-1">
                        <span
                          className={`px-2 py-0.5 rounded-full font-body text-[11px] font-semibold ${
                            issue.status === 'Resolved'
                              ? 'bg-tertiary-fixed/30 text-on-tertiary-container'
                              : issue.status === 'In Progress'
                              ? 'bg-secondary-container/60 text-on-secondary-container'
                              : 'bg-surface-container text-on-surface-variant'
                          }`}
                        >
                          {issue.status}
                        </span>
                        <span className="font-body text-[11px] text-on-surface-variant font-medium">
                          120m away
                        </span>
                      </div>
                      <h2 className="font-headline text-[15px] font-bold text-on-surface leading-snug truncate group-hover:text-secondary transition-colors">
                        {issue.title}
                      </h2>
                      <p className="font-body text-[12px] text-on-surface-variant truncate mt-0.5">
                        {issue.location.address}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-on-surface-variant mt-2">
                      <span className="font-body text-[11px] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">schedule</span>
                        <span>{formatRelativeTime(issue.createdAt)}</span>
                      </span>
                      <span className="font-body text-[11px] font-semibold text-on-tertiary-container flex items-center gap-1 bg-surface-container px-2 py-0.5 rounded-full">
                        <span className="material-symbols-outlined text-[13px]">how_to_reg</span>
                        <span>{issue.citizenConfirmationCount} confirmed</span>
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}

          <div className="p-space-md rounded-xl bg-surface-container-low text-on-surface-variant flex items-center gap-space-sm mt-space-xs border border-surface-container">
            <span className="material-symbols-outlined text-[20px] text-secondary">verified_user</span>
            <p className="font-body text-[12px]">
              Citizen confirmations help municipal dispatch prioritize urgent hazards in District 4.
            </p>
          </div>
        </div>

        {/* Right Column: Complaint Details & Map View */}
        {activeSelected && (
          <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl shadow-md p-space-lg flex flex-col gap-space-md border border-outline-variant/30 sticky top-20">
            {/* Header Metadata */}
            <div className="flex flex-wrap items-center justify-between gap-space-sm pb-space-sm border-b border-surface-container">
              <div className="flex items-center gap-space-xs">
                <span className="font-headline text-[15px] font-bold text-primary">
                  #{activeSelected.trackingId}
                </span>
                <span className="text-outline-variant">•</span>
                <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-body text-[11px] font-semibold">
                  {activeSelected.category}
                </span>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-body text-[12px] font-semibold ${
                  activeSelected.status === 'Resolved'
                    ? 'bg-tertiary-fixed/30 text-on-tertiary-container'
                    : 'bg-secondary-container/70 text-on-secondary-container'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-secondary"></span>
                <span>{activeSelected.status}</span>
              </span>
            </div>

            {/* Title & Description */}
            <div>
              <h2 className="font-headline text-[22px] font-bold text-on-surface mb-2">
                {activeSelected.title}
              </h2>
              <p className="font-body text-[14px] text-on-surface-variant leading-relaxed">
                {activeSelected.description}
              </p>
            </div>

            {/* Media & Interactive Stylized Map Split View */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
              {/* Photo Preview */}
              <div className="rounded-xl overflow-hidden bg-surface-container h-52 relative group shadow-inner border border-surface-container-high">
                <img
                  src={activeSelected.originalPhotoUrl}
                  alt={activeSelected.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-inverse-surface/85 backdrop-blur-sm text-inverse-on-surface font-body text-[11px] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">photo_camera</span>
                  <span>Citizen Evidence</span>
                </div>
              </div>

              {/* Map Preview — real OpenStreetMap */}
              <div className="w-full h-52 rounded-xl overflow-hidden border border-secondary-fixed/50 shadow-inner">
                <OpenStreetMap
                  center={{
                    lat: activeSelected.location.latitude,
                    lng: activeSelected.location.longitude,
                  }}
                  zoom={16}
                  height="208px"
                  radiusMetres={200}
                  markers={[
                    {
                      lat: activeSelected.location.latitude,
                      lng: activeSelected.location.longitude,
                      title: activeSelected.title,
                      trackingId: activeSelected.trackingId,
                      color: activeSelected.priority === 'Urgent' ? 'error' : 'primary',
                      popup: `${activeSelected.category} — ${activeSelected.status}`,
                    },
                  ]}
                />
              </div>
            </div>

            {/* Confirm Issue Action Bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-space-md border-t border-surface-container">
              <div className="text-[13px] text-on-surface-variant">
                <strong>{activeSelected.citizenConfirmationCount} residents</strong> have verified this problem.
              </div>
              <button
                type="button"
                onClick={() => confirmExistingIssue(activeSelected.id, 'cit-001')}
                className="w-full sm:w-auto px-space-lg py-2.5 rounded-lg bg-secondary text-on-secondary font-body text-[13px] font-semibold hover:opacity-95 shadow-sm transition-opacity flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">thumb_up</span>
                <span>Confirm This Issue</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
