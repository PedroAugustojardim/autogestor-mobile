import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types/navigation';
import api from '../../services/api';

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
        <Text style={styles.successIcon}>📧</Text>
        <Text style={styles.successTitle}>Email enviado!</Text>
        <Text style={styles.successText}>
          Se o email estiver cadastrado, você receberá as instruções para redefinir sua senha.
        </Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.buttonText}>Voltar ao Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Recuperar senha</Text>
        <Text style={styles.subtitle}>
          Digite seu email e enviaremos as instruções para criar uma nova senha.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Email cadastrado</Text>
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

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#FFF" />
              : <Text style={styles.buttonText}>Enviar instruções</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', paddingHorizontal: 24, paddingTop: 60 },
  backBtn: { marginBottom: 24 },
  backText: { color: '#1B5E20', fontSize: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1B5E20', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#616161', lineHeight: 22, marginBottom: 32 },
  form: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 24,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4,
  },
  label: { fontSize: 14, fontWeight: '600', color: '#424242', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: '#212121', backgroundColor: '#FAFAFA',
  },
  inputError: { borderColor: '#E53935' },
  errorText: { color: '#E53935', fontSize: 12, marginTop: 4 },
  button: { backgroundColor: '#1B5E20', borderRadius: 8, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  successContainer: { flex: 1, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center', padding: 32 },
  successIcon: { fontSize: 64, marginBottom: 24 },
  successTitle: { fontSize: 24, fontWeight: 'bold', color: '#1B5E20', marginBottom: 12 },
  successText: { fontSize: 15, color: '#616161', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
});
