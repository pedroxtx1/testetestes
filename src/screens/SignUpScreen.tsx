import { signUp } from '../services/auth';
import React, { useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PremiumCard, PrimaryButton, AppInput, SelectChip, SectionTitle, COLORS } from '../ui/components';

interface SignUpData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  age: string;
  height: string;
  weight: string;
  goal: 'perda_peso' | 'ganho_massa' | 'manutencao' | '';
  gender: 'masculino' | 'feminino' | '';
  activityLevel: 'sedentario' | 'leve' | 'moderado' | 'intenso' | 'muito_intenso' | '';
}

export const SignUpScreen = ({ onSignUpComplete, onCancel }: {
  onSignUpComplete: (email: string, password: string) => void;
  onCancel: () => void;
}) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<SignUpData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    height: '',
    weight: '',
    goal: '',
    gender: '',
    activityLevel: '',
  });
  const buttonScale = useRef(new Animated.Value(1)).current;
  const closeScale = useRef(new Animated.Value(1)).current;

  const animateButton = (animatedValue: Animated.Value, toValue: number) => {
    Animated.spring(animatedValue, {
      toValue,
      useNativeDriver: false,
      speed: 20,
      bounciness: 10,
    }).start();
  };

  const updateData = (field: keyof SignUpData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleNextStep = async () => {
    if (step === 1) {
      if (
        data.name &&
        data.email &&
        data.password === data.confirmPassword &&
        data.password.length >= 6
      ) {
        setStep(2);
      } else {
        alert('Por favor, preencha todos os campos corretamente');
      }
    } else if (step === 2) {
      if (data.age && data.height && data.weight && data.goal && data.gender && data.activityLevel) {
        try {
          const result = await signUp({
            name: data.name,
            email: data.email,
            password: data.password,
            age: Number(data.age),
            height: Number(data.height),
            weight: Number(data.weight),
            goal: data.goal,
            gender: data.gender,
            activityLevel: data.activityLevel,
          });

          if (result?.session) {
            onSignUpComplete(data.email, data.password);
          } else {
            alert('Cadastro criado, mas o Supabase está pedindo confirmação de e-mail. Confirme a caixa de entrada ou desative a confirmação em Auth > Providers > Email.');
            onCancel();
          }

        } catch (error: any) {
          if (error.message === 'User already registered') {
            alert('Este e-mail já está cadastrado! Tente fazer login.');
          } else if (error.message?.includes('Password should be')) {
            alert('A senha deve ter pelo menos 6 caracteres.');
          } else if (error.message?.includes('Invalid email')) {
            alert('E-mail inválido. Verifique o formato.');
          } else {
            alert('Erro ao criar conta: ' + (error.message || 'Tente novamente.'));
          }
        }
      } else {
        alert('Por favor, preencha todos os dados');
      }
    }
  };

  const goals = [
    { label: 'Perder peso', value: 'perda_peso' },
    { label: 'Ganho de Massa', value: 'ganho_massa' },
    { label: 'Manutenção', value: 'manutencao' },
  ];

  const genders = [
    { label: 'Masculino', value: 'masculino' },
    { label: 'Feminino', value: 'feminino' },
  ];

  const activityLevels = [
    { label: 'Sedentário', value: 'sedentario' },
    { label: 'Leve', value: 'leve' },
    { label: 'Moderado', value: 'moderado' },
    { label: 'Intenso', value: 'intenso' },
    { label: 'Muito Intenso', value: 'muito_intenso' },
  ];

  return (
    <LinearGradient colors={['#E8F5E9', '#F9FAF9']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <Animated.View style={{ transform: [{ scale: closeScale }] }}>
              <TouchableOpacity
                onPress={step === 2 ? () => setStep(1) : onCancel}
                style={styles.backButton}
                onPressIn={() => animateButton(closeScale, 0.92)}
                onPressOut={() => animateButton(closeScale, 1)}
              >
                <MaterialIcons name={step === 2 ? 'arrow-back' : 'close'} size={24} color={COLORS.GreenPrimary} />
              </TouchableOpacity>
            </Animated.View>
            <Text style={styles.title}>Criar Conta</Text>
            <View style={styles.stepIndicator}>
              <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
              <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
            </View>
          </View>

          {step === 1 ? (
            <>
              <SectionTitle title="Informações Pessoais" subtitle="Dados essenciais para sua conta" />
              <PremiumCard>
                <View style={{ gap: 14 }}>
                  <AppInput
                    value={data.name}
                    onValueChange={(value: string) => updateData('name', value)}
                    label="Nome completo"
                  />
                  <AppInput
                    value={data.email}
                    onValueChange={(value: string) => updateData('email', value)}
                    label="E-mail"
                    keyboardType="email-address"
                  />
                  <AppInput
                    value={data.password}
                    onValueChange={(value: string) => updateData('password', value)}
                    label="Senha"
                    isPassword={true}
                  />
                  <AppInput
                    value={data.confirmPassword}
                    onValueChange={(value: string) => updateData('confirmPassword', value)}
                    label="Confirmar senha"
                    isPassword={true}
                  />
                </View>
              </PremiumCard>
            </>
          ) : (
            <>
              <SectionTitle title="Dados de Saúde" subtitle="Informações para personalizar sua experiência" />
              <PremiumCard>
                <View style={{ gap: 14 }}>
                  <AppInput
                    value={data.age}
                    onValueChange={(value: string) => updateData('age', value)}
                    label="Idade"
                    keyboardType="numeric"
                  />
                  <AppInput
                    value={data.height}
                    onValueChange={(value: string) => updateData('height', value)}
                    label="Altura (cm)"
                    keyboardType="decimal-pad"
                  />
                  <AppInput
                    value={data.weight}
                    onValueChange={(value: string) => updateData('weight', value)}
                    label="Peso (kg)"
                    keyboardType="decimal-pad"
                  />
                </View>
              </PremiumCard>

              <SectionTitle title="Objetivo" subtitle="Qual é o seu objetivo?" />
              <PremiumCard>
                <View style={styles.chipRow}>
                  {goals.map((goal) => (
                    <SelectChip
                      key={goal.value}
                      label={goal.label}
                      selected={data.goal === goal.value}
                      onClick={() => updateData('goal', goal.value)}
                    />
                  ))}
                </View>
              </PremiumCard>

              <SectionTitle title="Gênero" subtitle="Para recomendações personalizadas" />
              <PremiumCard>
                <View style={styles.chipRow}>
                  {genders.map((gender) => (
                    <SelectChip
                      key={gender.value}
                      label={gender.label}
                      selected={data.gender === gender.value}
                      onClick={() => updateData('gender', gender.value)}
                    />
                  ))}
                </View>
              </PremiumCard>

              <SectionTitle title="Nível de Atividade Física" subtitle="Para cálculos precisos de calorias" />
              <PremiumCard>
                <View style={styles.chipRow}>
                  {activityLevels.map((level) => (
                    <SelectChip
                      key={level.value}
                      label={level.label}
                      selected={data.activityLevel === level.value}
                      onClick={() => updateData('activityLevel', level.value)}
                    />
                  ))}
                </View>
              </PremiumCard>
            </>
          )}

          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <PrimaryButton
              text={step === 1 ? 'Próximo' : 'Concluir Cadastro'}
              onClick={handleNextStep}
              onPressIn={() => animateButton(buttonScale, 0.96)}
              onPressOut={() => animateButton(buttonScale, 1)}
            />
          </Animated.View>
        </SafeAreaView>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingVertical: 20 },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.GreenPrimary, marginBottom: 12, textAlign: 'center' },
  backButton: { marginBottom: 12 },
  stepIndicator: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E0E0E0' },
  stepDotActive: { backgroundColor: COLORS.GreenPrimary, width: 24 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
});