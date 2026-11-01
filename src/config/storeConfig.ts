/**
 * Store & Multi-Platform Distribution Configuration
 * Centralizes App Store, Google Play Store, Direct APK, and Alternative Mobile Store URLs.
 *
 * Web build shows the multi-platform download hub.
 * Native Store builds (iOS App Store / Google Play) automatically hide external store links
 * to comply with Apple App Store Review Guidelines & Google Play Developer Policies.
 */

export interface DownloadPlatformItem {
  id: 'app_store' | 'play_store' | 'direct_apk' | 'appgallery' | 'galaxy_store' | 'itch_mobile';
  name: string;
  nameTr: string;
  subtitle: string;
  subtitleTr: string;
  badgeText: string;
  badgeTextTr: string;
  url: string;
  os: 'ios' | 'android' | 'all';
  accentColor: string;
  version: string;
  size: string;
}

export const APP_METADATA = {
  appId: 'com.zindansovalyesi.game',
  appNameTr: 'Dungeon Knight: Pixel RPG',
  appNameEn: 'Dungeon Knight: Pixel RPG',
  version: '1.0.0',
  versionCode: 1,
  minIosVersion: '15.0',
  minAndroidSdk: 24, // Android 7.0+
  targetAndroidSdk: 35, // Android 15 (Google Play 2025/2026 requirement)
  privacyPolicyPath: '/privacy-policy.html',
  appStoreIconPath: '/icons/app-store-1024.png',
  playStoreIconPath: '/icons/play-store-512.png',
};

export const MOBILE_DOWNLOAD_PLATFORMS: DownloadPlatformItem[] = [
  {
    id: 'app_store',
    name: 'Apple App Store',
    nameTr: 'Apple App Store',
    subtitle: 'For iPhone & iPad (iOS 15.0+)',
    subtitleTr: 'iPhone ve iPad için (iOS 15.0+)',
    badgeText: 'App Store',
    badgeTextTr: "App Store'dan İndir",
    url: 'https://apps.apple.com/app/id0000000000',
    os: 'ios',
    accentColor: 'border-sky-500/60 bg-sky-950/30 text-sky-300',
    version: 'v1.0.0 (IPA)',
    size: '14.2 MB',
  },
  {
    id: 'play_store',
    name: 'Google Play Store',
    nameTr: 'Google Play Store',
    subtitle: 'Official Android Store (AAB)',
    subtitleTr: 'Resmi Android Mağazası (Android 7.0+)',
    badgeText: 'Google Play',
    badgeTextTr: "Google Play'den İndir",
    url: 'https://play.google.com/store/apps/details?id=com.zindansovalyesi.game',
    os: 'android',
    accentColor: 'border-emerald-500/60 bg-emerald-950/30 text-emerald-300',
    version: 'v1.0.0 (AAB)',
    size: '11.8 MB',
  },
  {
    id: 'direct_apk',
    name: 'Direct Android APK',
    nameTr: 'Doğrudan Android APK İndir',
    subtitle: 'Universal Signed APK (Arm64 / v8a)',
    subtitleTr: 'Mağazasız Doğrudan Kurulum Paketi (.APK)',
    badgeText: 'Download .APK',
    badgeTextTr: '.APK Paketi İndir',
    url: '/downloads/zindan-sovalyesi-v1.0.0.apk',
    os: 'android',
    accentColor: 'border-amber-500/60 bg-amber-950/30 text-amber-300',
    version: 'v1.0.0 (APK)',
    size: '12.4 MB',
  },
  {
    id: 'galaxy_store',
    name: 'Samsung Galaxy Store',
    nameTr: 'Samsung Galaxy Store',
    subtitle: 'Optimized for Galaxy Devices',
    subtitleTr: 'Samsung Galaxy Cihazlar İçin Özel',
    badgeText: 'Galaxy Store',
    badgeTextTr: 'Galaxy Store',
    url: 'https://galaxystore.samsung.com/detail/com.zindansovalyesi.game',
    os: 'android',
    accentColor: 'border-indigo-500/60 bg-indigo-950/30 text-indigo-300',
    version: 'v1.0.0',
    size: '12.0 MB',
  },
  {
    id: 'appgallery',
    name: 'Huawei AppGallery',
    nameTr: 'Huawei AppGallery',
    subtitle: 'For Huawei & HarmonyOS Phones',
    subtitleTr: 'Huawei & HarmonyOS Cihazlar İçin (HMS)',
    badgeText: 'AppGallery',
    badgeTextTr: 'AppGallery',
    url: 'https://appgallery.huawei.com/app/C00000000',
    os: 'android',
    accentColor: 'border-rose-500/60 bg-rose-950/30 text-rose-300',
    version: 'v1.0.0',
    size: '12.1 MB',
  },
  {
    id: 'itch_mobile',
    name: 'itch.io / Uptodown Mobile',
    nameTr: 'itch.io & Uptodown Mobil',
    subtitle: 'Indie Game Store & APK Mirror',
    subtitleTr: 'Bağımsız Oyun Platformu & Alternatif İndirme',
    badgeText: 'itch.io / APK',
    badgeTextTr: 'Alternatif Platform',
    url: 'https://itch.io',
    os: 'all',
    accentColor: 'border-purple-500/60 bg-purple-950/30 text-purple-300',
    version: 'v1.0.0',
    size: '12.4 MB',
  },
];
