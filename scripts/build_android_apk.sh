#!/usr/bin/env bash
set -e

echo "=== Diet-AI: Gerador de APK Android via Gradle ==="

cd "$(dirname "$0")/.."

if [ -f "scripts/env_android.sh" ]; then
    source "scripts/env_android.sh"
fi

if ! command -v java &> /dev/null; then
    if command -v distrobox &> /dev/null; then
        echo "🔄 Java não encontrado no host. Executando compilação dentro do Distrobox Fedora..."
        exec distrobox enter Fedora -- bash -c "cd /var/mnt/dados/Projetos/vibeProjects/diet-AI && bash scripts/build_android_apk.sh"
    fi
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
VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "0.2.1")
TARGET_NAME="diet-AI-${VERSION}.apk"

if [ -f "$OUTPUT_APK" ]; then
    cp "$OUTPUT_APK" "$TARGET_NAME"
    echo "✅ APK gerado com sucesso!"
    echo "📦 Arquivo original: $OUTPUT_APK"
    echo "📱 Cópia de distribuição: $TARGET_NAME"
else
    echo "⚠️ Arquivo $OUTPUT_APK não encontrado após o build."
fi

# Passo 4: Envio e instalação via ADB (usando Distrobox Fedora)
if [ -f "$TARGET_NAME" ]; then
    echo ""
    echo "=== Passo 4: Envio e Instalação via ADB (Distrobox Fedora) ==="
    bash scripts/install_apk_adb.sh "$TARGET_NAME" --auto
fi
