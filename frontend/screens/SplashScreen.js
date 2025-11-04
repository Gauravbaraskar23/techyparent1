import React, { useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem("access");
        if (token) {
          console.log("✅ Token found — navigating to MainTabs");
          navigation.reset({
            index: 0,
            routes: [{ name: "MainTabs" }],
          });
        } else {
          console.log("🔒 No token — navigating to Login");
          navigation.reset({
            index: 0,
            routes: [{ name: "Login" }],
          });
        }
      } catch (error) {
        console.log("Error checking login:", error);
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
