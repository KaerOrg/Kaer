import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import HomeScreen from '../screens/HomeScreen'
import ProfileScreen from '../screens/ProfileScreen'
import SleepDiaryScreen from '../screens/modules/SleepDiaryScreen'
import SleepDiaryEntryScreen from '../screens/modules/SleepDiaryEntryScreen'
import { colors } from '../theme'

export type AppStackParamList = {
  Tabs: undefined
  SleepDiary: undefined
  SleepDiaryEntry: { date?: string }
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
    </Stack.Navigator>
  )
}
