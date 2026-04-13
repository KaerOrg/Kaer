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
import { colors } from '../theme'

export type AppStackParamList = {
  Tabs: undefined
  SleepDiary: undefined
  SleepDiaryEntry: { date?: string }
  SleepDiaryMonth: undefined
  CrisisPlan: undefined
  Psychoeducation: undefined
  CardDetail: { cardId: string; isRead: boolean }
  DecisionalBalance: undefined
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
    </Stack.Navigator>
  )
}
