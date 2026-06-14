export interface UserProfile {
  name: string; email: string; age: number; sex: string;
  weightKg: number; heightCm: number; goal: string; activityLevel: string;
}

export interface HealthSummary {
  bmi: number; bmiLabel: string; idealWeightKg: number;
  waterLiters: number; calories: number; sleepHours: number; dietFocus: string;
}

export const HealthEngine = {
  defaultProfile: (): UserProfile => ({
    name: "Ana Paula", email: "ana@maissaude.app", age: 29, sex: "Feminino",
    weightKg: 68.0, heightCm: 167.0, goal: "Vida saudável", activityLevel: "Moderado"
  }),
  calculateSummary: (profile: UserProfile): HealthSummary => {
    const heightM = profile.heightCm / 100.0;
    const bmi = profile.weightKg / Math.pow(heightM, 2);
    return {
      bmi: parseFloat(bmi.toFixed(1)),
      bmiLabel: bmi < 18.5 ? "Abaixo do peso" : bmi < 25 ? "Saudável" : "Sobrepeso",
      idealWeightKg: parseFloat((22.0 * Math.pow(heightM, 2)).toFixed(1)),
      waterLiters: parseFloat((profile.weightKg * 0.04).toFixed(1)),
      calories: Math.round((10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age - 161) * 1.55),
      sleepHours: 8.0,
      dietFocus: "Equilíbrio entre energia, hidratação e constância nutricional"
    };
  }
};