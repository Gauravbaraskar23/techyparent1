import React, { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  RefreshControl,
  Linking,
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { NativeModules } from 'react-native';
import UsageStats from 'react-native-usage-stats';
import {
  getTodayScreenTime,
  getScreenTimeSummary,
  getAppLimits,
  createAppLimit,
  updateAppLimit,
  deleteAppLimit,
} from '../src/api/screentimeApi';
import ScreenTimeService from '../services/ScreenTimeService';
import IntentLauncher from 'react-native-intent-launcher';
// import * as IntentLauncher from 'expo-intent-launcher';

export default function ScreenTimeScreen() {
  const [todayData, setTodayData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [appLimits, setAppLimits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [limitMinutes, setLimitMinutes] = useState('60');

  const { BlockerModule } = NativeModules || {};
  const route = useRoute();
  const navigation = useNavigation();
  // const { childId } = route.params || {};
    const [childId, setChildId] = useState(null);
    // const [initialLoading, setInitialLoading] = useState(true);  // new add
    useEffect(() => {
      const getChildId = async () => {
        
          const id = await AsyncStorage.getItem('selectedChildId');
          console.log("Child ID from storage:", id);

          if (id) {
            setChildId(parseInt(id));
          } else {
            console.log(" No child selected");
          }
        
      };

      getChildId();
      requestUsagePermission();  // Request permission on screen load

    }, []);  
// Debugging
  console.log("ChildID: ", childId);


  // Initialize screen time tracking service
  useEffect(() => {
    if (childId) {
      ScreenTimeService.init(childId);
    }
    
    return () => {
      // Don't stop tracking on unmount - it should run in background
    };
  }, [childId]);

  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (childId) {
        loadAllData();
      }
    }, [childId])
  );

  const loadAllData = async () => {
    try {
      setLoading(true);

      console.log("Loading all data....");
      await Promise.all([
        loadTodayData(),
        loadSummary(),
        loadAppLimits(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load screen time data');
    } finally {
      console.log("Finished loading data.");
      setLoading(false);
    }
  };

  const loadTodayData = async () => {
    try {
      console.log("Loading today's API data with child ID: ", childId);
      const data = await getTodayScreenTime(childId);

      console.log("Todays API response: ", data);
      setTodayData(data);
    } catch (error) {
      console.error('Error loading today data:', error);

      // IMP Alert
      Alert.alert("Today API error", JSON.stringify(error));
    }
  };

  const loadSummary = async () => {
    try {
      const data = await getScreenTimeSummary(childId);
      
      console.log("Summary API response: ", data);
      setSummary(data);
    } catch (error) {
      console.error('Error loading summary:', error);
      Alert.alert("Summary API error", JSON.stringify(error));
    }
  };

  const loadAppLimits = async () => {
    try {
      const data = await getAppLimits(childId);
      console.log("App limits API response: ", data);
      setAppLimits(data);
    } catch (error) {
      console.error('Error loading app limits:', error);
      Alert.alert("App Limits API error", JSON.stringify(error));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const requestUsagePermission = async () => {
      try {
        const granted = await UsageStats.checkPermission();

        console.log("Usage permission:", granted);

        if (!granted) {
          Alert.alert(
            "Permission Required",
            "Enable Usage Access to track screen time",
            [
              {
                text: "Open Settings",
                onPress: () => {
                  NativeModules.startActivity({
                    action: 'android.settings.USAGE_ACCESS_SETTINGS',
                  });
                },
              },
              { text: "Cancel" },
            ]
          );
        }
      } catch (error) {
        console.log("Permission error:", error);
      }
    };

  const handleSetLimit = (app) => {
    setEditingApp(app);
    
    // Find existing limit
    const existingLimit = appLimits.find(
      limit => limit.app_package === app.app_package
    );
    
    if (existingLimit) {
      setLimitMinutes(existingLimit.daily_limit_minutes.toString());
    } else {
      setLimitMinutes('60');
    }
    
    setModalVisible(true);
  };

  const handleSaveLimit = async () => {
    if (!editingApp) return;

    const minutes = parseInt(limitMinutes);
    
    if (isNaN(minutes) || minutes <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid number of minutes');
      return;
    }

    try {
      const existingLimit = appLimits.find(
        limit => limit.app_package === editingApp.app_package
      );

      if (existingLimit) {
        // Update existing limit
        await updateAppLimit(existingLimit.id, minutes, false);
      } else {
        // Create new limit
        await createAppLimit(
          childId,
          editingApp.app_name,
          editingApp.app_package,
          minutes,
          false
        );
      }

      setModalVisible(false);
      setEditingApp(null);
      await loadAllData();
      
      Alert.alert('Success', `Limit set to ${minutes} minutes for ${editingApp.app_name}`);
    } catch (error) {
      console.error('Error saving limit:', error);
      Alert.alert('Error', 'Failed to save limit');
    }
  };

  const handleBlockApp = async (app, shouldBlock) => {
    try {
      const existingLimit = appLimits.find(
        limit => limit.app_package === app.app_package
      );

      if (existingLimit) {
        await updateAppLimit(existingLimit.id, existingLimit.daily_limit_minutes, shouldBlock);
      } else {
        await createAppLimit(childId, app.app_name, app.app_package, 0, shouldBlock);
      }
      
      if (shouldBlock) {
        response.blocked_apps.forEach(app => {
          BlockerModule.blockApp(app.app_package);
        });
        
      } else {
        await BlockerModule.unblockApp(app.app_package);
      }

      await loadAllData();
      
      Alert.alert(
        'Success',
        shouldBlock ? `${app.app_name} has been blocked` : `${app.app_name} has been unblocked`
      );
    } catch (error) {
      console.error('Error blocking app:', error);
      Alert.alert('Error', 'Failed to update app block status');
    }
  };

  const handleUpdateScreenTime = async () => {
    try {
      Alert.alert('Updating...', 'Fetching latest screen time data');
      await ScreenTimeService.trackCurrentUsage();
      await loadAllData();
      Alert.alert('Success', 'Screen time updated successfully');
    } catch (error) {
      console.error('Error updating screen time:', error);
      Alert.alert('Error', 'Failed to update screen time');
    }
  };

  const formatTime = (minutes) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return '#ef4444';
    if (percentage >= 80) return '#f59e0b';
    return '#10b981';
  };


  
  const renderAppItem = ({ item }) => {

  const limitData = appLimits.find(
    l => l.app_package === item.app_package
  );

  // const dailyLimit = item.daily_limit || limitData?.daily_limit_minutes;
  // const usage = item.total_time || 0;
  const dailyLimit = limitData?.daily_limit_minutes || 0;

  const usage = item.duration_minutes || 0;

  const percentage = dailyLimit
    ? Math.min((usage / dailyLimit) * 100, 100)
    : 0;
  console.log("App limits Api response:", appLimits);
  return (
    <View style={styles.appCard}>

      {/* LEFT SIDE */}
      <View style={{ flex: 1 }}>
        <Text style={styles.appName}>{item.app_name}</Text>

        <Text>
          Used: {formatTime(usage)}
        </Text>

        {/* ✅ ALWAYS SHOW LIMIT SECTION */}
        {dailyLimit > 0 ? (
          <Text style={styles.limitText}>
            Limit: {formatTime(dailyLimit)}
          </Text>
        ) : (
          <Text style={ { color: 'gray' } }>
            No limit set
          </Text>
        )}

        {/* ✅ Progress bar only if limit exists */}
        {dailyLimit > 0 && (
          <View style={{ height: 6, backgroundColor: '#ddd', marginTop: 5 }}>
            <View style={
              {
                height: 6,
                width: `${percentage}%`,
                backgroundColor: percentage >= 100 ? 'red' : 'green',
              }
            } />
          </View>
        )}

        {/* ✅ Exceeded warning */}
        { percentage >= 100 && (
          <Text style={{ color: 'red'}}>
            Limit Exceeded 🚫
          </Text>
        )}
      </View>

      {/* RIGHT SIDE BUTTON */}
      <TouchableOpacity
        style={styles.limitButton}
        onPress={() => handleSetLimit(item)}
      >
        <Text style={styles.limitButtonText}>
          {dailyLimit > 0 ? 'Edit limit' : 'Set limit'}
        </Text>
      </TouchableOpacity>

    </View>
  );
};

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading screen time data...</Text>
      </View>
    );
  }

  if (!childId) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#9ca3af" />
        <Text style={styles.errorText}>No child selected</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Screen Time</Text>
          <TouchableOpacity
            style={styles.updateButton}
            onPress={handleUpdateScreenTime}
          >
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.updateButtonText}>Update</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Summary */}
        {todayData && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Today's Usage</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {formatTime(todayData.total_minutes)}
                </Text>
                <Text style={styles.summaryLabel}>Total Time</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{todayData.app_count}</Text>
                <Text style={styles.summaryLabel}>Apps Used</Text>
              </View>
            </View>
          </View>
        )}

        {/* Weekly/Monthly Summary */}
        {summary && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Overview</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {summary?.weekly?.total_hours || 0}h
                </Text>
                <Text style={styles.summaryLabel}>This Week</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {summary?.monthly?.total_hours || 0}h
                </Text>
                <Text style={styles.summaryLabel}>This Month</Text>
              </View>
            </View>
          </View>
        )}

        {/* Apps List */}
        <View style={styles.appsSection}>
          <Text style={styles.sectionTitle}>Apps</Text>
          {todayData && todayData.apps && todayData.apps.length > 0 ? (
            <FlatList
              data={todayData.apps}
              keyExtractor={(item) => item.app_package}
              renderItem={renderAppItem}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="phone-portrait-outline" size={64} color="#9ca3af" />
              <Text style={styles.emptyText}>No app usage recorded yet</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Set Limit Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Set Daily Limit for {editingApp?.app_name}
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Daily Limit (minutes)</Text>
              <TextInput
                style={styles.input}
                value={limitMinutes}
                onChangeText={setLimitMinutes}
                keyboardType="number-pad"
                placeholder="60"
              />
              <Text style={styles.inputHint}>
                {formatTime(parseInt(limitMinutes) || 0)} per day
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSaveLimit}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6b7280',
  },
  errorText: {
    marginTop: 10,
    fontSize: 18,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
  },
  appsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  appCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  appInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  appPackage: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  blockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  blockedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  timeInfo: {
    marginBottom: 12,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  timeLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 10,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  limitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  limitButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
  blockButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  unblockButton: {
    backgroundColor: '#10b981',
  },
  blockButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#9ca3af',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  inputHint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

