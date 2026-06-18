import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Switch } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from './components';

interface CollapsibleSettingProps {
  title: string;
  icon: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export const CollapsibleSetting: React.FC<CollapsibleSettingProps> = ({
  title,
  icon,
  isOpen,
  onToggle,
  children,
}) => {
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const animatedOpacity = useRef(new Animated.Value(0)).current;
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(animatedHeight, {
          toValue: contentHeight,
          duration: 400,
          useNativeDriver: false,
        }),
        Animated.timing(animatedOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(animatedHeight, {
          toValue: 0,
          duration: 400,
          useNativeDriver: false,
        }),
        Animated.timing(animatedOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [isOpen, contentHeight, animatedHeight, animatedOpacity]);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={onToggle}>
        <View style={styles.titleContainer}>
          <View style={styles.iconContainer}>
            <MaterialIcons name={icon as any} size={24} color={COLORS.GreenPrimary} />
          </View>
          <Text style={styles.title}>{title}</Text>
        </View>
        <Animated.View
          style={{
            transform: [
              {
                rotate: isOpen ? '180deg' : '0deg',
              },
            ],
          }}
        >
          <MaterialIcons name="chevron-right" size={24} color={COLORS.TextVariant} />
        </Animated.View>
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.content,
          {
            height: animatedHeight,
            opacity: animatedOpacity,
          },
        ]}
      >
        <View
          style={styles.innerContent}
          onLayout={event => {
            setContentHeight(event.nativeEvent.layout.height);
          }}
        >
          {children}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F7F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    overflow: 'hidden',
  },
  innerContent: {
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
});
