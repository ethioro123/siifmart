import React from 'react';
import { ChevronDown, Code, Trash2 } from 'lucide-react';
import { Site } from '../../types';

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

  return (
    <div
      onClick={() => setExpandedSiteId(isExpanded ? null : site.id)}
      className={`bg-white/5 hover:bg-white/10 border ${
        isExpanded ? 'border-cyber-primary/40 bg-cyber-primary/5' : 'border-white/5'
      } rounded-xl p-3 cursor-pointer transition-all duration-200 group`}
    >
      <div className="flex items-start justify-between gap-1.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              site.status === 'Active' ? 'bg-green-500' :
              site.status === 'Maintenance' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <h6 className="text-white font-bold text-xs leading-tight truncate group-hover:text-cyber-primary transition-colors" title={site.name}>
              {site.name}
            </h6>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 line-clamp-2" title={site.address}>
            {site.address}
          </p>
        </div>
        <ChevronDown
          size={14}
          className={`text-gray-500 shrink-0 transition-transform mt-0.5 ${
            isExpanded ? 'rotate-180 text-cyber-primary' : ''
          }`}
        />
      </div>

      {isExpanded && (
        <div className="mt-2.5 pt-2.5 border-t border-white/5 space-y-2 text-[10px] text-gray-400" onClick={(e) => e.stopPropagation()}>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-bold text-gray-500 block uppercase tracking-wider text-[8px]">Code</span>
              <span className="font-mono text-cyber-primary font-bold">{site.code || 'N/A'}</span>
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
              <Code size={10} className="text-cyber-primary" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => handleDeleteSite(site.id)}
              className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-400 text-[9px] font-bold transition-colors flex items-center gap-1"
              title="Delete Location"
              disabled={isDeleting}
            >
              <Trash2 size={10} />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
