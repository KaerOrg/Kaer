import React, { useCallback, useState } from 'react'
import { Text, StyleSheet, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import type { ModuleType } from '@kaer/shared'
import { Card } from '@ui/Card'
import Button from '@ui/Button'
import { colors, spacing } from '@theme'
import { useAuthStore } from '../store/authStore'
import { useToast } from '../contexts/ToastContext'
import { useConfirmDialog } from '../contexts/ConfirmDialogContext'
import {
  availableDemoModules,
  generateDemoForModule,
  purgeAllDemo,
} from '@services/demo/demoDataService'

// Liste figée par le registre statique des générateurs : calculée une fois au
// niveau module, jamais réallouée à chaque rendu.
const DEMO_MODULES = availableDemoModules()

// Opérations mutuellement exclusives : une seule à la fois. Un state discriminé
// rend l'exclusivité structurelle (impossible de générer et purger en parallèle).
type BusyState = { kind: 'generate'; module: ModuleType } | { kind: 'purge' } | null

/**
 * Écran développeur CACHÉ (rendu uniquement en build dev et sur compte de test,
 * cf. la garde de visibilité dans SettingsScreen). Permet de fabriquer ~2 mois
 * de données de démo par module, puis de tout purger. La barrière réelle
 * « compte de test uniquement » vit dans le service ; cet écran n'est que le
 * point d'entrée.
 */
export default function DemoDataScreen() {
  const { t } = useTranslation()
  const { patient } = useAuthStore()
  const { showToast } = useToast()
  const { showConfirm } = useConfirmDialog()

  const [busy, setBusy] = useState<BusyState>(null)

  const handleGenerate = useCallback(
    (module: ModuleType) => {
      showConfirm({
        title: t('dev.demo.confirm_generate_title'),
        message: t('dev.demo.confirm_generate_message'),
        confirmLabel: t('dev.demo.confirm_generate_confirm'),
        onConfirm: async () => {
          setBusy({ kind: 'generate', module })
          const result = await generateDemoForModule(module, { patientEmail: patient?.email })
          setBusy(null)
          if (result.ok) {
            showToast(t('dev.demo.generated', { count: result.count }), 'success')
          } else {
            showToast(t('dev.demo.error'), 'error')
          }
        },
      })
    },
    [patient, showConfirm, showToast, t],
  )

  const handlePurge = useCallback(() => {
    showConfirm({
      title: t('dev.demo.confirm_purge_title'),
      message: t('dev.demo.confirm_purge_message'),
      confirmLabel: t('dev.demo.confirm_purge_confirm'),
      destructive: true,
      onConfirm: async () => {
        setBusy({ kind: 'purge' })
        const result = await purgeAllDemo({ patientEmail: patient?.email })
        setBusy(null)
        if (result.ok) {
          showToast(t('dev.demo.purged', { count: result.count }), 'success')
        } else {
          showToast(t('dev.demo.error'), 'error')
        }
      },
    })
  }, [patient, showConfirm, showToast, t])

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.disclaimer}>{t('dev.demo.disclaimer')}</Text>

        {DEMO_MODULES.map((module) => (
          <Card
            key={module}
            header={{ title: module, subtitle: t('dev.demo.module_hint') }}
            actions={
              <Button
                label={t('dev.demo.generate_button')}
                size="sm"
                onPress={() => handleGenerate(module)}
                loading={busy?.kind === 'generate' && busy.module === module}
                disabled={busy !== null}
              />
            }
          />
        ))}

        <Button
          label={t('dev.demo.purge_button')}
          variant="danger"
          onPress={handlePurge}
          loading={busy?.kind === 'purge'}
          disabled={busy !== null}
        />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  disclaimer: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
})
