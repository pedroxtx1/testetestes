import { create } from 'zustand';
import { UserProfile, HealthSummary, HealthEngine } from '../models/Engine';
import { signIn as supabaseSignIn, getProfile } from '../services/auth';
import { supabase } from '../services/supabase';

interface AppState {
  isAuthenticated: boolean;
  userProfile: UserProfile | null;
  healthSummary: HealthSummary | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profile: UserProfile) => void;
}

function buildProfile(user: any, profile: any | null): UserProfile {
  return {
    name: profile?.name ?? user?.user_metadata?.name ?? 'Usuário',
    email: user?.email ?? '',
    age: profile?.age ?? user?.user_metadata?.age ?? 25,
    sex: profile?.gender ?? user?.user_metadata?.gender ?? 'Feminino',
    weightKg: profile?.weight ?? user?.user_metadata?.weight ?? 70,
    heightCm: profile?.height ?? user?.user_metadata?.height ?? 170,
    goal: profile?.goal ?? user?.user_metadata?.goal ?? 'Vida saudável',
    activityLevel: profile?.activityLevel ?? 'Moderado',
  };
}

export const useAppStore = create<AppState>((set) => ({
  isAuthenticated: false,
  userProfile: null,
  healthSummary: null,

  // Faz a autenticação e já sobe o estado local imediatamente
  // quando o Supabase devolve uma sessão válida.
  login: async (email: string, password: string) => {
    console.log('Tentando login com:', email);
    const { user, session } = await supabaseSignIn(email, password);
    console.log('Login Supabase OK, user:', user?.id);

    if (session?.user) {
      try {
        const profile = await getProfile(session.user.id);
        const userProfile = buildProfile(session.user, profile);
        set({
          isAuthenticated: true,
          userProfile,
          healthSummary: HealthEngine.calculateSummary(userProfile),
        });
      } catch (err) {
        console.warn('Não foi possível carregar profile no login, usando metadata:', err);
        const userProfile = buildProfile(session.user, null);
        set({
          isAuthenticated: true,
          userProfile,
          healthSummary: HealthEngine.calculateSummary(userProfile),
        });
      }
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ isAuthenticated: false, userProfile: null, healthSummary: null });
  },

  updateProfile: (profile: UserProfile) => {
    const summary = HealthEngine.calculateSummary(profile);
    set({ userProfile: profile, healthSummary: summary });
  },
}));
