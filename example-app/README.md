## Pretty Toast Demo App

This app exercises the local `@capgo/capacitor-pretty-toast` package through the public `toast.*` API.

### Run

```bash
bun install
bun run start
```

### Sync Native Platforms

```bash
bunx cap sync ios
bunx cap sync android
```

### Capture Modes

- `/?demo=hero` shows a stable top-of-page hero toast for screenshots.
- `/?demo=flow` plays the one-shot enter/exit promo morph used for the README video.
- `/?demo=update` plays the loading-to-success update morph.
