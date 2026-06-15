import React, { useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const BASE_URL = "http://10.176.131.220:8000/api"; // 🔥 your IP

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem("access_token");

        if (!token) {
          console.log("🔒 No token — go to Login");
          return navigation.reset({
            index: 0,
            routes: [{ name: "Login" }],
          });
        }

        // 🔥 VERIFY TOKEN WITH BACKEND
        const res = await axios.get(`${BASE_URL}/me/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 200) {
          console.log("✅ Valid token — go to Dashboard");

          navigation.reset({
            index: 0,
            routes: [{ name: "MainTabs" }],
          });
        }
      } catch (error) {
        console.log("❌ Token invalid or expired");

        // 🔥 CLEAR BAD TOKEN
        await AsyncStorage.removeItem("access_token");
        await AsyncStorage.removeItem("refresh_token");

        navigation.reset({
          index: 0,
          routes: [{ name: "Login" }],
        });
      }
    };

    checkLoginStatus();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2196F3" />
      <Text style={styles.text}>Loading Techy Parent...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { marginTop: 10, fontSize: 16, color: "#333" },
});