/**
 * Native Mobile (iOS App Store & Google Play Store) vs. Web Platform Manager
 *
 * Separates Web behavior from Native Store builds (Capacitor / Cordova / WebView wrappers)
 * and enforces mandatory App Store & Google Play technical requirements:
 * 1. Auto-pauses gameplay & audio when the app goes to background or screen locks.
 * 2. Handles Android hardware Back button to pause gameplay instead of killing the app.
 * 3. Suppresses WebView long-press selection / context menu during multi-touch combat.
 */

export type RuntimePlatform = 'ios' | 'android' | 'web';

interface CapacitorGlobal {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
}

export function getRuntimePlatform(): {
  isNativeStoreBuild: boolean;
  platform: RuntimePlatform;
  isMobileDevice: boolean;
  isStandalone: boolean;
} {
  if (typeof window === 'undefined') {
    return {
      isNativeStoreBuild: false,
      platform: 'web',
      isMobileDevice: false,
      isStandalone: false,
    };
  }

  const cap = (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;
  const buildTarget = import.meta.env.VITE_BUILD_TARGET as string | undefined;
  const urlParams = new URLSearchParams(window.location.search);
  const queryTarget = urlParams.get('target');

  const isCapNative = Boolean(cap?.isNativePlatform?.());
  const isNativeFlag =
    buildTarget === 'native' ||
    buildTarget === 'ios' ||
    buildTarget === 'android' ||
    queryTarget === 'native' ||
    queryTarget === 'ios' ||
    queryTarget === 'android';

  const isNativeStoreBuild = isCapNative || isNativeFlag;

  const ua = window.navigator.userAgent.toLowerCase();
  const isIOS =
    buildTarget === 'ios' ||
    queryTarget === 'ios' ||
    cap?.getPlatform?.() === 'ios' ||
    /iphone|ipad|ipod/.test(ua);
  const isAndroid =
    buildTarget === 'android' ||
    queryTarget === 'android' ||
    cap?.getPlatform?.() === 'android' ||
    /android/.test(ua);

  const platform: RuntimePlatform = isIOS ? 'ios' : isAndroid ? 'android' : 'web';
  const isMobileDevice = isIOS || isAndroid || window.innerWidth <= 900;

  const isStandalone =
    isNativeStoreBuild ||
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;

  return {
    isNativeStoreBuild,
    platform,
    isMobileDevice,
    isStandalone,
  };
}

/**
 * Registers mandatory iOS App Store & Google Play Store lifecycle listeners:
 * - Auto-pause when app enters background, tab switches, or phone call arrives
 * - Android hardware back button handling
 * - Multi-touch contextmenu prevention
 */
export function initNativeStoreLifecycle(callbacks: {
  onBackgroundPause: () => void;
  onHardwareBackButton: () => boolean;
}) {
  if (typeof window === 'undefined') return () => {};

  // 1. Auto-pause when app goes to background (App Store & Play Store requirement)
  const handleVisibilityChange = () => {
    if (document.hidden) {
      callbacks.onBackgroundPause();
    }
  };

  const handleWindowBlur = () => {
    callbacks.onBackgroundPause();
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('blur', handleWindowBlur);
  window.addEventListener('pagehide', handleWindowBlur);

  // 2. Prevent accidental context menu on long-press (joystick + action buttons)
  const handleContextMenu = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === 'CANVAS' || target.closest('main'))) {
      e.preventDefault();
    }
  };
  window.addEventListener('contextmenu', handleContextMenu);

  // 3. Android Hardware Back Button interception via History API & Capacitor event
  try {
    window.history.pushState({ dungeonGuard: true }, '');
  } catch {
    // ignore in restricted environments
  }

  const handlePopState = () => {
    const handled = callbacks.onHardwareBackButton();
    if (handled) {
      try {
        window.history.pushState({ dungeonGuard: true }, '');
      } catch {
        // ignore
      }
    }
  };

  window.addEventListener('popstate', handlePopState);

  // Also listen to Capacitor's native 'backButton' document event if running in Android WebView
  const handleCapBackButton = (e: Event) => {
    e.preventDefault();
    callbacks.onHardwareBackButton();
  };
  document.addEventListener('backButton', handleCapBackButton);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('blur', handleWindowBlur);
    window.removeEventListener('pagehide', handleWindowBlur);
    window.removeEventListener('contextmenu', handleContextMenu);
    window.removeEventListener('popstate', handlePopState);
    document.removeEventListener('backButton', handleCapBackButton);
  };
}
