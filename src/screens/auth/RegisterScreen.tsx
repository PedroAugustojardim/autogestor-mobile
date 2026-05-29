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
import { useAuthStore } from '../../store/authStore';

const schema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>;
};

export function RegisterScreen({ navigation }: Props) {
  const { register: registerUser, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await registerUser(data.name, data.email, data.password);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Erro ao criar conta. Tente novamente.';
      Alert.alert('Erro', msg);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Criar conta</Text>
        <Text style={styles.subtitle}>Comece a controlar seus gastos</Text>

        <View style={styles.form}>
          {(['name', 'email', 'password', 'confirmPassword'] as const).map((field) => {
            const labels: Record<string, string> = {
              name: 'Nome completo',
              email: 'Email',
              password: 'Senha',
              confirmPassword: 'Confirmar senha',
            };
            const placeholders: Record<string, string> = {
              name: 'Seu nome',
              email: 'seu@email.com',
              password: 'Mínimo 6 caracteres',
              confirmPassword: 'Repita a senha',
            };
            return (
              <View key={field}>
                <Text style={styles.label}>{labels[field]}</Text>
                <Controller
                  control={control}
                  name={field}
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={[styles.input, errors[field] && styles.inputError]}
                      placeholder={placeholders[field]}
                      placeholderTextColor="#9E9E9E"
                      keyboardType={field === 'email' ? 'email-address' : 'default'}
                      autoCapitalize={field === 'name' ? 'words' : 'none'}
                      secureTextEntry={(field === 'password' || field === 'confirmPassword') && !showPassword}
                      value={value}
                      onChangeText={onChange}
                    />
                  )}
                />
                {errors[field] && <Text style={styles.errorText}>{errors[field]?.message}</Text>}
              </View>
            );
          })}

          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Text style={styles.showPass}>{showPassword ? 'Ocultar senhas' : 'Mostrar senhas'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            {isLoading
              ? <ActivityIndicator color="#FFF" />
              : <Text style={styles.buttonText}>Criar conta</Text>
            }
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Já tem conta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Entrar</Text>
            </TouchableOpacity>
          </View>
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
  subtitle: { fontSize: 15, color: '#616161', marginTop: 6, marginBottom: 28 },
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
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  loginText: { color: '#616161', fontSize: 14 },
  loginLink: { color: '#1B5E20', fontSize: 14, fontWeight: '600' },
});
