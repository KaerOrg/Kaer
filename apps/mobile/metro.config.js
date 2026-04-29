const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname

const config = getDefaultConfig(projectRoot)

// Monorepo deduplication: apps/mobile has react@19.1.0 while root
// node_modules has react@19.2.5 (pulled in by react-dom).
// The react-native renderer bundled in react-native is compiled for 19.1.0
// and requires an EXACT version match.
// resolveRequest intercepts every import and forces all 'react' to 19.1.0.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react' || moduleName.startsWith('react/')) {
    const resolved = require.resolve(moduleName, {
      paths: [projectRoot],
    })
    return { filePath: resolved, type: 'sourceFile' }
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
