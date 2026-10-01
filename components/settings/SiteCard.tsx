import React from 'react';
import { ChevronDown, Code, Trash2, Lock, Hash } from 'lucide-react';
import { Site } from '../../types';
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
}

export function SiteCard({
  site,
  expandedSiteId,
  setExpandedSiteId,
  setNewSite,
  setIsSiteModalOpen,
  handleDeleteSite,
  isDeleting,
  logisticsZones
}: SiteCardProps) {
  const isExpanded = expandedSiteId === site.id;
  const isAdmin = isAdminSite(site);
  const countryId = getSiteCountryId(site) as Country;
  const countryProfile = getCountryProfile(countryId);
  const humanReadableSiteId = formatDisplaySiteId(site);

  return (
    <div
      onClick={() => setExpandedSiteId(isExpanded ? null : site.id)}
      className={`bg-white/80 dark:bg-black/20 hover:bg-white dark:hover:bg-white/5 border ${
        isExpanded ? 'border-[#2C5E3B]/40 bg-[#2C5E3B]/5' : 'border-[#E2DCCE]/60 dark:border-white/5'
      } rounded-2xl p-3.5 cursor-pointer transition-all duration-200 group shadow-sm`}
    >
      <div className="flex items-start justify-between gap-1.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              site.status === 'Active' ? 'bg-[#2C5E3B]' :
              site.status === 'Maintenance' ? 'bg-amber-500' : 'bg-red-500'
            }`} />
            <h6 className="text-[#1E3F27] dark:text-white font-black text-xs leading-tight truncate group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors" title={site.name}>
              {site.name}
            </h6>

            {/* Country ID Badge */}
            <span className="text-[9px] px-1.5 py-0.5 rounded-md font-mono font-bold shrink-0 bg-[#2C5E3B]/10 text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#2C5E3B]/20 flex items-center gap-1">
              <span>{countryProfile.flag}</span>
              <span>{countryId}</span>
            </span>

            {/* Human-Readable Site ID */}
            <span className="text-[9px] px-1.5 py-0.5 rounded-md font-mono font-extrabold shrink-0 bg-stone-100 dark:bg-white/10 text-stone-800 dark:text-stone-200 border border-stone-300/80 dark:border-white/10 flex items-center gap-0.5" title={`Human-Readable Site ID: ${humanReadableSiteId}`}>
              <Hash size={10} className="opacity-50" />
              <span>{humanReadableSiteId}</span>
            </span>

            {isAdmin && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold shrink-0 bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                🏛️ Central HQ
              </span>
            )}
          </div>
          <p className="text-[10px] text-stone-500 dark:text-gray-400 mt-1 line-clamp-2" title={site.address}>
            {site.address}
          </p>
        </div>
        <ChevronDown
          size={14}
          className={`text-stone-400 dark:text-gray-500 shrink-0 transition-transform mt-0.5 ${
            isExpanded ? 'rotate-180 text-[#2C5E3B] dark:text-[#A9CBA2]' : ''
          }`}
        />
      </div>

      {isExpanded && (
        <div className="mt-2.5 pt-2.5 border-t border-white/5 space-y-2 text-[10px] text-gray-400" onClick={(e) => e.stopPropagation()}>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-bold text-gray-500 block uppercase tracking-wider text-[8px]">Country & Site ID</span>
              <span className="font-bold text-white flex items-center gap-1">
                <span>{countryProfile.flag} {countryId}</span>
                <span className="text-stone-400 font-normal">({countryProfile.name.replace(/\s*\(.*\)/, '')})</span>
                <span className="text-[9px] text-[#A9CBA2] font-mono font-extrabold ml-1">[{humanReadableSiteId}]</span>
              </span>
            </div>
            <div>
              <span className="font-bold text-gray-500 block uppercase tracking-wider text-[8px]">Status</span>
              <span className={`font-semibold ${
                site.status === 'Active' ? 'text-green-400' :
                site.status === 'Maintenance' ? 'text-yellow-400' : 'text-red-400'
              }`}>{site.status}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-bold text-gray-500 block uppercase tracking-wider text-[8px]">Manager</span>
              <span className="text-white font-medium truncate block font-bold" title={site.manager || 'Unassigned'}>
                {site.manager || 'Unassigned'}
              </span>
            </div>
            <div>
              <span className="font-bold text-gray-500 block uppercase tracking-wider text-[8px]">Internal System ID</span>
              <span className="text-stone-400 font-mono text-[9px] truncate block flex items-center gap-1" title={site.id}>
                <Lock size={9} className="text-stone-500" />
                <span className="truncate">{site.id}</span>
              </span>
            </div>
          </div>
          <div>
            <span className="font-bold text-gray-500 block uppercase tracking-wider text-[8px]">Logistics Zone</span>
            <span className="text-yellow-400 font-medium truncate block font-bold" title={
              site.logisticsZoneId
                ? (logisticsZones.find(z => z.id === site.logisticsZoneId)?.name || 'Unknown')
                : 'Unassigned'
            }>
              {site.logisticsZoneId
                ? (logisticsZones.find(z => z.id === site.logisticsZoneId)?.name || 'Unknown')
                : 'Unassigned'}
            </span>
          </div>
          <div>
            <span className="font-bold text-gray-500 block uppercase tracking-wider text-[8px]">
              {site.type === 'Warehouse' || site.type === 'Distribution Center'
                ? 'Capacity'
                : site.type === 'Administration'
                  ? 'Staff Limit'
                  : 'Terminals'}
            </span>
            <span className="text-white font-semibold">
              {site.type === 'Warehouse' || site.type === 'Distribution Center'
                ? `${site.capacity || 0} m²`
                : site.type === 'Administration'
                  ? `${site.capacity || 0} staff`
                  : `${site.terminalCount || 0} POS`}
            </span>
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t border-white/5">
            <button
              onClick={() => { setNewSite(site); setIsSiteModalOpen(true); }}
              className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-[9px] font-bold transition-colors flex items-center gap-1"
              title="Edit Location"
            >
              <Code size={10} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
              <span>Edit</span>
            </button>
            {isAdmin ? (
              <span
                className="px-2.5 py-1.5 bg-stone-500/10 border border-stone-500/20 rounded-lg text-stone-400 text-[9px] font-bold flex items-center gap-1 cursor-not-allowed select-none"
                title="Administration HQ is protected and cannot be deleted"
              >
                <Lock size={10} />
                <span>Protected HQ</span>
              </span>
            ) : (
              <button
                onClick={() => handleDeleteSite(site.id)}
                className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-400 text-[9px] font-bold transition-colors flex items-center gap-1"
                title="Delete Location"
                disabled={isDeleting}
              >
                <Trash2 size={10} />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
