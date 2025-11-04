// import React from "react";
// import { View, Text, StyleSheet } from "react-native";

// export default function GoalsScreen() {
//   return (
//     <View style={styles.container}>
//       <Text style={styles.text}>Goals for child  (Coming Soon)</Text>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, justifyContent: "center", alignItems: "center" },
//   text: { fontSize: 18, color: "#333" },
// });


import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import axios from "axios";

// 🔗 Change this to your local Django server IP
const API_URL = "http://10.239.126.220:8000/api/goals/";

export default function GoalsScreen() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch goals for a specific child (example: child with ID 2)
  const fetchGoals = async () => {
    try {
      const res = await axios.get(API_URL, {
        params: { child_id: 2 }, // change this dynamically later
      });
      setGoals(res.data);
    } catch (err) {
      console.error("Error fetching goals:", err);
      setError("Failed to load goals.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={{ marginTop: 10 }}>Loading Goals...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "red" }}>{error}</Text>
      </View>
    );
  }

  const renderGoal = ({ item }) => (
    <View style={styles.goalCard}>
      <Text style={styles.goalTitle}>{item.title}</Text>
      <Text style={styles.goalDescription}>{item.description}</Text>
      <Text style={styles.status}>
        Status: <Text style={styles[item.status]}>{item.status}</Text>
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => alert(`Goal: ${item.title}`)}
      >
        <Text style={styles.buttonText}>View Details</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🎯 Child's Goals</Text>
      <FlatList
        data={goals}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderGoal}
        contentContainerStyle={{ paddingBottom: 30 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
    marginBottom: 10,
  },
  goalCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222",
  },
  goalDescription: {
    fontSize: 15,
    color: "#555",
    marginTop: 5,
  },
  status: {
    fontSize: 14,
    marginTop: 8,
  },
  in_progress: { color: "#ff9800", fontWeight: "bold" },
  completed: { color: "#4caf50", fontWeight: "bold" },
  pending: { color: "#f44336", fontWeight: "bold" },
  button: {
    marginTop: 10,
    backgroundColor: "#2196F3",
    paddingVertical: 8,
    borderRadius: 6,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
});

