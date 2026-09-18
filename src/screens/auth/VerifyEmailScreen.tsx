import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types/navigation';
import { useAuthStore } from '../../store/authStore';
import { FormField } from '../../components/FormField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors } from '../../theme/colors';
import { styles } from './authStyles';
import { getApiErrorMessage } from '../../utils/apiError';

type Props = NativeStackScreenProps<AuthStackParamList, 'VerifyEmail'> & {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'VerifyEmail'>;
};

// Igual ao intervalo mínimo entre envios no backend (VERIFICATION_RESEND_COOLDOWN_MS) —
// antes disso o servidor ignora o pedido, então o link fica travado pra não parecer que
// "reenviou" quando nada foi enviado.
const RESEND_COOLDOWN_SECONDS = 60;

// Tela desenhada no canvas de design (artboards "Confirmar email", "… código errado" e "… vindo do
// login" — https://claude.ai/artifact/FYQmtw2SPeW1Pg9oFLxg4g). Medidas e cores saem de lá.
export function VerifyEmailScreen({ navigation, route }: Props) {
  const { email, justSent } = route.params;
  const { verifyEmail, resendVerification, isLoading } = useAuthStore();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | undefined>();
  // Em cooldown só logo depois do cadastro (o código acabou de sair). Quem chega vindo do
  // login com uma conta pendente pode estar com o código vencido e precisa poder reenviar já.
  const [secondsLeft, setSecondsLeft] = useState(justSent ? RESEND_COOLDOWN_SECONDS : 0);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const onConfirm = async () => {
    const digits = code.trim();
    if (!/^\d{6}$/.test(digits)) {
      setError('Digite os 6 dígitos do código');
      return;
    }
    setError(undefined);
    try {
      // Sucesso abre a sessão e o RootNavigator troca pro app sozinho (isAuthenticated).
      await verifyEmail(email, digits);
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Não foi possível confirmar. Tente novamente.'));
    }
  };

  const onResend = async () => {
    setResending(true);
    try {
      await resendVerification(email);
      setSecondsLeft(RESEND_COOLDOWN_SECONDS);
      Alert.alert('Código enviado', 'Se o cadastro estiver aguardando confirmação, você receberá um novo código por email.');
    } catch (err: any) {
      Alert.alert('Erro', getApiErrorMessage(err, 'Não foi possível reenviar agora. Tente novamente em instantes.'));
    } finally {
      setResending(false);
    }
  };

  const resendDisabled = secondsLeft > 0 || resending;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.container, local.container]} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backRow} onPress={() => navigation.navigate('Login')} hitSlop={8}>
          <Feather name="chevron-left" size={17} color={colors.textSecondary} />
          <Text style={styles.backText}>Voltar ao login</Text>
        </TouchableOpacity>

        <View style={local.header}>
          <Text style={local.title}>Confirme seu email</Text>
          <Text style={local.subtitle}>Enviamos um código de 6 dígitos para</Text>
          <Text style={local.email}>{email}</Text>
        </View>

        <View style={styles.form}>
          <FormField
            label="Código de confirmação"
            placeholder="000000"
            keyboardType="number-pad"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            maxLength={6}
            style={local.codeInput}
            value={code}
            onChangeText={(text) => setCode(text.replace(/\D/g, ''))}
            error={error}
          />

          <PrimaryButton label="Confirmar" onPress={onConfirm} loading={isLoading} disabled={code.length !== 6} />

          <TouchableOpacity style={local.resend} onPress={onResend} disabled={resendDisabled}>
            <Text style={[local.resendText, resendDisabled && local.resendTextDisabled]}>
              {secondsLeft > 0 ? `Reenviar código em ${secondsLeft}s` : 'Reenviar código'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={local.hint}>O código expira em 15 minutos. Confira também a caixa de spam.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Só o que difere do esqueleto compartilhado das telas de auth (authStyles) para bater com o desenho:
// topo 56 e espaço 22 entre blocos, cabeçalho à esquerda, campo de código com altura fixa.
const local = StyleSheet.create({
  container: { paddingTop: 56, gap: 22 },
  header: { gap: 4 },
  title: { fontSize: 22, lineHeight: 27, fontWeight: '700', color: colors.textPrimary },
  subtitle: { fontSize: 13.5, lineHeight: 18, color: colors.textSecondary },
  // Email numa linha própria e em destaque: dentro da frase, um email longo quebrava no meio do domínio.
  email: { fontSize: 13.5, lineHeight: 18, fontWeight: '600', color: colors.textPrimary },
  codeInput: {
    height: 56, paddingVertical: 0, fontSize: 24, letterSpacing: 8, textAlign: 'center', textAlignVertical: 'center',
  },
  resend: { alignSelf: 'center', paddingVertical: 8 },
  resendText: { fontSize: 13.5, fontWeight: '600', color: colors.link },
  resendTextDisabled: { opacity: 0.6 },
  hint: { fontSize: 13.5, lineHeight: 20, color: colors.textSecondary, textAlign: 'center' },
});
