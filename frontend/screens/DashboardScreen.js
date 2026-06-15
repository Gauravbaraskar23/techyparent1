import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  Platform,
  AppState,
} from "react-native";

import { useFocusEffect } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { Alert } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { ProgressBar } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NotificationBadge from "../components/NotificationBadge";


export default function DashboardScreen({ navigation }) {
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const API_BASE = "http://10.176.131.220:8000/api";
  const API_URL = `${API_BASE}/dashboard/`; //  CHANGE THIS

  //  FETCH DASHBOARD
  const fetchDashboard = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");

      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if(!response.ok) {
        console.log("API Error");
        return;
      }
      const json = await response.json();

      setData(json);
    } catch (error) {
      console.log("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchDashboard(); //  reload every time screen is focused
    }, [])
  );

  useEffect(() => {
  const loadSelectedChild = async () => {
    const savedChild = await AsyncStorage.getItem("selectedChildId");
    if (savedChild) {
      setSelectedChildId(parseInt(savedChild));
    }
  };

  loadSelectedChild();
}, []);

  useEffect(() => {
    const handleAppStateChange = async (state) => {
      if (state === "background" || state === "inactive") {
        const childId = await AsyncStorage.getItem("selectedChildId");
        const token = await AsyncStorage.getItem("access_token");

        if (childId) {
          await fetch(`${API_BASE}/children/${childId}/set-offline/`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        }
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => subscription.remove();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboard().then(() => setRefreshing(false));
  }, []);

  const handleAddChild = () => navigation.navigate("AddChild");
  const handleLogout = async () => {
    await AsyncStorage.removeItem("access_token");
    navigation.navigate("Login");
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    if (hour < 20) return "Good Evening";
    return "Good Night";
  };

  // ⏳ LOADING
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  // ❌ NO DATA
  if (!data || !data.parent ) {
    return (
      <View style={styles.loader}>
        <Text>Loading....</Text>
      </View>
    );
  }

  const handleDelete = async (childId) => {
    const deleteChild = async () => {
      try {
        const token = await AsyncStorage.getItem("access_token");

        await fetch(`${API_BASE}/children/${childId}/`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        Alert.alert("Deleted", "Child removed successfully");

        fetchDashboard(); // refresh
      } catch (err) {
        console.log(err);
        Alert.alert("Error", "Failed to delete child");
      }
    };

    if (Platform.OS === "web") {
      const confirmDelete = window.confirm("Delete this child?");
      if (confirmDelete) deleteChild();
    } else {
      Alert.alert("Delete Child", "Are you sure?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", onPress: deleteChild, style: "destructive" },
      ]);
    }
  };

  const handleSelectChild = async (child) => {
    try {
      console.log("Selected Child:", child);

      // UI highlight ke liye state update karo
      setSelectedChildId(child.id);

      // ✅ Save childId
      await AsyncStorage.setItem("selectedChildId", child.id.toString());

      // ✅ Backend ko batao child online hai
      const token = await AsyncStorage.getItem("access_token");

      await fetch(`${API_BASE}/children/${child.id}/set-online/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      Alert.alert("Success", `${child.name} selected`);

    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to select child");
    }
  };


  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.name}>{data.parent.name}</Text>
          <Text style={styles.date}>{new Date().toDateString()}</Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center" }}>

          {/* Daily Routine */}
          <TouchableOpacity
              style={{ marginRight: 15 }}
              onPress={() => navigation.navigate("DailyRoutine")}
            >
              <Ionicons name="calendar-outline" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Notifications */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate("Notifications")}
          >
            <View style={{ position: "relative" }}>
              <Ionicons name="notifications-outline" size={26} color="#fff" />
              <View style={{ position: "absolute", top: -4, right: -4 }}>
                {data?.notifications > 0 && (
                  <NotificationBadge count={data.notifications} />
                )}
              </View>
            </View>
          </TouchableOpacity>

          {/* Profile */}
          <TouchableOpacity
            style={[styles.iconButton, { marginLeft: 15 }]}
            onPress={handleLogout}
          >
            <Ionicons name="person-circle-outline" size={30} color="#fff" />
          </TouchableOpacity>

      </View>
      </View>

      {/* TITLE */}
      <View style={styles.statsRow}>
        <Text style={styles.sectionTitle}>Your Children</Text>

        <View style={styles.statsCard}>
          <Text style={styles.statsText}>
            {data.statistics.online_children}/
            {data.statistics.total_children} Online
          </Text>
        </View>
      </View>

      {/* LIST */}
      <FlatList
        data={data?.children || []}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => {
          const activity = data?.recent_activities?.find(
            (a) => a.child === item.id
          ) || {};

          const progress =
            activity.goals_total > 0
              ? activity.goals_completed / activity.goals_total
              : 0;

          return (
            <TouchableOpacity style={[styles.childCard, selectedChildId === item.id && styles.selectedChildCard]}
             onPress={() => handleSelectChild(item)}
            >
              <View style={styles.childHeader}>
                <View style={styles.childInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {item.name.charAt(0)}
                    </Text>
                  </View>

                  <View style={styles.childDetails}>
                    <Text style={styles.childName}>{item.name}</Text>
                    <Text style={styles.childAge}>
                      Age {item.age} • {item.gender}
                    </Text>
                  </View>
                </View>

                <View style={styles.statusBadge}>
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: item.online ? "green" : "gray" },
                    ]}
                  />
                  <Text style={{ color: item.online ? "green" : "gray" }}>
                    {item.online ? "Online" : "Offline"}
                  </Text>
                </View>
              </View>

              <View style={styles.activityRow}>
                <View style={styles.activityItem}>
                  <Ionicons name="time-outline" size={20} color="#3b82f6" />
                  <Text style={styles.activityLabel}>
                    {activity.screen_time || 0}h Screen Time
                  </Text>
                </View>

                <View style={styles.activityItem}>
                  <MaterialIcons name="emoji-events" size={20} color="#f59e0b" />
                  <Text style={styles.activityLabel}>
                    {activity.goals_completed || 0}/
                    {activity.goals_total || 0} Goals
                  </Text>
                </View>
              </View>

              <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Goal Progress</Text>
                  <Text style={styles.progressPercentage}>
                    {Math.round(progress * 100)}%
                  </Text>
                </View>
                <ProgressBar progress={progress} color="#22c55e" />
              </View>
                <View style={{ flexDirection: "row", marginTop: 10 }}>
        
        {/* EDIT BUTTON */}
        <TouchableOpacity
          style={{ marginRight: 15 }}
          onPress={() =>
            navigation.navigate("EditChild", { child: item })
          }
        ><Text>
            Edit <Ionicons name="create-outline" size={22} color="#3b82f6" />
          </Text>
        </TouchableOpacity>

        {/* DELETE BUTTON */}
        <TouchableOpacity
          onPress={() => handleDelete(item.id)}
        >
          <Text>
            Delete <Ionicons name="trash-outline" size={22} color="red" />
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('SetPin')}>
          <Text>Set PIN</Text>
        </TouchableOpacity>
      
              
      </View>
            </TouchableOpacity>
          );
        }}
      />
          
      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleAddChild}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },

  header: {
    backgroundColor: "#3b82f6",
    paddingTop: 60,
    paddingHorizontal: 22,
    paddingBottom: 30,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  greeting: { color: "#e0e7ff" },
  name: { fontSize: 26, fontWeight: "800", color: "#fff" },
  date: { color: "#dbeafe" },

  headerIcons: { flexDirection: "row" },

  iconButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
  },

  badge: {
    width: 8,
    height: 8,
    backgroundColor: "red",
    position: "absolute",
    top: 2,
    right: 2,
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    margin: 20,
  },

  sectionTitle: { fontSize: 18, fontWeight: "700" },

  statsCard: {
    backgroundColor: "#e0f2fe",
    padding: 6,
    borderRadius: 10,
  },

  statsText: { fontWeight: "600" },

  childCard: {
    backgroundColor: "#fff",
    margin: 20,
    padding: 20,
    borderRadius: 20,
  },

  childHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  childInfo: { flexDirection: "row" },


  selectedChildCard: {
  borderWidth: 2,
  borderColor: "#3b82f6",
  backgroundColor: "#eff6ff",
},

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#e0f2fe",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: { fontSize: 20, fontWeight: "700" },

  childDetails: { marginLeft: 10 },

  childName: { fontSize: 18, fontWeight: "800" },

  childAge: { color: "#6b7280" },

  statusBadge: { flexDirection: "row", alignItems: "center" },

  dot: {
    width: 8,
    height: 8,
    backgroundColor: "green",
    borderRadius: 4,
    marginRight: 5,
  },

  activityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },

  activityItem: { flexDirection: "row", alignItems: "center" },

  activityLabel: { marginLeft: 8 },

  progressContainer: { marginTop: 15 },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  progressLabel: { fontSize: 12 },

  progressPercentage: { fontSize: 12 },

  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#3b82f6",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
});

 