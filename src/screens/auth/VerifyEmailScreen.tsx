import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
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
// antes disso o servidor ignora o pedido, então o botão fica travado pra não parecer que
// "reenviou" quando nada foi enviado.
const RESEND_COOLDOWN_SECONDS = 60;

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

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backRow} onPress={() => navigation.navigate('Login')} hitSlop={8}>
          <Feather name="chevron-left" size={17} color={colors.textSecondary} />
          <Text style={styles.backText}>Voltar ao login</Text>
        </TouchableOpacity>

        <View style={styles.brandBlock}>
          <Text style={styles.title}>Confirme seu email</Text>
          <Text style={styles.subtitle}>Enviamos um código de 6 dígitos para</Text>
          <Text style={styles.emailHighlight}>{email}</Text>
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
            style={{ fontSize: 24, letterSpacing: 8, textAlign: 'center' }}
            value={code}
            onChangeText={(text) => setCode(text.replace(/\D/g, ''))}
            error={error}
          />

          <PrimaryButton label="Confirmar" onPress={onConfirm} loading={isLoading} disabled={code.length !== 6} />

          <PrimaryButton
            label={secondsLeft > 0 ? `Reenviar código em ${secondsLeft}s` : 'Reenviar código'}
            variant="ghost"
            onPress={onResend}
            disabled={secondsLeft > 0}
            loading={resending}
          />
        </View>

        <Text style={styles.subtitle}>O código expira em 15 minutos. Confira também a caixa de spam.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
