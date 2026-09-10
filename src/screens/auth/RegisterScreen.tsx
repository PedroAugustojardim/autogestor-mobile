import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Feather from 'react-native-vector-icons/Feather';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types/navigation';
import { useAuthStore } from '../../store/authStore';
import { passwordSchema } from '../../utils/password';
import { FormField } from '../../components/FormField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors } from '../../theme/colors';
import { styles } from './authStyles';

const schema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: passwordSchema,
  confirmPassword: z.string(),
  inviteCode: z.string().trim().min(1, 'Código de convite é obrigatório'),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>;
};

const FIELDS = ['name', 'email', 'password', 'confirmPassword', 'inviteCode'] as const;

const LABELS: Record<string, string> = {
  name: 'Nome completo',
  email: 'Email',
  password: 'Senha',
  confirmPassword: 'Confirmar senha',
  inviteCode: 'Código de convite',
};

const PLACEHOLDERS: Record<string, string> = {
  name: 'Seu nome',
  email: 'seu@email.com',
  password: 'Mínimo 8, com maiúscula, número e símbolo',
  confirmPassword: 'Repita a senha',
  inviteCode: 'Código recebido por email',
};

export function RegisterScreen({ navigation }: Props) {
  const { register: registerUser, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await registerUser(data.name, data.email, data.password, data.inviteCode);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Erro ao criar conta. Tente novamente.';
      Alert.alert('Erro', msg);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="chevron-left" size={17} color={colors.textSecondary} />
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>

        <View style={styles.brandBlock}>
          <Text style={styles.title}>Criar conta</Text>
          <Text style={styles.subtitle}>Comece a controlar seus gastos</Text>
        </View>

        <View style={styles.form}>
          {FIELDS.map((field) => (
            <Controller
              key={field}
              control={control}
              name={field}
              render={({ field: { onChange, value } }) => (
                <FormField
                  label={LABELS[field]}
                  placeholder={PLACEHOLDERS[field]}
                  keyboardType={field === 'email' ? 'email-address' : 'default'}
                  autoCapitalize={field === 'name' ? 'words' : 'none'}
                  secureTextEntry={(field === 'password' || field === 'confirmPassword') && !showPassword}
                  value={value}
                  onChangeText={onChange}
                  error={errors[field]?.message}
                />
              )}
            />
          ))}

          <PrimaryButton
            label={showPassword ? 'Ocultar senhas' : 'Mostrar senhas'}
            variant="ghost"
            onPress={() => setShowPassword(!showPassword)}
          />

          <PrimaryButton label="Criar conta" onPress={handleSubmit(onSubmit)} loading={isLoading} />

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Já tem conta? </Text>
            <PrimaryButton label="Entrar" variant="ghost" onPress={() => navigation.navigate('Login')} />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
