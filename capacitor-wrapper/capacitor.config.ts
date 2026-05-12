import type { CapacitorConfig } from "@capacitor/cli";

// Build local nativo do Capacitor — sem WebView remota, sem Lovable hosted.
// O conteúdo da WebView vem de `webDir` (assets locais embutidos no .ipa).
const config: CapacitorConfig = {
  appId: "app.plantain7502.soybean5714",
  appName: "Gucmart",
  webDir: "dist",

  ios: {
    contentInset: "never",
    scrollEnabled: true,
    backgroundColor: "#000000",
    preferredContentMode: "mobile",
    limitsNavigationsToAppBoundDomains: false,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 600,
      launchAutoHide: true,
      backgroundColor: "#000000",
      iosSpinnerStyle: "small",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#000000",
      overlaysWebView: true,
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon",
      iconColor: "#000000",
    },
  },
};

export default config;
