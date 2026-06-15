import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  getTodayActivities,
  toggleActivityCompletion,
  createActivity,
  updateActivity,
  deleteActivity,
  getCategories,
  getRoutineStats,
  createRoutine,
} from '../api/dailyRoutineApi';
import VoiceService from '../services/VoiceService';

export default function DailyRoutineScreen({ route, navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todayData, setTodayData] = useState(null);
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [childId, setChildId] = useState(null);
  
  // Modal states
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [statsModalVisible, setStatsModalVisible] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    
    title: '',
    description: '',
    scheduled_time: new Date(),
    duration_minutes: 15,
    category: null,
    icon_name: 'time-outline',
    color: '#3b82f6',
    is_mandatory: false,
    reminder_enabled: true,
    reminder_minutes_before: 5,
  });
  
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Load child ID
  useEffect(() => {
    const init = async () => {
    loadChildId();
    };
    init();
  }, []);

  // Load data when screen focused
  useFocusEffect(
    useCallback(() => {
      if (!childId) return;

        loadAllData();
        
        // Start voice assistant
        // VoiceService.start(childId);
      return () => {
        // Don't stop voice service on unmount - it should keep running
      };
    }, [childId])
  );

  const loadChildId = async () => {
    try {
      const id = await AsyncStorage.getItem('selectedChildId');
      setChildId(id ? parseInt(id) : route.params?.childId || 1);
    } catch (error) {
      console.error('Error loading child ID:', error);
      setChildId(route.params?.childId || 1);
    }
  };

  const loadAllData = async () => {
    try{
      setLoading(true);

      await Promise.all([
        loadTodayActivities(),
        loadCategories(),
        loadStats(),
      ]);
    } catch(error) {
      console.log("Load error:", error);
    } finally{
      setLoading(false);
    }
  };

  const loadTodayActivities = async () => {
    try {
      const data = await getTodayActivities(childId);

      if (data.message === "No active routine found") {
        console.log("No active routine, creating one...");
        const newRoutine = await createRoutine({
          child : childId,
          name: "Daily Routine"
        });


        const newData = await getTodayActivities(childId);
        setTodayData(newData);
      } else {
      setTodayData(data);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadStats = async () => {
    try {
      const data = await getRoutineStats(childId);
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  // const handleToggleCompletion = async (activityId) => {
  //   try {
  //     await toggleActivityCompletion(activityId);
  //     await loadTodayActivities();
      
  //     // Speak confirmation
  //     VoiceService.speak("Activity updated!");
  //   } catch (error) {
  //     console.error('Error toggling completion:', error);
  //     Alert.alert('Error', 'Failed to update activity');
  //   }
  // };
    const handleToggleCompletion = async (activityId) => {
      try {
        // Optimistic update
        setTodayData(prev => ({
          ...prev,
          activities: prev.activities.map(a =>
            a.id === activityId
              ? { ...a, is_completed_today: !a.is_completed_today }
              : a
          )
        }));

        await toggleActivityCompletion(activityId);

        VoiceService.speak("Activity updated!");

      } catch (error) {
        console.error(error);
      }
    };


  const handleAddActivity = () => {
    if (!todayData || todayData.message) {
    Alert.alert("Please create a routine first");
    return;
  }
    resetFormData();
    setAddModalVisible(true);
  };

  const handleEditActivity = (activity) => {
    setSelectedActivity(activity);
    setFormData({
      
      title: activity.title,
      description: activity.description || '',
      scheduled_time: new Date(`2000-01-01T${activity.scheduled_time}`),
      duration_minutes: activity.duration_minutes,
      category: activity.category,
      icon_name: activity.icon_name,
      color: activity.color,
      is_mandatory: activity.is_mandatory,
      reminder_enabled: activity.reminder_enabled,
      reminder_minutes_before: activity.reminder_minutes_before,
    });
    setEditModalVisible(true);
  };

  const handleDeleteActivity = (activity) => {
    Alert.alert(
      'Delete Activity',
      `Are you sure you want to delete "${activity.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteActivity(activity.id);
              await loadTodayActivities();
              Alert.alert('Success', 'Activity deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete activity');
            }
          },
        },
      ]
    );
  };

  const handleSaveActivity = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter activity title');
      return;
    }
    const routineId =  todayData?.routine_id || todayData?.id;
    if (!routineId) {
       console.log("Today Data Full:", todayData);
    Alert.alert("Error", "Routine not loaded yet");
    return;
  }

    try {
      console.log("Today Data:", todayData);
     
      const activityData = {
        // routine: todayData?.id,
        routine: routineId,
        title: formData.title,
        description: formData.description,
        scheduled_time: formData.scheduled_time.toTimeString().slice(0, 5),
        duration_minutes: formData.duration_minutes,
        category: formData.category,
        icon_name: formData.icon_name,
        color: formData.color,
        is_mandatory: formData.is_mandatory,
        reminder_enabled: formData.reminder_enabled,
        reminder_minutes_before: formData.reminder_minutes_before,

      };
      console.log("Sending activity with data:", activityData);

      if (selectedActivity) {
        await updateActivity(selectedActivity.id, activityData);
        setEditModalVisible(false);
      } else {
        await createActivity(activityData);
        setAddModalVisible(false);
      }

      await loadTodayActivities();
      Alert.alert('Success', 'Activity saved successfully');
    } catch (error) {
      console.error('Full Error:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to save activity');
    }
  };

  const resetFormData = () => {
    setFormData({
      // routine : todayData?.id || '',
      title: '',
      description: '',
      scheduled_time: new Date(),
      duration_minutes: 15,
      category: null,
      icon_name: 'time-outline',
      color: '#3b82f6',
      is_mandatory: false,
      reminder_enabled: true,
      reminder_minutes_before: 5,
    });
    setSelectedActivity(null);
  };

  // const toggleVoiceListening = async () => {
  //   if (isListening) {
  //     await VoiceService.stopListening();
  //     setIsListening(false);
  //   } else {
  //     await VoiceService.startContinuousListening();
  //     setIsListening(true);
  //   }
  // };

  const formatTime = (time) => {
    if (!time) return '';
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getProgressColor = (percentage) => {
    if (percentage === 0) return '#d1d5db' // neutral gray
    if (percentage >= 80) return '#10b981';  // green
    if (percentage >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const renderActivityItem = (activity) => {
    const isCompleted = activity.is_completed_today;
    const isPast = new Date(`2000-01-01T${activity.scheduled_time}`) < new Date(`2000-01-01T${new Date().toTimeString().slice(0, 5)}`);



    return (
      <TouchableOpacity

        key={activity.id}
        style={[
          styles.activityCard,
          isCompleted && styles.completedCard,
        ]}
        onPress={() => handleToggleCompletion(activity.id)}
        onLongPress={() => handleEditActivity(activity)}
        activeOpacity={0.7}
      >
        {/* Left Color Bar */}
        <View style={[styles.colorBar, { backgroundColor: activity.color }]} />

        {/* Activity Icon */}
        <View style={[styles.activityIcon, { backgroundColor: activity.color + '20' }]}>
          <Ionicons
            name={isCompleted ? 'checkmark-circle' : activity.icon_name}
            size={28}
            color={isCompleted ? '#10b981' : activity.color}
          />
        </View>

        {/* Activity Content */}
        <View style={styles.activityContent}>
          <View style={styles.activityHeader}>
            <Text style={[styles.activityTitle, isCompleted && styles.completedText]}>
              {activity.title}
            </Text>
            {activity.is_mandatory && (
              <View style={styles.mandatoryBadge}>
                <Ionicons name="star" size={12} color="#f59e0b" />
              </View>
            )}
          </View>

          <View style={styles.activityMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color="#6b7280" />
              <Text style={styles.metaText}>{formatTime(activity.scheduled_time)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="hourglass-outline" size={14} color="#6b7280" />
              <Text style={styles.metaText}>{activity.duration_minutes} min</Text>
            </View>
            {activity.category_name && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{activity.category_name}</Text>
              </View>
            )}
          </View>

          {activity.description && (
            <Text style={styles.activityDescription} numberOfLines={2}>
              {activity.description}
            </Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.activityActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              handleEditActivity(activity);
            }}
          >
            <Ionicons name="pencil" size={18} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              handleDeleteActivity(activity);
            }}
          >
            <Ionicons name="trash" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderActivityForm = () => (
    <View style={styles.formContainer}>
      {/* Title */}
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Activity Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Brush Teeth"
          value={formData.title}
          onChangeText={(text) => setFormData({ ...formData, title: text })}
        />
      </View>

      {/* Description */}
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Optional details..."
          value={formData.description}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Time */}
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Scheduled Time *</Text>
        <TouchableOpacity
          style={styles.timeButton}
          onPress={() => {
            setShowTimePicker(true)
          }}
        >
          <Ionicons name="time-outline" size={20} color="#3b82f6" />
          <Text style={styles.timeText}>
            {formData.scheduled_time.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })}
          </Text>
        </TouchableOpacity>
      </View>

      {showTimePicker && (
        <DateTimePicker
          value={formData.scheduled_time}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedTime) => {
            if (Platform.OS === 'android'){
            setShowTimePicker(false);
            }
            if (event.type === 'set' && selectedTime) {
              setFormData((prev) => ({
                 ...prev,
                  scheduled_time: selectedTime,
                 }));
            }
          }}
        />
      )}

      {/* Duration */}
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Duration (minutes)</Text>
        <View style={styles.durationButtons}>
          {[5, 10, 15, 30, 60].map((duration) => (
            <TouchableOpacity
              key={duration}
              style={[
                styles.durationButton,
                formData.duration_minutes === duration && styles.durationButtonActive,
              ]}
              onPress={() => setFormData({ ...formData, duration_minutes: duration })}
            >
              <Text
                style={[
                  styles.durationButtonText,
                  formData.duration_minutes === duration && styles.durationButtonTextActive,
                ]}
              >
                {duration}m
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Category */}
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.categoryButtons}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  formData.category === category.id && styles.categoryButtonActive,
                  { borderColor: category.color },
                ]}
                onPress={() => {
                  setFormData({
                    ...formData,
                    category: category.id,
                    color: category.color,
                    icon_name: category.icon_name,
                  });
                }}
              >
                <Ionicons name={category.icon_name} size={20} color={category.color} />
                <Text style={styles.categoryButtonText}>{category.display_name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Settings */}
      <View style={styles.formGroup}>
        <View style={styles.switchRow}>
          <View style={styles.switchLabel}>
            <Ionicons name="star-outline" size={20} color="#f59e0b" />
            <Text style={styles.switchText}>Mandatory Activity</Text>
          </View>
          <Switch
            value={formData.is_mandatory}
            onValueChange={(value) => setFormData({ ...formData, is_mandatory: value })}
            trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
          />
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchLabel}>
            <Ionicons name="notifications-outline" size={20} color="#3b82f6" />
            <Text style={styles.switchText}>Enable Reminder</Text>
          </View>
          <Switch
            value={formData.reminder_enabled}
            onValueChange={(value) => setFormData({ ...formData, reminder_enabled: value })}
            trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
          />
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.formButtons}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => {
            resetFormData(); // Add this to clear form when canceling
            setAddModalVisible(false);
            setEditModalVisible(false);
          }}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveActivity}>
          <Text style={styles.saveButtonText}>Save Activity</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading routine...</Text>
      </View>
    );
  }

  if (!todayData || todayData.message === "No active routine found") {
    return (
      <View style={styles.centerContainer}>
        {/* <Ionicons name="calendar-outline" size={64} color="#9ca3af" /> */}
        <Text style={styles.emptyTitle}>No Routine Found</Text>
        <Text style={styles.emptyText}>Create your first routine to get started</Text>
        <TouchableOpacity style={styles.createButton} onPress={handleAddActivity}>
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.createButtonText}>Create Routine</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // add fallback for API fail handling missing
  if (!todayData?.activities) {
  return <Text>No data available</Text>;
}

  const progressColor = getProgressColor(todayData.completion_percentage);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Routine</Text>
        <TouchableOpacity onPress={() => setStatsModalVisible(true)}>
          <Ionicons name="stats-chart" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      {/* Progress Card */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.dateText}>{todayData.day}</Text>
          <Text style={[styles.progressPercentage, { color: progressColor }]}>
            {todayData.completion_percentage}%
          </Text>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${todayData.completion_percentage}%`,
                  backgroundColor: progressColor,
                },
              ]}
            />
          </View>
        </View>

        <Text style={styles.progressText}>
          {todayData.completed} / {todayData.total} activities completed
        </Text>
      </View>

      {/* Activities List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {todayData.activities && todayData.activities.length > 0 ? (
          todayData.activities.map(renderActivityItem)
        ) : (
          <View style={styles.emptyActivities}>
            <Ionicons name="list-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>No activities for today</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Voice Button (Floating) */}
      {/* <TouchableOpacity
        style={[styles.voiceButton, isListening && styles.voiceButtonActive]}
        onPress={toggleVoiceListening}
      >
        <Ionicons name={isListening ? 'mic' : 'mic-outline'} size={28} color="#fff" />
        {isListening && <Text style={styles.voiceButtonText}>Listening...</Text>}
      </TouchableOpacity> */}

      {/* Add Button (Floating) */}
      <TouchableOpacity style={styles.addButton} onPress={handleAddActivity}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal
        visible={addModalVisible || editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setAddModalVisible(false);
          setEditModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedActivity ? 'Edit Activity' : 'Add Activity'}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {renderActivityForm()}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Stats Modal */}
      <Modal
        visible={statsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setStatsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Routine Statistics</Text>
            {stats && (
              <ScrollView>
                <View style={styles.statsCard}>
                  <Text style={styles.statsTitle}>Current Streak</Text>
                  <Text style={styles.statsValue}>{stats.current_streak} days 🔥</Text>
                </View>
                <View style={styles.statsCard}>
                  <Text style={styles.statsTitle}>Average Completion</Text>
                  <Text style={styles.statsValue}>{stats.avg_completion}%</Text>
                </View>
                {stats.daily_stats && stats.daily_stats.map((day, index) => (
                  <View key={index} style={styles.dayStatCard}>
                    <Text style={styles.dayStatDate}>{day.day}</Text>
                    <Text style={styles.dayStatText}>
                      {day.completed}/{day.total} ({day.percentage}%)
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setStatsModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
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
    backgroundColor: '#f3f4f6',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  progressCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  progressPercentage: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
  },
  completedCard: {
    opacity: 0.7,
    backgroundColor: '#f0fdf4',
  },
  colorBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  activityIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#6b7280',
  },
  mandatoryBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6b7280',
  },
  categoryBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 11,
    color: '#3b82f6',
    fontWeight: '600',
  },
  activityDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  activityActions: {
    flexDirection: 'column',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  voiceButton: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  voiceButtonActive: {
    backgroundColor: '#ef4444',
  },
  voiceButtonText: {
    position: 'absolute',
    bottom: -20,
    fontSize: 10,
    color: '#ef4444',
    fontWeight: '600',
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
  },
  formContainer: {
    gap: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
  },
  timeText: {
    fontSize: 16,
    color: '#111827',
  },
  durationButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  durationButton: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    alignItems: 'center',
  },
  durationButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  durationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  durationButtonTextActive: {
    color: '#fff',
  },
  categoryButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 2,
    borderRadius: 8,
    borderColor: '#d1d5db',
  },
  categoryButtonActive: {
    backgroundColor: '#eff6ff',
  },
  categoryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchText: {
    fontSize: 14,
    color: '#374151',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  emptyActivities: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  statsCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  statsTitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  dayStatCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  dayStatDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  dayStatText: {
    fontSize: 14,
    color: '#6b7280',
  },
  closeButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});