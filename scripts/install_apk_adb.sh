#!/usr/bin/env bash
set -e

# Navega para a raiz do projeto
cd "$(dirname "$0")/.."

echo "=== Diet-AI: Instalador de APK via ADB (Distrobox Fedora) ==="

APK_PATH="$1"
AUTO_MODE=false

if [ "$1" = "--auto" ]; then
    APK_PATH=""
    AUTO_MODE=true
elif [ "$2" = "--auto" ]; then
    AUTO_MODE=true
fi

# Se não foi fornecido um APK específico, localiza o mais recente
if [ -z "$APK_PATH" ] || [ ! -f "$APK_PATH" ]; then
    # Busca por diet-AI-*.apk na raiz
    LATEST_APK=$(ls -t diet-AI-*.apk 2>/dev/null | head -n 1 || true)
    if [ -n "$LATEST_APK" ] && [ -f "$LATEST_APK" ]; then
        APK_PATH="$LATEST_APK"
    elif [ -f "android/app/build/outputs/apk/debug/app-debug.apk" ]; then
        APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"
    fi
fi

if [ -z "$APK_PATH" ] || [ ! -f "$APK_PATH" ]; then
    echo "❌ Erro: Nenhum APK encontrado para instalação."
    echo "💡 Execute primeiro: npm run build:android"
    exit 1
fi

# Função wrapper para executar comandos ADB via Distrobox Fedora
run_adb() {
    if [ -f "/run/.containerenv" ]; then
        # Já está dentro do container
        adb "$@"
    elif command -v distrobox &> /dev/null; then
        distrobox enter Fedora -- adb "$@"
    elif [ -x "$HOME/Android/Sdk/platform-tools/adb" ]; then
        "$HOME/Android/Sdk/platform-tools/adb" "$@"
    elif command -v adb &> /dev/null; then
        adb "$@"
    else
        echo "❌ Erro: ADB não encontrado no sistema ou no Distrobox Fedora."
        exit 1
    fi
}

echo "🔍 Verificando dispositivos conectados via ADB..."
DEVICE_OUTPUT=$(run_adb devices | grep -v "List of devices" | grep "device$" || true)

if [ -z "$DEVICE_OUTPUT" ]; then
    echo "⚠️  Nenhum dispositivo Android detectado com 'device' ativo."
    if [ "$AUTO_MODE" = true ]; then
        echo "💡 Dica: Conecte seu celular via cabo USB, ative a 'Depuração USB' e execute:"
        echo "   npm run install:android"
        exit 0
    else
        echo "💡 Certifique-se de que:"
        echo "   1. O celular está conectado via cabo USB."
        echo "   2. A 'Depuração USB' está ativada nas Opções do Desenvolvedor."
        echo "   3. Você autorizou a conexão no aviso da tela do celular."
        exit 1
    fi
fi

DEVICE_ID=$(echo "$DEVICE_OUTPUT" | head -n 1 | awk '{print $1}')
echo "📱 Dispositivo conectado detectado: $DEVICE_ID"
echo "📦 Instalando APK: $APK_PATH ..."
echo "ℹ️  Usando flags -r -d (preserva todos os dados do banco SQLite e configurações existentes)"

# Obtém caminho absoluto do APK para garantir leitura correta
ABS_APK_PATH=$(realpath "$APK_PATH")

run_adb install -r -d "$ABS_APK_PATH"

echo "🚀 Iniciando Diet-AI no aparelho..."
run_adb shell am start -n br.com.dietai.app/.MainActivity || true

echo "✅ Sucesso! Diet-AI foi instalado e iniciado no dispositivo."
