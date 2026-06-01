import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import HomeScreen from '../screens/HomeScreen'
import ProfileScreen from '../screens/ProfileScreen'
import AppointmentsScreen from '../screens/AppointmentsScreen'
import BookAppointmentScreen from '../screens/BookAppointmentScreen'
import PsychoeducationScreen from '../screens/modules/PsychoeducationScreen'
import CardDetailScreen from '../screens/modules/CardDetailScreen'
import BreathingTechniquesScreen from '../screens/modules/BreathingTechniquesScreen'
import BreathingExerciseScreen from '../screens/modules/BreathingExerciseScreen'
import ScaleHistoryScreen from '../screens/modules/ScaleHistoryScreen'
import ScaleEntryScreen from '../screens/modules/ScaleEntryScreen'
import ModuleContentScreen from '../screens/modules/ModuleContentScreen'
import CrisisPlanScreen from '../screens/modules/CrisisPlanScreen'
import MotivationalBalanceScreen from '../screens/modules/MotivationalBalanceScreen'
import MotivationalBalanceDetailScreen from '../screens/modules/MotivationalBalanceDetailScreen'
import { getTechnique } from '../constants/breathingTechniques'
import { colors } from '../theme'

function getTechniqueTitle(key: string): string {
  return getTechnique(key)?.name ?? 'Exercice de respiration'
}

export type AppStackParamList = {
  Tabs: undefined
  Psychoeducation: undefined
  CardDetail: { cardId: string; isRead: boolean }
  BreathingTechniques: undefined
  BreathingExercise: { techniqueKey: string }
  ScaleHistory: { scale_id: string }
  ScaleEntry: { scale_id: string }
  ModuleContent: { moduleType: string }
  MotivationalBalance: undefined
  MotivationalBalanceDetail: { topicId: string; topicKey: string }
  BookAppointment: { practitionerId: string }
  CrisisPlan: { initialUrgency?: boolean }
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
        options={{ title: 'Prendre un rendez-vous' }}
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
        name="CrisisPlan"
        component={CrisisPlanScreen}
        options={{ title: 'Plan de crise' }}
      />
      <Stack.Screen
        name="MotivationalBalance"
        component={MotivationalBalanceScreen}
        options={{ title: 'Balance motivationnelle' }}
      />
      <Stack.Screen
        name="MotivationalBalanceDetail"
        component={MotivationalBalanceDetailScreen}
        options={({ route }) => ({
          title: route.params.topicKey
            .split('_')
            .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' '),
        })}
      />
    </Stack.Navigator>
  )
}
