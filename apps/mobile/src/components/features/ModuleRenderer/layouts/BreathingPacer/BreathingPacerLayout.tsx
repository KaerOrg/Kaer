import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Modal } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  fetchBreathingSessions,
  techniquesFromFields,
  type BreathingSession,
  type BreathingTechnique,
} from '@services/breathingService'
import type { ContentField } from '@services/moduleService'
import { colors, spacing, radius } from '@theme'
import { useTeen } from '../../../../../hooks/useTeen'
import { TechniqueCard } from './TechniqueCard'
import { BreathingExercisePlayer } from './BreathingExercisePlayer'

export interface BreathingPacerLayoutProps {
  fields: ContentField[]
  moduleId: string
}

/**
 * Layout `breathing_pacer` (patient mobile) : liste des techniques de respiration
 * (config lue depuis les fields) + historique des sessions, chaque carte ouvrant
 * le lecteur d'exercice animé dans une modale. Remplace les anciens écrans custom
 * `BreathingTechniquesScreen` / `BreathingExerciseScreen` (issue #19).
 */
export function BreathingPacerLayout({ fields, moduleId }: BreathingPacerLayoutProps) {
  const { t } = useTranslation()
  const { tt } = useTeen()

  const techniques = useMemo(() => techniquesFromFields(fields), [fields])
  const [sessions, setSessions] = useState<BreathingSession[]>([])
  const [activeTechnique, setActiveTechnique] = useState<BreathingTechnique | null>(null)

  const loadSessions = useCallback(() => {
    fetchBreathingSessions()
      .then(setSessions)
      .catch(() => setSessions([]))
  }, [])

  useEffect(() => { loadSessions() }, [loadSessions])

  // Callback stable : la carte reçoit la clé et le rappelle, pas de lambda par carte.
  const handleOpen = useCallback(
    (techniqueKey: string) => {
      const found = techniques.find((tech) => tech.key === techniqueKey)
      if (found) setActiveTechnique(found)
    },
    [techniques]
  )

  // Ferme le lecteur ; si une session a été enregistrée, rafraîchit l'historique.
  const handleCloseExercise = useCallback((saved: boolean) => {
    setActiveTechnique(null)
    if (saved) loadSessions()
  }, [loadSessions])

  // Nombre de sessions par technique (lookup O(1), recalculé quand les sessions changent).
  const sessionCountByKey = useMemo(() => {
    const counts = new Map<string, number>()
    for (const s of sessions) counts.set(s.technique_key, (counts.get(s.technique_key) ?? 0) + 1)
    return counts
  }, [sessions])

  // Lookup O(1) technique par clé pour l'historique.
  const techniqueByKey = useMemo(
    () => new Map(techniques.map((tech) => [tech.key, tech])),
    [techniques]
  )

  const intro = tt(moduleId, 'intro') || t(`modules.${moduleId}.intro_guide`)

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.intro}>{intro}</Text>

        {techniques.map((technique) => (
          <TechniqueCard
            key={technique.key}
            technique={technique}
            moduleId={moduleId}
            sessionCount={sessionCountByKey.get(technique.key) ?? 0}
            onOpen={handleOpen}
          />
        ))}

        {/* Historique récent */}
        {sessions.length > 0 ? (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>{t(`modules.${moduleId}.recent_sessions`)}</Text>
            {sessions.slice(0, 10).map((s) => {
              const tech = techniqueByKey.get(s.technique_key)
              const mins = Math.floor(s.duration_seconds / 60)
              const secs = s.duration_seconds % 60
              const dateLabel = new Date(s.date + 'T00:00:00').toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'short',
              })
              return (
                <View key={s.id} style={styles.historyRow}>
                  <View style={[styles.historyDot, { backgroundColor: tech?.color ?? colors.border }]} />
                  <Text style={styles.historyName}>{tech ? t(`modules.${moduleId}.${tech.key}_name`) : s.technique_key}</Text>
                  <Text style={styles.historyDuration}>
                    {mins > 0 ? `${mins}min ` : ''}{secs > 0 ? `${secs}s` : ''}
                  </Text>
                  <Text style={styles.historyDate}>{dateLabel}</Text>
                </View>
              )
            })}
          </View>
        ) : null}
      </ScrollView>

      <Modal
        visible={activeTechnique != null}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => handleCloseExercise(false)}
      >
        {activeTechnique != null ? (
          <BreathingExercisePlayer technique={activeTechnique} moduleId={moduleId} onClose={handleCloseExercise} />
        ) : null}
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },

  intro: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },

  historySection: { gap: spacing.sm, marginTop: spacing.sm },
  historyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyDot: { width: 8, height: 8, borderRadius: radius.full },
  historyName: { flex: 1, fontSize: 13, color: colors.text },
  historyDuration: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  historyDate: { fontSize: 12, color: colors.textMuted, width: 56, textAlign: 'right' },
})
