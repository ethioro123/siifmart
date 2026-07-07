import { Site } from '../../types';
import { encodeLocation, extractSitePrefix } from '../../utils/locationEncoder';

export const generateLocationBarcodesCSV = async (
  site: Partial<Site> & { barcodePrefix?: string },
  addNotification: (type: 'alert' | 'success' | 'info', message: string) => void,
  setIsGenerating: (val: boolean) => void
) => {
  const usePrefix = site.barcodePrefix || extractSitePrefix(site.code);

  if (!site.id && !site.code) {
    addNotification('alert', 'Please ensure the site has a valid code to generate a barcode prefix.');
    return;
  }

  const zoneCount = site.zoneCount || 10;
  const aisleCount = site.aisleCount || 20;
  const bayCount = site.bayCount || 20;

  setIsGenerating(true);
  try {
    const rows = [['Location Label', 'Barcode', 'Zone', 'Aisle', 'Bay', 'Site Prefix', 'Site Name']];
    const zones = Array.from({ length: zoneCount }, (_, i) => String.fromCharCode(65 + i));

    zones.forEach(zone => {
      for (let a = 1; a <= aisleCount; a++) {
        for (let b = 1; b <= bayCount; b++) {
          const aisleStr = a.toString().padStart(2, '0');
          const bayStr = b.toString().padStart(2, '0');
          const label = `${zone}-${aisleStr}-${bayStr}`;
          const barcode = encodeLocation(label, usePrefix);

          if (barcode) {
            rows.push([label, barcode, zone, aisleStr, bayStr, usePrefix, site.name || 'Unknown']);
          }
        }
      }
    });

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `barcodes_${(site.name || 'site').replace(/\s+/g, '_')}_${usePrefix}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addNotification('success', `Generated ${rows.length - 1} barcodes for ${site.name}`);
  } catch (error) {
    console.error('Barcode generation failed:', error);
    addNotification('alert', 'Failed to generate barcodes');
  } finally {
    setIsGenerating(false);
  }
};
