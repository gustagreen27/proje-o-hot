# Gucmart — iOS nativo (Capacitor)

App iOS nativo gerado com Capacitor. **Sem WebView remota, sem APNs, sem Firebase, sem OneSignal.** Tudo roda offline com assets locais e notificações locais nativas do iOS.

## Stack

- Vite SPA → bundle estático em `dist/index.html`
- Capacitor 6 (iOS) → embute o bundle em `capacitor-wrapper/dist`
- `@capacitor/local-notifications` + `@capacitor/haptics`

## Build local

```bash
# 1) instala deps web
npm install

# 2) build do bundle Vite
npm run build

# 3) sincroniza com iOS (copia dist + cap sync)
npm run cap:sync

# 4) abre Xcode
npm run cap:open
```

No Xcode: selecione um device real, ajuste signing e rode.

## Build no Codemagic

O `codemagic.yaml` já faz tudo automaticamente:

1. `npm install` na raiz
2. `npm run build` (SPA estático em `dist/`)
3. `npm install` em `capacitor-wrapper/`
4. Copia `dist/` → `capacitor-wrapper/dist`
5. `npx cap add ios` (se necessário) + `npx cap sync ios`
6. `pod install`
7. Build assinado Ad Hoc (.ipa)

Basta dar push em `main`.

## Notificações locais

- Botão **"Enviar Notificação"** dispara `LocalNotifications.schedule(...)` com:
  - Título: `Venda realizada com Cartão de Crédito`
  - Corpo: `Você recebeu: US$ <valor> - HP<10 dígitos>`
  - `id`, `sound: "default"`, `badge: 1`, agendamento +3s
- Funciona na lockscreen, banner, Central de Notificações e Dynamic Island.
- 100% offline, sem servidor.

## Configuração

- `appId`: `app.plantain7502.soybean5714`
- `appName`: `Gucmart`
- `webDir`: `dist` (assets locais — sem `server.url`)
- `npm run build` gera obrigatoriamente `dist/index.html`
