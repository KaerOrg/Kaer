import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useTranslation } from 'react-i18next'
import { Card } from '@ui/Card'
import { IconChip } from '@ui/IconChip'
import { colors, spacing, radius, fonts } from '@theme'

interface CrisisBannerProps {
  onPress: () => void
}

/**
 * Bandeau de crise de l'accueil patient : carte blanche à filet gauche danger,
 * pastille d'icône pleine danger, titre en rouge foncé, sous-titre atténué, chevron.
 *
 * Élément FIXE (affiché dès que le module de crise est débloqué), jamais déclenché
 * ni coloré par une donnée patient : conforme MDR 2017/745 (présent mais non alarmant,
 * pas de rouge plein en fond).
 */
export const CrisisBanner = React.memo(function CrisisBanner({ onPress }: CrisisBannerProps) {
  const { t } = useTranslation()
  return (
    <Card
      onPress={onPress}
      leftAccentColor={colors.danger}
      style={styles.card}
      accessibilityLabel={t('modules.crisis_plan.consultation_title')}
    >
      <View style={styles.row}>
        <IconChip color={colors.danger}>
          <MaterialCommunityIcons name="alert-outline" size={22} color={colors.white} />
        </IconChip>
        <View style={styles.content}>
          <Text style={styles.title}>{t('modules.crisis_plan.consultation_title')}</Text>
          <Text style={styles.subtitle}>{t('home.crisis_subtitle')}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color={colors.danger} />
      </View>
    </Card>
  )
})

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  content: { flex: 1, gap: 2 },
  title: { fontSize: 17, fontWeight: '700', color: colors.dangerText, fontFamily: fonts.serif },
  subtitle: { fontSize: 13, color: colors.textMuted },
})
