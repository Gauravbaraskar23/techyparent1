import React, { useState, useEffect, useCallback } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Alert 
} from "react-native";
// import { downloadPDF } from "../utils/pdfDownloader";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getReportSummary, exportReport, completeRecommendation } from "../api/ReportsApi";
import { useNavigation } from '@react-navigation/native';

export default function ReportsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [childId, setChildId] = useState(null);
  const [exporting, setExporting] = useState(false);
  const navigation = useNavigation();
  // Load child ID from storage
  useEffect(() => {
    loadChildId();
  }, []);

  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (childId) {
        loadReportData();
      }
    }, [childId])
  );

  const loadChildId = async () => {
    try {
      const id = await AsyncStorage.getItem('selectedChildId');
      setChildId(id ? parseInt(id) : 1); // Default to 1 if not found
    } catch (error) {
      console.error('Error loading child ID:', error);
      setChildId(1);
    }
  };

  const loadReportData = async () => {
    try {
      setLoading(true);
      const data = await getReportSummary(childId);
      setReportData(data);
    } catch (error) {
      console.error('Error loading report data:', error);
      Alert.alert('Error', 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReportData();
    setRefreshing(false);
  };
const handleExportReport = async () => {
  try {
    setExporting(true);

    const result = await exportReport(childId, 'weekly');

    const fileUrl = result.download_url;
    console.log("EXPORT RESPONSE:", result);
    console.log("PDF URL:", result?.download_url);
    // 📥 Download PDF locally
    const localFilePath = await downloadPDF(fileUrl, 'child_report.pdf');

    console.log("PDF saved at:", localFilePath);

    // 👉 Navigate to viewer
    navigation.navigate('PdfViewer', {
      pdfUrl: 'file://' + localFilePath,
    });

  } catch (error) {
    Alert.alert("Error", "Failed to download report");
  } finally {
    setExporting(false);
  }
};
  // const handleExportReport = async () => {
  //   try {
  //     setExporting(true);
  //     Alert.alert('Exporting...', 'Generating your report PDF');
      
  //     const result = await exportReport(childId, 'weekly');
      
  //     Alert.alert(
  //       'Success!', 
  //       'Report exported successfully',
  //       [
  //         { text: 'OK', onPress: () => console.log('Export confirmed') }
  //       ]
  //     );
  //   } catch (error) {
  //     console.error('Error exporting report:', error);
  //     Alert.alert('Error', 'Failed to export report');
  //   } finally {
  //     setExporting(false);
  //   }
  // };

  const handleCompleteRecommendation = async (recommendationId) => {
    try {
      await completeRecommendation(recommendationId);
      await loadReportData(); // Refresh to remove completed recommendation
      Alert.alert('Success', 'Recommendation marked as complete');
    } catch (error) {
      console.error('Error completing recommendation:', error);
      Alert.alert('Error', 'Failed to complete recommendation');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading report...</Text>
      </View>
    );
  }

  if (!reportData) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="document-text-outline" size={64} color="#9ca3af" />
        <Text style={styles.errorText}>No report data available</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Progress Reports</Text>
      </View>

      {/* Summary Section */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Ionicons name="time-outline" size={30} color="#3b82f6" />
          <Text style={styles.summaryTitle}>Screen Time</Text>
          <Text style={styles.summaryValue}>
            {reportData.screen_time_today || '0 hrs / day'}
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <Ionicons name="book-outline" size={30} color="#22c55e" />
          <Text style={styles.summaryTitle}>Learning</Text>
          <Text style={styles.summaryValue}>
            {reportData.videos_watched_total} Videos
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <MaterialIcons name="emoji-events" size={30} color="#f59e0b" />
          <Text style={styles.summaryTitle}>Goals</Text>
          <Text style={styles.summaryValue}>
            {reportData.goals_achieved_total} Achieved
          </Text>
        </View>
      </View>

      {/* Activity Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activity Overview</Text>

        <View style={styles.activityCard}>
          <Ionicons name="bar-chart-outline" size={26} color="#3b82f6" />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={styles.activityTitle}>Daily Activity</Text>
            <Text style={styles.activityDesc}>
              Your child's activity {reportData.daily_activity_change >= 0 ? 'increased' : 'decreased'} by{' '}
              <Text style={{ 
                color: reportData.daily_activity_change >= 0 ? "#16a34a" : "#ef4444",
                fontWeight: '600'
              }}>
                {Math.abs(reportData.daily_activity_change)}%
              </Text> this week.
            </Text>
          </View>
        </View>

        <View style={styles.activityCard}>
          <Ionicons 
            name={reportData.engagement_level === 'High' ? "happy-outline" : "happy-outline"} 
            size={26} 
            color="#22c55e" 
          />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={styles.activityTitle}>Engagement: {reportData.engagement_level}</Text>
            <Text style={styles.activityDesc}>
              High engagement in{' '}
              <Text style={{ color: "#3b82f6", fontWeight: '600' }}>
                {reportData.engagement_category}
              </Text>{' '}
              activities.
            </Text>
          </View>
        </View>
      </View>

      {/* Weekly Progress Chart */}
      <View style={styles.chartPlaceholder}>
        <Text style={styles.chartText}>📊 Weekly Learning Progress</Text>
        {reportData.weekly_data && reportData.weekly_data.length > 0 && (
          <View style={styles.miniChart}>
            {reportData.weekly_data.map((day, index) => (
              <View key={index} style={styles.chartBar}>
                <View 
                  style={[
                    styles.barFill, 
                    { 
                      height: `${Math.min(100, (day.screen_time_minutes / 180) * 100)}%`,
                      backgroundColor: day.screen_time_minutes > 120 ? '#ef4444' : '#3b82f6'
                    }
                  ]} 
                />
                <Text style={styles.chartLabel}>{day.label}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Recommendations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommendations</Text>

        {reportData.recommendations && reportData.recommendations.length > 0 ? (
          reportData.recommendations.map((recommendation, index) => (
            <TouchableOpacity 
              key={recommendation.id || index}
              style={styles.recommendCard}
              onPress={() => handleCompleteRecommendation(recommendation.id)}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={recommendation.icon_name || "bulb-outline"} 
                size={28} 
                color={
                  recommendation.category === 'creativity' ? '#f97316' :
                  recommendation.category === 'screen_time' ? '#3b82f6' :
                  recommendation.category === 'learning' ? '#22c55e' :
                  recommendation.category === 'physical' ? '#8b5cf6' :
                  '#6b7280'
                }
              />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <View style={styles.recommendHeader}>
                  <Text style={styles.recommendTitle}>{recommendation.title}</Text>
                  {recommendation.priority === 'high' && (
                    <View style={styles.priorityBadge}>
                      <Text style={styles.priorityText}>!</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.recommendDesc}>
                  {recommendation.description}
                </Text>
                <Text style={styles.tapToComplete}>Tap to mark complete</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.noRecommendations}>
            <Ionicons name="checkmark-circle" size={48} color="#22c55e" />
            <Text style={styles.noRecommendText}>All recommendations completed!</Text>
          </View>
        )}
      </View>

      {/* Export Button */}
      <TouchableOpacity 
        style={[styles.exportButton, exporting && styles.exportButtonDisabled]}
        onPress={handleExportReport}
        disabled={exporting}
      >
        {exporting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons name="download-outline" size={22} color="#fff" />
        )}
        <Text style={styles.exportText}>
          {exporting ? 'Exporting...' : 'Export Report (PDF)'}
        </Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#f9fafb",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6b7280',
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    backgroundColor: "#3b82f6",
    paddingVertical: 18,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  headerText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 15,
    marginTop: 15,
  },
  summaryCard: {
    backgroundColor: "#fff",
    width: "31%",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 14,
    color: "#555",
    marginTop: 6,
  },
  summaryValue: {
    fontSize: 13,
    color: "#111",
    fontWeight: "600",
    textAlign: 'center',
    marginTop: 2,
  },
  section: {
    marginTop: 25,
    marginHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    color: "#111",
  },
  activityCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  activityDesc: {
    color: "#555",
    fontSize: 13,
    marginTop: 3,
  },
  chartPlaceholder: {
    margin: 20,
    padding: 20,
    backgroundColor: "#e0f2fe",
    borderRadius: 12,
    alignItems: "center",
  },
  chartText: {
    color: "#0369a1",
    fontWeight: "600",
    marginBottom: 15,
    fontSize: 16,
  },
  miniChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    width: '100%',
    height: 100,
    paddingHorizontal: 10,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 100,
    marginHorizontal: 2,
  },
  barFill: {
    width: '100%',
    backgroundColor: '#3b82f6',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 5,
  },
  chartLabel: {
    fontSize: 10,
    color: '#0369a1',
    marginTop: 4,
    fontWeight: '600',
  },
  recommendCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  recommendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recommendTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
    flex: 1,
  },
  priorityBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  recommendDesc: {
    color: "#555",
    fontSize: 13,
    marginTop: 4,
  },
  tapToComplete: {
    fontSize: 11,
    color: '#3b82f6',
    marginTop: 6,
    fontStyle: 'italic',
  },
  noRecommendations: {
    alignItems: 'center',
    padding: 40,
  },
  noRecommendText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 10,
  },
  exportButton: {
    backgroundColor: "#3b82f6",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 40,
    marginTop: 25,
    paddingVertical: 12,
    borderRadius: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  exportButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  exportText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    marginLeft: 8,
  },
});
// import React from "react";
// import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
// import { Ionicons, MaterialIcons } from "@expo/vector-icons";

// export default function ReportsScreen() {
//   return (
//     <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
//       {/* ✅ Header */}
//       <View style={styles.header}>
//         <Text style={styles.headerText}>Progress Reports</Text>
//       </View>

//       {/* ✅ Summary Section */}
//       <View style={styles.summaryContainer}>
//         <View style={styles.summaryCard}>
//           <Ionicons name="time-outline" size={30} color="#3b82f6" />
//           <Text style={styles.summaryTitle}>Screen Time</Text>
//           <Text style={styles.summaryValue}>2.5 hrs / day</Text>
//         </View>

//         <View style={styles.summaryCard}>
//           <Ionicons name="book-outline" size={30} color="#22c55e" />
//           <Text style={styles.summaryTitle}>Learning</Text>
//           <Text style={styles.summaryValue}>12 Videos Watched</Text>
//         </View>

//         <View style={styles.summaryCard}>
//           <MaterialIcons name="emoji-events" size={30} color="#f59e0b" />
//           <Text style={styles.summaryTitle}>Goals</Text>
//           <Text style={styles.summaryValue}>5 Achieved</Text>
//         </View>
//       </View>

//       {/* ✅ Activity Overview */}
//       <View style={styles.section}>
//         <Text style={styles.sectionTitle}>Activity Overview</Text>

//         <View style={styles.activityCard}>
//           <Ionicons name="bar-chart-outline" size={26} color="#3b82f6" />
//           <View style={{ marginLeft: 10 }}>
//             <Text style={styles.activityTitle}>Daily Activity</Text>
//             <Text style={styles.activityDesc}>
//               Your child’s activity increased by <Text style={{ color: "#16a34a" }}>12%</Text> this week.
//             </Text>
//           </View>
//         </View>

//         <View style={styles.activityCard}>
//           <Ionicons name="happy-outline" size={26} color="#22c55e" />
//           <View style={{ marginLeft: 10 }}>
//             <Text style={styles.activityTitle}>Engagement</Text>
//             <Text style={styles.activityDesc}>
//               High engagement in <Text style={{ color: "#3b82f6" }}>Creative Learning</Text> videos.
//             </Text>
//           </View>
//         </View>
//       </View>

//       {/* ✅ Placeholder for Graph or Chart */}
//       <View style={styles.chartPlaceholder}>
//         <Text style={styles.chartText}>📊 Weekly Learning Progress Chart</Text>
//       </View>

//       {/* ✅ Recommendations */}
//       <View style={styles.section}>
//         <Text style={styles.sectionTitle}>Recommendations</Text>

//         <View style={styles.recommendCard}>
//           <Ionicons name="bulb-outline" size={28} color="#f97316" />
//           <View style={{ flex: 1, marginLeft: 10 }}>
//             <Text style={styles.recommendTitle}>Encourage Creativity</Text>
//             <Text style={styles.recommendDesc}>
//               Try adding drawing and storytelling activities to boost imagination.
//             </Text>
//           </View>
//         </View>

//         <View style={styles.recommendCard}>
//           <Ionicons name="fitness-outline" size={28} color="#3b82f6" />
//           <View style={{ flex: 1, marginLeft: 10 }}>
//             <Text style={styles.recommendTitle}>Balanced Screen Time</Text>
//             <Text style={styles.recommendDesc}>
//               Maintain healthy limits and take short breaks after learning sessions.
//             </Text>
//           </View>
//         </View>
//       </View>

//       {/* ✅ Export Button */}
//       <TouchableOpacity style={styles.exportButton}>
//         <Ionicons name="download-outline" size={22} color="#fff" />
//         <Text style={styles.exportText}>Export Report (PDF)</Text>
//       </TouchableOpacity>

//       <View style={{ height: 40 }} />
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#f9fafb",
//   },
//   header: {
//     backgroundColor: "#3b82f6",
//     paddingVertical: 18,
//     paddingHorizontal: 20,
//   },
//   headerText: {
//     color: "#fff",
//     fontSize: 22,
//     fontWeight: "700",
//   },
//   summaryContainer: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginHorizontal: 15,
//     marginTop: 15,
//   },
//   summaryCard: {
//     backgroundColor: "#fff",
//     width: "31%",
//     paddingVertical: 15,
//     borderRadius: 12,
//     alignItems: "center",
//     elevation: 3,
//   },
//   summaryTitle: {
//     fontSize: 14,
//     color: "#555",
//     marginTop: 6,
//   },
//   summaryValue: {
//     fontSize: 14,
//     color: "#111",
//     fontWeight: "600",
//   },
//   section: {
//     marginTop: 25,
//     marginHorizontal: 15,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: "700",
//     marginBottom: 12,
//     color: "#111",
//   },
//   activityCard: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#fff",
//     padding: 12,
//     borderRadius: 10,
//     marginBottom: 10,
//     elevation: 2,
//   },
//   activityTitle: {
//     fontSize: 16,
//     fontWeight: "600",
//   },
//   activityDesc: {
//     color: "#555",
//     fontSize: 13,
//     marginTop: 3,
//   },
//   chartPlaceholder: {
//     margin: 20,
//     padding: 40,
//     backgroundColor: "#e0f2fe",
//     borderRadius: 12,
//     alignItems: "center",
//   },
//   chartText: {
//     color: "#0369a1",
//     fontWeight: "600",
//   },
//   recommendCard: {
//     flexDirection: "row",
//     alignItems: "flex-start",
//     backgroundColor: "#fff",
//     padding: 12,
//     borderRadius: 10,
//     marginBottom: 10,
//     elevation: 2,
//   },
//   recommendTitle: {
//     fontSize: 15,
//     fontWeight: "600",
//     color: "#111",
//   },
//   recommendDesc: {
//     color: "#555",
//     fontSize: 13,
//     marginTop: 4,
//   },
//   exportButton: {
//     backgroundColor: "#3b82f6",
//     flexDirection: "row",
//     justifyContent: "center",
//     alignItems: "center",
//     marginHorizontal: 40,
//     marginTop: 25,
//     paddingVertical: 12,
//     borderRadius: 30,
//   },
//   exportText: {
//     color: "#fff",
//     fontWeight: "700",
//     fontSize: 16,
//     marginLeft: 8,
//   },
// });
