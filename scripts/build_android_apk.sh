#!/usr/bin/env bash
set -e

echo "=== Diet-AI: Gerador de APK Android via Gradle ==="

cd "$(dirname "$0")/.."

if [ -f "scripts/env_android.sh" ]; then
    source "scripts/env_android.sh"
fi

if ! command -v java &> /dev/null; then
    echo "⚠️  AVISO: Java (JDK 17+) não foi encontrado no PATH do ambiente atual."
    echo "💡 Para compilar nativamente no Linux (Bazzite/Fedora):"
    echo "   Execute dentro do Distrobox Fedora: distrobox enter Fedora"
    exit 1
fi

echo "Compilando APK de Debug..."
cd android
./gradlew assembleDebug

echo "✅ APK gerado com sucesso!"
echo "Localização: android/app/build/outputs/apk/debug/app-debug.apk"
