import { HealthEngine } from './src/models/Engine';
import { signInWithGoogle, getProfile, onAuthChange, resetPassword } from './src/services/auth';
import React, { useState, useRef, useContext, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ScrollView, StyleSheet, Animated, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { PremiumCard, PrimaryButton, SecondaryButton, AppInput, LoadingButton, GoogleAppleButtons, LoadingScreen, COLORS, TabTransitionContext } from './src/ui/components';
import { HomeScreen } from './src/screens/HomeScreen';
import { HealthScreen } from './src/screens/HealthScreen';
import { AiScreen } from './src/screens/AiNutritionScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { SignUpScreen } from './src/screens/SignUpScreen';
import { useAppStore } from './src/store/useAppStore';
import { supabase } from './src/services/supabase';
import { UserProfile } from './src/models/Engine';

const Tab = createBottomTabNavigator();

class ErrorBoundary extends React.Component<any, { hasError: boolean; error?: Error }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error) {
    console.error('Uncaught error in App:', error);
    this.setState({ error });
  }
  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Ocorreu um erro</Text>
          <Text style={{ color: '#5f6368', marginBottom: 20 }}>{this.state.error?.message}</Text>
          <PrimaryButton text="Recarregar" onClick={() => { if (typeof window !== 'undefined') window.location?.reload(); }} />
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

const LoginScreen = () => {
  const { setEnteringFromLogin } = useContext(TabTransitionContext);
  const login = useAppStore(state => state.login);
  const [showSignUp, setShowSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const signUpScale = useRef(new Animated.Value(1)).current;

  const animateSignupButton = (value: number) => {
    Animated.spring(signUpScale, { toValue: value, useNativeDriver: true, speed: 20, bounciness: 8 }).start();
  };

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Preencha e-mail e senha.');
      return;
    }
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (e: any) {
      console.error('Erro no login:', e);
      if (e.message?.includes('Email not confirmed')) {
        alert('Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.');
      } else if (e.message?.includes('Invalid login credentials')) {
        alert('E-mail ou senha incorretos.');
      } else {
        alert('Erro ao entrar: ' + e.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setIsSendingReset(true);
    try {
      await resetPassword(forgotEmail);
      alert('Link de redefinição enviado para o e-mail informado.');
      setShowForgotPassword(false);
    } catch (e: any) {
      alert('Erro ao enviar link: ' + e.message);
    } finally {
      setIsSendingReset(false);
    }
  };

  if (showSignUp) {
    return (
      <SignUpScreen
        onSignUpComplete={async (signUpEmail: string, signUpPassword: string) => {
          setIsLoading(true);
          try {
            await login(signUpEmail, signUpPassword);
          } catch (e: any) {
            console.log('Login pós-cadastro falhou (provável confirmação de e-mail):', e.message);
            if (e.message?.includes('Email not confirmed')) {
              alert('Cadastro realizado! Confirme seu e-mail para entrar.');
            } else {
              alert('Cadastro realizado! Faça login para continuar.');
            }
          } finally {
            setIsLoading(false);
            setShowSignUp(false);
          }
        }}
        onCancel={() => setShowSignUp(false)}
      />
    );
  }

  return (
    <LinearGradient colors={['#E8F5E9', '#F9FAF9']} style={styles.authContainer}>
      <Modal
        visible={showForgotPassword}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowForgotPassword(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Redefinir senha</Text>
            <Text style={styles.modalSubtitle}>Digite seu e-mail e enviaremos um link para redefinir sua senha.</Text>
            <AppInput
              value={forgotEmail}
              onValueChange={setForgotEmail}
              label="E-mail"
            />
            <View style={{ gap: 10, marginTop: 8 }}>
              <LoadingButton
                text="Enviar e-mail"
                onClick={handleForgotPassword}
                isLoading={isSendingReset}
              />
              <TouchableOpacity onPress={() => setShowForgotPassword(false)} style={styles.modalCancel}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={{ paddingVertical: 40 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.authLogoText}>MaisSaúde</Text>
        <View style={styles.loginIconRow}>
          <MaterialIcons name="favorite" size={24} color={COLORS.GreenPrimary} />
          <Text style={styles.loginIconText}>Seu bem-estar começa aqui</Text>
        </View>
        <Text style={styles.authSubtitle}>Saúde, alimentação, hidratação e sono em uma experiência premium.</Text>

        <PremiumCard>
          <View style={{ gap: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Entrar</Text>
            <AppInput value={email} onValueChange={setEmail} label="E-mail" />
            <AppInput value={password} onValueChange={setPassword} label="Senha" isPassword={true} />
            <TouchableOpacity onPress={() => setShowForgotPassword(true)}>
              <Text style={{ color: '#4CAF50', fontWeight: '500' }}>Esqueci minha senha</Text>
            </TouchableOpacity>
            <LoadingButton text="Entrar" onClick={handleLogin} isLoading={isLoading} />
            <Animated.View style={{ transform: [{ scale: signUpScale }] }}>
              <SecondaryButton
                text="Cadastrar"
                onClick={() => setShowSignUp(true)}
                onPressIn={() => animateSignupButton(0.96)}
                onPressOut={() => animateSignupButton(1)}
              />
            </Animated.View>
          </View>
        </PremiumCard>

        <PremiumCard>
          <View style={{ gap: 14 }}>
            <Text style={{ fontSize: 16, fontWeight: '600' }}>Acesso rápido</Text>
            <GoogleAppleButtons
              onGoogle={async () => {
                setIsLoading(true);
                try {
                  await signInWithGoogle();
                } catch (error: any) {
                  alert('Erro ao entrar com Google: ' + error.message);
                  setIsLoading(false);
                }
              }}
              onApple={() => {}}
            />
          </View>
        </PremiumCard>
      </ScrollView>
    </LinearGradient>
  );
};

export default function App() {
  const isAuthenticated = useAppStore(state => state.isAuthenticated);
  const [tabTransition, setTabTransition] = useState({ previousIndex: 0, currentIndex: 0 });
  const [enteringFromLogin, setEnteringFromLogin] = useState(false);

  useEffect(() => {
    const buildProfile = (sessionUser: any, profile: any | null): UserProfile => ({
      name: profile?.name ?? sessionUser?.user_metadata?.name ?? 'Usuário',
      email: sessionUser?.email ?? '',
      age: profile?.age ?? sessionUser?.user_metadata?.age ?? 25,
      sex: profile?.gender ?? sessionUser?.user_metadata?.gender ?? 'Feminino',
      weightKg: profile?.weight ?? sessionUser?.user_metadata?.weight ?? 70,
      heightCm: profile?.height ?? sessionUser?.user_metadata?.height ?? 170,
      goal: profile?.goal ?? sessionUser?.user_metadata?.goal ?? 'Vida saudável',
      activityLevel: 'Moderado',
    });

    const syncSession = async (session: any) => {
      if (!session?.user) return;

      try {
        const profile = await getProfile(session.user.id);
        const userProfile = buildProfile(session.user, profile);
        const healthSummary = HealthEngine.calculateSummary(userProfile);
        useAppStore.setState({ isAuthenticated: true, userProfile, healthSummary });
      } catch (err) {
        console.error('Erro ao carregar perfil no auth sync:', err);
        const userProfile = buildProfile(session.user, null);
        const healthSummary = HealthEngine.calculateSummary(userProfile);
        useAppStore.setState({ isAuthenticated: true, userProfile, healthSummary });
      }
    };

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        void syncSession(data.session);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('onAuthStateChange evento:', event, 'session:', !!session);

      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') && session?.user) {
        setTimeout(() => {
          void syncSession(session);
        }, 0);
      }

      if (event === 'SIGNED_OUT') {
        console.log('Usuário deslogado');
        useAppStore.setState({ isAuthenticated: false, userProfile: null, healthSummary: null });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const TabLabels: { [key: string]: string } = {
    'Início': 'Início', 'Saúde': 'Saúde', 'Agente': 'Agente', 'Perfil': 'Perfil'
  };

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <TabTransitionContext.Provider value={{ previousIndex: tabTransition.previousIndex, currentIndex: tabTransition.currentIndex, enteringFromLogin, setEnteringFromLogin }}>
          <NavigationContainer
            onStateChange={(state) => {
              if (!state) return;
              setTabTransition(prev => ({ previousIndex: prev.currentIndex, currentIndex: state.index }));
            }}
          >
            {isAuthenticated ? (
              <Tab.Navigator
                screenOptions={({ route }) => ({
                  headerShown: false,
                  tabBarActiveTintColor: '#4CAF50',
                  tabBarInactiveTintColor: '#999',
                  tabBarStyle: { height: 80, paddingBottom: 12, paddingTop: 8, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
                  tabBarLabel: ({ focused, color }) => (
                    <Text style={{ fontSize: 11, fontWeight: focused ? '600' : '500', color, marginTop: 4 }}>
                      {TabLabels[route.name] || route.name}
                    </Text>
                  ),
                  tabBarIcon: ({ color, size }) => {
                    if (route.name === 'Agente') return <MaterialIcons name="auto-awesome" size={size + 4} color={color} />;
                    const icons: Record<string, string> = { 'Início': 'home', 'Saúde': 'heartbeat', 'Perfil': 'user-alt' };
                    return <FontAwesome5 name={icons[route.name] || 'home'} size={size + 2} color={color} />;
                  },
                })}
              >
                <Tab.Screen name="Início" component={HomeScreen} />
                <Tab.Screen name="Saúde" component={HealthScreen} />
                <Tab.Screen name="Agente" component={AiScreen} />
                <Tab.Screen name="Perfil" component={ProfileScreen} />
              </Tab.Navigator>
            ) : (
              <LoginScreen />
            )}
          </NavigationContainer>
        </TabTransitionContext.Provider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  authContainer: { flex: 1, paddingHorizontal: 24 },
  authLogoText: { fontSize: 32, fontWeight: '800', color: '#4CAF50', marginTop: 40, marginBottom: 8 },
  loginIconRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  loginIconText: { fontSize: 14, color: COLORS.GreenPrimary, fontWeight: '600' },
  authSubtitle: { fontSize: 16, color: '#5f6368', marginBottom: 24, lineHeight: 22 },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8, color: '#333' },
  modalSubtitle: { fontSize: 14, color: '#5f6368', marginBottom: 16, lineHeight: 20 },
  modalCancel: { marginTop: 8, alignItems: 'center' },
  modalCancelText: { color: '#4CAF50', fontWeight: '600' },
  avatarBadge: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: 'white', fontSize: 22, fontWeight: 'bold' }
});
