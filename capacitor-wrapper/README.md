# Vendas — Capacitor iOS Wrapper

Shell nativo iOS (WKWebView via Capacitor 6) que carrega
**https://ios-push-aura.lovable.app**.

A UI web atual (TanStack Start + Tailwind + Framer Motion) **não é alterada** —
o app nativo apenas a renderiza em fullscreen, com status bar transparente,
suporte a notch / Dynamic Island, splash screen e ícone próprios.

> ⚠️ O Lovable não compila projetos iOS. Este diretório é um scaffold:
> você precisa cloná-lo localmente ou subir num serviço de CI (Codemagic /
> Ionic Appflow / GitHub Actions com macOS runner) para gerar o `.ipa`.

---

## 1. Pré-requisitos

- Conta **Apple Developer** ativa (US$ 99/ano) — necessária para assinar e instalar.
- Node 20+.
- Para build **local**: macOS com Xcode 15+.
- Para build **sem Mac**: conta no [Codemagic](https://codemagic.io) ou
  [Ionic Appflow](https://ionic.io/appflow) (build na nuvem).

---

## 2. Setup local (uma vez)

```bash
cd capacitor-wrapper
npm install
npx cap add ios           # cria a pasta ios/ (Xcode project)
npx cap sync ios          # copia capacitor.config.ts → Info.plist
```

Após isso, a pasta `ios/` existirá. **Commite-a** no repositório para
permitir builds na nuvem sem Mac.

---

## 3. Configurar Bundle ID e Team

Edite `capacitor.config.ts`:

```ts
appId: "app.lovable.vendas.ioswrapper",  // troque para o seu reverse-DNS
appName: "Vendas",
```

Depois:

```bash
npx cap sync ios
```

No Xcode (`npx cap open ios`):

1. Selecione o target **App**.
2. Aba **Signing & Capabilities** → marque **Automatically manage signing**.
3. Selecione seu **Team** (Apple Developer).
4. Em **Capabilities**, adicione **Push Notifications** e **Background Modes →
   Remote notifications** se for usar push APNs nativo.

---

## 4. Ícones e Splash

Coloque `icon.png` (1024×1024) e `splash.png` (2732×2732) em
`ios-resources/` e rode:

```bash
npm i -g @capacitor/assets
npx capacitor-assets generate --ios \
  --iconBackgroundColor "#000000" \
  --splashBackgroundColor "#000000"
```

---

## 5. Gerar `.ipa` — três caminhos

### A) Localmente no Xcode

```bash
npx cap open ios
```

No Xcode: **Product → Archive → Distribute App → Ad Hoc / Development / App Store**.
O `.ipa` sai em `~/Library/Developer/Xcode/Archives/`.

### B) Codemagic (sem Mac) — recomendado

1. Crie conta gratuita em https://codemagic.io e conecte seu repositório Git.
2. Selecione **Capacitor / iOS**.
3. Em **Code signing identities**, faça upload do seu
   **Apple Developer certificate (.p12)** e **Provisioning Profile (.mobileprovision)**.
   - Como obter: Apple Developer portal → Certificates / Profiles, ou deixe o
     Codemagic gerar automaticamente via App Store Connect API Key.
4. Build settings:
   - Working directory: `capacitor-wrapper`
   - Pre-build script:
     ```bash
     npm ci
     npx cap sync ios
     cd ios/App && pod install
     ```
   - Xcode scheme: `App`
   - Distribution: `Development` ou `Ad Hoc` (para instalar direto) ou
     `App Store` (para TestFlight).
5. Start build → baixe o `.ipa` ao final.

### C) Ionic Appflow

Similar ao Codemagic, com integração nativa Capacitor. Veja
https://ionic.io/docs/appflow/package/builds/ios.

---

## 6. Instalar no iPhone

### Via TestFlight (recomendado)
1. Suba o `.ipa` para App Store Connect (`xcrun altool` ou Transporter app).
2. Adicione testadores em TestFlight.
3. Eles instalam pelo app TestFlight no iPhone.

### Via Ad Hoc + AltStore / Sideloadly (sem App Store)
1. Gere o `.ipa` com perfil **Ad Hoc** (UDID do iPhone registrado no portal Apple).
2. Use [Sideloadly](https://sideloadly.io) ou [AltStore](https://altstore.io)
   no PC/Mac para instalar o `.ipa` no iPhone via cabo.

### Via Apple Configurator 2 (apenas macOS)
1. Conecte o iPhone.
2. Arraste o `.ipa` no Apple Configurator 2.

---

## 7. Push Notifications APNs (opcional, futuro)

A configuração do plugin já está em `capacitor.config.ts`. Para ativar:

1. Apple Developer portal → **Keys** → criar **APNs Auth Key (.p8)**.
2. No app web (TanStack Start), detectar se está rodando dentro do Capacitor
   (`window.Capacitor?.isNativePlatform()`) e chamar:
   ```ts
   import { PushNotifications } from "@capacitor/push-notifications";
   await PushNotifications.requestPermissions();
   await PushNotifications.register();
   PushNotifications.addListener("registration", (token) => {
     // enviar token.value para o backend Lovable Cloud
   });
   ```
3. Backend usa biblioteca como `node-apn` ou `@parse/node-apn` com a `.p8`
   para mandar push para o `device token`.

> Enquanto isso, o Web Push (VAPID) que já está implementado **continua
> funcionando** quando o site é aberto pelo Safari ou pela webview do
> Capacitor (iOS 16.4+).

---

## 8. Atualizar o app sem rebuildar

Como o Capacitor está apontando para `server.url` (URL remota), **toda
alteração feita no projeto Lovable web aparece instantaneamente no app
nativo** após o publish — sem precisar gerar `.ipa` novamente.

Você só precisa de novo build do `.ipa` quando mudar:
- `capacitor.config.ts`
- ícone / splash
- plugins nativos
- Bundle ID / permissões

---

## 9. Estrutura final

```
capacitor-wrapper/
├── capacitor.config.ts     ← configuração nativa
├── package.json
├── www/index.html          ← fallback (redireciona para o site)
├── ios-resources/          ← icon.png e splash.png fonte
└── ios/                    ← gerado por `npx cap add ios` (após setup local)
    └── App/
        ├── App.xcworkspace
        ├── App/
        │   ├── Info.plist
        │   └── Assets.xcassets/
        └── Podfile
```
