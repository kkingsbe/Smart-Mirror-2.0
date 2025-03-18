/**
 * Utility functions for device detection and performance metrics
 */

/**
 * Detects if the current device is likely a low-performance device like a Raspberry Pi
 * @returns {boolean} True if the device is detected as low-performance
 */
export const isLowPerformanceDevice = (): boolean => {
  if (typeof window === 'undefined') return false;

  // Check for Raspberry Pi specific user agent strings
  const userAgent = navigator.userAgent.toLowerCase();
  const isRaspberryPi = 
    userAgent.includes('raspbian') || 
    userAgent.includes('raspberry') ||
    userAgent.includes('armv7') ||
    userAgent.includes('linux armv');

  // Check for low memory (if deviceMemory API is available)
  const hasLowMemory = 
    'deviceMemory' in navigator && 
    typeof (navigator as Navigator & { deviceMemory?: number }).deviceMemory === 'number' &&
    ((navigator as Navigator & { deviceMemory?: number }).deviceMemory || 0) <= 2;

  // Check for low CPU cores (if hardwareConcurrency API is available)
  const hasLowCPU = 
    'hardwareConcurrency' in navigator && 
    typeof navigator.hardwareConcurrency === 'number' &&
    (navigator.hardwareConcurrency || 0) <= 4;

  // Check for localStorage preference (allows manual override)
  const userPreference = typeof localStorage !== 'undefined' ? 
    localStorage.getItem('preferLowPerformanceMode') : null;
    
  if (userPreference === 'true') return true;
  if (userPreference === 'false') return false;

  // Return true if any of the checks indicate a low-performance device
  return isRaspberryPi || hasLowMemory || hasLowCPU;
}; 