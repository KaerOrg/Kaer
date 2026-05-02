import React, { useCallback, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Plus, ChevronRight, Trash2, Info, ExternalLink } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import {
  listExposureHierarchies,
  createExposureHierarchy,
  deleteExposureHierarchy,
  generateId,
  type ExposureHierarchy,
} from '../../lib/database'
import { AppStackParamList } from '../../navigation/AppStack'
import { DisclaimerBanner } from '../../components/DisclaimerBanner'
import { colors, spacing, radius } from '../../theme'
import { useTeen } from '../../hooks/useTeen'
import { TeenAccent } from '../../components/TeenAccent'

type Nav = NativeStackNavigationProp<AppStackParamList>

// ─── Sources officielles ──────────────────────────────────────────────────────

const SOURCES = [
  {
    key: 'has',
    label: 'HAS (2007) — Troubles anxieux graves',
    url: 'https://www.has-sante.fr/jcms/c_598386/fr/ald-n-23-troubles-anxieux-graves',
  },
  {
    key: 'nice',
    label: 'NICE (2020) — Anxiety disorder (CG113)',
    url: 'https://www.nice.org.uk/guidance/cg113',
  },
  {
    key: 'wolpe',
    label: 'Wolpe J (1958) — Psychotherapy by Reciprocal Inhibition',
    url: null,
  },
  {
    key: 'foa',
    label: 'Foa & Kozak (1986) — Emotional processing of fear — Psychological Bulletin',
    url: null,
  },
] as const

// ─── Modal info / sources ─────────────────────────────────────────────────────

function InfoModal({ visible, onClose, isTeenMode }: {
  visible: boolean
  onClose: () => void
  isTeenMode: boolean
}) {
  const { t } = useTranslation()
  const ns = isTeenMode ? 'teen' : 'common'

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={infoStyles.backdrop} onPress={onClose}>
        <View style={infoStyles.sheet}>
          <Text style={infoStyles.title}>
            {t('modules.exposure_hierarchy.info_title', { ns })}
          </Text>
          <Text style={infoStyles.intro}>
            {t('modules.exposure_hierarchy.info_body', { ns })}
          </Text>
          <Text style={infoStyles.sourcesTitle}>
            {t('modules.exposure_hierarchy.info_sources', { ns })}
          </Text>
          {SOURCES.map((s) =>
            s.url ? (
              <Pressable
                key={s.key}
                style={infoStyles.sourceRow}
                onPress={() => Linking.openURL(s.url)}
                accessibilityRole="link"
              >
                <ExternalLink size={13} color={colors.primary} />
                <Text style={infoStyles.sourceLink}>{s.label}</Text>
              </Pressable>
            ) : (
              <View key={s.key} style={infoStyles.sourceRow}>
                <Text style={infoStyles.sourceText}>{s.label}</Text>
              </View>
            )
          )}
          <Pressable style={infoStyles.closeBtn} onPress={onClose}>
            <Text style={infoStyles.closeBtnText}>{t('common.close')}</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  )
}

const infoStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  sheet: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: '100%',
    gap: spacing.sm,
  },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  intro: { fontSize: 13, color: colors.text, lineHeight: 20 },
  sourcesTitle: { fontSize: 12, fontWeight: '700', color: colors.textMuted, marginTop: spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  sourceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  sourceLink: { flex: 1, fontSize: 12, color: colors.primary, lineHeight: 18 },
  sourceText: { flex: 1, fontSize: 12, color: colors.textMuted, lineHeight: 18 },
  closeBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  closeBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
})

// ─── Ligne hiérarchie ─────────────────────────────────────────────────────────

interface HierarchyRowProps {
  item: ExposureHierarchy
  onPress: () => void
  onDelete: () => void
}

function HierarchyRow({ item, onPress, onDelete }: HierarchyRowProps) {
  const { t } = useTranslation()
  const date = new Date(item.created_at).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  return (
    <Pressable style={rowStyles.card} onPress={onPress} accessibilityRole="button">
      <View style={rowStyles.body}>
        <Text style={rowStyles.title} numberOfLines={1}>
          {item.title ?? t('modules.exposure_hierarchy.untitled')}
        </Text>
        <Text style={rowStyles.date}>{date}</Text>
      </View>
      <View style={rowStyles.actions}>
        <Pressable
          onPress={onDelete}
          hitSlop={8}
          accessibilityLabel={t('common.delete')}
        >
          <Trash2 size={17} color={colors.textMuted} />
        </Pressable>
        <ChevronRight size={18} color={colors.textMuted} />
      </View>
    </Pressable>
  )
}

const rowStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
  },
  body: { flex: 1, gap: 2 },
  title: { fontSize: 15, fontWeight: '600', color: colors.text },
  date: { fontSize: 12, color: colors.textMuted },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
})

// ─── Modal nouvelle hiérarchie ────────────────────────────────────────────────

function NewHierarchyModal({ visible, onConfirm, onCancel }: {
  visible: boolean
  onConfirm: (title: string | null) => void
  onCancel: () => void
}) {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')

  const handleConfirm = useCallback(() => {
    onConfirm(title.trim() || null)
    setTitle('')
  }, [title, onConfirm])

  const handleCancel = useCallback(() => {
    setTitle('')
    onCancel()
  }, [onCancel])

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
      <Pressable style={newModalStyles.backdrop} onPress={handleCancel}>
        <View style={newModalStyles.sheet}>
          <Text style={newModalStyles.title}>
            {t('modules.exposure_hierarchy.new_hierarchy_title')}
          </Text>
          <TextInput
            style={newModalStyles.input}
            placeholder={t('modules.exposure_hierarchy.new_hierarchy_placeholder')}
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
            autoFocus
            maxLength={80}
          />
          <View style={newModalStyles.actions}>
            <Pressable style={newModalStyles.btnGhost} onPress={handleCancel}>
              <Text style={newModalStyles.btnGhostText}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable style={newModalStyles.btnPrimary} onPress={handleConfirm}>
              <Text style={newModalStyles.btnPrimaryText}>{t('common.create')}</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  )
}

const newModalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  sheet: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: '100%',
    gap: spacing.md,
  },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.background,
  },
  actions: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'flex-end' },
  btnGhost: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnGhostText: { fontSize: 14, color: colors.textMuted, fontWeight: '500' },
  btnPrimary: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  btnPrimaryText: { fontSize: 14, color: colors.white, fontWeight: '700' },
})

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function ExposureHierarchyScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<Nav>()
  const { isTeenMode, tt, teenColor } = useTeen()

  const [hierarchies, setHierarchies] = useState<ExposureHierarchy[]>([])
  const [loading, setLoading] = useState(true)
  const [showInfo, setShowInfo] = useState(false)
  const [showNew, setShowNew] = useState(false)

  useFocusEffect(
    useCallback(() => {
      let active = true
      listExposureHierarchies().then((rows) => {
        if (!active) return
        setHierarchies(rows)
        setLoading(false)
      })
      return () => { active = false }
    }, [])
  )

  const handleCreate = useCallback(async (title: string | null) => {
    setShowNew(false)
    const id = generateId()
    await createExposureHierarchy(id, title)
    const updated = await listExposureHierarchies()
    setHierarchies(updated)
    navigation.navigate('ExposureHierarchyDetail', { hierarchyId: id, title })
  }, [navigation])

  const handleDelete = useCallback((item: ExposureHierarchy) => {
    Alert.alert(
      t('common.delete'),
      t('modules.exposure_hierarchy.delete_confirm', {
        title: item.title ?? t('modules.exposure_hierarchy.untitled'),
      }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteExposureHierarchy(item.id)
            setHierarchies((prev) => prev.filter((h) => h.id !== item.id))
          },
        },
      ]
    )
  }, [t])

  return (
    <View style={styles.container}>
      <TeenAccent color={teenColor('exposure_hierarchy')} />

      <DisclaimerBanner moduleKey="exposure_hierarchy" isTeenMode={isTeenMode} />

      {/* Bouton info */}
      <Pressable
        style={styles.infoRow}
        onPress={() => setShowInfo(true)}
        accessibilityRole="button"
        accessibilityLabel={t('modules.exposure_hierarchy.info_btn')}
      >
        <Info size={14} color={colors.primary} />
        <Text style={styles.infoText}>
          {tt('exposure_hierarchy', 'info_btn')}
        </Text>
      </Pressable>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={hierarchies}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <HierarchyRow
              item={item}
              onPress={() =>
                navigation.navigate('ExposureHierarchyDetail', {
                  hierarchyId: item.id,
                  title: item.title,
                })
              }
              onDelete={() => handleDelete(item)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>
                {t('modules.exposure_hierarchy.empty_title')}
              </Text>
              <Text style={styles.emptyText}>
                {t('modules.exposure_hierarchy.empty_text')}
              </Text>
            </View>
          }
        />
      )}

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <Pressable
          style={styles.addBtn}
          onPress={() => setShowNew(true)}
          accessibilityRole="button"
          accessibilityLabel={t('modules.exposure_hierarchy.add_hierarchy')}
        >
          <Plus size={20} color={colors.white} />
          <Text style={styles.addBtnText}>
            {t('modules.exposure_hierarchy.add_hierarchy')}
          </Text>
        </Pressable>
      </SafeAreaView>

      <InfoModal
        visible={showInfo}
        onClose={() => setShowInfo(false)}
        isTeenMode={isTeenMode}
      />
      <NewHierarchyModal
        visible={showNew}
        onConfirm={handleCreate}
        onCancel={() => setShowNew(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xs,
  },
  infoText: { fontSize: 12, color: colors.primary, textDecorationLine: 'underline' },

  list: { padding: spacing.md, gap: spacing.sm, paddingBottom: 100 },
  separator: { height: spacing.sm },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  empty: {
    alignItems: 'center',
    paddingTop: spacing.xl * 2,
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.text, textAlign: 'center' },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },

  footer: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
  },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
  },
  addBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
})
