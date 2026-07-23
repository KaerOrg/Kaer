import React, { useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Card } from '@ui/Card'
import { colors, spacing, radius } from '@theme'
import type { UnlockedModule } from '@services/homeService'
import { groupModulesByCategory } from './moduleGrouping'
import { ModuleRow } from './ModuleRow'

interface ModuleSectionsProps {
  modules: UnlockedModule[]
  isTeenMode: boolean
  teenColor: (moduleType: string) => string | undefined
  /** Un module est-il ouvrable (écran custom ou non `coming_soon`) ? */
  isAvailable: (mod: UnlockedModule) => boolean
  onModulePress: (mod: UnlockedModule) => void
}

/**
 * Liste des modules débloqués regroupés par catégorie. Chaque groupe = un label
 * de section (uppercase, atténué) + une carte unique dont les lignes de module
 * sont séparées par un filet. Les en-têtes ne s'affichent que s'il y a plusieurs
 * groupes.
 */
export const ModuleSections = React.memo(function ModuleSections({
  modules, isTeenMode, teenColor, isAvailable, onModulePress,
}: ModuleSectionsProps) {
  const { t } = useTranslation()
  const sections = useMemo(() => groupModulesByCategory(modules), [modules])
  const showHeaders = sections.length > 1

  return (
    <View style={styles.container}>
      {sections.map(({ catId, items }) => (
        <View key={catId} style={styles.group}>
          {showHeaders ? <Text style={styles.header}>{t(`category.${catId}.label`)}</Text> : null}
          <Card variant="elevated" style={styles.card}>
            {items.map((mod, index) => (
              <View key={mod.id}>
                {index > 0 ? <View style={styles.divider} /> : null}
                <ModuleRow
                  mod={mod}
                  title={t(`modules.${mod.module_type}.label`)}
                  subtitle={t(`modules.${mod.module_type}.description`)}
                  available={isAvailable(mod)}
                  comingSoonLabel={t('home.coming_soon')}
                  onSelect={onModulePress}
                  accentColor={isTeenMode ? teenColor(mod.module_type) : undefined}
                />
              </View>
            ))}
          </Card>
        </View>
      ))}
    </View>
  )
})

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  group: { gap: spacing.sm },
  header: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginLeft: spacing.xs,
  },
  // Carte de section : conteneur unique, padding annulé (les lignes gèrent le leur),
  // coins arrondis 16 ; les lignes sont séparées par un filet interne.
  card: { borderRadius: radius.lg, padding: 0, gap: 0 },
  divider: { height: 1, backgroundColor: colors.neutral },
})
