import { Capacitor } from '@capacitor/core';

/**
 * Platform detection utilities for differentiating between mobile app and web
 */

export const getPlatform = () => Capacitor.getPlatform();

export const isNativeApp = () => {
  const platform = getPlatform();
  return platform === 'ios' || platform === 'android';
};

export const isWeb = () => getPlatform() === 'web';

export const isIOS = () => getPlatform() === 'ios';

export const isAndroid = () => getPlatform() === 'android';

/**
 * Hook to use platform detection in components
 */
export const usePlatform = () => {
  return {
    platform: getPlatform(),
    isNativeApp: isNativeApp(),
    isWeb: isWeb(),
    isIOS: isIOS(),
    isAndroid: isAndroid(),
  };
};
