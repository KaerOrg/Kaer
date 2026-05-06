const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const config = getDefaultConfig(__dirname)

// In this monorepo, packages hoisted to the root node_modules (zustand,
// @react-navigation/*…) resolve to react@19.2.5, while react-native's renderer
// needs exactly react@19.1.0. Two React copies in the same Metro bundle break
// hook calls. resolveRequest intercepts before normal resolution so every
// require('react') lands on the single 19.1.0 copy in apps/mobile/node_modules.
const reactDir = path.resolve(__dirname, 'node_modules/react')

const REACT_ALIASES = {
  'react': path.join(reactDir, 'index.js'),
  'react/jsx-runtime': path.join(reactDir, 'jsx-runtime.js'),
  'react/jsx-dev-runtime': path.join(reactDir, 'jsx-dev-runtime.js'),
}

const _resolve = config.resolver.resolveRequest
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const alias = REACT_ALIASES[moduleName]
  if (alias) return { filePath: alias, type: 'sourceFile' }
  if (_resolve) return _resolve(context, moduleName, platform)
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
