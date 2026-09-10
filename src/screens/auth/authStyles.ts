import { StyleSheet, Platform } from 'react-native';
import { colors } from '../../theme/colors';

// Estilos compartilhados entre as telas de autenticação (Login/Register/ForgotPassword/
// ResetPassword) — todas seguem o mesmo esqueleto visual, então ficam num arquivo só
// em vez de duplicar o StyleSheet em cada tela.
export const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 40,
    gap: 24,
  },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 14, color: colors.textSecondary },

  brandBlock: { alignItems: 'center', gap: 6 },
  logoBadge: {
    width: 52, height: 52, borderRadius: 16, backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  logoBadgeText: { fontSize: 22, fontWeight: '800', color: colors.white },
  title: { fontSize: 21, fontWeight: '700', color: colors.textPrimary },
  subtitle: { fontSize: 13.5, color: colors.textSecondary, textAlign: 'center' },

  form: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 20, padding: 22, gap: 16,
  },

  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { fontSize: 13, color: colors.textSecondary },

  tokenInput: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13, minHeight: 70, textAlignVertical: 'top',
  },

  successContainer: {
    flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center',
    padding: 32, gap: 14,
  },
  successIconWrap: {
    width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  successTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  successText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, maxWidth: 300 },
});
