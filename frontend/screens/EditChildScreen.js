import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

const API_BASE = "http://10.176.131.220:8000/api";

export default function EditChildScreen({ route, navigation }) {
  const { child } = route.params;

  const [name, setName] = useState(child.name);
  const [age, setAge] = useState(String(child.age));
  const [gender, setGender] = useState(child.gender || "");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!name || !age) {
      Alert.alert("Error", "Please enter name and age");
      return;
    }

    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("access_token");

      if (!token) {
        Alert.alert("Session Expired", "Please login again");
        navigation.replace("Login");
        return;
      }

      await axios.patch(
        `${API_BASE}/children/${child.id}/`,
        {
          name,
          age: parseInt(age),
          gender: gender || "",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Alert.alert("Success", "Child updated successfully 🎉", [
        {
          text: "OK",
          onPress: () => 
            navigation.navigate.goBack(),
         
        },
      ]);
    } catch (err) {
      console.log(err.response?.data || err);

      if (err.response?.status === 401) {
        Alert.alert("Session Expired", "Login again");
        navigation.replace("Login");
      } else {
        Alert.alert("Error", "Update failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : null}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          {/* HEADER */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={22} color="#111827" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Edit Child</Text>
          </View>

          {/* FORM CARD */}
          <View style={styles.card}>
            {/* NAME */}
            <Text style={styles.label}>Child Name</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={18} color="#6b7280" />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter child name"
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* AGE */}
            <Text style={styles.label}>Age</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="calendar-outline" size={18} color="#6b7280" />
              <TextInput
                style={styles.input}
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                placeholder="Enter age"
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* GENDER */}
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderRow}>
              {["male", "female", "other"].map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.genderButton,
                    gender === g && styles.genderButtonActive,
                  ]}
                  onPress={() => setGender(g)}
                >
                  <Text
                    style={[
                      styles.genderText,
                      gender === g && styles.genderTextActive,
                    ]}
                  >
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* UPDATE BUTTON */}
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleUpdate}
              disabled={loading}
            >
              <Text style={styles.addButtonText}>
                {loading ? "Updating..." : "Update Child"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f3f4f6" },

  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },

  backButton: {
    height: 40,
    width: 40,
    borderRadius: 12,
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginLeft: 15,
    color: "#111827",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    elevation: 3,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    marginTop: 10,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },

  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: "#111827",
  },

  genderRow: {
    flexDirection: "row",
    gap: 10,
  },

  genderButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },

  genderButtonActive: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },

  genderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },

  genderTextActive: {
    color: "#fff",
  },

  addButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 25,
  },

  addButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});