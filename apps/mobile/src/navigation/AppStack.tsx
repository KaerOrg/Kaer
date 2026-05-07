import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import HomeScreen from '../screens/HomeScreen'
import ProfileScreen from '../screens/ProfileScreen'
import PsychoeducationScreen from '../screens/modules/PsychoeducationScreen'
import CardDetailScreen from '../screens/modules/CardDetailScreen'
import DecisionalBalanceScreen from '../screens/modules/DecisionalBalanceScreen'
import FearThermometerScreen from '../screens/modules/FearThermometerScreen'
import FearEntryScreen from '../screens/modules/FearEntryScreen'
import BehavioralActivationScreen from '../screens/modules/BehavioralActivationScreen'
import BehavioralActivationEntryScreen from '../screens/modules/BehavioralActivationEntryScreen'
import BreathingTechniquesScreen from '../screens/modules/BreathingTechniquesScreen'
import BreathingExerciseScreen from '../screens/modules/BreathingExerciseScreen'
import ScaleHistoryScreen from '../screens/modules/ScaleHistoryScreen'
import ScaleEntryScreen from '../screens/modules/ScaleEntryScreen'
import ModuleContentScreen from '../screens/modules/ModuleContentScreen'
import { getTechnique } from '../constants/breathingTechniques'
import { colors } from '../theme'

function getTechniqueTitle(key: string): string {
  return getTechnique(key)?.name ?? 'Exercice de respiration'
}

export type AppStackParamList = {
  Tabs: undefined
  Psychoeducation: undefined
  CardDetail: { cardId: string; isRead: boolean }
  DecisionalBalance: undefined
  FearThermometer: undefined
  FearEntry: { entryId?: string }
  BehavioralActivation: undefined
  BehavioralActivationEntry: { recordId?: string }
  BreathingTechniques: undefined
  BreathingExercise: { techniqueKey: string }
  ScaleHistory: { scale_id: string }
  ScaleEntry: { scale_id: string }
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
        name="ScaleHistory"
        component={ScaleHistoryScreen}
        options={({ route }) => ({ title: route.params.scale_id.toUpperCase().replace('_', '-') })}
      />
      <Stack.Screen
        name="ScaleEntry"
        component={ScaleEntryScreen}
        options={{ title: 'Nouveau questionnaire' }}
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
