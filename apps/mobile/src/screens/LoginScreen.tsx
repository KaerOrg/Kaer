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
import { useTranslation } from 'react-i18next'
import { logger } from '@psytool/shared'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { AuthStackParamList } from '../navigation/AuthStack'
import { useAuthStore } from '../store/authStore'
import InputField from '../components/ui/InputField'
import Button from '../components/ui/Button'
import { colors, spacing } from '../theme'

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>
}

export default function LoginScreen({ navigation }: Props) {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((s) => s.login)

  const handleLogin = async () => {
    logger.log('[LoginScreen] handleLogin triggered, email:', email.trim())
    if (!email.trim() || !password) {
      Alert.alert(t('auth.missing_fields_title'), t('auth.missing_fields_message'))
      return
    }
    setLoading(true)
    try {
      logger.log('[LoginScreen] calling login...')
      await login(email.trim().toLowerCase(), password)
      logger.log('[LoginScreen] login returned (no error)')
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : t('auth.login_error_title')
      logger.error('[LoginScreen] login error:', message)
      Alert.alert(t('auth.login_error_title'), message)
    } finally {
      logger.log('[LoginScreen] finally — setLoading(false)')
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
          <Text style={styles.subtitle}>{t('auth.app_subtitle')}</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.title}>{t('auth.login_title')}</Text>

          <InputField
            label={t('auth.email_label')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder={t('auth.email_placeholder')}
          />
          <InputField
            label={t('auth.password_label')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            placeholder={t('auth.password_placeholder')}
          />

          <Button label={t('auth.login_button')} onPress={handleLogin} loading={loading} />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('auth.divider')}</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            label={t('auth.invitation_button')}
            onPress={() => navigation.navigate('Register', {})}
            variant="secondary"
          />
          <Text style={styles.hint}>{t('auth.invitation_hint')}</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, padding: spacing.lg, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: spacing.xl * 1.5 },
  logo: { fontSize: 40, fontWeight: '800', color: colors.primary, letterSpacing: -1 },
  subtitle: { fontSize: 16, color: colors.textMuted, marginTop: 4 },
  form: { gap: spacing.md },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: spacing.xs },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.textMuted, fontSize: 14 },
  hint: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
})
