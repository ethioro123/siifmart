import { useCallback } from 'react';
import type { Site, SystemConfig, SystemLog } from '../../types';
import { sitesService, systemConfigService } from '../../services/supabase.service';
import { logger } from '../../utils/logger';
import { setCurrencySymbol } from '../../constants/categories';
import { isAdminSite, findCountryAdminSite } from '../../utils/countryAdmin';
import { getCountryProfile } from '../../utils/localization';

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
                logger.error('useSiteActions', 'Failed to save settings to localStorage', e as Error);
            }
            if (updated.currency === 'KES' || updated.currency === 'KSh' || updated.country === 'KE') {
                setCurrencySymbol('KSh');
            } else if (updated.currency) {
                setCurrencySymbol(updated.currency);
            } else if (updated.country) {
                const prof = getCountryProfile(updated.country);
                setCurrencySymbol(prof.currencySymbol);
            }
            return updated;
        });

        try {
            await systemConfigService.updateSettings(newSettings, user);
            logSystemEvent('Settings Updated', 'System configuration changed', user, 'Settings');
        } catch (error) {
            logger.error('useSiteActions', 'Failed to persist settings to database', error as Error);
            addNotification('alert', 'Failed to save settings to server. Changes kept locally.');
        }
    }, []);

    const setActiveSite = useCallback((id: string) => setActiveSiteId(id), []);

    const getTaxForSite = useCallback((siteId?: string) => {
        const id = siteId || activeSiteId;
        const site = sites.find(s => s.id === id);
        const siteCountry = (site?.country || settings.country || 'ET') as string;
        const countryConfigs = (settings.countryConfigs || {}) as Record<string, Partial<SystemConfig>>;
        const activeConfig = countryConfigs[siteCountry] || {};
        const isSalesTaxEnabled = Boolean(activeConfig.taxOnSelling ?? settings.taxOnSelling);

        if (!isSalesTaxEnabled) {
            return [];
        }

        const effectiveTaxRate = activeConfig.taxRate ?? settings.taxRate ?? 0;

        if (!site?.taxJurisdictionId) {
            return [{ name: 'Standard Tax', rate: effectiveTaxRate, compound: false }];
        }
        const jurisdictions = activeConfig.taxJurisdictions || settings.taxJurisdictions;
        const jurisdiction = jurisdictions?.find(j => j.id === site.taxJurisdictionId);
        if (!jurisdiction || !jurisdiction.rules || jurisdiction.rules.length === 0) {
            return [{ name: 'Standard Tax', rate: effectiveTaxRate, compound: false }];
        }
        return jurisdiction.rules;
    }, [activeSiteId, sites, settings.taxRate, settings.taxJurisdictions, settings.taxOnSelling, settings.countryConfigs, settings.country]);

    const addSite = useCallback(async (site: Site, user: string) => {
        try {
            const siteCountry = site.country || 'ET';
            const newSite = await sitesService.create(site);

            // If this country does not have an Administration HQ, ensure one is auto-provisioned
            const hasAdmin = sites.some(s => (s.country || 'ET') === siteCountry && isAdminSite(s));
            if (!hasAdmin && !isAdminSite(site)) {
                const adminSite = await sitesService.ensureCountryAdministrationSite(siteCountry);
                if (adminSite) {
                    setSites(prev => [newSite, adminSite, ...prev]);
                    logSystemEvent('HQ Auto-Provisioned', `Auto-provisioned Administration HQ for ${siteCountry}: ${adminSite.name}`, user, 'Sites');
                    addNotification('info', `Administration HQ "${adminSite.name}" automatically provisioned for ${siteCountry}.`);
                } else {
                    setSites(prev => [newSite, ...prev]);
                }
            } else {
                setSites(prev => [newSite, ...prev]);
            }

            logSystemEvent('Site Added', `New site created: ${site.name}`, user, 'Sites');
            addNotification('success', `Site ${site.name} created successfully`);
        } catch (error) {
            logger.error('useSiteActions', 'caught error', error as Error);
            addNotification('alert', 'Failed to create site');
        }
    }, [sites, logSystemEvent, addNotification, setSites]);

    const updateSite = useCallback(async (site: Site, user: string) => {
        try {
            const updated = await sitesService.update(site.id, site);
            setSites(prev => prev.map(s => s.id === site.id ? updated : s));
            logSystemEvent('Site Updated', `Site updated: ${site.name}`, user, 'Sites');
        } catch (error) {
            logger.error('useSiteActions', 'caught error', error as Error);
            addNotification('alert', 'Failed to update site');
        }
    }, [logSystemEvent, addNotification, setSites]);

    const deleteSite = useCallback(async (id: string, user: string) => {
        const targetSite = sites.find(s => s.id === id);
        if (targetSite && isAdminSite(targetSite)) {
            const siteCountry = targetSite.country || 'ET';
            const countryAdminCount = sites.filter(s => (s.country || 'ET') === siteCountry && isAdminSite(s)).length;
            if (countryAdminCount <= 1) {
                addNotification('alert', `Cannot delete "${targetSite.name}". Every country must retain an Administration Central HQ.`);
                return;
            }
        }

        try {
            await sitesService.delete(id);
            setSites(prev => prev.filter(s => s.id !== id));
            logSystemEvent('Site Deleted', `Site deleted: ${id}`, user, 'Sites');
        } catch (error: any) {
            logger.error('useSiteActions', 'caught error', error as Error);
            addNotification('alert', error?.message || 'Failed to delete site');
        }
    }, [sites, logSystemEvent, addNotification, setSites]);

    return { updateSettings, setActiveSite, getTaxForSite, addSite, updateSite, deleteSite };
}
