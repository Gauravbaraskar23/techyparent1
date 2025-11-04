import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import axios from "axios";

const API_URL = "http://172.28.34.220:8000/api/register/"; // ✅ replace with your Django signup endpoint

export default function SignupScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

const handleSignup = async () => {
  if (!username || !email || !password) {
    Alert.alert("Error", "Please fill all fields");
    return;
  }

  setLoading(true);
  console.log("🟢 Sending signup request to:", API_URL);

  try {
    const res = await axios.post(API_URL, {
      username,
      email,
      password,
    });

    console.log("✅ Response from server:", res.data);

    Alert.alert("Success", "Account created successfully!", [
      {
        text: "OK",
        onPress: () => navigation.navigate("Login"), // ✅ navigate to Login
      },
    ]);
  } catch (error) {
    console.log("❌ Signup Error:", error.message);
    console.log("❌ Full Error Response:", error.response?.data);

    Alert.alert(
      "Signup Failed",
      error.response?.data?.error || "Something went wrong. Please try again."
    );
  } finally {
    setLoading(false);
  }
};


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Your Account</Text>

      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#777"
        value={username}
        onChangeText={setUsername}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#777"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#777"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={[styles.button, loading && { backgroundColor: "#999" }]}
        onPress={handleSignup}
        disabled={loading}
      >
        {loading ? (
          <>
            <ActivityIndicator color="#fff" />
            <Text style={styles.loadingText}> Creating Account...</Text>
          </>
        ) : (
          <Text style={styles.buttonText}>Sign Up</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.linkText}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f7fa",
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#333",
    marginBottom: 30,
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  button: {
    width: "100%",
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  loadingText: {
    color: "#fff",
    fontSize: 15,
    marginLeft: 8,
  },
  linkText: {
    marginTop: 20,
    color: "#2196F3",
    fontWeight: "500",
  },
});

// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
// } from 'react-native';
// import axios from 'axios';

// export default function SignupScreen({ navigation }) {
//   const [username, setUsername] = useState('');
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [loading, setLoading] = useState(false);

//   const handleSignup = async () => {
//   if (!username || !email || !password) {
//     Alert.alert('Error', 'All fields are required');
//     return;
//   }

//   try {
//     setLoading(true);
//     const response = await axios.post(
//       'http://10.239.126.220:8000/api/register/',
//       { username, email, password },
//       { timeout: 8000 }
//     );

//     setLoading(false);
//     Alert.alert('Success', 'Account created successfully!', [
//       {
//         text: 'Login Now',
//         onPress: () => navigation.replace('Login'),
//       },
//     ]);
//   } catch (error) {
//     setLoading(false);
//     if (error.message.includes('Network Error')) {
//       Alert.alert('Network Error', 'Cannot reach the server.');
//     } else if (error.response) {
//       Alert.alert('Signup Failed', 'User already exists or invalid data.');
//     } else {
//       Alert.alert('Error', 'Something went wrong.');
//     }
//   }
// };

// //   const handleSignup = async () => {
// //   if (!username || !email || !password) {
// //     Alert.alert('Error', 'All fields are required');
// //     return;
// //   }

// //   try {
// //     setLoading(true);
// //     const response = await axios.post(
// //       'http://10.239.126.220:8000/api/register/',
// //       { username, email, password },
// //       { timeout: 8000 }
// //     );

// //     setLoading(false);

// //     Alert.alert('Success', 'Account created successfully!', [
// //       { text: 'OK', onPress: () => navigation.navigate('Login') },
// //     ]);
// //   } catch (err) {
// //     setLoading(false);
// //     if (err.message.includes('Network Error')) {
// //       Alert.alert('Network Error', 'Cannot reach server.');
// //     } else if (err.response) {
// //       Alert.alert('Signup Failed', 'User already exists or invalid data.');
// //     } else {
// //       Alert.alert('Error', 'Something went wrong. Please try again.');
// //     }
// //   }
// // };


//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Create Account</Text>

//       <Text style={styles.label}>Username</Text>
//       <TextInput
//         style={styles.input}
//         placeholder="Enter your username"
//         value={username}
//         onChangeText={setUsername}
//       />

//       <Text style={styles.label}>Email Address</Text>
//       <TextInput
//         style={styles.input}
//         placeholder="Enter your email"
//         value={email}
//         onChangeText={setEmail}
//         autoCapitalize="none"
//       />

//       <Text style={styles.label}>Password</Text>
//       <TextInput
//         style={styles.input}
//         placeholder="Enter your password"
//         value={password}
//         onChangeText={setPassword}
//         secureTextEntry
//       />

//       <TouchableOpacity
//         onPress={handleSignup}
//         style={[styles.button, loading && { opacity: 0.6 }]}
//         disabled={loading}
//       >
//         <Text style={styles.buttonText}>
//           {loading ? 'Creating Account...' : 'Sign Up'}
//         </Text>
//       </TouchableOpacity>

//       <TouchableOpacity onPress={() => navigation.replace('Login')}>
//         <Text style={styles.loginLink}>
//           Already have an account? Sign In
//         </Text>
//       </TouchableOpacity>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//     paddingHorizontal: 25,
//   },
//   title: { fontSize: 26, fontWeight: 'bold', color: '#1e40af', marginBottom: 20 },
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
//   loginLink: {
//     marginTop: 15,
//     color: '#2563eb',
//     textDecorationLine: 'underline',
//   },
  
// });
