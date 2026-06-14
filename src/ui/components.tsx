import React, { useState, useRef, useContext } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Platform, Animated, Dimensions, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

export const COLORS = {
  GreenPrimary: '#4CAF50',
  GreenLight: '#81C784',
  GreenMint: '#E8F5E9',
  SurfaceSoft: '#F9FAF9',
  GrayLine: '#E0E0E0',
  TextVariant: '#5f6368'
};

type TabTransitionType = { previousIndex: number; currentIndex: number; enteringFromLogin: boolean; setEnteringFromLogin: (v: boolean) => void };
export const TabTransitionContext = React.createContext<TabTransitionType>({ previousIndex: 0, currentIndex: 0, enteringFromLogin: false, setEnteringFromLogin: (v: boolean) => {} });

export const GradientHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <View style={styles.headerCardContainer}>
    <LinearGradient colors={[COLORS.GreenPrimary, COLORS.GreenLight, COLORS.GreenMint]} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.gradientHeader}>
      <Text style={styles.headerTitle}>{title}</Text>
      <Text style={styles.headerSubtitle}>{subtitle}</Text>
    </LinearGradient>
  </View>
);

export const PremiumCard = ({ children, style }: any) => (
  <View style={[styles.premiumCard, style]}>{children}</View>
);

export const PrimaryButton = ({ text, onClick, onPressIn, onPressOut, style }: { text: string; onClick: () => void; onPressIn?: () => void; onPressOut?: () => void; style?: any }) => (
  <TouchableOpacity
    style={[styles.primaryButton, style]}
    onPress={onClick}
    onPressIn={onPressIn}
    onPressOut={onPressOut}
    activeOpacity={0.8}
  >
    <Text style={styles.primaryButtonText}>{text}</Text>
  </TouchableOpacity>
);

export const SecondaryButton = ({ text, onClick, onPressIn, onPressOut, style }: { text: string; onClick: () => void; onPressIn?: () => void; onPressOut?: () => void; style?: any }) => (
  <TouchableOpacity
    style={[styles.secondaryButton, style]}
    onPress={onClick}
    onPressIn={onPressIn}
    onPressOut={onPressOut}
    activeOpacity={0.8}
  >
    <Text style={styles.secondaryButtonText}>{text}</Text>
  </TouchableOpacity>
);

export const AppInput = ({ value, onValueChange, label, keyboardType = 'default', isPassword = false }: any) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onValueChange}
      keyboardType={keyboardType}
      secureTextEntry={isPassword}
    />
  </View>
);

export const SelectChip = ({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) => (
  <TouchableOpacity style={[styles.chip, selected ? styles.chipSelected : styles.chipUnselected]} onPress={onClick} activeOpacity={0.7}>
    <Text style={[styles.chipText, selected ? { color: 'white' } : { color: 'black' }]}>{label}</Text>
  </TouchableOpacity>
);

export const SectionTitle = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <View style={styles.sectionTitleContainer}>
    <Text style={styles.titleText}>{title}</Text>
    {subtitle && <Text style={styles.subtitleText}>{subtitle}</Text>}
  </View>
);

export const MetricRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.metricRow}>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={styles.metricValue}>{value}</Text>
  </View>
);

export const IconCircle = ({ iconName }: { iconName: string }) => (
  <View style={styles.iconCircle}>
    <MaterialIcons name={iconName as any} size={24} color={COLORS.GreenPrimary} />
  </View>
);

export const LoadingButton = ({ text, onClick, isLoading = false }: { text: string; onClick: () => void; isLoading?: boolean }) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const animation = useRef<Animated.CompositeAnimation | null>(null);

  React.useEffect(() => {
    if (isLoading) {
      spinValue.setValue(0);
      animation.current = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      animation.current.start();
    } else if (animation.current) {
      animation.current.stop();
    }
  }, [isLoading]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <TouchableOpacity style={styles.primaryButton} onPress={onClick} disabled={isLoading} activeOpacity={0.8}>
      {isLoading ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <MaterialIcons name="sync" size={20} color="white" />
          </Animated.View>
          <Text style={styles.primaryButtonText}>Entrando...</Text>
        </View>
      ) : (
        <Text style={styles.primaryButtonText}>{text}</Text>
      )}
    </TouchableOpacity>
  );
};

export const WaterCup = ({ filled = false, size = 80 }: { filled?: boolean; size?: number }) => {
  const animatedFill = new Animated.Value(filled ? 1 : 0);

  React.useEffect(() => {
    Animated.timing(animatedFill, {
      toValue: filled ? 1 : 0,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [filled]);

  return (
    <View style={[styles.waterCupContainer, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.waterCupFill,
          {
            backgroundColor: filled ? '#81C784' : 'transparent',
            opacity: animatedFill,
          },
        ]}
      />
      <View style={styles.waterCupBorder}>
        <MaterialIcons name="local-drink" size={size * 0.4} color={filled ? 'white' : COLORS.GreenPrimary} />
        {filled && <Text style={styles.cupText}>250ml</Text>}
      </View>
    </View>
  );
};

export const StepCounter = ({ steps = 0, dailyGoal = 10000 }: { steps?: number; dailyGoal?: number }) => {
  const km = (steps / 1500).toFixed(1);
  const progress = Math.min(steps / dailyGoal, 1);

  return (
    <View style={styles.stepCounterContainer}>
      <View style={styles.stepCounterCircle}>
        <LinearGradient 
          colors={[COLORS.GreenPrimary, COLORS.GreenLight]} 
          start={{ x: 0, y: 0 }} 
          end={{ x: 1, y: 1 }} 
          style={styles.stepCounterGradient}
        >
          <View style={{ alignItems: 'center' }}>
            <MaterialIcons name="directions-walk" size={32} color="white" />
            <Text style={styles.stepCounterValue}>{steps.toLocaleString('pt-BR')}</Text>
            <Text style={styles.stepCounterKm}>{km} km</Text>
          </View>
        </LinearGradient>
      </View>
      <View style={styles.stepCounterProgress}>
        <View style={styles.stepProgressBg}>
          <View style={[styles.stepProgressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.stepProgressText}>{Math.round(progress * 100)}% da meta</Text>
      </View>
    </View>
  );
};

export const GoogleAppleButtons = ({ onGoogle, onApple }: { onGoogle: () => void; onApple: () => void }) => (
  <View style={styles.socialButtonsContainer}>
    <TouchableOpacity style={styles.socialButton} onPress={onGoogle} activeOpacity={0.7}>
      <FontAwesome5 name="google" size={20} color="#EA4335" />
      <Text style={styles.socialButtonText}>Google</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.socialButton} onPress={onApple} activeOpacity={0.7}>
      <FontAwesome5 name="apple" size={20} color="black" />
      <Text style={styles.socialButtonText}>Apple</Text>
    </TouchableOpacity>
  </View>
);


export const WaterReservoir = ({ progress = 0, width = 100, height = 220, goalMl = 2000 }: { progress?: number; width?: number; height?: number; goalMl?: number }) => {
  const animatedFill = React.useRef(new Animated.Value(progress)).current;

  React.useEffect(() => {
    Animated.timing(animatedFill, {
      toValue: progress,
      duration: 450,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const fillHeight = animatedFill.interpolate({
    inputRange: [0, 1],
    outputRange: [0, height - 28],
  });

  return (
    <View style={[styles.reservoirContainer, { width, height }]}>
      <View style={styles.reservoirBody}>
        <Animated.View style={[styles.reservoirFill, { height: fillHeight, width: width - 16 }]} />
        <View style={styles.reservoirLabelContainer}>
          <Text style={styles.reservoirSub}>{((progress * goalMl) / 1000).toFixed(1)} L</Text>
          <Text style={styles.reservoirSub}>{(goalMl / 1000).toFixed(1)} L</Text>
        </View>
      </View>
    </View>
  );
};

export const LoadingScreen = ({ text = 'Carregando...' }: { text?: string }) => (
  <View style={styles.loadingWrapper}>
    <ActivityIndicator size="large" color={COLORS.GreenPrimary} />
    <Text style={styles.loadingText}>{text}</Text>
  </View>
);

export const PageSlide = ({ children, tabIndex }: { children: React.ReactNode; tabIndex?: number }) => {
  const isFocused = useIsFocused();
  const { previousIndex, currentIndex, enteringFromLogin, setEnteringFromLogin } = useContext(TabTransitionContext);
  const screenWidth = Dimensions.get('window').width;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const exitAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (typeof tabIndex === 'number') {
      const direction = currentIndex > previousIndex ? 1 : currentIndex < previousIndex ? -1 : 0;
      const isIncoming = tabIndex === currentIndex;
      const isOutgoing = tabIndex === previousIndex;

      if (isIncoming && isFocused) {
        slideAnim.setValue(direction * screenWidth);
        scaleAnim.setValue(0.98);
        opacityAnim.setValue(0);
        Animated.parallel([
          Animated.timing(slideAnim, { toValue: 0, duration: 360, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1, duration: 360, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 1, duration: 360, useNativeDriver: true }),
        ]).start(() => {
          try { setEnteringFromLogin(false); } catch (e) {}
        });
      }

      if (isOutgoing && !isFocused) {
        exitAnim.setValue(0);
        Animated.timing(exitAnim, { toValue: 1, duration: 360, useNativeDriver: true }).start();
      } else {
        exitAnim.setValue(0);
      }
    } else {
      if (isFocused) {
        if (enteringFromLogin) {
          scaleAnim.setValue(0.92);
          opacityAnim.setValue(0);
          Animated.parallel([
            Animated.timing(scaleAnim, { toValue: 1, duration: 420, useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 1, duration: 420, useNativeDriver: true }),
          ]).start(() => {
            try { setEnteringFromLogin(false); } catch (e) {}
          });
        } else {
          const direction = currentIndex > previousIndex ? 1 : currentIndex < previousIndex ? -1 : 0;
          const startValue = direction * screenWidth;
          slideAnim.setValue(startValue);
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 350,
            useNativeDriver: true,
          }).start();
        }
      }
    }
  }, [isFocused, currentIndex, previousIndex, screenWidth, enteringFromLogin, tabIndex]);

  const incomingTransform: any = { transform: [{ translateX: slideAnim }, { scale: scaleAnim }], opacity: opacityAnim };

  const outgoingTransform = {
    transform: [
      {
        translateX: exitAnim.interpolate({ inputRange: [0, 1], outputRange: [0, (currentIndex > previousIndex ? -1 : 1) * 40] }),
      },
      { scale: exitAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.98] }) },
    ],
    opacity: exitAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.86] }),
  };

  const overlayStyle: any = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    ...incomingTransform,
  };

  const isOutgoingScreen = typeof tabIndex === 'number' && tabIndex === previousIndex;
  const finalStyle = isOutgoingScreen ? outgoingTransform : overlayStyle;

  return (
    <Animated.View style={finalStyle}>
      {children}
    </Animated.View>
  );
};
const styles = StyleSheet.create({
  headerCardContainer: { width: '100%', marginBottom: 18 },
  gradientHeader: { padding: 24, borderRadius: 30 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 8 },
  headerSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.92)', lineHeight: 22 },
  premiumCard: {
    backgroundColor: 'white', borderRadius: 26, padding: 20, marginBottom: 18,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 4px 12px rgba(0,0,0,0.06)' }
      : { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 4 }),
  },
  primaryButton: { backgroundColor: COLORS.GreenPrimary, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginTop: 6 },
  primaryButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  secondaryButton: { backgroundColor: '#F0F4F0', height: 54, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  secondaryButtonText: { color: 'black', fontSize: 15, fontWeight: '500' },
  inputContainer: { marginBottom: 14 },
  inputLabel: { fontSize: 13, color: COLORS.TextVariant, marginBottom: 6, marginLeft: 4, fontWeight: '500' },
  input: { borderWidth: 1, borderColor: COLORS.GrayLine, borderRadius: 18, paddingHorizontal: 16, height: 54, fontSize: 16, backgroundColor: 'white' },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, borderWidth: 1, marginRight: 10, marginBottom: 10 },
  chipSelected: { backgroundColor: COLORS.GreenPrimary, borderColor: COLORS.GreenPrimary },
  chipUnselected: { backgroundColor: 'white', borderColor: COLORS.GrayLine },
  chipText: { fontSize: 14, fontWeight: '600' },
  sectionTitleContainer: { marginBottom: 14, marginTop: 4 },
  titleText: { fontSize: 22, fontWeight: '700', color: 'black' },
  subtitleText: { fontSize: 14, color: COLORS.TextVariant, marginTop: 4 },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  metricLabel: { fontSize: 15, color: COLORS.TextVariant },
  metricValue: { fontSize: 15, fontWeight: '600', color: 'black' },
  iconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(76, 175, 80, 0.14)', justifyContent: 'center', alignItems: 'center' },
  waterCupContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    margin: 8,
  },
  waterCupBorder: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  waterCupFill: {
    position: 'absolute',
    width: '100%',
    height: '70%',
    borderRadius: 10,
    bottom: '15%',
    zIndex: 1,
  },
  cupText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    marginTop: 4,
  },
  reservoirWrapper: {
    alignItems: 'center',
  },
  reservoirContainer: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(232, 245, 233, 0.9)',
    borderRadius: 26,
    padding: 8,
    overflow: 'hidden',
  },
  reservoirBody: {
    flex: 1,
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.25)',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  reservoirFill: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: '#81C784',
    borderRadius: 16,
  },
  reservoirLabelContainer: {
    position: 'absolute',
    top: 14,
    width: '100%',
    alignItems: 'center',
  },
  reservoirLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.GreenPrimary,
  },
  reservoirSub: {
    fontSize: 12,
    color: COLORS.TextVariant,
    marginTop: 4,
  },
  stepCounterContainer: {
    gap: 12,
    marginVertical: 10,
  },
  stepCounterCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignSelf: 'center',
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 8px 24px rgba(0,0,0,0.1)' }
      : { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 24, elevation: 8 }),
  },
  stepCounterGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCounterValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 4,
  },
  stepCounterKm: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  stepCounterProgress: {
    gap: 8,
  },
  stepProgressBg: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  stepProgressFill: {
    height: '100%',
    backgroundColor: COLORS.GreenPrimary,
    borderRadius: 4,
  },
  stepProgressText: {
    fontSize: 12,
    color: COLORS.TextVariant,
    textAlign: 'center',
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  loadingWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAF9',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.TextVariant,
    textAlign: 'center',
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: 18,
    backgroundColor: '#F0F4F0',
    borderWidth: 1,
    borderColor: COLORS.GrayLine,
    gap: 8,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'black',
  },
});