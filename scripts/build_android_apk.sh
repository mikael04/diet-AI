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

# Garante que o bundle JS seja embutido no APK de debug para funcionar standalone no celular
if [ -f "android/app/build.gradle" ]; then
    if ! grep -q "debuggableVariants = \[\]" "android/app/build.gradle"; then
        sed -i 's/\/\/ debuggableVariants = \["liteDebug", "prodDebug"\]/debuggableVariants = \[\]/g' "android/app/build.gradle"
    fi
fi

echo "Compilando APK Standalone via Gradle..."
cd android
./gradlew assembleDebug
cd ..

# Cria a cópia do APK com nome de versão no diretório raiz do projeto
OUTPUT_APK="android/app/build/outputs/apk/debug/app-debug.apk"
TARGET_NAME="diet-AI-0.2.apk"

if [ -f "$OUTPUT_APK" ]; then
    cp "$OUTPUT_APK" "$TARGET_NAME"
    echo "✅ APK gerado com sucesso!"
    echo "📦 Arquivo original: $OUTPUT_APK"
    echo "📱 Cópia de distribuição: $TARGET_NAME"
else
    echo "⚠️ Arquivo $OUTPUT_APK não encontrado após o build."
fi
