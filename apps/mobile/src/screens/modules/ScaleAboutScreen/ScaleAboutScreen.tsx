// ─── Fiche « à propos » d'une échelle (#415, Q-11) ───────────────────────────
//
// Quatre blocs : ce que c'est, ce que ça n'est pas, qui voit quoi, et un renvoi
// discret vers le plan de sécurité. Puis la note portée par l'instrument, et la
// mention de source en pied.
//
// ⚠️ MDR 2017/745 : rien sur cet écran ne dépend d'une réponse du patient. La note sur
// l'item 9 est AFFICHÉE EN PERMANENCE et jamais déclenchée : reproduire cette phrase,
// c'est citer l'outil ; la conditionner à une réponse serait produire une
// interprétation. Aucun score, aucune couleur d'alerte, aucun seuil.
//
// La seule condition d'affichage est le renvoi vers le plan de sécurité, présent si et
// seulement si `crisis_plan` est attribué : propriété de l'ATTRIBUTION, pas une donnée
// saisie. Même doctrine qu'en #411, et absent plutôt que grisé.

import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useTranslation } from 'react-i18next'
import { readScaleSource } from '@kaer/shared'
import { Card } from '@ui/Card'
import { colors } from '@theme'
import { AppStackParamList } from '../../../navigation/AppStack'
import { fetchModuleFields, type ContentField } from '@services/moduleService'
import { fetchUnlockedModules } from '@services/homeService'
import { useAuthStore } from '../../../store/authStore'
import { SourceCitation } from '../../../components/features/SourceCitation'
import { AboutBlock } from './AboutBlock'
import { styles } from './styles'

type Nav = NativeStackNavigationProp<AppStackParamList>
type RouteT = RouteProp<AppStackParamList, 'ScaleAbout'>

const SAFETY_MODULE = 'crisis_plan'

export default function ScaleAboutScreen() {
  const navigation = useNavigation<Nav>()
  const { params } = useRoute<RouteT>()
  const { scale_id } = params
  const { t } = useTranslation()
  const patient = useAuthStore(s => s.patient)

  const [fields, setFields] = useState<ContentField[]>([])
  const [planUnlocked, setPlanUnlocked] = useState<boolean | null>(null)

  useEffect(() => {
    navigation.setOptions({ title: t(`modules.${scale_id}.label`) })
  }, [navigation, t, scale_id])

  useEffect(() => {
    let active = true
    fetchModuleFields(scale_id)
      .then(result => { if (active) setFields(result.fields) })
      .catch(() => { if (active) setFields([]) })
    return () => { active = false }
  }, [scale_id])

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

  const handleOpenPlan = useCallback(() => {
    navigation.navigate('ModuleContent', { moduleType: SAFETY_MODULE })
  }, [navigation])

  const clinician = t('common.your_clinician')
  const source = readScaleSource(fields)

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>

        <AboutBlock
          title={t('modules.scale_about.what_title')}
          body={t(`modules.${scale_id}.about_what`)}
        />
        <AboutBlock
          title={t('modules.scale_about.not_title')}
          body={t(`modules.${scale_id}.about_not`)}
        />
        <AboutBlock
          title={t('modules.scale_about.who_title')}
          body={t(`modules.${scale_id}.about_who`, { name: clinician })}
        />

        {/* Note portée par l'instrument : citée mot pour mot, jamais déclenchée. */}
        <Card variant="default" style={styles.note} testID="instrument-note">
          <Text style={styles.noteText}>{t(`modules.${scale_id}.about_instrument_note`)}</Text>
        </Card>

        {planUnlocked === true ? (
          <Card
            onPress={handleOpenPlan}
            style={styles.planCard}
            accessibilityLabel={t('modules.scale_about.plan_action')}
            testID="about-plan-link"
          >
            <View style={styles.planText}>
              <Text style={styles.planLead}>{t('modules.scale_about.plan_lead')}</Text>
              <Text style={styles.planAction}>{t('modules.scale_about.plan_action')}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
          </Card>
        ) : null}

        {/* Pied technique : la mention de source du composant de Q-13, jamais une
            chaîne écrite ici. C'est aussi le seul endroit de la fiche où le sigle de
            la recommandation peut apparaître, pour qui le cherche. */}
        <View style={styles.footer}>
          <SourceCitation
            citation={source.citation}
            translationAttribution={source.translationAttribution}
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}
