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
import api from '../../services/api';
import { passwordSchema } from '../../utils/password';
import { FormField } from '../../components/FormField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors } from '../../theme/colors';
import { styles } from './authStyles';

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
        <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="chevron-left" size={17} color={colors.textSecondary} />
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>

        <View style={styles.brandBlock}>
          <Text style={styles.title}>Redefinir senha</Text>
          <Text style={styles.subtitle}>Cole o código que enviamos por email e escolha uma nova senha.</Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="token"
            render={({ field: { onChange, value } }) => (
              <FormField
                label="Código recebido por email"
                placeholder="Cole o código aqui"
                autoCapitalize="none"
                autoCorrect={false}
                multiline
                style={styles.tokenInput}
                value={value}
                onChangeText={onChange}
                error={errors.token?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <FormField
                label="Nova senha"
                placeholder="Mínimo 8, com maiúscula, número e símbolo"
                secureTextEntry={!showPassword}
                value={value}
                onChangeText={onChange}
                error={errors.password?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, value } }) => (
              <FormField
                label="Confirmar nova senha"
                placeholder="Repita a nova senha"
                secureTextEntry={!showPassword}
                value={value}
                onChangeText={onChange}
                error={errors.confirmPassword?.message}
              />
            )}
          />

          <PrimaryButton
            label={showPassword ? 'Ocultar senhas' : 'Mostrar senhas'}
            variant="ghost"
            onPress={() => setShowPassword(!showPassword)}
          />

          <PrimaryButton label="Redefinir senha" onPress={handleSubmit(onSubmit)} loading={loading} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
