# Assets iOS

Coloque aqui os arquivos-fonte para gerar ícone e splash:

- `icon.png` — 1024×1024 PNG, sem transparência, sem cantos arredondados
- `splash.png` — 2732×2732 PNG, conteúdo centralizado em ~1200×1200

Depois rode (na sua máquina local, após `npx cap add ios`):

```bash
npm i -g @capacitor/assets
npx capacitor-assets generate --ios \
  --iconBackgroundColor "#000000" \
  --splashBackgroundColor "#000000"
```

Isso popula `ios/App/App/Assets.xcassets/AppIcon.appiconset/` e o splash storyboard.
