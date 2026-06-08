// ─── Layout `crisis_companion` — compagnon de crise (urge surfing) ───────────
//
// Machine à états : accueil + choix de catégorie (un seul écran, pour minimiser
// les taps en crise) → activité + délai → minuteur « vague » → fin neutre.
// Aucune persistance — l'objectif est de traverser une crise en temps réel, pas
// de produire une donnée. Catégories et activités proviennent des fields
// (config-first) ; le minuteur est fixe, choisi par le patient.
// Source : Marlatt (1985), Linehan DBT, Bowen (2014).
// Conformité MDR 2017/745 : minuteur fixe, zéro interprétation, fin neutre.

import { useState, useMemo, useCallback, useEffect } from 'react'
import { View, Text, Pressable, ScrollView } from 'react-native'
import { colors } from '../../../../../theme'
import type { ContentField } from '../../../../../services/moduleService'
import { useModuleT } from '../../../../../hooks/useModuleT'
import { resolvePsyEduIcon } from '../PsyEdu/iconMap'
import { parseDurations, formatCountdown, nextActivityIndex, elapsedFraction } from './crisisLogic'
import { styles } from './styles'

type Mode = 'home' | 'activity' | 'timer' | 'done'

interface CategoryVM {
  key: string
  label: string
  icon: string
  color: string
  activities: string[]
}

export interface CrisisCompanionLayoutProps {
  /** Catégories (chaque section = une catégorie DBT). */
  sections: Map<string, ContentField[]>
  /** Fields hors section : accueil (`exercise_intro`) + config (`exercise_config`). */
  uiFields: ContentField[]
  /** Identifiant du module — sert à dériver les clés i18n du chrome. */
  moduleId: string
  /** Couleur d'accent (teen mode / thème module). */
  accentColor?: string
}

export function CrisisCompanionLayout({ sections, uiFields, moduleId, accentColor }: CrisisCompanionLayoutProps) {
  const t = useModuleT()
  const accent = accentColor ?? colors.primary

  const ui = useCallback((key: string): string => t(`modules.${moduleId}.now.${key}`), [t, moduleId])

  const introTexts = useMemo(
    () =>
      uiFields
        .filter(f => f.field_type === 'exercise_intro')
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(f => ({ id: f.id, text: t(f.text_code ?? '') })),
    [uiFields, t]
  )

  const durations = useMemo(() => {
    const configField = uiFields.find(f => f.field_type === 'exercise_config')
    return parseDurations(configField?.props['durations'])
  }, [uiFields])

  const categories = useMemo<CategoryVM[]>(() => {
    const out: CategoryVM[] = []
    for (const [sectionId, secFields] of sections) {
      const header = secFields.find(f => f.field_type === 'crisis_category')
      if (!header) continue
      const activities = secFields
        .filter(f => f.field_type === 'crisis_activity')
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(f => t(f.text_code ?? ''))
      out.push({
        key: sectionId,
        label: t(header.text_code ?? ''),
        icon: header.props['icon'] ?? 'Waves',
        color: header.props['color'] ?? accent,
        activities,
      })
    }
    return out
  }, [sections, t, accent])

  const [mode, setMode] = useState<Mode>('home')
  const [catIndex, setCatIndex] = useState(0)
  const [actIndex, setActIndex] = useState(0)
  const [durationSec, setDurationSec] = useState(0)
  const [remaining, setRemaining] = useState(0)

  const activeCategory = categories[catIndex]
  const currentActivity = activeCategory?.activities[actIndex] ?? ''

  // Minuteur : décrément 1 s tant qu'on est en mode timer. L'intervalle est créé
  // à l'entrée du mode et nettoyé à la sortie (deps = [mode]).
  useEffect(() => {
    if (mode !== 'timer') return
    const id = setInterval(() => setRemaining(r => (r <= 1 ? 0 : r - 1)), 1000)
    return () => clearInterval(id)
  }, [mode])

  // Fin du minuteur → écran de fin (neutre).
  useEffect(() => {
    if (mode === 'timer' && remaining === 0) setMode('done')
  }, [mode, remaining])

  const handlePickCategory = useCallback((index: number) => {
    setCatIndex(index)
    setActIndex(0)
    setMode('activity')
  }, [])
  const handleAnotherActivity = useCallback(() => {
    const total = categories[catIndex]?.activities.length ?? 0
    setActIndex(prev => nextActivityIndex(prev, total))
  }, [categories, catIndex])
  const handleStartTimer = useCallback((minutes: number) => {
    setDurationSec(minutes * 60)
    setRemaining(minutes * 60)
    setMode('timer')
  }, [])
  const handleHome = useCallback(() => setMode('home'), [])
  const handleHold = useCallback(() => setMode('done'), [])
  const handleStop = useCallback(() => setMode('activity'), [])

  if (categories.length === 0) return null

  // ── Accueil + choix de catégorie (un seul écran) ────────────────────────────
  if (mode === 'home') {
    const WaveIcon = resolvePsyEduIcon('Waves')
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.introCard}>
          <View style={[styles.introIconCircle, { backgroundColor: accent + '1A' }]}>
            <WaveIcon size={36} color={accent} />
          </View>
          <Text style={styles.introTitle}>{ui('title')}</Text>
          {introTexts.map(p => (
            <Text key={p.id} style={styles.introText}>{p.text}</Text>
          ))}
        </View>

        <Text style={styles.sectionLabel}>{ui('pick_category')}</Text>
        {categories.map((cat, index) => {
          const Icon = resolvePsyEduIcon(cat.icon)
          return (
            <Pressable
              key={cat.key}
              style={[styles.categoryCard, { borderLeftColor: cat.color }]}
              onPress={() => handlePickCategory(index)}
              accessibilityRole="button"
              testID={`crisis-category-${cat.key}`}
            >
              <View style={[styles.categoryIconCircle, { backgroundColor: cat.color + '1A' }]}>
                <Icon size={22} color={cat.color} />
              </View>
              <Text style={styles.categoryLabel}>{cat.label}</Text>
            </Pressable>
          )
        })}
      </ScrollView>
    )
  }

  // ── Activité proposée + choix du délai ──────────────────────────────────────
  if (mode === 'activity' && activeCategory) {
    const Icon = resolvePsyEduIcon(activeCategory.icon)
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.activityCard, { borderTopColor: activeCategory.color }]}>
          <View style={styles.activityHead}>
            <View style={[styles.categoryIconCircle, { backgroundColor: activeCategory.color + '1A' }]}>
              <Icon size={20} color={activeCategory.color} />
            </View>
            <Text style={[styles.activityCategoryName, { color: activeCategory.color }]}>{activeCategory.label}</Text>
          </View>
          <Text style={styles.activityText}>{currentActivity}</Text>
          {activeCategory.activities.length > 1 ? (
            <Pressable style={styles.linkBtn} onPress={handleAnotherActivity} accessibilityRole="button">
              <Text style={styles.linkBtnText}>{ui('pick_another')}</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.durationRow}>
          {durations.map(min => (
            <Pressable
              key={min}
              style={[styles.durationBtn, { borderColor: accent }]}
              onPress={() => handleStartTimer(min)}
              accessibilityRole="button"
              testID={`crisis-duration-${min}`}
            >
              <Text style={[styles.durationBtnText, { color: accent }]}>{`${min} ${ui('minutes')}`}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable style={styles.cancelBtn} onPress={handleHome} accessibilityRole="button">
          <Text style={styles.cancelBtnText}>{ui('back')}</Text>
        </Pressable>
      </ScrollView>
    )
  }

  // ── Minuteur « vague » ──────────────────────────────────────────────────────
  if (mode === 'timer') {
    const WaveIcon = resolvePsyEduIcon('Waves')
    const fillWidth = `${Math.round(elapsedFraction(remaining, durationSec) * 100)}%` as const
    return (
      <View style={styles.timerContainer}>
        <View style={[styles.timerWaveCircle, { backgroundColor: accent + '1A' }]}>
          <WaveIcon size={48} color={accent} />
        </View>
        <Text style={[styles.timerCount, { color: accent }]}>{formatCountdown(remaining)}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: fillWidth, backgroundColor: accent }]} />
        </View>
        <Text style={styles.timerCaption}>{ui('timer_caption')}</Text>
        <Pressable style={[styles.primaryBtn, { backgroundColor: accent }]} onPress={handleHold} accessibilityRole="button">
          <Text style={styles.primaryBtnText}>{ui('hold')}</Text>
        </Pressable>
        <Pressable style={styles.cancelBtn} onPress={handleStop} accessibilityRole="button">
          <Text style={styles.cancelBtnText}>{ui('stop')}</Text>
        </Pressable>
      </View>
    )
  }

  // ── Fin (neutre) ────────────────────────────────────────────────────────────
  const HeartIcon = resolvePsyEduIcon('Heart')
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.doneCard}>
        <View style={[styles.introIconCircle, { backgroundColor: colors.success + '1A' }]}>
          <HeartIcon size={36} color={colors.success} />
        </View>
        <Text style={styles.doneTitle}>{ui('done_title')}</Text>
        <Text style={styles.doneText}>{ui('done_text')}</Text>
      </View>
      <Pressable style={[styles.primaryBtn, { backgroundColor: accent }]} onPress={handleHome} accessibilityRole="button">
        <Text style={styles.primaryBtnText}>{ui('finish')}</Text>
      </Pressable>
    </ScrollView>
  )
}
