import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getRoutineSummary } from '../api/dailyRoutineApi';

export default function DailyRoutineWidget({ childId }) {
  const [loading, setLoading] = useState(true);
  const [routineData, setRoutineData] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    if (childId) {
      loadRoutineData();
      
      // Refresh every minute
      const interval = setInterval(() => {
        loadRoutineData();
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [childId]);

  const loadRoutineData = async () => {
    try {
      const data = await getRoutineSummary(childId);
      setRoutineData(data);
    } catch (error) {
      console.error('Error loading routine data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePress = () => {
    navigation.navigate('DailyRoutine', { childId });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#3b82f6" />
      </View>
    );
  }

  if (!routineData || !routineData.has_routine) {
    return (
      <TouchableOpacity style={styles.container} onPress={handlePress}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons name="calendar-outline" size={20} color="#3b82f6" />
            <Text style={styles.title}>Daily Routine</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="add-circle-outline" size={32} color="#9ca3af" />
          <Text style={styles.emptyText}>Create your routine</Text>
        </View>
      </TouchableOpacity>
    );
  }

  const percentage = routineData.completion_percentage || 0;
  const progressColor = 
    percentage >= 80 ? '#10b981' : 
    percentage >= 50 ? '#f59e0b' : 
    '#ef4444';

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="calendar-outline" size={20} color="#3b82f6" />
          <Text style={styles.title}>Daily Routine</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      </View>

      {/* Progress Section */}
      <View style={styles.progressSection}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            {routineData.completed_today} of {routineData.total_activities} completed
          </Text>
          <Text style={[styles.percentageText, { color: progressColor }]}>
            {percentage}%
          </Text>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View 
              style={[
                styles.progressBarFill, 
                { 
                  width: `${percentage}%`,
                  backgroundColor: progressColor 
                }
              ]} 
            />
          </View>
        </View>
      </View>

      {/* Current/Next Activity */}
      {routineData.current_activity ? (
        <View style={styles.activityCard}>
          <View style={[styles.activityIcon, { backgroundColor: routineData.current_activity.color + '20' }]}>
            <Ionicons 
              name={routineData.current_activity.icon_name || 'time-outline'} 
              size={20} 
              color={routineData.current_activity.color || '#3b82f6'} 
            />
          </View>
          <View style={styles.activityInfo}>
            <Text style={styles.activityLabel}>Now</Text>
            <Text style={styles.activityTitle} numberOfLines={1}>
              {routineData.current_activity.title}
            </Text>
            <Text style={styles.activityTime}>
              Until {routineData.current_activity.end_time}
            </Text>
          </View>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        </View>
      ) : routineData.next_activity ? (
        <View style={styles.activityCard}>
          <View style={[styles.activityIcon, { backgroundColor: routineData.next_activity.color + '20' }]}>
            <Ionicons 
              name={routineData.next_activity.icon_name || 'time-outline'} 
              size={20} 
              color={routineData.next_activity.color || '#3b82f6'} 
            />
          </View>
          <View style={styles.activityInfo}>
            <Text style={styles.activityLabel}>Up Next</Text>
            <Text style={styles.activityTitle} numberOfLines={1}>
              {routineData.next_activity.title}
            </Text>
            <Text style={styles.activityTime}>
              {routineData.next_activity.scheduled_time}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.completedCard}>
          <Ionicons name="checkmark-circle" size={32} color="#10b981" />
          <Text style={styles.completedText}>All done for today! 🎉</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
  },
  percentageText: {
    fontSize: 18,
    fontWeight: '700',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarBackground: {
    flex: 1,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityInfo: {
    flex: 1,
  },
  activityLabel: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 13,
    color: '#6b7280',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  liveText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  completedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  completedText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#10b981',
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
  },
});