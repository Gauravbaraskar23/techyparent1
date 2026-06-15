import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules } from 'react-native';

const { BlockerModule } = NativeModules;

export default function SetPinScreen() {
  const [pin, setPin] = useState('');

  const savePin = async () => {
    if (pin.length < 4) {
      Alert.alert("Error", "PIN must be at least 4 digits");
      return;
    }

    try {
      // ✅ 1. Save in React Native (optional)
      await AsyncStorage.setItem('PARENT_PIN', pin);

      // ✅ 2. Save in Native (VERY IMPORTANT)
      BlockerModule.setPin(pin);

      Alert.alert("Success", "PIN saved successfully 🔐");
      setPin('');
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save PIN");
    }
  };

  const handleUnlock = async () => {
    try {
      const isCorrect = await BlockerModule.verifyPin(pin);

      if (isCorrect) {
        Alert.alert("Unlocked ✅");

        // TEMP unlock
        await BlockerModule.unblockApp(route.params.package);

        // OPTIONAL: re-block after 5 min
        setTimeout(() => {
          BlockerModule.blockApp(route.params.package);
        }, 5 * 60 * 1000);

        navigation.goBack();
      } else {
        Alert.alert("Wrong PIN ❌");
      }
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      
      <Text style={{ fontSize: 20, marginBottom: 20 }}>
        Set Parent PIN
      </Text>

      <TextInput
        value={pin}
        onChangeText={setPin}
        placeholder="Enter PIN"
        keyboardType="number-pad"
        secureTextEntry
        style={{
          borderWidth: 1,
          width: 200,
          padding: 10,
          borderRadius: 10,
          marginBottom: 20,
        }}
      />

      <TouchableOpacity
        onPress={savePin}
        style={{
          backgroundColor: 'blue',
          padding: 12,
          borderRadius: 10,
        }}
      >
        <Text style={{ color: '#fff' }}>Save PIN</Text>
      </TouchableOpacity>
    </View>
  );
}