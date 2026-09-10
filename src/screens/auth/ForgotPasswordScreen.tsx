import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Feather from 'react-native-vector-icons/Feather';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types/navigation';
import api from '../../services/api';
import { FormField } from '../../components/FormField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors } from '../../theme/colors';
import { styles } from './authStyles';

const schema = z.object({
  email: z.string().email('Email inválido'),
});

type FormData = z.infer<typeof schema>;

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;
};

export function ForgotPasswordScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: data.email });
      setSent(true);
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar o email. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={styles.successContainer}>
        <View style={[styles.successIconWrap, { backgroundColor: colors.accentSoftBg }]}>
          <Feather name="mail" size={28} color={colors.accent} />
        </View>
        <Text style={styles.successTitle}>Email enviado!</Text>
        <Text style={styles.successText}>
          Se o email estiver cadastrado, você receberá as instruções para redefinir sua senha.
        </Text>
        <PrimaryButton label="Já tenho um código" onPress={() => navigation.navigate('ResetPassword')} />
        <PrimaryButton label="Voltar ao Login" variant="ghost" onPress={() => navigation.navigate('Login')} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="chevron-left" size={17} color={colors.textSecondary} />
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>

        <View style={styles.brandBlock}>
          <Text style={styles.title}>Recuperar senha</Text>
          <Text style={styles.subtitle}>
            Digite seu email e enviaremos as instruções para criar uma nova senha.
          </Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <FormField
                label="Email cadastrado"
                placeholder="seu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={value}
                onChangeText={onChange}
                error={errors.email?.message}
              />
            )}
          />

          <PrimaryButton label="Enviar instruções" onPress={handleSubmit(onSubmit)} loading={loading} />
          <PrimaryButton label="Já tenho um código" variant="ghost" onPress={() => navigation.navigate('ResetPassword')} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
