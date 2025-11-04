// import React from "react";
// import { View, Text, StyleSheet } from "react-native";

// export default function FamilyBondingScreen() {
//   return (
//     <View style={styles.container}>
//       <Text style={styles.text}>Family Bonding Ideas (Coming Soon)</Text>
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
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";

export default function FamilyBondingScreen() {
  const [categories, setCategories] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const BASE_URL = "http://127.0.0.1:8000/api/familybonding/";

  // Fetch categories and activities from your Django API
  const fetchFamilyBondingData = async () => {
    try {
      const response = await fetch(BASE_URL);
      const data = await response.json();

      const categoryResponse = await fetch(data.categories);
      const categoryData = await categoryResponse.json();

      const activityResponse = await fetch(data.activities);
      const activityData = await activityResponse.json();

      setCategories(categoryData);
      setActivities(activityData);
    } catch (error) {
      console.error("Error fetching family bonding data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFamilyBondingData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading Family Bonding Ideas...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Family Bonding Activities</Text>

      {/* Category Section */}
      <Text style={styles.sectionTitle}>Categories</Text>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.categoryCard}>
            <Text style={styles.categoryText}>{item.name}</Text>
          </View>
        )}
      />

      {/* Activity Section */}
      <Text style={styles.sectionTitle}>Activities</Text>
      {activities.length === 0 ? (
        <Text style={styles.noDataText}>No activities available right now.</Text>
      ) : (
        <FlatList
          data={activities}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.activityCard}>
              <Text style={styles.activityTitle}>{item.title}</Text>
              <Text style={styles.activityDescription}>{item.description}</Text>
              <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>Try This</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 12,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 10,
    marginBottom: 6,
  },
  categoryCard: {
    backgroundColor: "#E8F5E9",
    padding: 12,
    borderRadius: 12,
    marginRight: 10,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2E7D32",
  },
  activityCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    elevation: 3,
  },
  activityTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#1B5E20",
  },
  activityDescription: {
    fontSize: 15,
    color: "#555",
    marginTop: 6,
  },
  button: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginTop: 10,
    alignSelf: "flex-start",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  noDataText: {
    fontSize: 15,
    color: "#888",
    textAlign: "center",
    marginTop: 20,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 10,
    color: "#555",
  },
});
