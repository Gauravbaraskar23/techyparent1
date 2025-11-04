import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
  if (!email || !password) {
    Alert.alert('Error', 'Please enter email and password');
    return;
  }

  try {
    setLoading(true);
    const response = await axios.post(
      'http://172.28.34.220:8000/api/token/',
      {
        username: email,
        password: password,
      },
      { timeout: 8000 }
    );

    if (response.status === 200 && response.data.access && response.data.refresh) {
      await AsyncStorage.setItem('access', response.data.access);
      await AsyncStorage.setItem('refresh', response.data.refresh);

      setLoading(false);
      console.log('✅ Login successful — navigating to Dashboard');

      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } else {
      setLoading(false);
      Alert.alert('Login Failed', 'Invalid credentials or response.');
    }
  } catch (error) {
    setLoading(false);
    console.log('❌ Login Error:', error);

    if (error.code === 'ECONNABORTED') {
      Alert.alert('Timeout', 'Server took too long to respond.');
    } else if (error.message.includes('Network Error')) {
      Alert.alert('Network Error', 'Check your Wi-Fi and Django server.');
    } else if (error.response?.status === 401) {
      Alert.alert('Invalid Credentials', 'Incorrect email or password.');
    } else {
      Alert.alert('Error', 'Something went wrong. Try again later.');
    }
  }
};

//   const handleLogin = async () => {
//   console.log('✅ Login button pressed');
  
//   if (!email || !password) {
//     Alert.alert('Error', 'Please enter email and password');
//     return;
//   }

//   try {
//     setLoading(true);
//     console.log('📡 Sending login request to Django...');

//     const response = await axios.post(
//       'http://10.239.126.220:8000/api/token/',
//       {
//         username: email,
//         password: password,
//       },
//       { timeout: 8000 }
//     );

//     // 🔍 Check if valid tokens returned
//     if (response.status === 200 && response.data.access && response.data.refresh) {
//       console.log('✅ Login success:', response.data);

//       // Save tokens
//       await AsyncStorage.setItem('access', response.data.access);
//       await AsyncStorage.setItem('refresh', response.data.refresh);

//       setLoading(false);

//       // ✅ Redirect only if success
//       navigation.reset({
//         index: 0,
//         routes: [{ name: 'MainTabs' }],
//       });
//     } else {
//       setLoading(false);
//       Alert.alert('Login Failed', 'Invalid response from server');
//       console.log('❌ Invalid token response:', response.data);
//     }

//   } catch (err) {
//     setLoading(false);

//     if (err.code === 'ECONNABORTED') {
//       Alert.alert('Timeout', 'Server took too long to respond');
//       console.log('❌ Request timed out');
//     } else if (err.message.includes('Network Error')) {
//       Alert.alert(
//         'Network Error',
//         'Cannot reach the server. Make sure Django is running and both devices are on the same Wi-Fi.'
//       );
//       console.log('❌ Network error — check IP or server connection');
//     } else if (err.response) {
//       // 🔥 Handle 401 invalid credentials
//       console.log('❌ API error:', err.response.data);
//       if (err.response.status === 401) {
//         Alert.alert('Login Failed', 'Invalid username or password');
//       } else {
//         Alert.alert('Error', `Server error: ${err.response.status}`);
//       }
//     } else {
//       console.log('❌ Unknown error:', err);
//       Alert.alert('Error', 'Something went wrong');
//     }
//   }
// };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
      
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
      <TouchableOpacity
  style={styles.backButton}
  onPress={() => navigation.goBack()}
>
  <Text style={styles.backText}>← Back</Text>
</TouchableOpacity>

        <Image
          source={{
            uri: 'https://img.icons8.com/ios-filled/100/4a90e2/family.png',
          }}
          style={styles.logo}
        />

        <Text style={styles.title}>TechyParent</Text>
        <Text style={styles.subtitle}>Secure Family Digital Management</Text>
          <Text style={styles.welcome}>Welcome Back!</Text>
        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          onPress={handleLogin}
          style={[styles.button, loading && { opacity: 0.6 }]}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Signing In...' : 'Sign In Securely'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.footer}>or continue with</Text>

        <View style={styles.socialRow}>
          <TouchableOpacity style={styles.socialBtn}>
            <Text>Google</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialBtn}>
            <Text>Apple</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => navigation.replace('Signup')}
          style={{ marginTop: 20 }}
        >
          <Text style={styles.signupText}>
            Don’t have an account? Sign Up
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 25,
    paddingVertical: 40,
  },
  logo: { width: 80, height: 80, marginBottom: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1e40af' },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 30 },
  label: { alignSelf: 'flex-start', marginBottom: 5, color: '#111827' },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#2563eb',
    width: '100%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  footer: { marginVertical: 15, color: '#9ca3af' },
  socialRow: { flexDirection: 'row', gap: 10 },
  socialBtn: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  signupText: {
    color: '#2563eb',
    textDecorationLine: 'underline',
  },

  welcome: {
  fontSize: 22,
  fontWeight: 'bold',
  color: '#1e3a8a', // a nice deep blue
  alignSelf: 'flex-start',
  marginBottom: 5,
},

backButton: {
  alignSelf: 'flex-start',
  marginBottom: 10,
  marginTop: 20,
},
backText: {
  fontSize: 18,
  color: '#2563eb',
  fontWeight: '600',
},

});
