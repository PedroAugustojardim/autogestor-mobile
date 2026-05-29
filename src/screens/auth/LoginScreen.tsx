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
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

type FormData = z.infer<typeof schema>;

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

export function LoginScreen({ navigation }: Props) {
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Erro ao fazer login. Tente novamente.';
      Alert.alert('Erro', msg);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>AutoGestor</Text>
        <Text style={styles.subtitle}>Entre na sua conta</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="seu@email.com"
                placeholderTextColor="#9E9E9E"
                keyboardType="email-address"
                autoCapitalize="none"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}

          <Text style={styles.label}>Senha</Text>
          <View style={styles.passwordContainer}>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.passwordInput, errors.password && styles.inputError]}
                  placeholder="Sua senha"
                  placeholderTextColor="#9E9E9E"
                  secureTextEntry={!showPassword}
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
              <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgotText}>Esqueci minha senha</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            {isLoading
              ? <ActivityIndicator color="#FFF" />
              : <Text style={styles.buttonText}>Entrar</Text>
            }
          </TouchableOpacity>

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Não tem conta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Criar conta</Text>
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
    paddingTop: 80,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1B5E20',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#616161',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 40,
  },
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 6,
    marginTop: 16,
  },
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
  inputError: {
    borderColor: '#E53935',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#212121',
    borderWidth: 0,
  },
  eyeBtn: {
    paddingHorizontal: 14,
  },
  eyeText: {
    fontSize: 18,
  },
  errorText: {
    color: '#E53935',
    fontSize: 12,
    marginTop: 4,
  },
  forgotText: {
    color: '#1B5E20',
    fontSize: 14,
    textAlign: 'right',
    marginTop: 12,
  },
  button: {
    backgroundColor: '#1B5E20',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    color: '#616161',
    fontSize: 14,
  },
  registerLink: {
    color: '#1B5E20',
    fontSize: 14,
    fontWeight: '600',
  },
});
