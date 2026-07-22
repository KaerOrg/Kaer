import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Modal } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useTranslation } from 'react-i18next'
import { Button } from '@ui/Button'
import { EmptyState } from '@ui/EmptyState'
import { colors, spacing, radius } from '@theme'
import { useTeen } from '../../../../../hooks/useTeen'
import {
  fetchDefusionSessions,
  enabledTechniquesFromConfig,
  type DefusionSession,
  type DefusionTechnique,
} from '@services/defusionService'
import { TechniqueEntryCard } from './TechniqueEntryCard'
import { DefusionReader } from './DefusionReader'
import { DefusionHistory } from './DefusionHistory'

export interface DefusionLayoutProps {
  moduleId: string
  accentColor?: string
  patientConfig?: Record<string, unknown> | null
}

const RECENT_COUNT = 3

/**
 * Layout `defusion` (patient mobile) — accueil du module « Décrocher d'une pensée ».
 * Technique principale dominante (seul bouton plein), technique(s) secondaire(s) à
 * chevron, 3 dernières séances + accès à l'historique complet. N'affiche que les
 * techniques activées par le praticien (`config.enabled_techniques`) ; l'historique
 * garde les séances des techniques désactivées.
 */
export function DefusionLayout({ moduleId, accentColor, patientConfig }: DefusionLayoutProps) {
  const { isTeenMode } = useTeen()
  const { t, i18n } = useTranslation(isTeenMode ? ['teen', 'common'] : 'common')
  const mk = useCallback((key: string) => `modules.${moduleId}.${key}`, [moduleId])

  // Accent : teinte teen si mode ado, sinon la couleur primaire de l'app.
  const accent = accentColor ?? colors.primary
  const enabled = useMemo(() => enabledTechniquesFromConfig(patientConfig ?? null), [patientConfig])
  const [primaryTech, ...secondaryTechs] = enabled

  const [sessions, setSessions] = useState<DefusionSession[]>([])
  const [activeTechnique, setActiveTechnique] = useState<DefusionTechnique | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  const loadSessions = useCallback(() => {
    fetchDefusionSessions().then(setSessions).catch(() => setSessions([]))
  }, [])
  useEffect(() => { loadSessions() }, [loadSessions])

  const handleOpen = useCallback((technique: DefusionTechnique) => setActiveTechnique(technique), [])

  const handleCloseReader = useCallback(() => {
    setActiveTechnique(null)
    loadSessions()
  }, [loadSessions])

  const handleCloseHistory = useCallback(() => setShowHistory(false), [])
  const openHistory = useCallback(() => setShowHistory(true), [])

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.intro}>{t(mk('intro'))}</Text>

        {primaryTech ? (
          <TechniqueEntryCard technique={primaryTech} moduleId={moduleId} accent={accent} variant="primary" onOpen={handleOpen} />
        ) : null}
        {secondaryTechs.map((technique) => (
          <TechniqueEntryCard key={technique} technique={technique} moduleId={moduleId} accent={accent} variant="secondary" onOpen={handleOpen} />
        ))}

        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>{t(mk('recent_sessions'))}</Text>
          {sessions.length === 0 ? (
            <EmptyState
              icon={<MaterialCommunityIcons name="notebook-outline" size={40} color={colors.textMuted} />}
              title={t(mk('empty_title'))}
              description={t(mk('empty_body'))}
            />
          ) : (
            <>
              {sessions.slice(0, RECENT_COUNT).map((s) => {
                const color = s.technique === 'word_repetition' ? accent : colors.textMuted
                const dateLabel = new Date(s.created_at).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' })
                return (
                  <View key={s.id} style={styles.recentRow}>
                    <View style={[styles.dot, { backgroundColor: color }]} />
                    <Text style={styles.recentName}>{t(mk(`technique_${s.technique}_name`))}</Text>
                    {s.duration_seconds > 0 ? <Text style={styles.recentMeta}>{s.duration_seconds}s</Text> : null}
                    <Text style={styles.recentDate}>{dateLabel}</Text>
                  </View>
                )
              })}
              <Button variant="ghost" size="sm" label={t(mk('see_all_history'))} onPress={openHistory} />
            </>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={activeTechnique != null}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleCloseReader}
      >
        {activeTechnique != null ? (
          <DefusionReader technique={activeTechnique} moduleId={moduleId} accent={accent} onClose={handleCloseReader} />
        ) : null}
      </Modal>

      <Modal
        visible={showHistory}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleCloseHistory}
      >
        <DefusionHistory sessions={sessions} moduleId={moduleId} accent={accent} onClose={handleCloseHistory} />
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  intro: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  historySection: { gap: spacing.sm, marginTop: spacing.sm },
  historyTitle: {
    fontSize: 12, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  recentRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  dot: { width: 8, height: 8, borderRadius: radius.full },
  recentName: { flex: 1, flexShrink: 1, fontSize: 13, color: colors.text },
  recentMeta: { fontSize: 12, color: colors.textMuted },
  recentDate: { fontSize: 12, color: colors.textMuted, width: 56, textAlign: 'right' },
})
