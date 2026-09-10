import React from 'react';
import {
  View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types/navigation';
import { useAuthStore } from '../../store/authStore';
import { FormField } from '../../components/FormField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors } from '../../theme/colors';
import { styles } from './authStyles';

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
        <View style={styles.brandBlock}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>A</Text>
          </View>
          <Text style={styles.title}>AutoGestor</Text>
          <Text style={styles.subtitle}>Entre na sua conta</Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <FormField
                label="Email"
                placeholder="seu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={value}
                onChangeText={onChange}
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <FormField
                label="Senha"
                placeholder="Sua senha"
                secureToggle
                value={value}
                onChangeText={onChange}
                error={errors.password?.message}
              />
            )}
          />

          <PrimaryButton
            label="Esqueci minha senha"
            variant="ghost"
            onPress={() => navigation.navigate('ForgotPassword')}
          />

          <PrimaryButton
            label="Entrar"
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
          />

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Não tem conta? </Text>
            <PrimaryButton label="Criar conta" variant="ghost" onPress={() => navigation.navigate('Register')} />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
