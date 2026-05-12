# Assets do Expo wrapper

Coloque aqui os arquivos PNG referenciados em `app.json`:

- `icon.png` — 1024×1024 (ícone iOS/Android)
- `adaptive-icon.png` — 1024×1024 (foreground Android adaptive)
- `splash.png` — 1284×2778 ou 2732×2732 (splash screen)

Geração automática a partir de um único `icon.png` 1024×1024:

```bash
cd expo-wrapper
npm i -g @expo/cli
npx expo install expo-splash-screen
npx expo prebuild --clean   # opcional, gera nativo
```

Ou use o serviço https://www.appicon.co para gerar todos os tamanhos.
