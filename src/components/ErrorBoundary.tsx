import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { reportClientError } from '../services/errorReporter';
import { colors } from '../theme/colors';

interface State { hasError: boolean }

// Sem isto, um erro de render em qualquer tela derrubava o app inteiro (tela
// branca/crash) sem nenhum rastro. Error Boundary só pega erro de render/ciclo de
// vida — erro em handler de evento/async cai no ErrorUtils.setGlobalHandler (index.js).
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const where = info.componentStack?.split('\n').find((l) => l.trim().length > 0)?.trim();
    reportClientError(error, `ErrorBoundary${where ? `: ${where}` : ''}`);
  }

  reset = () => this.setState({ hasError: false });

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Algo deu errado</Text>
        <Text style={styles.subtitle}>O erro foi registrado. Tente novamente.</Text>
        <TouchableOpacity style={styles.button} onPress={this.reset}>
          <Text style={styles.buttonText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center',
    padding: 32, gap: 12,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  subtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  button: {
    marginTop: 8, backgroundColor: colors.accent, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 24,
  },
  buttonText: { color: colors.white, fontSize: 15, fontWeight: '700' },
});
