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
      'http://10.176.131.220:8000/api/token/',
      {
        username: email,
        password: password,
      },
      { timeout: 8000 }
    );

    if (response.status === 200 && response.data.access && response.data.refresh) {
      await AsyncStorage.setItem('access_token', response.data.access);
      await AsyncStorage.setItem('refresh_token', response.data.refresh);

      setLoading(false);
      console.log('✅ Login successful — navigating to Dashboard');

      // navigation.reset({
      //   index: 0,
      //   routes: [{ name: 'MainTabs' }],
      // });
      navigation.replace('MainTabs');
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
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your username"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="default"
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
    backgroundColor: '#0f172a', // Dark navy background
    paddingHorizontal: 25,
    paddingVertical: 40,
  },

  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 15,
  },

  backText: {
    fontSize: 16,
    color: '#38bdf8',
    fontWeight: '500',
  },

  logo: {
    width: 90,
    height: 90,
    marginBottom: 15,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    padding: 15,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 1,
  },

  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 25,
    textAlign: 'center',
  },

  welcome: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f1f5f9',
    alignSelf: 'flex-start',
    marginBottom: 15,
  },

  label: {
    alignSelf: 'flex-start',
    marginBottom: 6,
    color: '#cbd5e1',
    fontSize: 13,
  },

  input: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    color: '#ffffff',
    fontSize: 14,
  },

  button: {
    backgroundColor: '#3b82f6',
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    elevation: 3,
  },

  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 0.5,
  },

  footer: {
    marginVertical: 20,
    color: '#64748b',
  },

  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },

  socialBtn: {
    backgroundColor: '#1e293b',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 10,
  },

  signupText: {
    color: '#38bdf8',
    marginTop: 20,
    fontWeight: '500',
  },
});

// const styles = StyleSheet.create({
//   container: {
//     flexGrow: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//     paddingHorizontal: 25,
//     paddingVertical: 40,
//   },
//   logo: { width: 80, height: 80, marginBottom: 20 },
//   title: { fontSize: 26, fontWeight: 'bold', color: '#1e40af' },
//   subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 30 },
//   label: { alignSelf: 'flex-start', marginBottom: 5, color: '#111827' },
//   input: {
//     width: '100%',
//     borderWidth: 1,
//     borderColor: '#d1d5db',
//     borderRadius: 8,
//     padding: 12,
//     marginBottom: 15,
//   },
//   button: {
//     backgroundColor: '#2563eb',
//     width: '100%',
//     padding: 15,
//     borderRadius: 10,
//     alignItems: 'center',
//     marginTop: 10,
//   },
//   buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
//   footer: { marginVertical: 15, color: '#9ca3af' },
//   socialRow: { flexDirection: 'row', gap: 10 },
//   socialBtn: {
//     borderWidth: 1,
//     borderColor: '#d1d5db',
//     paddingVertical: 8,
//     paddingHorizontal: 20,
//     borderRadius: 8,
//   },
//   signupText: {
//     color: '#2563eb',
//     textDecorationLine: 'underline',
//   },

//   welcome: {
//   fontSize: 22,
//   fontWeight: 'bold',
//   color: '#1e3a8a', // a nice deep blue
//   alignSelf: 'flex-start',
//   marginBottom: 5,
// },

// backButton: {
//   alignSelf: 'flex-start',
//   marginBottom: 10,
//   marginTop: 20,
// },
// backText: {
//   fontSize: 18,
//   color: '#2563eb',
//   fontWeight: '600',
// },

// });
