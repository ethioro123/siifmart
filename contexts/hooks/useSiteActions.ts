import { useCallback } from 'react';
import type { Site, SystemConfig, SystemLog } from '../../types';
import { sitesService, systemConfigService } from '../../services/supabase.service';

interface UseSiteActionsDeps {
    sites: Site[];
    activeSiteId: string;
    settings: SystemConfig;
    setSites: React.Dispatch<React.SetStateAction<Site[]>>;
    setSettings: React.Dispatch<React.SetStateAction<SystemConfig>>;
    setActiveSiteId: React.Dispatch<React.SetStateAction<string>>;
    addNotification: (type: 'alert' | 'success' | 'info', message: string) => void;
    logSystemEvent: (action: string, details: string, user: string, module: SystemLog['module']) => void;
}

export function useSiteActions(deps: UseSiteActionsDeps) {
    const { sites, activeSiteId, settings, setSites, setSettings, setActiveSiteId, addNotification, logSystemEvent } = deps;

    const updateSettings = useCallback(async (newSettings: Partial<SystemConfig>, user: string) => {
        setSettings(prev => {
            const updated = { ...prev, ...newSettings };
            try {
                if (typeof window !== 'undefined') {
                    localStorage.setItem('siifmart_system_config', JSON.stringify(updated));
                }
            } catch (e) {
                console.error('Failed to save settings to localStorage', e);
            }
            return updated;
        });

        try {
            await systemConfigService.updateSettings(newSettings, user);
            logSystemEvent('Settings Updated', 'System configuration changed', user, 'Settings');
        } catch (error) {
            console.error('❌ Failed to persist settings to database:', error);
            addNotification('alert', 'Failed to save settings to server. Changes kept locally.');
        }
    }, []);

    const setActiveSite = useCallback((id: string) => setActiveSiteId(id), []);

    const getTaxForSite = useCallback((siteId?: string) => {
        const id = siteId || activeSiteId;
        const site = sites.find(s => s.id === id);
        if (!site?.taxJurisdictionId) {
            return [{ name: 'Standard Tax', rate: settings.taxRate ?? 0, compound: false }];
        }
        const jurisdiction = settings.taxJurisdictions?.find(j => j.id === site.taxJurisdictionId);
        if (!jurisdiction || !jurisdiction.rules || jurisdiction.rules.length === 0) {
            return [{ name: 'Standard Tax', rate: settings.taxRate ?? 0, compound: false }];
        }
        return jurisdiction.rules;
    }, [activeSiteId, sites, settings.taxRate, settings.taxJurisdictions]);

    const addSite = useCallback(async (site: Site, user: string) => {
        try {
            const newSite = await sitesService.create(site);
            setSites(prev => [newSite, ...prev]);
            logSystemEvent('Site Added', `New site created: ${site.name}`, user, 'Sites');
            addNotification('success', `Site ${site.name} created successfully`);
        } catch (error) {
            console.error(error);
            addNotification('alert', 'Failed to create site');
        }
    }, []);

    const updateSite = useCallback(async (site: Site, user: string) => {
        try {
            const updated = await sitesService.update(site.id, site);
            setSites(prev => prev.map(s => s.id === site.id ? updated : s));
            logSystemEvent('Site Updated', `Site updated: ${site.name}`, user, 'Sites');
        } catch (error) {
            console.error(error);
            addNotification('alert', 'Failed to update site');
        }
    }, []);

    const deleteSite = useCallback(async (id: string, user: string) => {
        try {
            await sitesService.delete(id);
            setSites(prev => prev.filter(s => s.id !== id));
            logSystemEvent('Site Deleted', `Site deleted: ${id}`, user, 'Sites');
        } catch (error) {
            console.error(error);
            addNotification('alert', 'Failed to delete site');
        }
    }, []);

    return { updateSettings, setActiveSite, getTaxForSite, addSite, updateSite, deleteSite };
}
