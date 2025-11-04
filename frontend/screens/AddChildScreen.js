import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";

export default function AddChildScreen({ navigation }) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!name || !age) {
      Alert.alert("Error", "Please enter both name and age");
      return;
    }
    try {
      setLoading(true);
      await axios.post("http://10.239.126.220:8000/api/add-child/", {
        name,
        age: parseInt(age),
        parent_id: 1, // Replace with actual logged-in parent ID
      });
      Alert.alert("Success", "Child added successfully!");
      navigation.goBack();
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Failed to add child.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Child</Text>
      </View>

      {/* Input Fields */}
      <Text style={styles.label}>Child Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter child name"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Age</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter age"
        value={age}
        keyboardType="numeric"
        onChangeText={setAge}
      />

      {/* Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={handleAdd} disabled={loading}>
        <Text style={styles.addButtonText}>{loading ? "Adding..." : "Add Child"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 40,
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 10,
  },
  label: {
    fontSize: 16,
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    marginBottom: 15,
  },
  addButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
