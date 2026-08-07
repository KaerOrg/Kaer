import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import HomeScreen from '../screens/HomeScreen'
import ProfileScreen from '../screens/ProfileScreen'
import SettingsScreen from '../screens/SettingsScreen'
import WorkInProgressScreen from '../screens/WorkInProgressScreen'
import AppointmentsScreen from '../screens/AppointmentsScreen'
import BookAppointmentScreen from '../screens/BookAppointmentScreen'
import ScaleHistoryScreen from '../screens/modules/ScaleHistoryScreen'
import MedicationSideEffectsHistoryScreen from '../screens/modules/MedicationSideEffectsHistoryScreen'
import MedicationSideEffectsEntryScreen from '../screens/modules/MedicationSideEffectsEntryScreen'
import MoodTrackerScreen from '../screens/modules/MoodTrackerScreen'
import ScaleEntryScreen from '../screens/modules/ScaleEntryScreen'
import ScaleSubmittedScreen from '../screens/modules/ScaleSubmittedScreen'
import ScaleAboutScreen from '../screens/modules/ScaleAboutScreen'
import ModuleContentScreen from '../screens/modules/ModuleContentScreen'
import ModuleRemindersScreen from '../screens/modules/ModuleRemindersScreen'
import type { PreviewKind } from '@kaer/shared'
import { colors } from '@theme'

export type AppStackParamList = {
  Tabs: undefined
  ScaleHistory: { scale_id: string }
  // resume : reprend le brouillon local laissé par une saisie interrompue (#412).
  // Sans lui, on repart d'un questionnaire vierge : c'est ce que fait « Recommencer ».
  ScaleEntry: { scale_id: string; entry_id?: string; resume?: boolean }
  // Écran d'après-envoi (#411). Il ne reçoit QUE l'identifiant de l'échelle : les
  // réponses ne lui sont pas transmises, et c'est ce qui le garde hors du champ du
  // dispositif médical. Les ressources qu'il propose sont les mêmes pour tout le monde.
  ScaleSubmitted: { scale_id: string }
  // Fiche « à propos » d'une échelle (#415) : ce que l'instrument est, ce qu'il n'est
  // pas, qui voit quoi. Rien n'y dépend d'une réponse du patient.
  ScaleAbout: { scale_id: string }
  // previewKindOverride : force un layout précis au lieu de celui du module (ex. la
  // roue crantée du plan de crise ouvre le module en mode édition `editable_steps`).
  // startEntry : ouvre directement la saisie plutôt que l'accueil du module. Posé par
  // le tap sur un rappel : le patient n'a pas à retrouver son module (#257).
  ModuleContent: { moduleType: string; previewKindOverride?: PreviewKind; startEntry?: boolean }
  // Rappels d'un module, côté patient : le rythme est posé en séance puis lui
  // appartient (#257).
  ModuleReminders: { moduleType: string }
  BookAppointment: { practitionerId: string; appointmentId?: string }
  MedicationSideEffectsHistory: undefined
  MedicationSideEffectsEntry: {
    effects: { key: string; label: string; color: string }[]
    entry_id?: string
  }
  MoodTracker: undefined
  Settings: undefined
  // Placeholder « page en chantier » : `title` porte le libellé de l'en-tête natif
  // (déjà traduit par l'écran appelant).
  WorkInProgress: { title: string }
}

export type TabParamList = {
  Home: undefined
  Appointments: undefined
  Profile: undefined
}

const Stack = createNativeStackNavigator<AppStackParamList>()
const Tab = createBottomTabNavigator<TabParamList>()

function Tabs() {
  const { t } = useTranslation()
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
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: t('nav.modules') }} />
      <Tab.Screen name="Appointments" component={AppointmentsScreen} options={{ title: t('nav.agenda') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: t('nav.profile') }} />
    </Tab.Navigator>
  )
}

export default function AppStack() {
  const { t } = useTranslation()
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
        name="Settings"
        component={SettingsScreen}
        options={{ title: t('profile.settings_label') }}
      />
      <Stack.Screen
        name="WorkInProgress"
        component={WorkInProgressScreen}
        options={({ route }) => ({ title: route.params.title })}
      />
      <Stack.Screen
        name="BookAppointment"
        component={BookAppointmentScreen}
        options={({ route }) => ({
          title: route.params.appointmentId ? 'Reprogrammer' : 'Prendre un rendez-vous',
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
      {/* Sans retour dans l'en-tête : on quitte cet écran par « Terminé », pour que
          les ressources d'aide ne se referment pas d'un geste réflexe. */}
      <Stack.Screen
        name="ScaleSubmitted"
        component={ScaleSubmittedScreen}
        options={{ title: '', headerBackVisible: false }}
      />
      <Stack.Screen
        name="ScaleAbout"
        component={ScaleAboutScreen}
        options={{ title: '' }}
      />
      <Stack.Screen
        name="ModuleContent"
        component={ModuleContentScreen}
        options={{ title: '' }}
      />
      <Stack.Screen
        name="ModuleReminders"
        component={ModuleRemindersScreen}
        options={{ title: '' }}
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
