const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Permite que o Metro resolva arquivos .wasm usados pelo expo-sqlite na Web
config.resolver.assetExts.push('wasm');

module.exports = config;
