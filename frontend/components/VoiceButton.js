import React, { useState } from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import VoiceService from '../services/VoiceService';

export default function VoiceButton({ childId, onResult }) {
  const [isListening, setIsListening] = useState(false);
  const pulseAnim = new Animated.Value(1);

  const handlePress = async () => {
    if (isListening) {
      await VoiceService.stopListening();
      setIsListening(false);
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      await VoiceService.startListening();
      setIsListening(true);
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isListening && styles.listeningButton
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <Ionicons 
          name={isListening ? 'mic' : 'mic-outline'} 
          size={32} 
          color="#fff" 
        />
      </Animated.View>
      {isListening && (
        <Text style={styles.listeningText}>Listening...</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  listeningButton: {
    backgroundColor: '#ef4444',
  },
  listeningText: {
    position: 'absolute',
    bottom: -20,
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
  },
});