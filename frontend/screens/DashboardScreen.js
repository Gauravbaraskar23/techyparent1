import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { ProgressBar } from "react-native-paper";

export default function DashboardScreen({ navigation }) {
  const [parent, setParent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchParentData = async () => {
    try {
      setLoading(true);
      // 🧠 Replace with your real API endpoint
      const response = await fetch("http://10.0.2.2:5000/api/parent");
      const data = await response.json();
      setParent(data);
    } catch (error) {
      console.error("Error fetching parent:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParentData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchParentData().finally(() => setRefreshing(false));
  }, []);

  const handleAddChild = () => {
    navigation.navigate("AddChild");
  };

  // 🕒 Get dynamic greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    if (hour < 20) return "Good Evening";
    return "Good Night";
  };

  return (
    <View style={styles.container}>
      {/* ✅ HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.name}>
            {parent?.name ? parent.name : "Parent"}
          </Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </Text>
        </View>

        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={26} color="#fff" />
            <View style={styles.badge} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconButton, { marginLeft: 15 }]}
            onPress={() => navigation.navigate("Login")}
          >
            <Ionicons name="person-circle-outline" size={30} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ✅ SECTION TITLE */}
      <Text style={styles.sectionTitle}>Your Children</Text>

      {/* ✅ CONTENT */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={{ color: "#666", marginTop: 10 }}>Loading data...</Text>
        </View>
      ) : !parent?.children || parent.children.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            No children found.{"\n"}Add your first child using the + button below.
          </Text>
        </View>
      ) : (
        <FlatList
          data={parent.children}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const activity = item.activities?.[0] || {};
            const goalProgress =
              activity.goals_total > 0
                ? activity.goals_completed / activity.goals_total
                : 0;
            const screenTimeHours = parseFloat(activity.screen_time) || 0;

            return (
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("ChildScreenTime", { childId: item.id })
                }
              >
                <View style={styles.childCard}>
                  <View style={styles.childHeader}>
                    <View>
                      <Text style={styles.childName}>{item.name}</Text>
                      <Text style={styles.childAge}>Age {item.age}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: item.online ? "#dcfce7" : "#fee2e2",
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: item.online ? "#16a34a" : "#dc2626",
                          fontWeight: "600",
                        }}
                      >
                        {item.online ? "Online" : "Offline"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.activityRow}>
                    <View style={styles.activityItem}>
                      <Ionicons name="time-outline" size={20} color="#3b82f6" />
                      <Text style={styles.activityLabel}>
                        {screenTimeHours.toFixed(1)}h Screen Time
                      </Text>
                    </View>

                    <View style={styles.activityItem}>
                      <MaterialIcons
                        name="emoji-events"
                        size={20}
                        color="#f59e0b"
                      />
                      <Text style={styles.activityLabel}>
                        {activity.goals_completed}/{activity.goals_total} Goals
                      </Text>
                    </View>
                  </View>

                  <View style={styles.progressContainer}>
                    <Text style={styles.progressLabel}>Goal Progress</Text>
                    <ProgressBar
                      progress={goalProgress}
                      color="#22c55e"
                      style={styles.progressBar}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* ✅ Floating Add Button */}
      <TouchableOpacity style={styles.fab} onPress={handleAddChild}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },

  // ✅ HEADER
  header: {
    backgroundColor: "#3b82f6", // same as bottom tab color
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: { fontSize: 18, color: "#fff", marginBottom: 2 },
  name: { fontSize: 24, fontWeight: "700", color: "#fff", marginBottom: 4 },
  date: { fontSize: 14, color: "#e0e0e0" },
  headerIcons: { flexDirection: "row", alignItems: "center" },
  iconButton: { position: "relative" },
  badge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
    position: "absolute",
    top: 2,
    right: 2,
  },

  // ✅ SECTION TITLE
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#333",
    marginTop: 25,
    marginBottom: 15,
    marginLeft: 20,
  },

  emptyState: { justifyContent: "center", alignItems: "center", marginTop: 50 },
  emptyText: { textAlign: "center", color: "#666", fontSize: 15, lineHeight: 22 },
  center: { justifyContent: "center", alignItems: "center", marginTop: 60 },

  childCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  childHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  childName: { fontSize: 18, fontWeight: "700", color: "#111" },
  childAge: { fontSize: 14, color: "#777", marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  activityItem: { flexDirection: "row", alignItems: "center" },
  activityLabel: { marginLeft: 6, fontSize: 14, color: "#444" },
  progressContainer: { marginTop: 12 },
  progressLabel: { fontSize: 13, color: "#666", marginBottom: 4 },
  progressBar: { height: 8, borderRadius: 5 },
  fab: {
    position: "absolute",
    bottom: 25,
    right: 25,
    backgroundColor: "#3b82f6",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
  },
});
