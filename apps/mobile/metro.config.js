const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const config = getDefaultConfig(__dirname)

// expo is hoisted to the monorepo root, so AppEntry.js resolves ../../App
// relative to PsyTool/node_modules/expo/ instead of apps/mobile/.
// Intercept and redirect to the correct App.tsx.
const _resolve = config.resolver.resolveRequest
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === '../../App' &&
    context.originModulePath.includes(`node_modules${path.sep}expo${path.sep}AppEntry`)
  ) {
    return { filePath: path.resolve(__dirname, 'App.tsx'), type: 'sourceFile' }
  }

  if (_resolve) return _resolve(context, moduleName, platform)
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
