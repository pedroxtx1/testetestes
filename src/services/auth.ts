import { supabase } from './supabase';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

type SignUpParams = {
  name: string;
  email: string;
  password: string;
  age: number;
  height: number;
  weight: number;
  goal: string;
  gender: string;
};

export async function signUp({
  name,
  email,
  password,
  age,
  height,
  weight,
  goal,
  gender,
}: SignUpParams) {
  console.log('INICIOU CADASTRO');

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, age, height, weight, goal, gender },
    },
  });

  console.log('AUTH DATA:', data);
  console.log('AUTH ERROR:', error);

  if (error) throw error;

  console.log('AUTH OK, user:', data.user?.id);

  if (data.user) {
    console.log('CRIANDO PERFIL...');

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: data.user.id,
          name,
          age,
          height,
          weight,
          goal,
          gender,
        },
        { onConflict: 'id' }
      );

    console.log('PROFILE ERROR:', profileError);

    if (profileError) {
      console.log('ERRO NO PERFIL, mas continuando...');
    }
  }

  console.log('CADASTRO COMPLETO');
  return data;
}

// signIn agora NÃO lança erro se o perfil não existir
// O onAuthStateChange no App.tsx vai cuidar da navegação
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  return { user: data.user, session: data.session };
}

export async function signInWithGoogle() {
  const redirectUrl = AuthSession.makeRedirectUri();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
    },
  });

  if (error) throw error;
  return data;
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: AuthSession.makeRedirectUri(),
  });
  if (error) throw error;
}

export async function getProfile(userId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
}

export function onAuthChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback);
}
