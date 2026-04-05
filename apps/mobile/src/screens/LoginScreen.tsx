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
import { AuthStackParamList } from '../navigation/AuthStack'
import { useAuthStore } from '../store/authStore'
import InputField from '../components/InputField'
import Button from '../components/Button'
import { colors, spacing } from '../theme'

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>
}

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((s) => s.login)

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Champs manquants', 'Veuillez remplir votre email et votre mot de passe.')
      return
    }
    setLoading(true)
    try {
      await login(email.trim().toLowerCase(), password)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Identifiants incorrects.'
      Alert.alert('Erreur de connexion', message)
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
        {/* En-tête avec le nom de l'app */}
        <View style={styles.header}>
          <Text style={styles.logo}>PsyTool</Text>
          <Text style={styles.subtitle}>Espace patient</Text>
        </View>

        {/* Formulaire de connexion */}
        <View style={styles.form}>
          <Text style={styles.title}>Connexion</Text>

          <InputField
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="votre@email.com"
          />
          <InputField
            label="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            placeholder="••••••••"
          />

          <Button label="Se connecter" onPress={handleLogin} loading={loading} />

          {/* Séparateur */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            label="J'ai une invitation"
            onPress={() => navigation.navigate('Register', {})}
            variant="secondary"
          />
          <Text style={styles.hint}>
            Votre praticien vous a envoyé un email avec un code d'invitation.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, padding: spacing.lg, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: spacing.xl * 1.5 },
  logo: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -1,
  },
  subtitle: { fontSize: 16, color: colors.textMuted, marginTop: 4 },
  form: { gap: spacing.md },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.textMuted, fontSize: 14 },
  hint: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
})
