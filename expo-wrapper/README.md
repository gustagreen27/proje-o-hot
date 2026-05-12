# Vendas — Expo WebView wrapper (EAS Build)

App Expo mínimo (React Native + `react-native-webview`) que carrega o site
publicado em https://ghost-ios-peek.lovable.app dentro de um shell nativo iOS/Android.

A interface web (TanStack Start + Tailwind + Framer Motion) **não é alterada** —
o wrapper apenas renderiza a URL em fullscreen.

> Este diretório é **paralelo** ao `capacitor-wrapper/`. Use **um** dos dois:
> - `capacitor-wrapper/` → build pelo **Codemagic** (`codemagic.yaml` na raiz)
> - `expo-wrapper/` → build pelo **EAS** (este README)

---

## 1. Pré-requisitos

- Node 20+
- Conta gratuita em https://expo.dev (já criada — project ID
  `a60be055-edf9-41dd-8763-5773f62bad3f`)
- Para `.ipa` instalável: conta **Apple Developer** (US$ 99/ano)

---

## 2. Setup (uma vez)

```bash
cd expo-wrapper
npm install
npm i -g eas-cli
eas login
```

O project ID já está fixado em `app.json` → `extra.eas.projectId`.
Se quiser reconectar manualmente:

```bash
npx eas-cli@latest init --id a60be055-edf9-41dd-8763-5773f62bad3f
```

---

## 3. Adicionar ícone e splash

Coloque em `assets/`:
- `icon.png` (1024×1024)
- `adaptive-icon.png` (1024×1024)
- `splash.png` (2732×2732 ou 1284×2778)

Veja `assets/README.md`.

---

## 4. Gerar `.ipa` na nuvem (sem Mac)

### Build de teste (perfil `preview`, distribuição interna)

```bash
cd expo-wrapper
eas build --platform ios --profile preview
```

O EAS roda na nuvem da Expo, gera o `.ipa` e te dá um link para download +
QR code para instalar via [Expo Go / dev client] em iPhones registrados.

### Build de produção + submit automático para App Store

```bash
npx eas-cli@latest build --platform all --auto-submit
```

> Para `--auto-submit` funcionar você precisa configurar suas credenciais
> Apple no EAS (`eas credentials`) e ter App Store Connect API Key.

---

## 5. Instalar no iPhone sem App Store

1. Use o perfil `preview` (já configurado em `eas.json`).
2. Registre o UDID do iPhone:
   ```bash
   eas device:create
   ```
3. Rode `eas build --platform ios --profile preview`.
4. Abra o link do build no Safari do iPhone → instala direto via perfil ad-hoc.

---

## 6. Trocar a URL carregada

Edite `app.json` → `extra.siteUrl` e refaça o build:

```json
"extra": {
  "siteUrl": "https://seu-novo-dominio.lovable.app"
}
```

---

## 7. Bundle ID

Edite em `app.json`:

```json
"ios":     { "bundleIdentifier": "app.lovable.vendas.expowrapper" }
"android": { "package":          "app.lovable.vendas.expowrapper" }
```

Use seu próprio reverse-DNS antes de submeter para a App Store.

---

## 8. Scripts disponíveis

| Comando | O que faz |
|---|---|
| `npm run eas:init` | Reconecta ao project ID Expo |
| `npm run eas:build:ios:preview` | Build iOS interno (.ipa para sideload) |
| `npm run eas:build:ios` | Build iOS produção |
| `npm run eas:build` | Build iOS + Android com auto-submit |
| `npm run start` | Roda Expo dev server (precisa de dev client) |

---

## 9. Atualizar o app sem rebuildar

Como o WebView aponta para uma URL remota, **toda alteração feita no projeto
Lovable web aparece instantaneamente no app nativo** após o publish — sem
gerar `.ipa` de novo.

Você só precisa de novo build quando mudar:
- `app.json` (bundle ID, nome, ícone, splash, plugins)
- `App.tsx` (lógica do wrapper)
- versão de dependências nativas
