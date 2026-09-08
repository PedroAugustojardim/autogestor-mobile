import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types/navigation';
import api from '../../services/api';
import { passwordSchema } from '../../utils/password';

const schema = z.object({
  token: z.string().trim().min(1, 'Cole o código recebido por email'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'ResetPassword'>;
};

export function ResetPasswordScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token: data.token, password: data.password });
      Alert.alert('Senha redefinida', 'Sua senha foi alterada. Faça login com a nova senha.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Código inválido ou expirado. Peça um novo email.';
      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Redefinir senha</Text>
        <Text style={styles.subtitle}>
          Cole o código que enviamos por email e escolha uma nova senha.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Código recebido por email</Text>
          <Controller
            control={control}
            name="token"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, styles.tokenInput, errors.token && styles.inputError]}
                placeholder="Cole o código aqui"
                placeholderTextColor="#9E9E9E"
                autoCapitalize="none"
                autoCorrect={false}
                multiline
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          {errors.token && <Text style={styles.errorText}>{errors.token.message}</Text>}

          <Text style={styles.label}>Nova senha</Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.password && styles.inputError]}
                placeholder="Mínimo 8, com maiúscula, número e símbolo"
                placeholderTextColor="#9E9E9E"
                secureTextEntry={!showPassword}
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

          <Text style={styles.label}>Confirmar nova senha</Text>
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.confirmPassword && styles.inputError]}
                placeholder="Repita a nova senha"
                placeholderTextColor="#9E9E9E"
                secureTextEntry={!showPassword}
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>}

          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Text style={styles.showPass}>{showPassword ? 'Ocultar senhas' : 'Mostrar senhas'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#FFF" />
              : <Text style={styles.buttonText}>Redefinir senha</Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backBtn: { marginBottom: 16 },
  backText: { color: '#1B5E20', fontSize: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1B5E20' },
  subtitle: { fontSize: 15, color: '#616161', marginTop: 6, marginBottom: 28, lineHeight: 22 },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  label: { fontSize: 14, fontWeight: '600', color: '#424242', marginBottom: 6, marginTop: 14 },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#212121',
    backgroundColor: '#FAFAFA',
  },
  tokenInput: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 13, minHeight: 70, textAlignVertical: 'top' },
  inputError: { borderColor: '#E53935' },
  errorText: { color: '#E53935', fontSize: 12, marginTop: 4 },
  showPass: { color: '#1B5E20', fontSize: 13, marginTop: 12, textAlign: 'right' },
  button: {
    backgroundColor: '#1B5E20',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});
