// ─── Layout `dual_ruler` — deux échelles 0-10 + saisies + historique ─────────
//
// Motif « entretien motivationnel » : un comportement cible, deux thermomètres
// (importance / confiance) notés de 0 à 10 via RatingSelector, deux justifications
// libres et une phrase d'engagement. Chaque enregistrement est une ligne
// `em_rulers` (persistée + synchronisée par motivationalBalanceService).
// Layout générique : les libellés dérivent du `moduleId` (clés `modules.<id>.rulers_*`),
// jamais d'un module figé.
// Conformité MDR 2017/745 : valeurs brutes saisies par le patient, zéro seuil,
// zéro interprétation, aucune couleur de gravité.

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { Trash2 } from 'lucide-react-native'
import { colors, spacing } from '@theme'
import { Button } from '@ui/Button'
import { Card } from '@ui/Card'
import { InputField } from '@ui/InputField'
import { RatingSelector } from '@ui/RatingSelector'
import { generateId } from '../../../../../lib/database'
import type { EMRuler } from '../../../../../lib/database'
import {
  saveEMRuler, listEMRulers, deleteEMRuler,
} from '../../../../../services/motivationalBalanceService'
import { useModuleTranslation } from '../../../../../hooks/useModuleT'
import { useConfirmDialog } from '../../../../../contexts/ConfirmDialogContext'
import { styles } from './styles'

const RULER_STEPS: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const DEFAULT_ACCENT = '#0EA5E9'

export interface DualRulerLayoutProps {
  /** Identifiant du module — sert à dériver les clés i18n `modules.<id>.rulers_*`. */
  moduleId: string
  /** Couleur d'accent (mode ado). */
  accentColor?: string
}

export function DualRulerLayout({ moduleId, accentColor }: DualRulerLayoutProps) {
  const t = useModuleTranslation()
  const { showConfirm } = useConfirmDialog()
  const accent = accentColor ?? DEFAULT_ACCENT

  const lbl = useCallback((key: string) => t(`modules.${moduleId}.${key}`), [t, moduleId])

  const [behaviorTarget, setBehaviorTarget] = useState('')
  const [importance, setImportance] = useState<number | null>(null)
  const [importanceWhy, setImportanceWhy] = useState('')
  const [confidence, setConfidence] = useState<number | null>(null)
  const [confidenceWhy, setConfidenceWhy] = useState('')
  const [commitment, setCommitment] = useState('')
  const [history, setHistory] = useState<EMRuler[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const loadHistory = useCallback(async () => {
    const rows = await listEMRulers(20)
    setHistory(rows.filter(r => r.importance_score !== null || r.confidence_score !== null))
  }, [])

  useEffect(() => { loadHistory().catch(() => {}) }, [loadHistory])

  const hasData = importance !== null || confidence !== null

  const handleSave = useCallback(async () => {
    if (!hasData) return
    setSaving(true)
    try {
      await saveEMRuler({
        id: generateId(),
        behavior_target: behaviorTarget.trim() || null,
        stage: null,
        importance_score: importance,
        importance_why: importanceWhy.trim() || null,
        confidence_score: confidence,
        confidence_why: confidenceWhy.trim() || null,
        commitment_text: commitment.trim() || null,
      })
      await loadHistory()
      setBehaviorTarget('')
      setImportance(null)
      setImportanceWhy('')
      setConfidence(null)
      setConfidenceWhy('')
      setCommitment('')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }, [hasData, behaviorTarget, importance, importanceWhy, confidence, confidenceWhy, commitment, loadHistory])

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

  const importanceTitleStyle = useMemo(() => [styles.rulerTitle, { color: accent }], [accent])
  const scoreStyle = useMemo(() => [styles.rulerScore, { color: accent }], [accent])

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" testID="dual-ruler-layout">
        <Text style={styles.sectionTitle}>{lbl('rulers_title')}</Text>

        <InputField
          label={lbl('rulers_behavior_label')}
          value={behaviorTarget}
          onChangeText={setBehaviorTarget}
          placeholder={lbl('rulers_behavior_placeholder')}
          testID="rulers-behavior-input"
        />

        {/* Importance */}
        <Card>
          <View style={styles.rulerHeader}>
            <Text style={importanceTitleStyle}>{lbl('rulers_importance')}</Text>
            {importance !== null ? <Text style={scoreStyle}>{importance}/10</Text> : null}
          </View>
          <Text style={styles.rulerQuestion}>{lbl('rulers_importance_q')}</Text>
          <RatingSelector
            label={lbl('rulers_importance')}
            value={importance}
            steps={RULER_STEPS}
            color={accent}
            variant="numbered"
            showHeader={false}
            testIdPrefix="importance-pip"
            onPress={setImportance}
          />
          {importance !== null ? (
            <InputField
              label={lbl('rulers_importance_why_label')}
              value={importanceWhy}
              onChangeText={setImportanceWhy}
              placeholder={lbl('rulers_importance_why_placeholder')}
              multiline
              numberOfLines={3}
              testID="rulers-importance-why"
            />
          ) : null}
        </Card>

        {/* Confiance */}
        <Card>
          <View style={styles.rulerHeader}>
            <Text style={importanceTitleStyle}>{lbl('rulers_confidence')}</Text>
            {confidence !== null ? <Text style={scoreStyle}>{confidence}/10</Text> : null}
          </View>
          <Text style={styles.rulerQuestion}>{lbl('rulers_confidence_q')}</Text>
          <RatingSelector
            label={lbl('rulers_confidence')}
            value={confidence}
            steps={RULER_STEPS}
            color={accent}
            variant="numbered"
            showHeader={false}
            testIdPrefix="confidence-pip"
            onPress={setConfidence}
          />
          {confidence !== null ? (
            <InputField
              label={lbl('rulers_confidence_why_label')}
              value={confidenceWhy}
              onChangeText={setConfidenceWhy}
              placeholder={lbl('rulers_confidence_why_placeholder')}
              multiline
              numberOfLines={3}
              testID="rulers-confidence-why"
            />
          ) : null}
        </Card>

        {/* Engagement */}
        <Card>
          <InputField
            label={lbl('rulers_commitment_label')}
            value={commitment}
            onChangeText={setCommitment}
            placeholder={lbl('rulers_commitment_placeholder')}
            multiline
            numberOfLines={3}
            testID="rulers-commitment-input"
          />
        </Card>

        {saved ? <Text style={styles.savedMsg}>{lbl('rulers_saved')}</Text> : null}

        <Button
          label={lbl('rulers_save')}
          onPress={handleSave}
          disabled={!hasData}
          loading={saving}
          testID="rulers-save-btn"
        />

        {/* Historique */}
        {history.length > 0 ? (
          <>
            <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>{lbl('rulers_history')}</Text>
            {history.map(r => (
              <Card key={r.id}>
                <View style={styles.historyCardHeader}>
                  <Text style={styles.historyDate}>{r.created_at.slice(0, 10)}</Text>
                  <Button
                    variant="ghost"
                    size="sm"
                    iconLeft={<Trash2 size={16} color={colors.textMuted} />}
                    onPress={() => handleDelete(r.id)}
                    accessibilityLabel={t('common.delete')}
                    testID={`ruler-delete-${r.id}`}
                  />
                </View>
                {r.behavior_target ? (
                  <Text style={styles.historyBehavior} numberOfLines={1}>{r.behavior_target}</Text>
                ) : null}
                <View style={styles.historyScores}>
                  {r.importance_score !== null ? (
                    <Text style={[styles.historyScore, { color: accent }]}>
                      {lbl('rulers_importance')} : {r.importance_score}/10
                    </Text>
                  ) : null}
                  {r.confidence_score !== null ? (
                    <Text style={[styles.historyScore, { color: accent }]}>
                      {lbl('rulers_confidence')} : {r.confidence_score}/10
                    </Text>
                  ) : null}
                </View>
                {r.commitment_text ? (
                  <Text style={styles.historyCommitment}>{r.commitment_text}</Text>
                ) : null}
              </Card>
            ))}
          </>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
