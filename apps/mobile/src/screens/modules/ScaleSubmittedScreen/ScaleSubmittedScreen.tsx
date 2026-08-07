// ─── Écran d'après-envoi d'une échelle (#411, Q-7) ───────────────────────────
//
// Le seul défaut de l'Epic PHQ-9 qui touche la sécurité patient. Avant lui, quelqu'un
// qui répondait « presque tous les jours » à la question sur les pensées de mort, seul,
// à 23 h, obtenait la FERMETURE DE L'ÉCRAN, alors que son plan de sécurité vit dans la
// même application.
//
// Ce que dit la preuve, et pourquoi cet écran est fait ainsi :
//   - l'item 9 ne permet pas de CONCLURE : sa valeur prédictive positive contre le
//     C-SSRS est de 28,6 % (Na, J Affect Disord 2018, n = 841) ;
//   - mais il interdit de NE RIEN FAIRE : sur 939 268 PHQ-9, une réponse « presque tous
//     les jours » multiplie par 5 à 8 le risque de tentative et par 3 à 11 celui de
//     mourir par suicide dans les 30 jours (Rossom, J Affect Disord 2017) ;
//   - et poser la question n'est pas iatrogène (Dazzi 2014, Gould 2005, Blades 2018).
//
// ⚠️ CONFORMITÉ MDR 2017/745, et c'est ce qui rend cet écran licite : les MÊMES
// ressources fixes, à TOUT LE MONDE, à CHAQUE envoi, SANS LIRE UNE SEULE RÉPONSE.
// Aucun calcul, aucune condition sur une donnée patient : c'est le statut d'un numéro
// d'urgence en pied de page. L'écran conditionné par l'item 9 a été abandonné pour
// cette raison exacte, il aurait fait de Kær un dispositif médical, et vu le risque
// en jeu, pas même en classe IIa.
//
// L'écran ne reçoit donc PAS les réponses : sa seule prop de route est `scale_id`.

import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useTranslation } from 'react-i18next'
import { Button } from '@ui/Button'
import { colors } from '@theme'
import { AppStackParamList } from '../../../navigation/AppStack'
import { fetchModuleFields, type ContentField } from '@services/moduleService'
import { fetchUnlockedModules } from '@services/homeService'
import { useAuthStore } from '../../../store/authStore'
import { CrisisEmergencyCalls } from '../../../components/features/ModuleRenderer/layouts/shared/CrisisEmergencyCalls'
import { SafetyPlanTile } from './SafetyPlanTile'
import { styles } from './styles'

type Nav = NativeStackNavigationProp<AppStackParamList>
type RouteT = RouteProp<AppStackParamList, 'ScaleSubmitted'>

/**
 * Module qui porte les ressources d'urgence en base. Elles y sont semées une seule
 * fois : les recopier sur chaque module qui veut les afficher dupliquerait trois
 * numéros de secours dans la configuration, avec le risque qu'ils divergent.
 */
const SAFETY_MODULE = 'crisis_plan'

const CHECK_ICON = <MaterialCommunityIcons name="check" size={24} color={colors.textMuted} />

export default function ScaleSubmittedScreen() {
  const navigation = useNavigation<Nav>()
  const { params } = useRoute<RouteT>()
  const { scale_id } = params
  const { t } = useTranslation()
  const patient = useAuthStore(s => s.patient)

  const [safetyFields, setSafetyFields] = useState<ContentField[]>([])
  // Le plan est-il attribué à ce patient ? Propriété de l'ATTRIBUTION, pas une donnée
  // saisie : conditionner là-dessus reste licite (même raisonnement structurel que
  // `initialPreviewKind`). `null` tant qu'on ne sait pas : on n'affiche rien.
  const [planUnlocked, setPlanUnlocked] = useState<boolean | null>(null)

  useEffect(() => {
    let active = true
    fetchModuleFields(SAFETY_MODULE)
      .then(result => { if (active) setSafetyFields(result.fields) })
      .catch(() => { if (active) setSafetyFields([]) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    if (patient?.id == null) { setPlanUnlocked(false); return }
    fetchUnlockedModules(patient.id)
      .then(modules => {
        if (active) setPlanUnlocked(modules.some(m => m.module_type === SAFETY_MODULE))
      })
      .catch(() => { if (active) setPlanUnlocked(false) })
    return () => { active = false }
  }, [patient?.id])

  const handleDone = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  const handleOpenPlan = useCallback(() => {
    navigation.navigate('ModuleContent', { moduleType: SAFETY_MODULE })
  }, [navigation])

  const clinician = t('common.your_clinician')

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>

        {/* ── Confirmation : c'est parti, et qui le verra ─────────── */}
        <View style={styles.checkChip}>{CHECK_ICON}</View>
        <Text style={styles.title}>{t('modules.scale_submitted.title')}</Text>
        <Text style={styles.subtitle}>
          {t('modules.scale_submitted.seen_by', { name: clinician })}
        </Text>

        {/* ── Ressources, SOUS la confirmation ────────────────────── */}
        <View style={styles.separator} />
        <Text style={styles.resourcesHint}>{t('modules.scale_submitted.resources_hint')}</Text>

        <View style={styles.resources}>
          {planUnlocked === true ? (
            <SafetyPlanTile
              title={t('modules.scale_submitted.plan_title')}
              subtitle={t('modules.scale_submitted.plan_subtitle')}
              onPress={handleOpenPlan}
            />
          ) : null}
          {/* Le composant de #318, en densité `full` : un seul rendu des secours dans
              toute l'app, et le 114 y part bien en `sms:`. */}
          <CrisisEmergencyCalls fields={safetyFields} density="full" />
        </View>

        <View style={styles.footer}>
          <Button label={t('modules.scale_submitted.done')} onPress={handleDone} testID={`submitted-done-${scale_id}`} />
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}
