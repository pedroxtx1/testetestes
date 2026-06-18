import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Animated, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { PremiumCard, PrimaryButton, AppInput, SelectChip, SectionTitle, WaterReservoir, COLORS, PageSlide } from '../ui/components';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../services/supabase';
import { getTodayWater, addWater, resetWater, getTodaySleep, saveSleep, getTodayMeals, addMeal } from '../services/health';

const SECTIONS = ['Água', 'Sono', 'Refeições'];
const SECTION_ICONS: Record<string, string> = { Água: 'tint', Sono: 'bed', Refeições: 'utensils' };

export const HealthScreen = () => {
  const { healthSummary } = useAppStore();
  const [selectedSection, setSelectedSection] = useState('Água');
  const [userId, setUserId] = useState<string | null>(null);

  const [waterGoalInput, setWaterGoalInput] = useState(
    healthSummary?.waterLiters ? (healthSummary.waterLiters * 1000).toString() : '2000'
  );
  const [consumedMl, setConsumedMl] = useState(0);
  const [savingWater, setSavingWater] = useState(false);

  const [savingSleep, setSavingSleep] = useState(false);
  const [sleepGoalInput, setSleepGoalInput] = useState('8.0');
  const [sleepStart, setSleepStart] = useState('23:00');
  const [sleepEnd, setSleepEnd] = useState('07:00');
  const [sleepDuration, setSleepDuration] = useState(0);

  const [meals, setMeals] = useState<any[]>([]);
  const [showMealForm, setShowMealForm] = useState(false);
  const [mealTitle, setMealTitle] = useState('');
  const [mealTime, setMealTime] = useState('');
  const [mealCalories, setMealCalories] = useState('');
  const [mealDescription, setMealDescription] = useState('');
  const [savingMeal, setSavingMeal] = useState(false);

  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
        loadTodayData(data.user.id);
      }
    });
  }, []);

  const loadTodayData = async (uid: string) => {
    const water = await getTodayWater(uid);
    setConsumedMl(water);

    const sleep = await getTodaySleep(uid);
    if (sleep) {
      setSleepDuration(sleep.sleep_hours ?? 0);
      setSleepStart(sleep.sleep_start ?? '23:00');
      setSleepEnd(sleep.sleep_end ?? '07:00');
    }

    const mealsData = await getTodayMeals(uid);
    setMeals(mealsData);
  };

  const handleAddWater = async () => {
  if (!userId) return;
  setSavingWater(true);
  try {
    const newMl = await addWater(userId);
    setConsumedMl(newMl);
  } catch (e) {
    alert('Erro ao registrar água!');
  } finally {
    setSavingWater(false);
  }
};

  const handleResetReservoir = async () => {
    rotateAnim.setValue(0);
    Animated.timing(rotateAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start(() => rotateAnim.setValue(0));
    if (userId) await resetWater(userId);
    setConsumedMl(0);
  };

  const handleSaveSleep = async () => {
    if (!userId) return;
    setSavingSleep(true);
    try {
      const startHour = parseInt(sleepStart.split(':')[0] || '0');
      const startMin = parseInt(sleepStart.split(':')[1] || '0');
      const endHour = parseInt(sleepEnd.split(':')[0] || '0');
      const endMin = parseInt(sleepEnd.split(':')[1] || '0');
      let diff = (endHour * 60 + endMin) - (startHour * 60 + startMin);
      if (diff < 0) diff += 24 * 60;
      const hours = parseFloat((diff / 60).toFixed(1));
      await saveSleep(userId, sleepStart, sleepEnd, hours);
      setSleepDuration(hours);
      alert('Sono registrado com sucesso!');
    } catch (e) {
      alert('Erro ao salvar sono!');
    } finally {
      setSavingSleep(false);
    }
  };

  const handleAddMeal = async () => {
    if (!userId || !mealTitle || !mealCalories) {
      alert('Preencha o nome e as calorias da refeição!');
      return;
    }
    setSavingMeal(true);
    try {
      const newMeal = await addMeal(userId, {
        title: mealTitle,
        time: mealTime || new Date().toTimeString().slice(0, 5),
        calories: parseInt(mealCalories),
        description: mealDescription,
      });
      setMeals(prev => [...prev, newMeal]);
      setMealTitle(''); setMealTime(''); setMealCalories(''); setMealDescription('');
      setShowMealForm(false);
    } catch (e) {
      alert('Erro ao salvar refeição!');
    } finally {
      setSavingMeal(false);
    }
  };

  return (
    <PageSlide tabIndex={1}>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <SectionTitle title="Saúde" subtitle="Água, sono e refeições em uma única experiência organizada" />

          <View style={styles.healthTabHeader}>
            <FontAwesome5 name={SECTION_ICONS[selectedSection]} size={24} color={COLORS.GreenPrimary} />
            <Text style={styles.healthTabLabel}>{selectedSection}</Text>
          </View>

          <View style={styles.chipRow}>
            {SECTIONS.map(sec => (
              <SelectChip key={sec} label={sec} selected={selectedSection === sec} onClick={() => setSelectedSection(sec)} />
            ))}
          </View>

          {selectedSection === 'Água' && (
            <View>
              <PremiumCard>
                <View style={styles.row}>
                  <View style={styles.iconWithMetric}>
                    <FontAwesome5 name="tint" size={26} color={COLORS.GreenPrimary} />
                    <Text style={styles.cardTitle}>Meta diária</Text>
                  </View>
                  <Text style={styles.cardSubtitle}>{consumedMl} / {waterGoalInput} ml</Text>
                </View>
                <AppInput value={waterGoalInput} onValueChange={setWaterGoalInput} label="Meta diária de água (ml)" keyboardType="numeric" />
                <Text style={styles.recommendationText}>Recomendado: {healthSummary?.waterLiters ? healthSummary.waterLiters * 1000 : 2000} ml</Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${Math.min((consumedMl / (parseInt(waterGoalInput) || 1)) * 100, 100)}%` }]} />
                </View>
                <Text style={styles.feedbackText}>
                  {consumedMl >= parseInt(waterGoalInput) ? 'Você bateu a meta diária de água!' : `Faltam ${parseInt(waterGoalInput) - consumedMl} ml`}
                </Text>
                <PrimaryButton text="Adicionar 250 ml" onClick={handleAddWater} />
                {savingWater && (
                  <View style={styles.centeredSaving}>
                    <ActivityIndicator size="small" color={COLORS.GreenPrimary} />
                    <Text style={styles.savingText}>Registrando...</Text>
                  </View>
                )}
              </PremiumCard>

              <PremiumCard>
                <View style={styles.reservoirHeaderRow}>
                  <Text style={[styles.cardTitle, { marginBottom: 0 }]}>Reservatório de água</Text>
                  <TouchableOpacity style={styles.resetIconHeader} onPress={handleResetReservoir}>
                    <Animated.View style={{ transform: [{ rotate: rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}>
                      <FontAwesome5 name="redo" size={16} color={COLORS.GreenPrimary} />
                    </Animated.View>
                  </TouchableOpacity>
                </View>
                <View style={styles.reservoirWrapper}>
                  <WaterReservoir progress={Math.min(consumedMl / (parseInt(waterGoalInput) || 1), 1)} width={120} height={280} goalMl={parseInt(waterGoalInput) || 2000} />
                </View>
                <Text style={styles.cupHintText}>O reservatório enche conforme você bebe água.</Text>
              </PremiumCard>
            </View>
          )}

          {selectedSection === 'Sono' && (
            <PremiumCard>
              <View style={styles.row}>
                <FontAwesome5 name="bed" size={26} color={COLORS.GreenPrimary} style={{ marginRight: 12 }} solid />
                <View>
                  <Text style={styles.cardTitle}>Registro de sono</Text>
                  <Text style={styles.cardSubtitle}>{sleepDuration}h de {sleepGoalInput}h</Text>
                </View>
              </View>
              <AppInput value={sleepGoalInput} onValueChange={setSleepGoalInput} label="Meta diária de sono (horas)" keyboardType="numeric" />
              <Text style={styles.recommendationText}>Recomendado: 8.0 horas</Text>
              <AppInput value={sleepStart} onValueChange={setSleepStart} label="Hora que dormiu (HH:MM)" />
              <AppInput value={sleepEnd} onValueChange={setSleepEnd} label="Hora que acordou (HH:MM)" />
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${Math.min((sleepDuration / (parseFloat(sleepGoalInput) || 1)) * 100, 100)}%` }]} />
              </View>
              {sleepDuration > 0 && <Text style={styles.feedbackText}>Dormiu às {sleepStart} e acordou às {sleepEnd}</Text>}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <PrimaryButton text="Salvar sono" onClick={handleSaveSleep} style={styles.saveInlineButton} />
                {savingSleep && <ActivityIndicator size="small" color={COLORS.GreenPrimary} />}
              </View>
            </PremiumCard>
          )}

          {selectedSection === 'Refeições' && (
            <View>
              <PremiumCard>
                <View style={styles.row}>
                  <FontAwesome5 name="utensils" size={28} color={COLORS.GreenPrimary} style={{ marginRight: 12 }} solid />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>Registro de refeições</Text>
                    <Text style={styles.cardSubtitle}>Refeições do dia</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowMealForm(!showMealForm)}
                    style={{ backgroundColor: COLORS.GreenPrimary, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}>
                    <Text style={{ color: 'white', fontWeight: '600' }}>+ Adicionar</Text>
                  </TouchableOpacity>
                </View>

                {showMealForm && (
                  <View style={{ gap: 10, marginTop: 8 }}>
                    <AppInput value={mealTitle} onValueChange={setMealTitle} label="Nome da refeição" />
                    <AppInput value={mealTime} onValueChange={setMealTime} label="Horário (HH:MM)" />
                    <AppInput value={mealCalories} onValueChange={setMealCalories} label="Calorias (kcal)" keyboardType="numeric" />
                    <AppInput value={mealDescription} onValueChange={setMealDescription} label="Descrição (opcional)" />
                    <PrimaryButton text={savingMeal ? "Salvando..." : "Salvar refeição"} onClick={handleAddMeal} style={styles.saveFullButton} />
                  </View>
                )}
              </PremiumCard>

              {meals.length === 0 ? (
                <PremiumCard>
                  <View style={styles.emptyState}>
                    <FontAwesome5 name="utensils" size={48} color={COLORS.GreenPrimary} solid />
                    <Text style={styles.emptyStateText}>Nenhuma refeição registrada</Text>
                    <Text style={styles.emptyStateSubtext}>Toque em "+ Adicionar" para registrar</Text>
                  </View>
                </PremiumCard>
              ) : (
                meals.map(meal => (
                  <PremiumCard key={meal.id}>
                    <View style={styles.mealCard}>
                      <FontAwesome5 name="utensils" size={24} color={COLORS.GreenPrimary} solid />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.cardTitle}>{meal.title}</Text>
                        <Text style={{ color: COLORS.TextVariant, fontSize: 13 }}>{meal.time}</Text>
                        <Text style={styles.cardSubtitle}>{meal.description}</Text>
                      </View>
                      <Text style={styles.caloriesBadge}>{meal.calories} kcal</Text>
                    </View>
                  </PremiumCard>
                ))
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </PageSlide>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollContent: { padding: 16 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconWithMetric: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: 'black' },
  cardSubtitle: { fontSize: 14, color: '#5f6368' },
  recommendationText: { fontSize: 12, color: '#5f6368', marginBottom: 16, marginLeft: 4 },
  progressBarBg: { height: 14, backgroundColor: '#E8F5E9', borderRadius: 999, width: '100%', marginBottom: 12 },
  progressBarFill: { height: 14, backgroundColor: COLORS.GreenPrimary, borderRadius: 999 },
  feedbackText: { fontWeight: '600', color: 'black', marginBottom: 12 },
  cupHintText: { fontSize: 12, color: COLORS.TextVariant, textAlign: 'center', marginTop: 8 },
  healthTabHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  healthTabLabel: { fontSize: 18, fontWeight: '700', color: 'black' },
  reservoirWrapper: { alignItems: 'center', marginBottom: 14 },
  reservoirHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  resetIconHeader: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(76,175,80,0.08)' },
  centeredSaving: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 6 },
  savingText: { color: COLORS.TextVariant, marginLeft: 8 },
  mealCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  caloriesBadge: { backgroundColor: 'rgba(76, 175, 80, 0.1)', color: COLORS.GreenPrimary, fontWeight: '600', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, fontSize: 12 },
  emptyState: { alignItems: 'center', gap: 12, paddingVertical: 20 },
  emptyStateText: { fontSize: 16, fontWeight: '600', color: 'black' },
  emptyStateSubtext: { fontSize: 14, color: COLORS.TextVariant },
  resetIconButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(76,175,80,0.08)' },
  saveInlineButton: { flex: 1, marginTop: 0 },
  saveFullButton: { width: '100%', flexGrow: 0, flexShrink: 0, marginTop: 0 },
});






