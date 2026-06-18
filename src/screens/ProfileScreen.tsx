import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PremiumCard, PrimaryButton, SecondaryButton, AppInput, MetricRow, SectionTitle, COLORS, PageSlide } from '../ui/components';
import { CollapsibleSetting } from '../ui/CollapsibleSetting';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../services/supabase';

let ImagePicker: any = null;
if (Platform.OS !== 'web') {
  ImagePicker = require('expo-image-picker');
}

export const ProfileScreen = () => {
  const { userProfile, healthSummary, logout } = useAppStore();
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showNotificationPreferences, setShowNotificationPreferences] = useState(false);
  const [showSecurityDetails, setShowSecurityDetails] = useState(false);
  const [showHelpSupportDetails, setShowHelpSupportDetails] = useState(false);
  const [editingProfile, setEditingProfile] = useState<boolean>(false);
  const [editData, setEditData] = useState({
    name: userProfile?.name || '',
    email: userProfile?.email || '',
    age: userProfile?.age?.toString() || '',
    height: userProfile?.heightCm?.toString() || '',
    weight: userProfile?.weightKg?.toString() || '',
    goal: userProfile?.goal || '',
    sex: userProfile?.sex || '',
    activityLevel: userProfile?.activityLevel || '',
  });
  const updateProfile = useAppStore(state => state.updateProfile);

  useEffect(() => {
    if (userProfile) {
      setEditData({
        name: userProfile.name,
        email: userProfile.email,
        age: userProfile.age.toString(),
        height: userProfile.heightCm.toString(),
        weight: userProfile.weightKg.toString(),
        goal: userProfile.goal,
        sex: userProfile.sex,
        activityLevel: userProfile.activityLevel,
      });
    }
  }, [userProfile]);

  const handlePickImage = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setProfilePhoto(url);
        setIsEditingPhoto(false);
      };
      input.click();
      return;
    }

    if (!ImagePicker) {
      alert('ImagePicker não disponível no projeto.');
      return;
    }



    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      setProfilePhoto(result.assets[0].uri);
      setIsEditingPhoto(false);
    }
  };

  const handleTakePhoto = async () => {
    if (Platform.OS === 'web' || !ImagePicker) {
      alert('Câmera não está disponível na web');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      setProfilePhoto(result.assets[0].uri);
      setIsEditingPhoto(false);
    }
  };

  const getInitials = () => {
    const name = userProfile?.name || userProfile?.email || 'U';
    return name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const formatGoal = (goal: string | undefined) => {
    if (!goal) return '—';
    const goalMap: { [key: string]: string } = {
      'perda_peso': 'Perda de Peso',
      'ganho_massa': 'Ganho de Massa',
      'manutencao': 'Manutenção',
    };
    return goalMap[goal] || goal.replace('_', ' ');
  };

  const handleSecurity = () => setShowSecurityDetails(prev => !prev);
  const handleHelpSupport = () => setShowHelpSupportDetails(prev => !prev);
  const handleNotifications = () => setShowNotificationPreferences(prev => !prev);
  const handleEditProfile = () => setEditingProfile(true);
  const handleCancelEdit = () => setEditingProfile(false);

  const handleSaveProfile = async () => {
    if (!editData.name || !editData.email) {
      Alert.alert('Atenção', 'Por favor preencha nome e e-mail.');
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').update({
          name: editData.name,
          age: parseInt(editData.age) || 0,
          height: parseFloat(editData.height) || 0,
          weight: parseFloat(editData.weight) || 0,
          goal: editData.goal,
          gender: editData.sex,
        }).eq('id', user.id);
      }

      updateProfile({
        name: editData.name,
        email: editData.email,
        age: parseInt(editData.age) || userProfile?.age || 0,
        weightKg: parseFloat(editData.weight) || userProfile?.weightKg || 0,
        heightCm: parseFloat(editData.height) || userProfile?.heightCm || 0,
        goal: editData.goal || userProfile?.goal || 'Vida saudável',
        sex: editData.sex || userProfile?.sex || 'Feminino',
        activityLevel: editData.activityLevel || userProfile?.activityLevel || 'Moderado',
      });

      setEditingProfile(false);
      Alert.alert('✅ Perfil atualizado', 'Seus dados foram salvos com sucesso.');
    } catch (e: any) {
      Alert.alert('Erro', 'Não foi possível salvar o perfil: ' + e.message);
    }
  };

  return (
    <PageSlide tabIndex={3}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          <LinearGradient
            colors={[COLORS.GreenPrimary, COLORS.GreenLight, COLORS.GreenMint]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.profilePhotoContainer}>
              <View style={styles.profilePhoto}>
                {profilePhoto ? (
                  <Image source={{ uri: profilePhoto }} style={styles.profilePhotoImage} />
                ) : (
                  <Text style={styles.profilePhotoInitials}>{getInitials()}</Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.editPhotoButton}
                onPress={() => setIsEditingPhoto(!isEditingPhoto)}
              >
                <MaterialIcons name="photo-camera" size={20} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.profileBadgeRow}>
              <MaterialIcons name="health-and-safety" size={24} color="white" />
              <Text style={styles.profileBadgeText}>Seu bem-estar em um só lugar</Text>
            </View>
            <Text style={styles.profileName}>{userProfile?.name || userProfile?.email?.split('@')[0] || 'Usuário'}</Text>
            <Text style={styles.profileEmail}>{userProfile?.email || ''}</Text>
          </LinearGradient>

          {isEditingPhoto && (
            <View style={styles.photoOptionsContainer}>
              <TouchableOpacity style={styles.photoOption} onPress={handlePickImage}>
                <FontAwesome5 name="image" size={24} color={COLORS.GreenPrimary} />
                <Text style={styles.photoOptionText}>Galeria</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoOption} onPress={handleTakePhoto}>
                <FontAwesome5 name="camera" size={24} color={COLORS.GreenPrimary} />
                <Text style={styles.photoOptionText}>Câmera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoOption} onPress={() => setIsEditingPhoto(false)}>
                <FontAwesome5 name="times" size={24} color="#E57373" />
                <Text style={styles.photoOptionText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          )}


          <SectionTitle title="Resumo de Saúde" subtitle="Suas informações atuais" />
          <PremiumCard>
            <View style={styles.metricsContainer}>
              <MetricRow label="IMC" value={`${healthSummary?.bmi || '—'} (${healthSummary?.bmiLabel || '—'})`} />
              <View style={styles.metricDivider} />
              {/* ✅ CORRIGIDO: sem fallback hardcoded */}
              <MetricRow label="Peso Atual" value={userProfile?.weightKg ? `${userProfile.weightKg} kg` : '—'} />
              <View style={styles.metricDivider} />
              <MetricRow label="Altura" value={userProfile?.heightCm ? `${userProfile.heightCm} cm` : '—'} />
              <View style={styles.metricDivider} />
              <MetricRow label="Idade" value={userProfile?.age ? `${userProfile.age} anos` : '—'} />
              <View style={styles.metricDivider} />
              <MetricRow label="Objetivo" value={formatGoal(userProfile?.goal)} />
              <View style={styles.metricDivider} />
              <MetricRow label="Gênero" value={userProfile?.sex || '—'} />
            </View>
          </PremiumCard>

          <SectionTitle title="Metas Diárias" subtitle="Recomendações personalizadas" />
          <PremiumCard>
            <View style={styles.goalsContainer}>
              <View style={styles.goalCard}>
                <MaterialIcons name="local-drink" size={28} color={COLORS.GreenPrimary} />
                <Text style={styles.goalTitle}>Água</Text>
                <Text style={styles.goalValue}>{healthSummary?.waterLiters || '—'} L</Text>
              </View>
              <View style={styles.goalCard}>
                <MaterialIcons name="nights-stay" size={28} color={COLORS.GreenPrimary} />
                <Text style={styles.goalTitle}>Sono</Text>
                <Text style={styles.goalValue}>{healthSummary?.sleepHours || '—'}h</Text>
              </View>
              <View style={styles.goalCard}>
                <MaterialIcons name="whatshot" size={28} color={COLORS.GreenPrimary} />
                <Text style={styles.goalTitle}>Calorias</Text>
                <Text style={styles.goalValue}>{healthSummary?.calories || '—'}</Text>
              </View>
              <View style={styles.goalCard}>
                <MaterialIcons name="fitness-center" size={28} color={COLORS.GreenPrimary} />
                <Text style={styles.goalTitle}>Peso Ideal</Text>
                <Text style={styles.goalValue}>{healthSummary?.idealWeightKg || '—'}kg</Text>
              </View>
            </View>
          </PremiumCard>

          <SectionTitle title="Configurações" subtitle="Personalize sua experiência" />
          <PremiumCard style={{ padding: 0, borderRadius: 18, overflow: 'hidden' }}>
            <CollapsibleSetting
              title="Notificações"
              icon="notifications"
              isOpen={showNotificationPreferences}
              onToggle={handleNotifications}
            >
              <View style={styles.notificationRow}>
                <Text style={styles.modalText}>Notificações push</Text>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={value => setNotificationsEnabled(value)}
                  thumbColor={notificationsEnabled ? COLORS.GreenPrimary : '#f4f3f4'}
                  trackColor={{ false: '#d0d0d0', true: '#a5d6a7' }}
                />
              </View>
              <Text style={styles.modalSmall}>Fique por dentro de lembretes de água, refeições e desafios diários.</Text>
            </CollapsibleSetting>

            <CollapsibleSetting
              title="Editar Perfil"
              icon="edit"
              isOpen={editingProfile}
              onToggle={() => setEditingProfile(!editingProfile)}
            >
              <View style={{ gap: 14 }}>
                <AppInput value={editData.name} onValueChange={(value: string) => setEditData(prev => ({ ...prev, name: value }))} label="Nome" />
                <AppInput value={editData.email} onValueChange={(value: string) => setEditData(prev => ({ ...prev, email: value }))} label="E-mail" keyboardType="email-address" />
                <AppInput value={editData.age} onValueChange={(value: string) => setEditData(prev => ({ ...prev, age: value }))} label="Idade" keyboardType="numeric" />
                <AppInput value={editData.height} onValueChange={(value: string) => setEditData(prev => ({ ...prev, height: value }))} label="Altura (cm)" keyboardType="numeric" />
                <AppInput value={editData.weight} onValueChange={(value: string) => setEditData(prev => ({ ...prev, weight: value }))} label="Peso (kg)" keyboardType="numeric" />
                <AppInput value={editData.goal} onValueChange={(value: string) => setEditData(prev => ({ ...prev, goal: value }))} label="Objetivo" />
                <AppInput value={editData.activityLevel} onValueChange={(value: string) => setEditData(prev => ({ ...prev, activityLevel: value }))} label="Nível de atividade" />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                  <PrimaryButton text="Salvar" onClick={handleSaveProfile} />
                  <SecondaryButton text="Cancelar" onClick={handleCancelEdit} />
                </View>
              </View>
            </CollapsibleSetting>

            <CollapsibleSetting
              title="Segurança"
              icon="security"
              isOpen={showSecurityDetails}
              onToggle={handleSecurity}
            >
              <Text style={styles.modalText}>Ative senha, biometria e verificação extra para manter seus dados protegidos.</Text>
              <Text style={styles.modalSmall}>Use PIN, reconhecimento facial ou senha para acessar funcionalidades sensíveis.</Text>
            </CollapsibleSetting>

            <CollapsibleSetting
              title="Ajuda e Suporte"
              icon="help"
              isOpen={showHelpSupportDetails}
              onToggle={handleHelpSupport}
            >
              <Text style={styles.modalText}>Precisa de suporte? Envie um e-mail para suporte@saudemais.app ou use o chat dentro do app.</Text>
              <Text style={styles.modalSmall}>Horário de atendimento: segunda a sexta, das 9h às 18h.</Text>
            </CollapsibleSetting>
          </PremiumCard>

          <PrimaryButton text="Encerrar Sessão" onClick={logout} />
          <View style={{ height: 20 }} />
        </ScrollView>
      </SafeAreaView>
    </PageSlide>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAF9' },
  scrollContent: { padding: 16 },
  headerGradient: {
    borderRadius: 30,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 8,
  },
  profilePhotoContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  profilePhotoImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profilePhotoInitials: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
  },
  editPhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.GreenPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  profileBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  profileBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  photoOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  photoOption: {
    alignItems: 'center',
    gap: 8,
  },
  photoOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'black',
  },
  metricsContainer: {
    gap: 12,
  },
  metricDivider: {
    height: 1,
    backgroundColor: COLORS.GrayLine,
  },
  goalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  goalCard: {
    width: '48%',
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  goalTitle: {
    fontSize: 12,
    color: COLORS.TextVariant,
    fontWeight: '500',
  },
  goalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.GreenPrimary,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: 'black',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'black',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 14,
    color: COLORS.TextVariant,
    marginBottom: 8,
    lineHeight: 20,
  },
  modalSmall: {
    fontSize: 13,
    color: COLORS.TextVariant,
    lineHeight: 18,
  },
  notificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
});
