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
// import { API_URL } from "../config/api";

const API_URL = "http://10.176.131.220:8000/api/register/"; //  replace with your Django signup endpoint
//  const API_URL = "${API_URL}/api/register/";
export default function SignupScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);

const handleSignup = async () => {
  if (!username || !email || !password || !name || !passwordConfirm) {
    Alert.alert("Error", "Please fill all fields");
    return;
  }

  if (password !== passwordConfirm) {
    Alert.alert("Error", "Passwords do not match");
    return;
  }

  setLoading(true);

  try {
    const res = await axios.post(API_URL, {
      username,
      email,
      password,
      password_confirm: passwordConfirm,
      name,
      timeout: 5000,
    });

    console.log("✅ Signup Success:", res.data);

    // ✅ Better Success UX
    Alert.alert(
      "🎉 Account Created",
      "Your account has been created successfully!\n\nPlease login to continue.",
      [
        {
          text: "Go to Login",
          onPress: () =>
            navigation.reset({
              index: 0,
              routes: [{ name: "Login" }], // 🔥 permanent navigation fix
            }),
        },
      ]
    );
  } catch (error) {
    console.log("❌ Signup Error:", error.response?.data);

    let errorMessage = "Something went wrong";

    if (error.response?.data) {
      const data = error.response.data;

      // 🔥 Extract first error dynamically
      const firstErrorKey = Object.keys(data)[0];
      errorMessage = data[firstErrorKey][0];
    }

    Alert.alert("Signup Failed", errorMessage);
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
        placeholder="Full Name"
        placeholderTextColor="#777"
        value={name}
        onChangeText={setName}
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

      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        placeholderTextColor="#777"
        secureTextEntry
        value={passwordConfirm}
        onChangeText={setPasswordConfirm}
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
    backgroundColor: "#0f172a", // Same dark navy as login
    paddingHorizontal: 25,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 30,
    letterSpacing: 0.5,
  },

  input: {
    width: "100%",
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 15,
    marginBottom: 18,
    color: "#ffffff",
    fontSize: 14,
  },

  button: {
    width: "100%",
    backgroundColor: "#3b82f6",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "center",
    elevation: 3,
  },

  buttonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
    letterSpacing: 0.5,
  },

  loadingText: {
    color: "#ffffff",
    fontSize: 15,
    marginLeft: 8,
  },

  linkText: {
    marginTop: 25,
    color: "#38bdf8",
    fontWeight: "500",
  },
});

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "#f5f7fa",
//     padding: 20,
//   },
//   title: {
//     fontSize: 26,
//     fontWeight: "700",
//     color: "#333",
//     marginBottom: 30,
//   },
//   input: {
//     width: "100%",
//     height: 50,
//     backgroundColor: "#fff",
//     borderRadius: 10,
//     paddingHorizontal: 15,
//     marginBottom: 15,
//     borderWidth: 1,
//     borderColor: "#ccc",
//   },
//   button: {
//     width: "100%",
//     backgroundColor: "#2196F3",
//     padding: 15,
//     borderRadius: 10,
//     alignItems: "center",
//     marginTop: 10,
//     flexDirection: "row",
//     justifyContent: "center",
//   },
//   buttonText: {
//     color: "#fff",
//     fontWeight: "600",
//     fontSize: 16,
//   },
//   loadingText: {
//     color: "#fff",
//     fontSize: 15,
//     marginLeft: 8,
//   },
//   linkText: {
//     marginTop: 20,
//     color: "#2196F3",
//     fontWeight: "500",
//   },
// });
