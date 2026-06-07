const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')
const workspaceNodeModules = path.resolve(workspaceRoot, 'node_modules')

const config = getDefaultConfig(projectRoot)

// Monorepo npm workspaces : Metro doit surveiller la racine et résoudre les
// dépendances hoistées dans node_modules de la racine.
config.watchFolders = [workspaceRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  workspaceNodeModules,
]

const _resolve = config.resolver.resolveRequest
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // expo is hoisted to the monorepo root, so AppEntry.js resolves ../../App
  // relative to Kær/node_modules/expo/ instead of apps/mobile/.
  // Intercept and redirect to the correct App.tsx.
  if (
    moduleName === '../../App' &&
    context.originModulePath.includes(`node_modules${path.sep}expo${path.sep}AppEntry`)
  ) {
    return { filePath: path.resolve(projectRoot, 'App.tsx'), type: 'sourceFile' }
  }

  // React singleton — UNE seule copie de React pour toute l'app.
  // Sans ça, un fichier de apps/mobile/src résout `react` depuis
  // apps/mobile/node_modules (si une copie y traîne) tandis que react-native
  // (à la racine) résout la copie racine. Deux instances de React = le
  // dispatcher de hooks est null pour les composants de l'app → crash
  // "Cannot read property 'useState' of null". On force toujours la copie racine.
  if (moduleName === 'react' || moduleName.startsWith('react/')) {
    return {
      type: 'sourceFile',
      filePath: require.resolve(moduleName, { paths: [workspaceNodeModules] }),
    }
  }

  if (_resolve) return _resolve(context, moduleName, platform)
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
