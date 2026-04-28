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
import PsychoeducationScreen from '../screens/modules/PsychoeducationScreen'
import CardDetailScreen from '../screens/modules/CardDetailScreen'
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
import CognitiveSaturationScreen from '../screens/modules/CognitiveSaturationScreen'
import CognitiveSaturationExerciseScreen from '../screens/modules/CognitiveSaturationExerciseScreen'
import EmotionWheelScreen from '../screens/modules/EmotionWheelScreen'
import EmotionEntryScreen from '../screens/modules/EmotionEntryScreen'
import EmotionMonthScreen from '../screens/modules/EmotionMonthScreen'
import ModuleContentScreen from '../screens/modules/ModuleContentScreen'
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
  Psychoeducation: undefined
  CardDetail: { cardId: string; isRead: boolean }
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
  CognitiveSaturation: undefined
  CognitiveSaturationExercise: undefined
  EmotionWheel: undefined
  EmotionEntry: undefined
  EmotionMonth: undefined
  ModuleContent: { moduleType: string }
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
        name="Psychoeducation"
        component={PsychoeducationScreen}
        options={{ title: 'Psychoéducation' }}
      />
      <Stack.Screen
        name="CardDetail"
        component={CardDetailScreen}
        options={({ route }) => ({
          title: route.params.cardId
            ? (require('../constants/psychoeducationCards').PSYCHOEDUCATION_CARDS[route.params.cardId]?.title ?? 'Carte')
            : 'Carte',
        })}
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
        name="ModuleContent"
        component={ModuleContentScreen}
        options={({ route }) => ({
          title: route.params.moduleType
            .split('_')
            .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' '),
        })}
      />
    </Stack.Navigator>
  )
}
