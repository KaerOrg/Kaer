import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import HomeScreen from '../screens/HomeScreen'
import ProfileScreen from '../screens/ProfileScreen'
import SleepDiaryScreen from '../screens/modules/SleepDiaryScreen'
import SleepDiaryEntryScreen from '../screens/modules/SleepDiaryEntryScreen'
import SleepDiaryMonthScreen from '../screens/modules/SleepDiaryMonthScreen'
import CrisisPlanScreen from '../screens/modules/CrisisPlanScreen'
import DecisionalBalanceScreen from '../screens/modules/DecisionalBalanceScreen'
import BeckColumnsScreen from '../screens/modules/BeckColumnsScreen'
import BeckEntryScreen from '../screens/modules/BeckEntryScreen'
import MoodTrackerScreen from '../screens/modules/MoodTrackerScreen'
import MedicationAdherenceScreen from '../screens/modules/MedicationAdherenceScreen'
import MedicationSideEffectsScreen from '../screens/modules/MedicationSideEffectsScreen'
import FearThermometerScreen from '../screens/modules/FearThermometerScreen'
import FearEntryScreen from '../screens/modules/FearEntryScreen'
import BehavioralActivationScreen from '../screens/modules/BehavioralActivationScreen'
import BehavioralActivationEntryScreen from '../screens/modules/BehavioralActivationEntryScreen'
import BreathingTechniquesScreen from '../screens/modules/BreathingTechniquesScreen'
import BreathingExerciseScreen from '../screens/modules/BreathingExerciseScreen'
import RimScreen from '../screens/modules/RimScreen'
import GroundingScreen from '../screens/modules/GroundingScreen'
import GroundingLearnScreen from '../screens/modules/GroundingLearnScreen'
import CognitiveSaturationScreen from '../screens/modules/CognitiveSaturationScreen'
import CognitiveSaturationExerciseScreen from '../screens/modules/CognitiveSaturationExerciseScreen'
import EmotionWheelScreen from '../screens/modules/EmotionWheelScreen'
import EmotionEntryScreen from '../screens/modules/EmotionEntryScreen'
import EmotionMonthScreen from '../screens/modules/EmotionMonthScreen'
import PHQ9Screen from '../screens/modules/PHQ9Screen'
import PHQ9EntryScreen from '../screens/modules/PHQ9EntryScreen'
import BSL23Screen from '../screens/modules/BSL23Screen'
import BSL23EntryScreen from '../screens/modules/BSL23EntryScreen'
import GAD7Screen from '../screens/modules/GAD7Screen'
import GAD7EntryScreen from '../screens/modules/GAD7EntryScreen'
import RCADS25Screen from '../screens/modules/RCADS25Screen'
import RCADS25EntryScreen from '../screens/modules/RCADS25EntryScreen'
import EPDSScreen from '../screens/modules/EPDSScreen'
import EPDSEntryScreen from '../screens/modules/EPDSEntryScreen'
import NSIScreen from '../screens/modules/NSIScreen'
import NSIEntryScreen from '../screens/modules/NSIEntryScreen'
import SNAPIVScreen from '../screens/modules/SNAPIVScreen'
import SNAPIVEntryScreen from '../screens/modules/SNAPIVEntryScreen'
import ASRS6Screen from '../screens/modules/ASRS6Screen'
import ASRS6EntryScreen from '../screens/modules/ASRS6EntryScreen'
import ASRS18Screen from '../screens/modules/ASRS18Screen'
import ASRS18EntryScreen from '../screens/modules/ASRS18EntryScreen'
import DietWeightPsychoScreen from '../screens/modules/DietWeightPsychoScreen'
import DietWeightPsychoDetailScreen from '../screens/modules/DietWeightPsychoDetailScreen'
import ChronoBioScreen from '../screens/modules/ChronoBioScreen'
import ChronoBioDetailScreen from '../screens/modules/ChronoBioDetailScreen'
import ChronoBioEntryScreen from '../screens/modules/ChronoBioEntryScreen'
import ChronoBioMonthScreen from '../screens/modules/ChronoBioMonthScreen'
import DistressToleranceScreen from '../screens/modules/DistressToleranceScreen'
import DistressToleranceDetailScreen from '../screens/modules/DistressToleranceDetailScreen'
import PsyEduModuleScreen from '../screens/modules/PsyEduModuleScreen'
import { getTechnique } from '../constants/breathingTechniques'
import { colors } from '../theme'

function getTechniqueTitle(key: string): string {
  return getTechnique(key)?.name ?? 'Exercice de respiration'
}

export type AppStackParamList = {
  Tabs: undefined
  SleepDiary: undefined
  SleepDiaryEntry: { date?: string }
  SleepDiaryMonth: undefined
  CrisisPlan: undefined
  DecisionalBalance: undefined
  BeckColumns: undefined
  BeckEntry: { recordId?: string }
  MoodTracker: undefined
  MedicationAdherence: undefined
  MedicationSideEffects: undefined
  FearThermometer: undefined
  FearEntry: { entryId?: string }
  BehavioralActivation: undefined
  BehavioralActivationEntry: { recordId?: string }
  BreathingTechniques: undefined
  BreathingExercise: { techniqueKey: string }
  Rim: undefined
  Grounding: undefined
  GroundingLearn: undefined
  CognitiveSaturation: undefined
  CognitiveSaturationExercise: undefined
  EmotionWheel: undefined
  EmotionEntry: undefined
  EmotionMonth: undefined
  PHQ9: undefined
  PHQ9Entry: { entryId?: string }
  BSL23: undefined
  BSL23Entry: { entryId?: string }
  GAD7: undefined
  GAD7Entry: { entryId?: string }
  RCADS25: undefined
  RCADS25Entry: { entryId?: string }
  EPDS: undefined
  EPDSEntry: { entryId?: string }
  NSI: undefined
  NSIEntry: {}
  SNAPIV: undefined
  SNAPIVEntry: {}
  ASRS6: undefined
  ASRS6Entry: {}
  ASRS18: undefined
  ASRS18Entry: {}
  PsyEduModule: { moduleKey: string }
  DietWeightPsycho: undefined
  DietWeightPsychoDetail: { topicId: string; topicTitle: string }
  ChronoBio: undefined
  ChronoBioDetail: { topicId: string; topicTitle: string }
  ChronoBioEntry: { date: string }
  ChronoBioMonth: undefined
  DistressTolerance: undefined
  DistressToleranceDetail: { topicId: string; topicTitle: string }
}

export type TabParamList = {
  Home: undefined
  Profile: undefined
}

const Stack = createNativeStackNavigator<AppStackParamList>()
const Tab = createBottomTabNavigator<TabParamList>()

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { borderTopColor: colors.border, backgroundColor: colors.card },
        tabBarIcon: ({ focused, color, size }) => {
          const iconName =
            route.name === 'Home'
              ? focused
                ? 'grid'
                : 'grid-outline'
              : focused
              ? 'person'
              : 'person-outline'
          return <Ionicons name={iconName as never} size={size} color={color} />
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Modules' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil' }} />
    </Tab.Navigator>
  )
}

export default function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: colors.primary,
        headerStyle: { backgroundColor: colors.card },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="SleepDiary"
        component={SleepDiaryScreen}
        options={{ title: 'Agenda du sommeil' }}
      />
      <Stack.Screen
        name="SleepDiaryEntry"
        component={SleepDiaryEntryScreen}
        options={{ title: 'Saisir ma nuit' }}
      />
      <Stack.Screen
        name="SleepDiaryMonth"
        component={SleepDiaryMonthScreen}
        options={{ title: 'Vue mensuelle' }}
      />
      <Stack.Screen
        name="CrisisPlan"
        component={CrisisPlanScreen}
        options={{ title: 'Plan de crise' }}
      />
      <Stack.Screen
        name="DecisionalBalance"
        component={DecisionalBalanceScreen}
        options={{ title: 'Balance décisionnelle' }}
      />
      <Stack.Screen
        name="BeckColumns"
        component={BeckColumnsScreen}
        options={{ title: 'Colonnes de Beck' }}
      />
      <Stack.Screen
        name="BeckEntry"
        component={BeckEntryScreen}
        options={({ route }) => ({
          title: route.params?.recordId ? 'Modifier l\'enregistrement' : 'Nouvel enregistrement',
        })}
      />
      <Stack.Screen
        name="MoodTracker"
        component={MoodTrackerScreen}
        options={{ title: 'Thermomètre de l\'humeur' }}
      />
      <Stack.Screen
        name="MedicationAdherence"
        component={MedicationAdherenceScreen}
        options={{ title: 'Observance du traitement' }}
      />
      <Stack.Screen
        name="MedicationSideEffects"
        component={MedicationSideEffectsScreen}
        options={{ title: 'Effets du traitement' }}
      />
      <Stack.Screen
        name="FearThermometer"
        component={FearThermometerScreen}
        options={{ title: 'Thermomètre de la peur' }}
      />
      <Stack.Screen
        name="FearEntry"
        component={FearEntryScreen}
        options={({ route }) => ({
          title: route.params?.entryId ? 'Modifier la saisie' : 'Nouvelle saisie SUDs',
        })}
      />
      <Stack.Screen
        name="BehavioralActivation"
        component={BehavioralActivationScreen}
        options={{ title: 'Activation comportementale' }}
      />
      <Stack.Screen
        name="BehavioralActivationEntry"
        component={BehavioralActivationEntryScreen}
        options={({ route }) => ({
          title: route.params?.recordId ? 'Modifier l\'activité' : 'Nouvelle activité',
        })}
      />
      <Stack.Screen
        name="BreathingTechniques"
        component={BreathingTechniquesScreen}
        options={{ title: 'Techniques de respiration' }}
      />
      <Stack.Screen
        name="BreathingExercise"
        component={BreathingExerciseScreen}
        options={({ route }) => ({
          title: getTechniqueTitle(route.params.techniqueKey),
        })}
      />
      <Stack.Screen
        name="Rim"
        component={RimScreen}
        options={{ title: 'RIM — Imagerie mentale' }}
      />
      <Stack.Screen
        name="Grounding"
        component={GroundingScreen}
        options={{ title: 'Ancrage 5-4-3-2-1' }}
      />
      <Stack.Screen
        name="GroundingLearn"
        component={GroundingLearnScreen}
        options={{ title: 'Pourquoi ça fonctionne ?' }}
      />
      <Stack.Screen
        name="CognitiveSaturation"
        component={CognitiveSaturationScreen}
        options={{ title: 'Saturation cognitive' }}
      />
      <Stack.Screen
        name="CognitiveSaturationExercise"
        component={CognitiveSaturationExerciseScreen}
        options={{ title: 'Exercice de saturation' }}
      />
      <Stack.Screen
        name="EmotionWheel"
        component={EmotionWheelScreen}
        options={{ title: 'Roue des émotions' }}
      />
      <Stack.Screen
        name="EmotionEntry"
        component={EmotionEntryScreen}
        options={{ title: 'Identifier une émotion' }}
      />
      <Stack.Screen
        name="EmotionMonth"
        component={EmotionMonthScreen}
        options={{ title: 'Bilan mensuel' }}
      />
      <Stack.Screen
        name="PHQ9"
        component={PHQ9Screen}
        options={{ title: 'PHQ-9' }}
      />
      <Stack.Screen
        name="PHQ9Entry"
        component={PHQ9EntryScreen}
        options={{ title: 'Nouveau PHQ-9' }}
      />
      <Stack.Screen
        name="BSL23"
        component={BSL23Screen}
        options={{ title: 'BSL-23' }}
      />
      <Stack.Screen
        name="BSL23Entry"
        component={BSL23EntryScreen}
        options={{ title: 'Nouveau BSL-23' }}
      />
      <Stack.Screen
        name="GAD7"
        component={GAD7Screen}
        options={{ title: 'GAD-7' }}
      />
      <Stack.Screen
        name="GAD7Entry"
        component={GAD7EntryScreen}
        options={{ title: 'Nouveau GAD-7' }}
      />
      <Stack.Screen
        name="RCADS25"
        component={RCADS25Screen}
        options={{ title: 'RCADS-25' }}
      />
      <Stack.Screen
        name="RCADS25Entry"
        component={RCADS25EntryScreen}
        options={{ title: 'Nouveau RCADS-25' }}
      />
      <Stack.Screen
        name="EPDS"
        component={EPDSScreen}
        options={{ title: 'EPDS' }}
      />
      <Stack.Screen
        name="EPDSEntry"
        component={EPDSEntryScreen}
        options={{ title: 'Nouveau EPDS' }}
      />
      <Stack.Screen
        name="NSI"
        component={NSIScreen}
        options={{ title: 'NSI' }}
      />
      <Stack.Screen
        name="NSIEntry"
        component={NSIEntryScreen}
        options={{ title: 'Nouveau NSI' }}
      />
      <Stack.Screen
        name="SNAPIV"
        component={SNAPIVScreen}
        options={{ title: 'SNAP-IV' }}
      />
      <Stack.Screen
        name="SNAPIVEntry"
        component={SNAPIVEntryScreen}
        options={{ title: 'Nouveau SNAP-IV' }}
      />
      <Stack.Screen
        name="ASRS6"
        component={ASRS6Screen}
        options={{ title: 'ASRS v1.1 — Dépistage' }}
      />
      <Stack.Screen
        name="ASRS6Entry"
        component={ASRS6EntryScreen}
        options={{ title: 'Nouveau ASRS v1.1' }}
      />
      <Stack.Screen
        name="ASRS18"
        component={ASRS18Screen}
        options={{ title: 'ASRS v1.1 — Bilan Complet' }}
      />
      <Stack.Screen
        name="ASRS18Entry"
        component={ASRS18EntryScreen}
        options={{ title: 'Nouveau ASRS v1.1 — Bilan' }}
      />
      <Stack.Screen
        name="PsyEduModule"
        component={PsyEduModuleScreen}
        options={({ route }) => ({
          title: route.params.moduleKey === 'psyedu_sleep'
            ? 'Sommeil & récupération'
            : route.params.moduleKey === 'psyedu_nutrition'
            ? 'Alimentation & cerveau'
            : route.params.moduleKey === 'psyedu_activity'
            ? 'Activité physique douce'
            : 'Distorsions cognitives',
        })}
      />
      <Stack.Screen
        name="DietWeightPsycho"
        component={DietWeightPsychoScreen}
        options={{ title: 'Psychotropes & alimentation' }}
      />
      <Stack.Screen
        name="DietWeightPsychoDetail"
        component={DietWeightPsychoDetailScreen}
        options={({ route }) => ({
          title: route.params.topicTitle,
        })}
      />
      <Stack.Screen
        name="DistressTolerance"
        component={DistressToleranceScreen}
        options={{ title: 'Tolérance à la détresse' }}
      />
      <Stack.Screen
        name="DistressToleranceDetail"
        component={DistressToleranceDetailScreen}
        options={({ route }) => ({ title: route.params.topicTitle })}
      />
      <Stack.Screen
        name="ChronoBio"
        component={ChronoBioScreen}
        options={{ title: 'Régularité chronobiologique' }}
      />
      <Stack.Screen
        name="ChronoBioDetail"
        component={ChronoBioDetailScreen}
        options={({ route }) => ({ title: route.params.topicTitle })}
      />
      <Stack.Screen
        name="ChronoBioEntry"
        component={ChronoBioEntryScreen}
        options={{ title: 'Ancrages du jour' }}
      />
      <Stack.Screen
        name="ChronoBioMonth"
        component={ChronoBioMonthScreen}
        options={{ title: 'Vue mensuelle' }}
      />
    </Stack.Navigator>
  )
}
