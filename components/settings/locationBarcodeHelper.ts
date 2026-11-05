import type { Site } from '../../types';
import { extractSitePrefix } from '../../utils/locationEncoder';
import { buildSiteLocationLabels, locationLabelsCSV } from '../../utils/siteLocationLabels';
import { siteLocationLabelsService } from '../../services/site-location-labels.service';
import { logger } from '../../utils/logger';
export const generateLocationBarcodesCSV = async (
  site: Partial<Site>,
  addNotification: (type: 'alert' | 'success' | 'info', message: string) => void,
  setIsGenerating: (val: boolean) => void
) => {
  if (!site.id || !site.country) {
    addNotification('alert', 'Save the facility before exporting its location labels.');
    return;
  }
  setIsGenerating(true);
  try {
    const locations = await siteLocationLabelsService.load(site.id, site.country);
    const rows = buildSiteLocationLabels(locations, site.barcodePrefix || extractSitePrefix(site.code), site.name || 'Site');
    const csv = locationLabelsCSV([['Location Label', 'Barcode', 'Zone', 'Aisle', 'Bay', 'Site Prefix', 'Site Name'], ...rows]);
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url; link.download = `location_labels_${site.code || site.id}.csv`;
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    addNotification('success', `Exported ${rows.length} saved location labels for ${site.name}`);
  } catch (error) {
    logger.error('locationBarcodeHelper', 'Barcode generation failed:', error);
    addNotification('alert', error instanceof Error ? error.message : 'Failed to export location labels');
  } finally { setIsGenerating(false); }
};
