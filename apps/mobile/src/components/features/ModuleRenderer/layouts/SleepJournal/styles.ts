import { StyleSheet } from 'react-native'
import { colors, spacing, radius } from '@theme'

export const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: colors.background },
  center:            { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  // ── List
  listContent:       { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.xs },
  infoBox:           { flexDirection: 'row', gap: 6, alignItems: 'flex-start', marginTop: spacing.md, padding: 10, backgroundColor: '#F3F4F6', borderRadius: 8 },
  footerText:        { fontSize: 12, color: colors.textMuted, flex: 1, lineHeight: 17 },
  ctaContainer:      { gap: spacing.sm, marginBottom: spacing.md },
  ctaCard: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    padding: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  monthCard: {
    backgroundColor: colors.card, borderRadius: radius.lg,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  ctaRow:            { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  ctaTexts:          { flex: 1 },
  ctaTitle:          { fontSize: 17, fontWeight: '700', color: colors.white },
  ctaSubtitle:       { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  monthBtnText:      { flex: 1, fontSize: 15, fontWeight: '600', color: colors.primary },
  chevron:           { fontSize: 22, color: colors.textMuted, fontWeight: '300' },
  chevronWhite:      { fontSize: 22, color: colors.white, fontWeight: '300' },
  listHeader: {
    fontSize: 13, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: spacing.sm, marginTop: spacing.sm,
  },
  // Ligne « nuit » : en-tête (date + étoiles), barre fenêtre de sommeil, horaires.
  nightRow: {
    paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md,
    borderRadius: radius.md, marginBottom: spacing.xs, backgroundColor: colors.card,
    gap: spacing.xs,
  },
  nightRowFilled:    { borderLeftWidth: 3, borderLeftColor: colors.primary },
  nightHeader:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nightDate:         { fontSize: 15, fontWeight: '500', color: colors.textMuted },
  nightDateFilled:   { color: colors.text, fontWeight: '600' },
  windowTrack: {
    height: 8, borderRadius: radius.full, backgroundColor: colors.border,
    overflow: 'hidden', marginTop: 2,
  },
  windowSegment: {
    position: 'absolute', top: 0, bottom: 0,
    backgroundColor: colors.primary, borderRadius: radius.full,
  },
  nightMeta:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  nightTime:         { fontSize: 12, color: colors.textMuted },
  nightDuration:     { fontSize: 13, fontWeight: '700', color: colors.primary },
  nightEmpty:        { fontSize: 13, color: colors.textMuted, fontStyle: 'italic' },
  starsRow:          { flexDirection: 'row', gap: 2 },
  // ── Month
  monthNav: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  monthTitle: {
    flex: 1, fontSize: 17, fontWeight: '700',
    color: colors.text, textAlign: 'center', textTransform: 'capitalize',
  },
  navSpacer:         { width: 44 },
  monthNavInline: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  monthContent:      { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  // Carte de moyennes du mois : anneau d'efficacité + durée + endormissement.
  summaryCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  summaryFacts:          { flex: 1, gap: spacing.xs },
  summaryEfficiencyLabel:{ fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  summaryFactRow:        { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  summaryFactValue:      { fontSize: 20, fontWeight: '800', color: colors.primary, minWidth: 70 },
  summaryFactLabel:      { flex: 1, fontSize: 13, color: colors.textMuted },
  // Écran Évolution : sélecteurs + cartes graphiques + note MDR.
  evolutionContent:      { gap: spacing.md },
  chartCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  chartTitle: {
    fontSize: 12, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  evolutionNote:     { fontSize: 12, color: colors.textMuted, fontStyle: 'italic', lineHeight: 17, marginTop: spacing.xs },
  calendarCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    gap: 4,
  },
  calendarHeader:    { flexDirection: 'row', justifyContent: 'space-between' },
  calendarRow:       { flexDirection: 'row', justifyContent: 'space-between' },
  weekday: {
    flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700',
    color: colors.textMuted, textTransform: 'uppercase', paddingBottom: spacing.xs,
  },
  calendarCell: {
    flex: 1, aspectRatio: 1,
    alignItems: 'center', justifyContent: 'center', padding: 2,
  },
  dayDot: {
    width: '85%', aspectRatio: 1, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  dayDotToday:       { borderWidth: 2, borderColor: colors.primary },
  dayNum:            { fontSize: 12, fontWeight: '500', color: colors.textMuted },
  dayNumFilled:      { color: colors.white, fontWeight: '700' },
  dayNumFuture:      { color: colors.border },
  nightmareBadge: {
    position: 'absolute', top: 0, right: 0, width: 12, height: 12,
    borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginTop: spacing.xs,
  },
  statsGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: colors.card,
    borderRadius: radius.lg, padding: spacing.md, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  statValue:         { fontSize: 26, fontWeight: '800', color: colors.primary },
  statLabel:         { fontSize: 13, color: colors.textMuted, marginTop: 2, textAlign: 'center' },
  legendCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md,
    gap: spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  legendRow:         { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  legendDot:         { width: 12, height: 12, borderRadius: 6 },
  legendLabel:       { fontSize: 13, color: colors.textMuted },
  // ── Entry
  entryHeaderBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  entryHeaderTitle:  { flex: 1, gap: 2 },
  entryContent:      { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },
  dateLabel: {
    fontSize: 11, fontWeight: '600', color: colors.primary,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  dateValue:         { fontSize: 17, fontWeight: '700', color: colors.text },
  section:           { gap: spacing.sm },
  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md,
    gap: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  divider:           { height: 1, backgroundColor: colors.border },
  timeFieldGroup:    { gap: spacing.xs },
  fieldLabel:        { fontSize: 14, fontWeight: '600', color: colors.text },
  minutesRow:        { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  minutesInput: {
    width: 72, fontSize: 28, fontWeight: '700', color: colors.primary,
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    textAlign: 'center',
  },
  minutesUnit:       { fontSize: 15, color: colors.textMuted },
  minutesConv:       { fontSize: 15, fontWeight: '600', color: colors.primary },
  counterRow:        { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  counterBtn: {
    width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.background,
    borderWidth: 1, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  counterBtnDisabled:{ opacity: 0.4 },
  counterBtnText:    { fontSize: 24, fontWeight: '300', color: colors.text, lineHeight: 28 },
  counterValue:      { fontSize: 28, fontWeight: '700', color: colors.text, minWidth: 40, textAlign: 'center' },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    gap: spacing.md, paddingVertical: spacing.md,
  },
  toggleLeft:        { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  toggleLabel:       { flex: 1, fontSize: 15, fontWeight: '500', color: colors.text },
  switchTrack: {
    width: 48, height: 28, borderRadius: radius.full,
    backgroundColor: colors.border, padding: 2, justifyContent: 'center',
  },
  switchTrackOn:     { backgroundColor: colors.primary },
  switchThumb: {
    width: 24, height: 24, borderRadius: radius.full,
    backgroundColor: colors.white, alignSelf: 'flex-start',
  },
  switchThumbOn:     { alignSelf: 'flex-end' },
  starsBig:          { flexDirection: 'row', gap: spacing.sm },
  qualityLabel:      { fontSize: 14, color: colors.textMuted, fontStyle: 'italic' },
  notesInput: {
    fontSize: 15, color: colors.text, minHeight: 90, lineHeight: 22,
  },
  // Grille 2×2 des horaires CSD (chaque cellule = un TimePicker).
  timeGrid:          { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  timeCell: {
    flex: 1, minWidth: '45%',
    backgroundColor: colors.card, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md,
  },
  // Carte Efficacité : anneau brut + libellé + explication (aucun jugement).
  efficiencyCard:    { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  efficiencyText:    { flex: 1, gap: 2 },
  efficiencyTitle:   { fontSize: 15, fontWeight: '700', color: colors.text },
  efficiencyHint:    { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  saveBtn: {
    backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
  },
  saveBtnText:       { fontSize: 16, fontWeight: '700', color: colors.white },
  btnDisabled:       { opacity: 0.6 },
  deleteBtn: {
    borderRadius: radius.lg, paddingVertical: spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.danger,
  },
  deleteBtnText:     { fontSize: 15, fontWeight: '600', color: colors.danger },
})
