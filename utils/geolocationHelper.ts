import { logger } from './logger';

export const fetchIpLocation = async (): Promise<string> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 seconds timeout

    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (res.ok) {
      const data = await res.json();
      if (data && data.city) {
        return `IP-Loc: ${data.city}, ${data.country_name || data.country} (${data.ip})`;
      }
    }
    throw new Error('Invalid response');
  } catch (e) {
    logger.error('CentralStore', 'IP Geolocation lookup failed:', e);
    return 'IP-Loc: Unknown (Lookup Failed)';
  }
};

export const fetchLoginLocation = async (): Promise<string> => {
  // If Geolocation API is not available (e.g. unsecure HTTP environment)
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    logger.warn('CentralStore', 'Geolocation is unsupported or disabled (possibly unsecure HTTP context). Falling back to IP Geolocation.');
    return await fetchIpLocation();
  }

  // 1. Try High Accuracy Geolocation (GPS)
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 8000, // 8 seconds to allow prompt interaction
        maximumAge: 0
      });
    });
    return `GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
  } catch (highAccErr: any) {
    logger.warn('CentralStore', 'High-accuracy GPS Geolocation failed/timed out, retrying with low-accuracy.', highAccErr);

    // 2. Try Low Accuracy Geolocation (Wi-Fi / Cell tower positioning)
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 4000, // 4 seconds timeout for fast low-accuracy lookup
          maximumAge: 60000 // Accept cached location up to 1 minute old
        });
      });
      return `GPS-Low: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
    } catch (lowAccErr: any) {
      logger.error('CentralStore', 'Low-accuracy Geolocation failed or permission denied, falling back to IP Geolocation.', lowAccErr);

      // 3. Fall back to IP Geolocation lookup
      return await fetchIpLocation();
    }
  }
};
