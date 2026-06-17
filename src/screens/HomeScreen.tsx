import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { GradientHeader, PremiumCard, SectionTitle, MetricRow, COLORS, PageSlide } from '../ui/components';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../services/supabase';
import { getTodayWater, getTodaySleep } from '../services/health';

export const HomeScreen = () => {
  const { userProfile, healthSummary } = useAppStore();

  const [waterMl, setWaterMl] = useState(0);
  const [sleepHours, setSleepHours] = useState(0);
  const [caloriesConsumed, setCaloriesConsumed] = useState(0);
  const [loading, setLoading] = useState(true);

  const waterGoalMl = healthSummary ? healthSummary.waterLiters * 1000 : 2700;
  const sleepGoal = healthSummary?.sleepHours ?? 8.0;
  const caloriesGoal = healthSummary?.calories ?? 2154;

  useEffect(() => {
    loadTodayData();
  }, []);

  const loadTodayData = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      const uid = data.user.id;

      const water = await getTodayWater(uid);
      setWaterMl(water);

      const sleep = await getTodaySleep(uid);
      setSleepHours(sleep?.sleep_hours ?? 0);

      const today = new Date().toISOString().split('T')[0];
      const { data: meals } = await supabase
        .from('meals')
        .select('calories')
        .eq('user_id', uid)
        .eq('date', today);
      const totalCal = (meals ?? []).reduce((sum: number, m: any) => sum + (m.calories ?? 0), 0);
      setCaloriesConsumed(totalCal);
    } catch (e) {
      console.error('Erro ao carregar dados do home:', e);
    } finally {
      setLoading(false);
    }
  };

  const metrics = [
    {
      title: "Hidratação",
      value: `${(waterMl / 1000).toFixed(1)} / ${(waterGoalMl / 1000).toFixed(1)} L`,
      subtitle: waterMl >= waterGoalMl ? '✓ Meta batida!' : `Faltam ${waterGoalMl - waterMl} ml`,
      progress: Math.min(waterMl / waterGoalMl, 1),
      color: '#81C784',
      icon: 'tint'
    },
    {
      title: "Sono",
      value: `${sleepHours.toFixed(1)} / ${sleepGoal} h`,
      subtitle: sleepHours >= sleepGoal ? '✓ Meta batida!' : `Faltam ${(sleepGoal - sleepHours).toFixed(1)} h`,
      progress: Math.min(sleepHours / sleepGoal, 1),
      color: '#A5D6A7',
      icon: 'moon'
    },
    {
      title: "Calorias",
      value: `${caloriesConsumed} / ${caloriesGoal} kcal`,
      subtitle: caloriesConsumed >= caloriesGoal ? '✓ Meta batida!' : `Faltam ${caloriesGoal - caloriesConsumed} kcal`,
      progress: Math.min(caloriesConsumed / caloriesGoal, 1),
      color: '#4CAF50',
      icon: 'fire'
    },
    {
      title: "Passos",
      value: `—`,
      subtitle: `Sensor não disponível`,
      progress: 0,
      color: '#66BB6A',
      icon: 'shoe-prints'
    }
  ];

  const insights = [
    {
      icon: 'heartbeat',
      title: "Leitura corporal",
      description: `Seu IMC atual é ${healthSummary?.bmi ?? 0}, classificado como ${healthSummary?.bmiLabel?.toLowerCase() ?? 'saudável'}.`,
      highlight: `Peso ideal em torno de ${healthSummary?.idealWeightKg ?? 0} kg`
    },
    {
      icon: 'calendar-check',
      title: "Rotina inteligente",
      description: `Para ${userProfile?.goal?.toLowerCase() ?? 'vida saudável'}, a agente sugere constância em sono, água e refeições.`,
      highlight: `${(waterGoalMl / 1000).toFixed(1)} L de água e ${sleepGoal} h de sono`
    },
    {
      icon: 'apple-alt',
      title: "Plano alimentar",
      description: "A distribuição calórica sugerida foi montada com base em idade, sexo, peso e altura.",
      highlight: `${caloriesGoal} kcal por dia`
    }
  ];

  return (
    <PageSlide tabIndex={0}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <GradientHeader
            title={`Olá, ${userProfile?.name || 'Usuário'}`}
            subtitle="Seu painel premium reúne IMC, peso ideal, hidratação, sono, calorias e progresso diário."
          />

          <PremiumCard>
            <View style={styles.cardContentGap}>
              <SectionTitle title="Resumo corporal" subtitle="Baseado nos seus dados atuais" />
              <MetricRow label="IMC" value={`${healthSummary?.bmi ?? '—'} (${healthSummary?.bmiLabel ?? '—'})`} />
              <MetricRow label="Peso ideal" value={`${healthSummary?.idealWeightKg ?? '—'} kg`} />
              <MetricRow label="Água recomendada" value={`${healthSummary?.waterLiters ?? '—'} L`} />
              <MetricRow label="Calorias diárias" value={`${healthSummary?.calories ?? '—'} kcal`} />
              <MetricRow label="Sono recomendado" value={`${healthSummary?.sleepHours ?? '—'} horas`} />
            </View>
          </PremiumCard>

          <Text style={styles.sectionTitleText}>Progresso diário</Text>

          <View style={styles.gridContainer}>
            {metrics.map((metric, index) => (
              <View key={index} style={styles.gridItem}>
                <PremiumCard style={{ marginBottom: 0, height: '100%' }}>
                  <View style={styles.metricCardInternal}>
                    <View style={styles.metricHeader}>
                      <Text style={styles.metricTitle}>{metric.title}</Text>
                      <FontAwesome5 name={metric.icon} size={18} color={metric.color} solid />
                    </View>
                    <Text style={[styles.metricValue, { color: metric.color }]}>{metric.value}</Text>
                    <Text style={styles.metricSubtitle}>{metric.subtitle}</Text>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${metric.progress * 100}%`, backgroundColor: metric.color }]} />
                    </View>
                  </View>
                </PremiumCard>
              </View>
            ))}
          </View>

          <SectionTitle title="Insights da agente" subtitle="Leituras personalizadas para o seu momento atual" />

          <View style={styles.cardContentGap}>
            {insights.map((insight, index) => (
              <PremiumCard key={index} style={{ marginBottom: 14 }}>
                <View style={styles.insightGap}>
                  <View style={styles.insightHeader}>
                    <FontAwesome5 name={insight.icon} size={16} color={COLORS.GreenPrimary} solid />
                    <Text style={styles.insightTitle}>{insight.title}</Text>
                  </View>
                  <Text style={styles.insightDesc}>{insight.description}</Text>
                  <Text style={styles.insightHighlight}>{insight.highlight}</Text>
                </View>
              </PremiumCard>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </PageSlide>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAF9' },
  scrollContent: { padding: 16 },
  cardContentGap: { gap: 12 },
  sectionTitleText: { fontSize: 20, fontWeight: '600', color: 'black', marginBottom: 14, marginTop: 4 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 18, gap: 12 },
  gridItem: { width: '48%', height: 160 },
  metricCardInternal: { gap: 6, justifyContent: 'space-between', height: '100%' },
  metricHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricTitle: { fontSize: 16, fontWeight: '600', color: 'black' },
  metricValue: { fontSize: 20, fontWeight: '700' },
  metricSubtitle: { fontSize: 13, color: COLORS.TextVariant, lineHeight: 17 },
  progressTrack: { height: 10, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 999, overflow: 'hidden', marginTop: 4 },
  progressFill: { height: '100%', borderRadius: 999 },
  insightGap: { gap: 8 },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  insightTitle: { fontSize: 16, fontWeight: '600', color: 'black' },
  insightDesc: { fontSize: 14, color: COLORS.TextVariant, lineHeight: 20 },
  insightHighlight: { fontSize: 14, fontWeight: '600', color: COLORS.GreenPrimary }
});