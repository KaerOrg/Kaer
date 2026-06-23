import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import * as Linking from 'expo-linking'
import { useTranslation } from 'react-i18next'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RouteProp } from '@react-navigation/native'
import { AuthStackParamList } from '../navigation/AuthStack'
import { useAuthStore } from '../store/authStore'
import InputField from '@ui/InputField'
import Button from '@ui/Button'
import { colors, spacing } from '@theme'

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>
  route: RouteProp<AuthStackParamList, 'Register'>
}

export default function RegisterScreen({ navigation, route }: Props) {
  const { t } = useTranslation()
  const [token, setToken] = useState(route.params?.token ?? '')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const register = useAuthStore((s) => s.register)

  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url) extractToken(url)
    })
    const sub = Linking.addEventListener('url', ({ url }) => extractToken(url))
    return () => sub.remove()
  }, [])

  function extractToken(url: string) {
    try {
      const parsed = Linking.parse(url)
      const tok = parsed.queryParams?.token
      if (typeof tok === 'string' && tok) setToken(tok)
    } catch { /* ignore */ }
  }

  const handleRegister = async () => {
    setError(null)
    if (!token.trim() || !password || !confirm) {
      setError(t('auth.register_missing_fields'))
      return
    }
    if (password !== confirm) {
      setError(t('auth.passwords_mismatch_message'))
      return
    }
    if (password.length < 8) {
      setError(t('auth.password_too_short_message'))
      return
    }
    setLoading(true)
    try {
      await register(token.trim(), password)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : t('common.error')
      setError(message)
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
          <Text style={styles.logo}>Kær</Text>
          <Text style={styles.subtitle}>{t('auth.register_subtitle')}</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.title}>{t('auth.register_title')}</Text>
          <Text style={styles.intro}>{t('auth.register_intro')}</Text>

          <InputField
            label={t('auth.token_label')}
            value={token}
            onChangeText={setToken}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder={t('auth.token_placeholder')}
          />
          <InputField
            label={t('auth.password_new_label')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder={t('auth.password_min_placeholder')}
          />
          <InputField
            label={t('auth.password_confirm_label')}
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            placeholder={t('auth.password_placeholder')}
          />

          {!!error && <Text style={styles.error}>{error}</Text>}
          <Button label={t('auth.register_button')} onPress={handleRegister} loading={loading} />
          <Button
            label={t('auth.already_account')}
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
  logo: { fontSize: 40, fontWeight: '800', color: colors.primary, letterSpacing: -1 },
  subtitle: { fontSize: 16, color: colors.textMuted, marginTop: 4 },
  form: { gap: spacing.md },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  intro: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  error: { fontSize: 13, color: colors.danger, lineHeight: 18, textAlign: 'center' },
})
