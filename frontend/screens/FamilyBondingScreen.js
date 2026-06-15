

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, ActivityIndicator, Alert, RefreshControl,
  Image, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';

const API_BASE = 'http://10.176.131.220:8000/api/familybonding';

const api = axios.create({ baseURL: API_BASE });
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Token ${token}`;
  return config;
});

// ===========================================================================
// TAB 1: ACTIVITIES
// ===========================================================================
function ActivitiesTab({ parentId }) {
  const [activities, setActivities] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addModal, setAddModal] = useState(false);

  useFocusEffect(useCallback(() => {
    loadData();
  }, [parentId]));

  const loadData = async () => {
    try {
      const [actRes, dashRes] = await Promise.all([
        api.get(`/activities/${parentId}/`),
        api.get(`/dashboard/${parentId}/`),
      ]);
      setActivities(actRes.data.activities || []);
      setDashboard(dashRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleComplete = async (activityId) => {
    Alert.prompt(
      'Complete Activity',
      'How many minutes did it take?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async (duration) => {
            try {
              await api.post(`/activities/complete/${activityId}/`, {
                actual_duration: parseInt(duration) || 0
              });
              await loadData();
              Alert.alert('Success', 'Activity completed! 🎉');
            } catch (e) {
              Alert.alert('Error', 'Failed to complete activity');
            }
          }
        }
      ],
      'plain-text',
      '',
      'numeric'
    );
  };

  const STATUS_COLORS = {
    planned: '#3B82F6',
    in_progress: '#F59E0B',
    completed: '#10B981',
    cancelled: '#EF4444',
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#EC4899" />
      </View>
    );
  }

  const upcoming = activities.filter(a => a.status === 'planned');
  const past = activities.filter(a => a.status === 'completed');

  return (
    <ScrollView
      style={s.tabContent}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={() => { setRefreshing(true); loadData(); }} 
        />
      }
    >
      {/* Streak Card */}
      {dashboard?.streak && (
        <View style={s.streakCard}>
          <View style={s.streakHeader}>
            <Ionicons name="flame" size={32} color="#F59E0B" />
            <View style={s.streakInfo}>
              <Text style={s.streakValue}>{dashboard.streak.current_streak} Week Streak</Text>
              <Text style={s.streakSub}>
                {dashboard.streak.total_activities} activities • {dashboard.streak.total_hours} hours
              </Text>
            </View>
          </View>
          <Text style={s.streakBest}>Best: {dashboard.streak.longest_streak} weeks 🏆</Text>
        </View>
      )}

      {/* Quick Stats */}
      <View style={s.quickStats}>
        <View style={s.quickStat}>
          <Text style={s.quickStatValue}>{dashboard?.this_month_count || 0}</Text>
          <Text style={s.quickStatLabel}>This Month</Text>
        </View>
        <View style={s.quickStat}>
          <Text style={s.quickStatValue}>{dashboard?.total_completed || 0}</Text>
          <Text style={s.quickStatLabel}>All Time</Text>
        </View>
        <View style={s.quickStat}>
          <Text style={s.quickStatValue}>{dashboard?.average_rating || 0}⭐</Text>
          <Text style={s.quickStatLabel}>Avg Rating</Text>
        </View>
      </View>

      {/* Upcoming Activities */}
      <Text style={s.sectionTitle}>📅 Upcoming Activities</Text>
      
      {upcoming.length === 0 ? (
        <View style={s.emptyBox}>
          <Ionicons name="calendar-outline" size={48} color="#E5E7EB" />
          <Text style={s.emptyText}>No upcoming activities</Text>
          <Text style={s.emptySub}>Plan something fun together!</Text>
        </View>
      ) : (
        upcoming.map((activity) => (
          <View key={activity.id} style={s.activityCard}>
            <View style={[s.activityBar, { backgroundColor: activity.category_color || '#EC4899' }]} />
            
            <View style={s.activityContent}>
              <View style={s.activityHeader}>
                <Text style={s.activityTitle} numberOfLines={2}>{activity.title}</Text>
                <View style={[s.statusBadge, { backgroundColor: STATUS_COLORS[activity.status] }]}>
                  <Text style={s.statusText}>{activity.status}</Text>
                </View>
              </View>

              <Text style={s.activityDesc} numberOfLines={2}>{activity.description}</Text>

              <View style={s.activityMeta}>
                <View style={s.metaItem}>
                  <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                  <Text style={s.metaText}>
                    {new Date(activity.scheduled_date).toLocaleDateString()}
                  </Text>
                </View>
                <View style={s.metaItem}>
                  <Ionicons name="time-outline" size={14} color="#6B7280" />
                  <Text style={s.metaText}>{activity.duration_minutes} min</Text>
                </View>
                {activity.is_outdoor && (
                  <View style={s.metaItem}>
                    <Ionicons name="sunny-outline" size={14} color="#F59E0B" />
                    <Text style={s.metaText}>Outdoor</Text>
                  </View>
                )}
              </View>

              {activity.children_names && activity.children_names.length > 0 && (
                <View style={s.participantsRow}>
                  <Ionicons name="people-outline" size={14} color="#EC4899" />
                  <Text style={s.participantsText}>
                    {activity.children_names.join(', ')}
                  </Text>
                </View>
              )}

              <View style={s.activityActions}>
                <TouchableOpacity 
                  style={s.completeBtn}
                  onPress={() => handleComplete(activity.id)}
                >
                  <Ionicons name="checkmark-circle" size={16} color="#fff" />
                  <Text style={s.completeBtnText}>Complete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))
      )}

      {/* Past Activities */}
      <Text style={s.sectionTitle}>✅ Completed</Text>
      
      {past.slice(0, 5).map((activity) => (
        <View key={activity.id} style={s.completedCard}>
          <View style={s.completedCheck}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          </View>
          <View style={s.completedContent}>
            <Text style={s.completedTitle}>{activity.title}</Text>
            <Text style={s.completedDate}>
              {new Date(activity.completed_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
      ))}

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

// ===========================================================================
// TAB 2: MEMORIES
// ===========================================================================
function MemoriesTab({ parentId }) {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMemories();
  }, []);

  const loadMemories = async () => {
    try {
      const res = await api.get(`/memories/${parentId}/`);
      setMemories(res.data.memories || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color="#EC4899" />
      </View>
    );
  }

  return (
    <ScrollView style={s.tabContent}>
      <Text style={s.sectionTitle}>📸 Family Memories</Text>

      {memories.length === 0 ? (
        <View style={s.emptyBox}>
          <Ionicons name="image-outline" size={48} color="#E5E7EB" />
          <Text style={s.emptyText}>No memories yet</Text>
          <Text style={s.emptySub}>Create memories from activities</Text>
        </View>
      ) : (
        memories.map((memory) => (
          <View key={memory.id} style={s.memoryCard}>
            <View style={s.memoryHeader}>
              <Text style={s.memoryTitle}>{memory.title}</Text>
              <Text style={s.memoryDate}>
                {new Date(memory.memory_date).toLocaleDateString()}
              </Text>
            </View>

            <Text style={s.memoryDesc}>{memory.description}</Text>

            {memory.tags && memory.tags.length > 0 && (
              <View style={s.tagsRow}>
                {memory.tags.slice(0, 3).map((tag, idx) => (
                  <View key={idx} style={s.tag}>
                    <Text style={s.tagText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={s.memoryFooter}>
              <View style={s.memoryStats}>
                <Ionicons name="heart-outline" size={16} color="#EF4444" />
                <Text style={s.memoryStatText}>{memory.likes_count || 0}</Text>
              </View>
              <View style={s.memoryStats}>
                <Ionicons name="chatbubble-outline" size={16} color="#3B82F6" />
                <Text style={s.memoryStatText}>{memory.comments_count || 0}</Text>
              </View>
            </View>
          </View>
        ))
      )}

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

// ===========================================================================
// TAB 3: STATS
// ===========================================================================
function StatsTab({ parentId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    loadStats();
  }, [period]);

  const loadStats = async () => {
    try {
      const res = await api.get(`/stats/${parentId}/?period=${period}`);
      setStats(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color="#EC4899" />
      </View>
    );
  }

  return (
    <ScrollView style={s.tabContent}>
      {/* Period Selector */}
      <View style={s.periodSelector}>
        {['week', 'month', 'year'].map((p) => (
          <TouchableOpacity
            key={p}
            style={[s.periodBtn, period === p && s.periodBtnActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[s.periodBtnText, period === p && s.periodBtnTextActive]}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Main Stats Grid */}
      <View style={s.statsGrid}>
        <View style={s.statBox}>
          <Text style={s.statValue}>{stats?.total_activities || 0}</Text>
          <Text style={s.statLabel}>Activities</Text>
        </View>
        <View style={s.statBox}>
          <Text style={[s.statValue, { color: '#EC4899' }]}>
            {stats?.total_hours || 0}h
          </Text>
          <Text style={s.statLabel}>Time Together</Text>
        </View>
        <View style={s.statBox}>
          <Text style={[s.statValue, { color: '#10B981' }]}>
            {stats?.indoor_activities || 0}
          </Text>
          <Text style={s.statLabel}>Indoor</Text>
        </View>
        <View style={s.statBox}>
          <Text style={[s.statValue, { color: '#F59E0B' }]}>
            {stats?.outdoor_activities || 0}
          </Text>
          <Text style={s.statLabel}>Outdoor</Text>
        </View>
      </View>

      {/* Category Breakdown */}
      <Text style={s.sectionTitle}>📊 By Category</Text>
      
      {stats?.category_breakdown && Object.keys(stats.category_breakdown).length > 0 ? (
        Object.entries(stats.category_breakdown).map(([category, count]) => (
          <View key={category} style={s.categoryRow}>
            <Text style={s.categoryName}>{category}</Text>
            <Text style={s.categoryCount}>{count} activities</Text>
          </View>
        ))
      ) : (
        <View style={s.emptyBox}>
          <Text style={s.emptyText}>No category data yet</Text>
        </View>
      )}

      {/* Ratings */}
      <Text style={s.sectionTitle}>⭐ Feedback</Text>
      
      <View style={s.ratingsCard}>
        <View style={s.ratingRow}>
          <Text style={s.ratingLabel}>Average Rating</Text>
          <Text style={s.ratingValue}>{stats?.average_rating || 0} / 5</Text>
        </View>
        <View style={s.ratingRow}>
          <Text style={s.ratingLabel}>Fun Level</Text>
          <Text style={s.ratingValue}>{stats?.average_fun_level || 0} / 5</Text>
        </View>
      </View>

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

// ===========================================================================
// TAB 4: CHALLENGES
// ===========================================================================
function ChallengesTab({ parentId }) {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      const res = await api.get(`/challenges/${parentId}/`);
      setChallenges(res.data.challenges || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (challengeId) => {
    try {
      const res = await api.post(`/challenges/progress/${challengeId}/`);
      if (res.data.completed) {
        Alert.alert('🎉 Challenge Completed!', res.data.message);
      }
      await loadChallenges();
    } catch (e) {
      Alert.alert('Error', 'Failed to update progress');
    }
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color="#EC4899" />
      </View>
    );
  }

  const active = challenges.filter(c => c.status === 'active');
  const completed = challenges.filter(c => c.status === 'completed');

  return (
    <ScrollView style={s.tabContent}>
      <Text style={s.sectionTitle}>🎯 Active Challenges</Text>

      {active.length === 0 ? (
        <View style={s.emptyBox}>
          <Ionicons name="trophy-outline" size={48} color="#E5E7EB" />
          <Text style={s.emptyText}>No active challenges</Text>
          <Text style={s.emptySub}>Create a challenge to get started</Text>
        </View>
      ) : (
        active.map((challenge) => {
          const progressPct = challenge.progress_percentage || 0;
          const daysLeft = Math.ceil(
            (new Date(challenge.end_date) - new Date()) / (1000 * 60 * 60 * 24)
          );

          return (
            <View key={challenge.id} style={s.challengeCard}>
              <Text style={s.challengeTitle}>{challenge.title}</Text>
              <Text style={s.challengeDesc}>{challenge.description}</Text>

              <View style={s.challengeProgress}>
                <View style={s.challengeProgressHeader}>
                  <Text style={s.challengeProgressText}>
                    {challenge.activities_completed}/{challenge.target_activities} activities
                  </Text>
                  <Text style={s.challengeProgressPct}>{progressPct}%</Text>
                </View>
                <View style={s.challengeProgressBar}>
                  <View style={[
                    s.challengeProgressFill, 
                    { width: `${progressPct}%` }
                  ]} />
                </View>
              </View>

              <View style={s.challengeMeta}>
                <View style={s.challengeMetaItem}>
                  <Ionicons name="time-outline" size={16} color="#6B7280" />
                  <Text style={s.challengeMetaText}>{daysLeft} days left</Text>
                </View>
                <View style={s.challengeMetaItem}>
                  <Ionicons name="gift-outline" size={16} color="#EC4899" />
                  <Text style={s.challengeMetaText}>{challenge.reward_description}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={s.updateProgressBtn}
                onPress={() => updateProgress(challenge.id)}
              >
                <Text style={s.updateProgressBtnText}>Update Progress</Text>
              </TouchableOpacity>
            </View>
          );
        })
      )}

      {/* Completed Challenges */}
      {completed.length > 0 && (
        <>
          <Text style={s.sectionTitle}>🏆 Completed</Text>
          {completed.map((challenge) => (
            <View key={challenge.id} style={s.completedChallengeCard}>
              <Ionicons name="trophy" size={24} color="#F59E0B" />
              <View style={s.completedChallengeContent}>
                <Text style={s.completedChallengeTitle}>{challenge.title}</Text>
                <Text style={s.completedChallengeDate}>
                  Completed {new Date(challenge.completed_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))}
        </>
      )}

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

// ===========================================================================
// MAIN SCREEN
// ===========================================================================
export default function FamilyBondingScreen({ navigation }) {
  const [parentId, setParentId] = useState(null);
  const [activeTab, setActiveTab] = useState('activities');

  useEffect(() => {
    AsyncStorage.getItem('parentId').then((id) => {
      setParentId(id ? parseInt(id) : 1);
    });
  }, []);

  const TABS = [
    { key: 'activities', label: 'Activities', icon: 'calendar-outline' },
    { key: 'memories', label: 'Memories', icon: 'image-outline' },
    { key: 'stats', label: 'Stats', icon: 'stats-chart-outline' },
    { key: 'challenges', label: 'Challenges', icon: 'trophy-outline' },
  ];

  if (!parentId) {
    return (
      <View style={s.center}>
        <ActivityIndicator color="#EC4899" />
      </View>
    );
  }

  return (
    <View style={s.screen}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Family Bonding</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Templates")}>
          <Ionicons name="add-circle-outline" size={28} color="#EC4899" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={s.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[s.tab, activeTab === tab.key && s.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon}
              size={20}
              color={activeTab === tab.key ? '#EC4899' : '#9CA3AF'}
            />
            <Text style={[s.tabText, activeTab === tab.key && s.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {activeTab === 'activities' && <ActivitiesTab parentId={parentId} />}
      {activeTab === 'memories' && <MemoriesTab parentId={parentId} />}
      {activeTab === 'stats' && <StatsTab parentId={parentId} />}
      {activeTab === 'challenges' && <ChallengesTab parentId={parentId} />}
    </View>
  );
}

// ===========================================================================
// STYLES
// ===========================================================================
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: 60, 
    paddingBottom: 16, 
    backgroundColor: '#fff' 
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#111827' },

  tabBar: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    borderBottomWidth: 1, 
    borderBottomColor: '#E5E7EB' 
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12, gap: 4 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#EC4899' },
  tabText: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
  tabTextActive: { color: '#EC4899', fontWeight: '700' },

  tabContent: { flex: 1, padding: 16 },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#111827', 
    marginTop: 16, 
    marginBottom: 12 
  },

  streakCard: { 
    backgroundColor: '#FEF3C7', 
    borderRadius: 16, 
    padding: 20, 
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#F59E0B'
  },
  streakHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  streakInfo: { flex: 1 },
  streakValue: { fontSize: 20, fontWeight: '700', color: '#92400E' },
  streakSub: { fontSize: 14, color: '#78350F', marginTop: 2 },
  streakBest: { fontSize: 13, color: '#92400E', fontWeight: '600', marginTop: 4 },

  quickStats: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    marginBottom: 16 
  },
  quickStat: { alignItems: 'center' },
  quickStatValue: { fontSize: 24, fontWeight: '700', color: '#EC4899' },
  quickStatLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  activityCard: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    marginBottom: 12, 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 3,
    position: 'relative'
  },
  activityBar: { 
    position: 'absolute', 
    left: 0, 
    top: 0, 
    bottom: 0, 
    width: 4, 
    borderTopLeftRadius: 16, 
    borderBottomLeftRadius: 16 
  },
  activityContent: { flex: 1, padding: 16, paddingLeft: 20 },
  activityHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 6 
  },
  activityTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#111827' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: '600', color: '#fff', textTransform: 'uppercase' },
  activityDesc: { fontSize: 14, color: '#6B7280', marginBottom: 10 },
  activityMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#6B7280' },
  participantsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  participantsText: { fontSize: 13, color: '#EC4899', fontWeight: '600' },
  activityActions: { flexDirection: 'row', gap: 8 },
  completeBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#10B981', 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 8, 
    gap: 4 
  },
  completeBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },

  completedCard: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 14, 
    marginBottom: 8, 
    alignItems: 'center', 
    gap: 12 
  },
  completedCheck: {},
  completedContent: { flex: 1 },
  completedTitle: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 2 },
  completedDate: { fontSize: 12, color: '#9CA3AF' },

  memoryCard: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 12 
  },
  memoryHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 8 
  },
  memoryTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#111827' },
  memoryDate: { fontSize: 12, color: '#9CA3AF' },
  memoryDesc: { fontSize: 14, color: '#6B7280', marginBottom: 10 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  tag: { backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontSize: 11, color: '#DC2626', fontWeight: '600' },
  memoryFooter: { flexDirection: 'row', gap: 16, marginTop: 8 },
  memoryStats: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  memoryStatText: { fontSize: 12, color: '#6B7280' },

  periodSelector: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  periodBtn: { 
    flex: 1, 
    paddingVertical: 10, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#E5E7EB', 
    alignItems: 'center', 
    backgroundColor: '#fff' 
  },
  periodBtnActive: { backgroundColor: '#EC4899', borderColor: '#EC4899' },
  periodBtnText: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
  periodBtnTextActive: { color: '#fff' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statBox: { 
    flex: 1, 
    minWidth: '45%', 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 16, 
    alignItems: 'center' 
  },
  statValue: { fontSize: 28, fontWeight: '700', color: '#EC4899', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#6B7280' },

  categoryRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    backgroundColor: '#fff', 
    padding: 14, 
    borderRadius: 10, 
    marginBottom: 8 
  },
  categoryName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  categoryCount: { fontSize: 14, color: '#6B7280' },

  ratingsCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
  ratingRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F3F4F6' 
  },
  ratingLabel: { fontSize: 14, color: '#6B7280' },
  ratingValue: { fontSize: 16, fontWeight: '700', color: '#EC4899' },

  challengeCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12 },
  challengeTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 6 },
  challengeDesc: { fontSize: 14, color: '#6B7280', marginBottom: 12 },
  challengeProgress: { marginBottom: 12 },
  challengeProgressHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 6 
  },
  challengeProgressText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  challengeProgressPct: { fontSize: 16, fontWeight: '700', color: '#EC4899' },
  challengeProgressBar: { 
    height: 8, 
    backgroundColor: '#F3F4F6', 
    borderRadius: 4, 
    overflow: 'hidden' 
  },
  challengeProgressFill: { height: '100%', backgroundColor: '#EC4899', borderRadius: 4 },
  challengeMeta: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  challengeMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  challengeMetaText: { fontSize: 12, color: '#6B7280' },
  updateProgressBtn: { 
    backgroundColor: '#EC4899', 
    paddingVertical: 10, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  updateProgressBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },

  completedChallengeCard: { 
    flexDirection: 'row', 
    backgroundColor: '#FEF3C7', 
    borderRadius: 12, 
    padding: 14, 
    marginBottom: 8, 
    alignItems: 'center', 
    gap: 12 
  },
  completedChallengeContent: { flex: 1 },
  completedChallengeTitle: { fontSize: 15, fontWeight: '600', color: '#92400E', marginBottom: 2 },
  completedChallengeDate: { fontSize: 12, color: '#78350F' },

  emptyBox: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#6B7280' },
  emptySub: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
});