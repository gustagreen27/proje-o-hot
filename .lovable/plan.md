# Push real no .ipa via APNs

## O que você vai precisar (Apple Developer)

1. **APNs Auth Key (.p8)** — em https://developer.apple.com/account/resources/authkeys
   - Marque "Apple Push Notifications service (APNs)"
   - Baixe o `.p8` (só pode baixar 1x)
   - Anote o **Key ID** (10 chars) e o **Team ID** (já temos: `3P88EQ69T9`? confirmar)
2. **App ID com capability "Push Notifications"** habilitada para o Bundle ID `app.plantain7502.soybean5714`
3. **Provisioning profile** atualizado (regenerar no Codemagic depois de habilitar a capability)

Sem esses 3, nada funciona — APNs não tem fallback.

## O que vou implementar

### 1. Backend (Lovable Cloud)
- Habilitar Cloud (Postgres + secrets)
- Tabela `device_tokens (id, token, platform, bundle_id, created_at)`
- Server function `registerDeviceToken({token, platform})` — upsert
- Server function `sendApnsToAll({title, body})` — assina JWT ES256 com a `.p8`, envia HTTP/2 (via `fetch` com `http2: true` não disponível no Worker → uso endpoint via `node-apn`-equivalente em pure JS: monto request HTTP/2 via Web Crypto + `fetch` para `https://api.push.apple.com/3/device/{token}`)
- Limpa tokens com status 410 (Unregistered)

### 2. Wrapper Capacitor
- `App.tsx` (não, é Capacitor não Expo) → registrar listener de PushNotifications no boot:
  - `PushNotifications.requestPermissions()`
  - `PushNotifications.register()`
  - listener `registration` → POST do token pro nosso servidor
- Como o app é só uma WebView que carrega `https://ios-push-aura.lovable.app`, preciso disparar o registro **de dentro do site** detectando `Capacitor.isNativePlatform()` e usando o plugin `@capacitor/push-notifications`. O bundle web inclui o plugin; ele só funciona quando rodando dentro do Capacitor.

### 3. Site (`src/`)
- Adicionar `@capacitor/core` + `@capacitor/push-notifications` ao `package.json` raiz (web)
- `src/lib/native-push.ts`: detecta Capacitor; se nativo, registra APNs e envia token pro servidor; se browser, usa Web Push como hoje
- Atualizar `setup.tsx` e `index.tsx` pra mostrar status correto no .ipa
- Botão "Enviar teste" passa a chamar `sendApnsToAll` quando há tokens nativos

### 4. Codemagic / Xcode
- Adicionar entitlement `aps-environment = production` (ou `development`) no `ios/App/App/App.entitlements`
- Script no `codemagic.yaml` que injeta o entitlement antes do build
- Atualizar provisioning profile no Codemagic depois que você habilitar Push no Apple Developer

### 5. Secrets (vou pedir depois)
- `APNS_KEY_P8` — conteúdo completo do `.p8` (cola o texto inteiro)
- `APNS_KEY_ID` — 10 chars
- `APNS_TEAM_ID` — `3P88EQ69T9` (confirmar)
- `APNS_BUNDLE_ID` — `app.plantain7502.soybean5714`
- `APNS_PRODUCTION` — `true` ou `false` (ad-hoc usa sandbox=`false` na verdade; confirmaremos)

## Ordem de execução

1. Habilitar Lovable Cloud + criar tabela `device_tokens`
2. Implementar lib APNs JWT + server functions
3. Atualizar wrapper Capacitor + site para registrar token nativo
4. Atualizar `codemagic.yaml` com entitlement `aps-environment`
5. Pedir os secrets APNs
6. Você habilita "Push Notifications" no Apple Developer + regenera profile no Codemagic
7. Build no Codemagic → instala .ipa → testa

## Avisos honestos

- **Ad-hoc com APNs production**: funciona, mas você precisa do profile correto. Se der erro `BadDeviceToken`, troco pra sandbox.
- **HTTP/2 no Worker**: Cloudflare Workers suportam fetch HTTP/2 transparente. Não preciso de `node-apn`.
- **Web Push não some**: continua funcionando para PWA no Safari. Os dois coexistem.
- **Tempo de iteração**: cada teste real exige novo build no Codemagic + reinstalar .ipa. Não é rápido.

Confirma que posso começar pelo passo 1 (habilitar Cloud + criar tabela)?