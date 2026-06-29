// ─── Layout `stage_wheel` — sélecteur de stade + historique ──────────────────
//
// Motif « où en suis-je ? » : N cartes de stade (modèle transthéorique de
// Prochaska : 6 stades) en sélection exclusive, enregistrées comme lignes
// `em_rulers` (champ `stage`). Layout générique : libellés dérivés du `moduleId`
// (`modules.<id>.stage_*`) et nombre de stades configurable via `stageCount`.
// Conformité MDR 2017/745 : auto-positionnement déclaratif du patient, aucune
// interprétation ni progression imposée, aucune couleur de jugement.

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View, Text, ScrollView } from 'react-native'
import { Trash2 } from 'lucide-react-native'
import { colors, spacing } from '@theme'
import { Button } from '@ui/Button'
import { Card } from '@ui/Card'
import { generateId } from '../../../../../lib/database'
import type { EMRuler } from '../../../../../lib/database'
import {
  saveEMRuler, listEMRulers, deleteEMRuler,
} from '../../../../../services/motivationalBalanceService'
import { useModuleTranslation } from '../../../../../hooks/useModuleT'
import { useConfirmDialog } from '../../../../../contexts/ConfirmDialogContext'
import { styles } from './styles'

const DEFAULT_STAGE_COUNT = 6
const DEFAULT_ACCENT = '#0EA5E9'

export interface StageWheelLayoutProps {
  /** Identifiant du module — sert à dériver les clés i18n `modules.<id>.stage_*`. */
  moduleId: string
  /** Nombre de stades proposés (défaut 6 — Prochaska). */
  stageCount?: number
  /** Couleur d'accent (mode ado). */
  accentColor?: string
}

export function StageWheelLayout({ moduleId, stageCount = DEFAULT_STAGE_COUNT, accentColor }: StageWheelLayoutProps) {
  const t = useModuleTranslation()
  const { showConfirm } = useConfirmDialog()
  const accent = accentColor ?? DEFAULT_ACCENT

  const lbl = useCallback((key: string) => t(`modules.${moduleId}.${key}`), [t, moduleId])
  const stageNumbers = useMemo(
    () => Array.from({ length: stageCount }, (_, i) => i + 1),
    [stageCount]
  )

  const [selected, setSelected] = useState<number | null>(null)
  const [history, setHistory] = useState<EMRuler[]>([])
  const [saving, setSaving] = useState(false)

  const loadHistory = useCallback(async () => {
    const rows = await listEMRulers(20)
    setHistory(rows.filter(r => r.stage !== null))
  }, [])

  useEffect(() => { loadHistory().catch(() => {}) }, [loadHistory])

  const handleSave = useCallback(async () => {
    if (selected === null) return
    setSaving(true)
    try {
      await saveEMRuler({
        id: generateId(),
        behavior_target: null,
        stage: selected,
        importance_score: null,
        importance_why: null,
        confidence_score: null,
        confidence_why: null,
        commitment_text: null,
      })
      await loadHistory()
      setSelected(null)
    } finally {
      setSaving(false)
    }
  }, [selected, loadHistory])

  const handleDelete = useCallback((id: string) => {
    showConfirm({
      title: lbl('rulers_delete_confirm'),
      confirmLabel: t('common.delete'),
      destructive: true,
      onConfirm: async () => {
        await deleteEMRuler(id)
        setHistory(prev => prev.filter(x => x.id !== id))
      },
    })
  }, [showConfirm, lbl, t])

  return (
    <ScrollView contentContainerStyle={styles.content} testID="stage-wheel-layout">
      <Text style={styles.sectionTitle}>{lbl('stage_title')}</Text>
      <Text style={styles.sectionSubtitle}>{lbl('stage_subtitle')}</Text>

      {stageNumbers.map(n => {
        const active = selected === n
        return (
          <Card
            key={n}
            onPress={() => setSelected(n)}
            accentColor={active ? accent : undefined}
            accessibilityLabel={lbl(`stage_${n}`)}
            testID={`stage-card-${n}`}
          >
            <View style={styles.stageRow}>
              <View style={[styles.stageDot, { backgroundColor: active ? accent : colors.border }]} />
              <View style={styles.stageText}>
                <Text style={[styles.stageName, active ? { color: accent } : null]}>{lbl(`stage_${n}`)}</Text>
                <Text style={styles.stageDesc}>{lbl(`stage_${n}_desc`)}</Text>
              </View>
            </View>
          </Card>
        )
      })}

      <Button
        label={lbl('rulers_save')}
        onPress={handleSave}
        disabled={selected === null}
        loading={saving}
        testID="stage-save-btn"
      />

      {history.length > 0 ? (
        <>
          <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>{lbl('stage_history')}</Text>
          {history.map(r => (
            <Card key={r.id}>
              <View style={styles.historyRow}>
                <View style={[styles.stageDotSm, { backgroundColor: accent }]} />
                <Text style={styles.historyLabel}>{lbl(`stage_${r.stage}`)}</Text>
                <Text style={styles.historyDate}>{r.created_at.slice(0, 10)}</Text>
                <Button
                  variant="ghost"
                  size="sm"
                  iconLeft={<Trash2 size={16} color={colors.textMuted} />}
                  onPress={() => handleDelete(r.id)}
                  accessibilityLabel={t('common.delete')}
                  testID={`stage-delete-${r.id}`}
                />
              </View>
            </Card>
          ))}
        </>
      ) : null}
    </ScrollView>
  )
}
