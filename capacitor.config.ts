import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sukunaru.studio',
  appName: 'Sukunaru Studio',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    Filesystem: {},
    Share: {},
  },
};

export default config;
