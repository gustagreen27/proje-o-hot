# Vendas iOS Wrapper (Capacitor)

Shell nativo iOS que carrega `https://ios-push-aura.lovable.app` numa WKWebView,
com suporte a:

- **Local Notifications** nativas do iOS (lockscreen real)
- **Push Notifications** (APNs) via servidor
- **Haptics**, **Status Bar**, **Splash Screen**

O código React/TS do site continua no diretório raiz (`src/`). Este wrapper só
empacota a WebView e expõe os plugins nativos.

## Build local (Mac com Xcode)

```bash
# 1. Build do site web (raiz do repo)
npm install
npm run build

# 2. Sync com iOS
npm run cap:sync     # roda npm install + npx cap sync ios em capacitor-wrapper/
npm run cap:open     # abre Xcode
```

No Xcode: selecione o time **Hui Yang (3P88EQ69T9)**, Bundle ID
`app.plantain7502.soybean5714`, Product → Archive.

## Build no Codemagic

O `codemagic.yaml` já está configurado para:

1. Instalar deps do wrapper (`capacitor-wrapper/`)
2. Rodar `npx cap sync ios`
3. Injetar `App.entitlements` com `aps-environment=production`
4. Assinar com o profile **Hotmart** + cert **iPhone Distribution: Hui Yang**
5. Gerar `.ipa` ad-hoc

Basta rodar o workflow `ios-ipa` no Codemagic.

## Notificações locais — como testar

1. Instale o `.ipa` no iPhone
2. Abra o app — ele pedirá permissão de notificações (janela nativa do iOS)
3. Toque em **"Notificar iOS"** no app
4. Bloqueie a tela; em ~3s a notificação aparece na lockscreen real

## Notificações push (APNs) — como testar

Pré-requisitos:
- Capability "Push Notifications" habilitada no App ID no Apple Developer
- Profile "Hotmart" regenerado depois de habilitar a capability
- Secrets `APNS_KEY_P8`, `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_BUNDLE_ID`,
  `APNS_PRODUCTION` configurados no Lovable Cloud

Depois disso o botão **"Enviar"** dispara o push real para todos os
dispositivos registrados.
