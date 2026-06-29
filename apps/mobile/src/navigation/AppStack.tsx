import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import HomeScreen from '../screens/HomeScreen'
import ProfileScreen from '../screens/ProfileScreen'
import AppointmentsScreen from '../screens/AppointmentsScreen'
import BookAppointmentScreen from '../screens/BookAppointmentScreen'
import BreathingTechniquesScreen from '../screens/modules/BreathingTechniquesScreen'
import BreathingExerciseScreen from '../screens/modules/BreathingExerciseScreen'
import ScaleHistoryScreen from '../screens/modules/ScaleHistoryScreen'
import MedicationSideEffectsHistoryScreen from '../screens/modules/MedicationSideEffectsHistoryScreen'
import MedicationSideEffectsEntryScreen from '../screens/modules/MedicationSideEffectsEntryScreen'
import MoodTrackerScreen from '../screens/modules/MoodTrackerScreen'
import ScaleEntryScreen from '../screens/modules/ScaleEntryScreen'
import ModuleContentScreen from '../screens/modules/ModuleContentScreen'
import CrisisUrgencyScreen from '../screens/modules/CrisisUrgencyScreen'
import i18next from 'i18next'
import { colors } from '@theme'

// Le nom d'une technique est une clé i18n dérivée de sa clé (route.params),
// indépendante de la config en base : on le résout directement pour le titre.
function getTechniqueTitle(key: string): string {
  return i18next.t(`modules.breathing_techniques.${key}_name`)
}

export type AppStackParamList = {
  Tabs: undefined
  BreathingTechniques: undefined
  BreathingExercise: { techniqueKey: string }
  ScaleHistory: { scale_id: string }
  ScaleEntry: { scale_id: string; entry_id?: string }
  ModuleContent: { moduleType: string }
  BookAppointment: { practitionerId: string; appointmentId?: string }
  CrisisUrgency: undefined
  MedicationSideEffectsHistory: undefined
  MedicationSideEffectsEntry: {
    effects: { key: string; label: string; color: string }[]
    entry_id?: string
  }
  MoodTracker: undefined
}

export type TabParamList = {
  Home: undefined
  Appointments: undefined
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
          if (route.name === 'Home') {
            return <Ionicons name={focused ? 'grid' : 'grid-outline'} size={size} color={color} />
          }
          if (route.name === 'Appointments') {
            return <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={size} color={color} />
          }
          return <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Modules' }} />
      <Tab.Screen name="Appointments" component={AppointmentsScreen} options={{ title: 'Agenda' }} />
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
        name="BookAppointment"
        component={BookAppointmentScreen}
        options={({ route }) => ({
          title: route.params.appointmentId ? 'Reprogrammer' : 'Prendre un rendez-vous',
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
        options={{ title: '' }}
      />
      <Stack.Screen
        name="ScaleEntry"
        component={ScaleEntryScreen}
        options={{ title: 'Nouveau questionnaire' }}
      />
      <Stack.Screen
        name="ModuleContent"
        component={ModuleContentScreen}
        options={{ title: '' }}
      />
      <Stack.Screen
        name="CrisisUrgency"
        component={CrisisUrgencyScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MedicationSideEffectsHistory"
        component={MedicationSideEffectsHistoryScreen}
        options={{ title: '' }}
      />
      <Stack.Screen
        name="MedicationSideEffectsEntry"
        component={MedicationSideEffectsEntryScreen}
        options={{ title: '' }}
      />
      <Stack.Screen
        name="MoodTracker"
        component={MoodTrackerScreen}
        options={{ title: '' }}
      />
    </Stack.Navigator>
  )
}
