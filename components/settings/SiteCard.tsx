import React from 'react';
import { ChevronDown, Edit2, Trash2, Lock, Hash, Landmark, Globe, MapPin } from 'lucide-react';
import { Site, Region } from '../../types';
import { isAdminSite } from '../../utils/countryAdmin';
import { formatDisplaySiteId, getSiteCountryId } from '../../utils/siteIdGenerator';
import { getCountryProfile, Country } from '../../utils/localization';

interface SiteCardProps {
  site: Site;
  expandedSiteId: string | null;
  setExpandedSiteId: (id: string | null) => void;
  setNewSite: (site: Partial<Site>) => void;
  setIsSiteModalOpen: (val: boolean) => void;
  handleDeleteSite: (id: string) => void;
  isDeleting: boolean;
  logisticsZones: any[];
  regions?: Region[];
}

export function SiteCard({
  site,
  expandedSiteId,
  setExpandedSiteId,
  setNewSite,
  setIsSiteModalOpen,
  handleDeleteSite,
  isDeleting,
  logisticsZones,
  regions = []
}: SiteCardProps) {
  const isExpanded = expandedSiteId === site.id;
  const isAdmin = isAdminSite(site);
  const countryId = getSiteCountryId(site) as Country;
  const countryProfile = getCountryProfile(countryId);
  const humanReadableSiteId = formatDisplaySiteId(site);
  const region = regions.find(r => r.code === (site.region_code || site.regionCode));

  return (
    <div
      onClick={() => setExpandedSiteId(isExpanded ? null : site.id)}
      className={`bg-[var(--theme-bg-card)] border transition-all duration-200 rounded-2xl p-3.5 cursor-pointer shadow-xs ${
        isExpanded ? 'border-[var(--theme-accent)] dark:border-[var(--theme-accent)]' : 'border-[var(--theme-border)] hover:border-[var(--theme-border-hover)]'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`w-2 h-2 rounded-full shrink-0 ${
              site.status === 'Active' ? 'bg-[var(--theme-status-success-bg)]' :
              site.status === 'Maintenance' ? 'bg-[var(--theme-status-warning-bg)]' : 'bg-[var(--theme-status-danger-bg)]'
            }`} />
            <h6 className="text-[var(--theme-text-primary)] font-semibold text-xs leading-tight truncate" title={site.name}>
              {site.name}
            </h6>

            {/* Sovereign Country ID Badge */}
            <span className="text-[11px] px-2 py-0.5 rounded-full font-mono font-semibold shrink-0 bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] border border-[var(--theme-accent)]/20 flex items-center gap-1">
              <Globe size={11} />
              <span>{countryId}</span>
            </span>

            {/* Human-Readable Site ID */}
            <span className="text-[11px] px-2 py-0.5 rounded-full font-mono font-semibold shrink-0 bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)] flex items-center gap-0.5" title={`Human-Readable Site ID: ${humanReadableSiteId}`}>
              <Hash size={11} className="opacity-60" />
              <span>{humanReadableSiteId}</span>
            </span>

            {/* Regional Territory Badge */}
            {(region || site.region_code || site.regionCode) && (
              <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold shrink-0 bg-stone-500/10 text-[var(--theme-text-secondary)] border border-[var(--theme-border)] flex items-center gap-1" title={region ? `Territory: ${region.name} (${region.city || region.code})` : `Region: ${site.region_code || site.regionCode}`}>
                <MapPin size={11} className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)]" />
                <span>{region ? (region.city || region.name.replace(/\s+Region$/i, '')) : (site.region_code || site.regionCode)}</span>
              </span>
            )}

            {isAdmin && (
              <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold shrink-0 bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 flex items-center gap-1">
                <Landmark size={11} />
                <span>Central HQ</span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-[var(--theme-text-secondary)] mt-1 line-clamp-2" title={site.address}>
            {site.address}
          </p>
        </div>
        <ChevronDown
          size={16}
          className={`text-[var(--theme-text-muted)] shrink-0 transition-transform mt-0.5 ${
            isExpanded ? 'rotate-180 text-[var(--theme-accent)] dark:text-[var(--theme-accent)]' : ''
          }`}
        />
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-[var(--theme-border)] space-y-2.5 text-[11px] text-[var(--theme-text-secondary)] bg-[var(--theme-bg-subtle)]/40 p-3 rounded-xl" onClick={(e) => e.stopPropagation()}>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-semibold text-[var(--theme-text-muted)] block uppercase tracking-wider text-[11px]">Country & Site ID</span>
              <span className="font-semibold text-[var(--theme-text-primary)] flex items-center gap-1 mt-0.5">
                <span>{countryId}</span>
                <span className="text-[var(--theme-text-secondary)] font-normal">({countryProfile.name.replace(/\s*\(.*\)/, '')})</span>
                <span className="text-[11px] text-[var(--theme-accent)] dark:text-[var(--theme-accent)] font-mono font-semibold ml-0.5">[{humanReadableSiteId}]</span>
              </span>
            </div>
            <div>
              <span className="font-semibold text-[var(--theme-text-muted)] block uppercase tracking-wider text-[11px]">Status</span>
              <span className={`font-semibold mt-0.5 block ${
                site.status === 'Active' ? 'text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)]' :
                site.status === 'Maintenance' ? 'text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)]' : 'text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)]'
              }`}>{site.status}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-semibold text-[var(--theme-text-muted)] block uppercase tracking-wider text-[11px]">Manager</span>
              <span className="text-[var(--theme-text-primary)] font-semibold truncate block mt-0.5" title={site.manager || 'Unassigned'}>
                {site.manager || 'Unassigned'}
              </span>
            </div>
            <div>
              <span className="font-semibold text-[var(--theme-text-muted)] block uppercase tracking-wider text-[11px]">Internal System ID</span>
              <span className="text-[var(--theme-text-secondary)] font-mono text-[11px] truncate block flex items-center gap-1 mt-0.5" title={site.id}>
                <Lock size={11} className="text-[var(--theme-text-muted)] shrink-0" />
                <span className="truncate">{site.id}</span>
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-semibold text-[var(--theme-text-muted)] block uppercase tracking-wider text-[11px]">Operational Region</span>
              <span className="text-[var(--theme-text-primary)] font-semibold truncate block mt-0.5 flex items-center gap-1" title={region?.name || site.region_code || 'Unassigned'}>
                <MapPin size={11} className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)] shrink-0" />
                <span className="truncate">{region ? region.name : (site.region_code || site.regionCode || 'Unassigned')}</span>
              </span>
            </div>
            <div>
              <span className="font-semibold text-[var(--theme-text-muted)] block uppercase tracking-wider text-[11px]">Logistics Zone</span>
              <span className="text-[var(--theme-text-primary)] font-medium truncate block mt-0.5" title={
                site.logisticsZoneId
                  ? (logisticsZones.find(z => z.id === site.logisticsZoneId)?.name || 'Unknown')
                  : 'Unassigned'
              }>
                {site.logisticsZoneId
                  ? (logisticsZones.find(z => z.id === site.logisticsZoneId)?.name || 'Unknown')
                  : 'Unassigned'}
              </span>
            </div>
          </div>
          <div>
            <span className="font-semibold text-[var(--theme-text-muted)] block uppercase tracking-wider text-[11px]">
              {site.type === 'Warehouse' || site.type === 'Distribution Center'
                ? 'Capacity'
                : site.type === 'Administration'
                  ? 'Staff Limit'
                  : 'Terminals'}
            </span>
            <span className="text-[var(--theme-text-primary)] font-semibold mt-0.5 block">
              {site.type === 'Warehouse' || site.type === 'Distribution Center'
                ? `${site.capacity || 0} m²`
                : site.type === 'Administration'
                  ? `${site.capacity || 0} staff`
                  : `${site.terminalCount || 0} POS`}
            </span>
          </div>

          <div className="flex gap-2 justify-end pt-2.5 border-t border-[var(--theme-border)]">
            <button
              onClick={() => { setNewSite(site); setIsSiteModalOpen(true); }}
              className="h-8 px-3 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-lg text-[var(--theme-text-primary)] text-[11px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
              title="Edit Location"
            >
              <Edit2 size={12} className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)]" />
              <span>Edit</span>
            </button>
            {isAdmin ? (
              <span
                className="h-8 px-3 bg-stone-500/10 border border-stone-500/20 rounded-lg text-[var(--theme-text-muted)] text-[11px] font-semibold flex items-center gap-1.5 cursor-not-allowed select-none"
                title="Administration HQ is protected and cannot be deleted"
              >
                <Lock size={12} />
                <span>Protected HQ</span>
              </span>
            ) : (
              <button
                onClick={() => handleDeleteSite(site.id)}
                className="h-8 px-3 bg-[var(--theme-status-danger-bg)] bg-[var(--theme-status-danger-bg)] border border-[var(--theme-status-danger-border)] rounded-lg text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] text-[11px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
                title="Delete Location"
                disabled={isDeleting}
              >
                <Trash2 size={12} />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
