This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
bash scripts/build_android_apk.sh # Build do APK via Gradle e instalação automática via ADB no dispositivo
bash scripts/install_apk_adb.sh   # Instalação direta do APK via ADB com flags -r -d
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- **Build Gradle & Instalação ADB Obrigatória**: Sempre que fizer alterações no código, novas features ou correções de bugs, execute o build do APK standalone via Gradle (`bash scripts/build_android_apk.sh` ou `npm run build:android`). O script compila o APK standalone (com bundle JS embutido), copia para a raiz como `diet-AI-<version>.apk` e automaticamente instala e inicia o app no aparelho conectado via ADB (`bash scripts/install_apk_adb.sh`). Nunca declare uma tarefa terminada sem compilar o APK e enviar para o aparelho conectado via ADB.
- **Controle de Versão e Changelog Obrigatório**: Sempre que implementar alterações no código, atualize a versão do projeto em `package.json` e `app.json`, e documente as mudanças em `CHANGELOG.md` seguindo Semantic Versioning (SemVer: correções de bugs incrementam patch, ex: `0.2.0` -> `0.2.1`; novas features incrementam minor, ex: `0.2.0` -> `0.3.0`; breaking changes incrementam major).
- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
