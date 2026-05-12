import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.plantain7502.soybean5714",
  appName: "Vendas",
  webDir: "www",

  // Carrega o site Lovable diretamente — mantém 100% da UI web atual
  server: {
    url: "https://ios-push-aura.lovable.app",
    cleartext: false,
    androidScheme: "https",
    iosScheme: "https",
  },

  ios: {
    contentInset: "never",          // sem inset extra → fullscreen real
    scrollEnabled: true,
    limitsNavigationsToAppBoundDomains: false,
    backgroundColor: "#000000",
    preferredContentMode: "mobile",
    // Status bar overlay transparente — o site já desenha o relógio
    overrideUserAgent: undefined,
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
      style: "DARK",                // texto claro sobre fundo preto
      backgroundColor: "#000000",
      overlaysWebView: true,        // status bar fica POR CIMA da webview
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon",
      iconColor: "#000000",
    },
  },
};

export default config;
