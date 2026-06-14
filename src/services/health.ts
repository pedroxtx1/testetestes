import { supabase } from './supabase';

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export async function getTodayWater(userId: string): Promise<number> {
  try {
    const { data } = await supabase
      .from('health_daily')
      .select('water_ml')
      .eq('user_id', userId)
      .eq('date', today())
      .single();
    return data?.water_ml ?? 0;
  } catch { return 0; }
}

export async function addWater(userId: string): Promise<number> {
  const currentMl = await getTodayWater(userId);
  const newMl = currentMl + 250;
  
  await supabase
    .from('health_daily')
    .upsert({ user_id: userId, date: today(), water_ml: newMl }, { onConflict: 'user_id,date' });
  
  return newMl;
}

export async function resetWater(userId: string): Promise<void> {
  await supabase
    .from('health_daily')
    .upsert({ user_id: userId, date: today(), water_ml: 0 }, { onConflict: 'user_id,date' });
}

export async function getTodaySleep(userId: string) {
  try {
    const { data } = await supabase
      .from('health_daily')
      .select('sleep_hours, sleep_start, sleep_end')
      .eq('user_id', userId)
      .eq('date', today())
      .single();
    return data;
  } catch { return null; }
}

export async function saveSleep(userId: string, sleepStart: string, sleepEnd: string, sleepHours: number): Promise<void> {
  await supabase
    .from('health_daily')
    .upsert({
      user_id: userId,
      date: today(),
      sleep_hours: sleepHours,
      sleep_start: sleepStart,
      sleep_end: sleepEnd,
    }, { onConflict: 'user_id,date' });
}

export async function getTodayMeals(userId: string) {
  try {
    const { data } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today()) // ← usa a data local correta
      .order('created_at', { ascending: true });
    return (data ?? []).map((m: any) => ({
      ...m,
      title: m.title || m.meal_name,
    }));
  } catch { return []; }
}

export async function addMeal(userId: string, meal: { 
  title: string; 
  time: string; 
  calories: number; 
  description: string 
}) {
  const { data, error } = await supabase
    .from('meals')
    .insert({
      user_id: userId,
      meal_name: meal.title,
      title: meal.title,
      time: meal.time,
      calories: meal.calories,
      description: meal.description || '',
      date: new Date().toISOString().split('T')[0],
      proteins: 0,
      carbs: 0,
      fats: 0,
    });

  if (error) {
    console.error('Supabase error:', error);
    throw error;
  }

  return {
    id: Date.now().toString(),
    user_id: userId,
    title: meal.title,
    meal_name: meal.title,
    time: meal.time,
    calories: meal.calories,
    description: meal.description,
    date: new Date().toISOString().split('T')[0],
  };
}

export async function updateProfileDB(userId: string, profile: {
  name: string; age: number; height: number; weight: number; goal: string; gender: string;
}) {
  const { error } = await supabase.from('profiles').update(profile).eq('id', userId);
  if (error) throw error;
}