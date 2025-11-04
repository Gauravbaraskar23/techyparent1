import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, FlatList, StyleSheet } from "react-native";
import { fetchScreenTimeSummary, fetchScreenTimeLogs } from "../src/api/screentimeApi";
import { useRoute } from "@react-navigation/native";

export default function ScreenTimeScreen() {
  const [summary, setSummary] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const route = useRoute();
  const { childId } = route.params || {}; // handle undefined params safely

  useEffect(() => {
    if (!childId) return; // prevent API call if no childId passed

    const loadData = async () => {
      try {
        const summaryData = await fetchScreenTimeSummary(childId);
        const logData = await fetchScreenTimeLogs(childId);
        setSummary(summaryData);
        setLogs(logData);
      } catch (error) {
        console.error("Error loading screen time data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [childId]);

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Screen Time Summary</Text>

      {summary && (
        <View style={styles.summaryBox}>
          <Text>Weekly Total: {summary.weekly_total_hours} hrs</Text>
          <Text>Monthly Total: {summary.monthly_total_hours} hrs</Text>
        </View>
      )}

      <Text style={styles.subTitle}>App Usage</Text>
      {summary?.app_usage_summary?.map((app, index) => (
        <Text key={index}>
          {app.app_used}: {app.total_hours} hrs
        </Text>
      ))}

      <Text style={styles.subTitle}>Daily Logs</Text>
      <FlatList
        data={logs}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Text>{`${item.date}: ${item.duration} hrs (${item.app_used})`}</Text>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f8f8f8" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  subTitle: { fontSize: 16, marginTop: 15, fontWeight: "600" },
  summaryBox: {
    backgroundColor: "#e0f0ff",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
