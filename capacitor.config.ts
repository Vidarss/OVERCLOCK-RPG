import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.overclock.exe',
  appName: 'OVERCLOCK.EXE',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    App: {
      // Handle app state changes for save persistence
    },
    AdMob: {
      // AdMob will use env vars at runtime
      // Test mode is auto-enabled on emulators
    },
  },
  ios: {
    contentInset: 'automatic',
  },
  android: {
    backgroundColor: '#0a0a0f',
    // Fullscreen immersive mode for game
    webContentsDebuggingEnabled: false,
  },
};

export default config;
