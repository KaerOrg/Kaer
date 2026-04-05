import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RouteProp } from '@react-navigation/native'
import { AuthStackParamList } from '../navigation/AuthStack'
import { useAuthStore } from '../store/authStore'
import InputField from '../components/InputField'
import Button from '../components/Button'
import { colors, spacing } from '../theme'

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>
  route: RouteProp<AuthStackParamList, 'Register'>
}

export default function RegisterScreen({ navigation, route }: Props) {
  // Le token et l'email peuvent être pré-remplis depuis un deep link
  const [token, setToken] = useState(route.params?.token ?? '')
  const [email, setEmail] = useState(route.params?.email ?? '')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const register = useAuthStore((s) => s.register)

  const handleRegister = async () => {
    if (!token.trim() || !email.trim() || !password || !confirm) {
      Alert.alert('Champs manquants', 'Veuillez remplir tous les champs.')
      return
    }
    if (password !== confirm) {
      Alert.alert('Mots de passe différents', 'Les deux mots de passe ne correspondent pas.')
      return
    }
    if (password.length < 8) {
      Alert.alert('Mot de passe trop court', 'Votre mot de passe doit contenir au moins 8 caractères.')
      return
    }
    setLoading(true)
    try {
      await register(email.trim().toLowerCase(), password, token.trim())
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Une erreur est survenue."
      Alert.alert("Erreur d'inscription", message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.logo}>PsyTool</Text>
          <Text style={styles.subtitle}>Créer mon espace patient</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.title}>Inscription</Text>
          <Text style={styles.intro}>
            Votre praticien vous a envoyé un code d'invitation par email.{'\n'}
            Saisissez-le ci-dessous pour créer votre compte.
          </Text>

          <InputField
            label="Code d'invitation"
            value={token}
            onChangeText={setToken}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Le code reçu par email"
          />
          <InputField
            label="Votre email (identique à votre invitation)"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="votre@email.com"
          />
          <InputField
            label="Choisir un mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Minimum 8 caractères"
          />
          <InputField
            label="Confirmer le mot de passe"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            placeholder="••••••••"
          />

          <Button label="Créer mon compte" onPress={handleRegister} loading={loading} />
          <Button
            label="J'ai déjà un compte"
            onPress={() => navigation.goBack()}
            variant="ghost"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, padding: spacing.lg, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  logo: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -1,
  },
  subtitle: { fontSize: 16, color: colors.textMuted, marginTop: 4 },
  form: { gap: spacing.md },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  intro: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
})
