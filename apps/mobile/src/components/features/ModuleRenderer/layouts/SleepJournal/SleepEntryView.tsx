// Mode « saisie » d'une nuit (sleep_diary). Aligné Consensus Sleep Diary :
// 4 horaires (mise au lit / essai de dormir / dernier réveil / sortie du lit),
// latence, réveils + WASO, siestes, aide au sommeil, cauchemars, qualité, ressenti.
// Possède son propre état de formulaire ; remonte par `onClose` après save/delete/back.
// Conforme MDR : aucune couleur de jugement (efficacité affichée en valeur brute).

import { useState, useCallback, useEffect } from 'react'
import {
  View, Text, Pressable, ScrollView, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { colors } from '../../../../../theme'
import { Button } from '../../../../ui/Button'
import { Card } from '../../../../ui/Card'
import {
  getSleepEntry, computeSleepEfficiency, generateId, type SleepEntry,
} from '../../../../../lib/database'
import { saveSleepEntry, deleteSleepEntry } from '../../../../../services/sleepDiaryService'
import { formatDateFull } from '../../../../../lib/dateUtils'
import { useToast } from '../../../../../contexts/ToastContext'
import { useConfirmDialog } from '../../../../../contexts/ConfirmDialogContext'
import type { Lbl, SleepConfig } from './types'
import { toHHMM, fromHHMM, timeToday, minutesToHhmmHint } from './sleepHelpers'
import { TimeField } from './TimeField'
import { MinutesField } from './MinutesField'
import { StarRating } from './StarRating'
import { styles } from './styles'

interface Props {
  targetDate: string
  lbl: Lbl
  t: (key: string) => string
  config: SleepConfig
  /** Remontée vers la liste (avec rechargement) après save / delete / retour. */
  onClose: () => void
}

export function SleepEntryView({ targetDate, lbl, t, config, onClose }: Props) {
  const { showToast } = useToast()
  const { showConfirm } = useConfirmDialog()

  const [existingId, setExistingId] = useState<string | null>(null)
  const [inBedTime, setInBedTime] = useState<Date>(() => timeToday(22, 45))
  const [bedtime, setBedtime] = useState<Date>(() => timeToday(23, 0))
  const [wakeTime, setWakeTime] = useState<Date>(() => timeToday(7, 0))
  const [outOfBedTime, setOutOfBedTime] = useState<Date>(() => timeToday(7, 15))
  const [onsetMinutes, setOnsetMinutes] = useState(0)
  const [awakenings, setAwakenings] = useState(0)
  const [awakeningsDuration, setAwakeningsDuration] = useState(0)
  const [napMinutes, setNapMinutes] = useState(0)
  const [sleepAid, setSleepAid] = useState(false)
  const [nightmares, setNightmares] = useState(false)
  const [quality, setQuality] = useState<number | null>(null)
  const [restedness, setRestedness] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [showInBedPicker, setShowInBedPicker] = useState(false)
  const [showBedtimePicker, setShowBedtimePicker] = useState(false)
  const [showWakePicker, setShowWakePicker] = useState(false)
  const [showOutOfBedPicker, setShowOutOfBedPicker] = useState(false)

  // Charge l'entrée existante de la nuit ciblée (préremplissage du formulaire).
  useEffect(() => {
    let cancelled = false
    getSleepEntry(targetDate).then(entry => {
      if (cancelled || !entry) return
      setExistingId(entry.id)
      if (entry.in_bed_time) setInBedTime(fromHHMM(entry.in_bed_time))
      if (entry.bedtime) setBedtime(fromHHMM(entry.bedtime))
      if (entry.wake_time) setWakeTime(fromHHMM(entry.wake_time))
      if (entry.out_of_bed_time) setOutOfBedTime(fromHHMM(entry.out_of_bed_time))
      setOnsetMinutes(entry.sleep_onset_minutes ?? 0)
      setAwakenings(entry.awakenings ?? 0)
      setAwakeningsDuration(entry.awakenings_duration_minutes ?? 0)
      setNapMinutes(entry.nap_minutes ?? 0)
      setSleepAid(entry.sleep_aid === 1)
      setNightmares(entry.nightmares === 1)
      setQuality(entry.quality)
      setRestedness(entry.restedness)
      setNotes(entry.notes ?? '')
    }).catch(() => { /* nouvelle saisie : valeurs par défaut */ })
    return () => { cancelled = true }
  }, [targetDate])

  const handleSave = useCallback(async () => {
    if (quality === null) {
      showToast(lbl('quality_missing_msg') || t('common.warning'), 'info')
      return
    }
    setSaving(true)
    try {
      await saveSleepEntry({
        id: existingId ?? generateId(),
        date: targetDate,
        in_bed_time: toHHMM(inBedTime),
        bedtime: toHHMM(bedtime),
        wake_time: toHHMM(wakeTime),
        out_of_bed_time: toHHMM(outOfBedTime),
        sleep_onset_minutes: onsetMinutes,
        awakenings,
        awakenings_duration_minutes: awakeningsDuration,
        nap_minutes: napMinutes,
        sleep_aid: sleepAid ? 1 : 0,
        nightmares: nightmares ? 1 : 0,
        quality,
        restedness,
        notes: notes.trim() || null,
      })
      onClose()
    } catch {
      showToast(t('common.save_error'), 'error')
    } finally {
      setSaving(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quality, existingId, targetDate, inBedTime, bedtime, wakeTime, outOfBedTime, onsetMinutes, awakenings, awakeningsDuration, napMinutes, sleepAid, nightmares, restedness, notes, t, showToast, onClose])

  const handleDelete = useCallback(() => {
    if (!existingId) return
    showConfirm({
      title: lbl('delete_title') || t('common.delete'),
      message: t('common.irreversible'),
      confirmLabel: t('common.delete'),
      destructive: true,
      onConfirm: async () => {
        await deleteSleepEntry(existingId)
        onClose()
      },
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingId, t, showConfirm, onClose])

  const liveSE = computeSleepEfficiency(
    toHHMM(bedtime), toHHMM(wakeTime), onsetMinutes, awakeningsDuration,
    toHHMM(inBedTime), toHHMM(outOfBedTime),
  )

  const onsetConv = minutesToHhmmHint(onsetMinutes)
  const awakDurConv = minutesToHhmmHint(awakeningsDuration)
  const napConv = minutesToHhmmHint(napMinutes)
  const qualityLabels = [1, 2, 3, 4, 5].map(n => lbl(`quality_label_${n}`))
  const restednessLabels = [1, 2, 3, 4, 5].map(n => lbl(`restedness_label_${n}`))
  const saveLabel = existingId ? (lbl('update_label') || t('common.update')) : (lbl('save_label') || t('common.save'))
  const tapModify = lbl('tap_to_modify_hint')
  const minutesUnit = lbl('minutes_unit') || 'min'
  const deleteLabel = lbl('delete_label') || t('common.delete')

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}
      testID="sleep-journal-entry"
    >
      <View style={styles.entryHeaderBar} testID="entry-date-header">
        <Pressable
          onPress={onClose}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel={lbl('back_label') || t('common.back')}
          testID="entry-back-button"
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.entryHeaderTitle}>
          <Text style={styles.dateLabel}>{lbl('date_label')}</Text>
          <Text style={styles.dateValue}>{formatDateFull(targetDate)}</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.entryContent} keyboardShouldPersistTaps="handled">
        {/* Horaires de la nuit (4 horaires CSD + latence) ────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{lbl('section_schedule_title')}</Text>
          <Card variant="elevated">
            <TimeField
              label={lbl('in_bed_label')} value={inBedTime} icon="bed-outline" hint={tapModify}
              show={showInBedPicker} onOpen={() => setShowInBedPicker(true)} onClose={() => setShowInBedPicker(false)}
              onChange={setInBedTime} confirmLabel={lbl('confirm_label') || t('common.ok')} testID="in-bed-btn"
            />
            <View style={styles.divider} />
            <TimeField
              label={lbl('bedtime_label')} value={bedtime} icon="clock-outline" hint={tapModify}
              show={showBedtimePicker} onOpen={() => setShowBedtimePicker(true)} onClose={() => setShowBedtimePicker(false)}
              onChange={setBedtime} confirmLabel={lbl('confirm_label') || t('common.ok')} testID="bedtime-btn"
            />
            <View style={styles.divider} />
            <TimeField
              label={lbl('wake_time_label')} value={wakeTime} icon="clock-outline" hint={tapModify}
              show={showWakePicker} onOpen={() => setShowWakePicker(true)} onClose={() => setShowWakePicker(false)}
              onChange={setWakeTime} confirmLabel={lbl('confirm_label') || t('common.ok')} testID="wake-time-btn"
            />
            <View style={styles.divider} />
            <TimeField
              label={lbl('out_of_bed_label')} value={outOfBedTime} icon="bed-empty" hint={tapModify}
              show={showOutOfBedPicker} onOpen={() => setShowOutOfBedPicker(true)} onClose={() => setShowOutOfBedPicker(false)}
              onChange={setOutOfBedTime} confirmLabel={lbl('confirm_label') || t('common.ok')} testID="out-of-bed-btn"
            />
            <View style={styles.divider} />
            <View style={styles.timeFieldGroup}>
              <Text style={styles.fieldLabel}>{lbl('onset_label')}</Text>
              <MinutesField
                value={onsetMinutes} max={config.onsetMaxMinutes} onChange={setOnsetMinutes}
                unit={minutesUnit} conv={onsetConv} testID="onset-input"
              />
            </View>
          </Card>
        </View>

        {/* Réveils nocturnes ─────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{lbl('section_awakenings_title')}</Text>
          <Card variant="elevated">
            <View style={styles.timeFieldGroup}>
              <Text style={styles.fieldLabel}>{lbl('awakenings_label')}</Text>
              <View style={styles.counterRow}>
                <Pressable
                  style={[styles.counterBtn, awakenings <= 0 && styles.counterBtnDisabled]}
                  onPress={() => awakenings > 0 && setAwakenings(awakenings - 1)}
                  accessibilityRole="button" accessibilityLabel="-" testID="awakenings-minus"
                >
                  <Text style={styles.counterBtnText}>−</Text>
                </Pressable>
                <Text style={styles.counterValue} testID="awakenings-value">{awakenings}</Text>
                <Pressable
                  style={[styles.counterBtn, awakenings >= config.awakeningsMax && styles.counterBtnDisabled]}
                  onPress={() => awakenings < config.awakeningsMax && setAwakenings(awakenings + 1)}
                  accessibilityRole="button" accessibilityLabel="+" testID="awakenings-plus"
                >
                  <Text style={styles.counterBtnText}>+</Text>
                </Pressable>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.timeFieldGroup}>
              <Text style={styles.fieldLabel}>{lbl('awakenings_duration_label')}</Text>
              <MinutesField
                value={awakeningsDuration} max={config.awakDurationMaxMinutes} onChange={setAwakeningsDuration}
                unit={minutesUnit} conv={awakDurConv} testID="awak-duration-input"
              />
            </View>
          </Card>
        </View>

        {/* Siestes ───────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{lbl('section_naps_title')}</Text>
          <Card variant="elevated">
            <View style={styles.timeFieldGroup}>
              <Text style={styles.fieldLabel}>{lbl('nap_label')}</Text>
              <MinutesField
                value={napMinutes} max={config.napMaxMinutes} onChange={setNapMinutes}
                unit={minutesUnit} conv={napConv} testID="nap-input"
              />
            </View>
          </Card>
        </View>

        {/* Aide au sommeil ───────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{lbl('section_sleep_aid_title')}</Text>
          <Card variant="elevated" style={styles.toggleRow} onPress={() => setSleepAid(!sleepAid)} testID="sleep-aid-toggle">
            <View style={styles.toggleLeft}>
              <MaterialCommunityIcons name="pill" size={22} color={sleepAid ? colors.primary : colors.textMuted} />
              <Text style={styles.toggleLabel}>{lbl('sleep_aid_label')}</Text>
            </View>
            <View style={[styles.switchTrack, sleepAid && styles.switchTrackOn]}>
              <View style={[styles.switchThumb, sleepAid && styles.switchThumbOn]} />
            </View>
          </Card>
        </View>

        {/* Cauchemars ────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{lbl('section_nightmares_title')}</Text>
          <Card variant="elevated" style={styles.toggleRow} onPress={() => setNightmares(!nightmares)} testID="nightmares-toggle">
            <View style={styles.toggleLeft}>
              <MaterialCommunityIcons name="ghost" size={22} color={nightmares ? colors.primary : colors.textMuted} />
              <Text style={styles.toggleLabel}>{lbl('nightmares_label')}</Text>
            </View>
            <View style={[styles.switchTrack, nightmares && styles.switchTrackOn]}>
              <View style={[styles.switchThumb, nightmares && styles.switchThumbOn]} />
            </View>
          </Card>
        </View>

        {/* Qualité ───────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{lbl('section_quality_title')}</Text>
          <Card variant="elevated">
            <Text style={styles.fieldLabel}>{lbl('quality_label')}</Text>
            <StarRating count={config.qualityMax} value={quality} onSelect={setQuality} testIdPrefix="quality-star" />
            {quality !== null && qualityLabels[quality - 1] ? (
              <Text style={styles.qualityLabel}>{qualityLabels[quality - 1]}</Text>
            ) : null}
          </Card>
        </View>

        {/* Ressenti au réveil ────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{lbl('section_restedness_title')}</Text>
          <Card variant="elevated">
            <Text style={styles.fieldLabel}>{lbl('restedness_label')}</Text>
            <StarRating count={5} value={restedness} onSelect={setRestedness} icon="weather-sunny" testIdPrefix="restedness-star" />
            {restedness !== null && restednessLabels[restedness - 1] ? (
              <Text style={styles.qualityLabel}>{restednessLabels[restedness - 1]}</Text>
            ) : null}
          </Card>
        </View>

        {/* Notes ─────────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{lbl('section_notes_title')}</Text>
          <Card variant="elevated">
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder={lbl('notes_placeholder')}
              placeholderTextColor={colors.textMuted}
              multiline numberOfLines={4} textAlignVertical="top"
              testID="notes-input"
            />
          </Card>
        </View>

        {liveSE !== null ? (
          <View style={styles.seCard} testID="sleep-efficiency">
            <View style={styles.seRow}>
              <MaterialCommunityIcons name="sleep" size={20} color={colors.primary} />
              <Text style={styles.seTitle}>{lbl('efficiency_label')}</Text>
              <Text style={styles.seScore}>{liveSE} %</Text>
            </View>
          </View>
        ) : null}

        <Button label={saving ? '…' : saveLabel} onPress={handleSave} loading={saving} testID="save-button"
          iconLeft={<MaterialCommunityIcons name="check" size={20} color={colors.white} />} />
        {existingId ? (
          <Button label={deleteLabel} onPress={handleDelete} variant="danger" testID="delete-button" />
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
