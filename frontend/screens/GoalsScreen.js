// screens/GoalsScreen.js
// Complete Goals Management Screen - Production Ready

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';

const API_BASE = 'http://10.176.131.220:8000/api/goals';

const api = axios.create({ baseURL: API_BASE });
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Token ${token}`;
  return config;
});

// ===========================================================================
// ACTIVE GOALS TAB
// ===========================================================================
function ActiveGoalsTab({ childId }) {
  const [goals, setGoals] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [progressValue, setProgressValue] = useState('');

  useFocusEffect(useCallback(() => {
    loadData();
  }, [childId]));

  const loadData = async () => {
    try {
      const [goalsRes, dashRes] = await Promise.all([
        api.get(`/list/${childId}/?status=active`),
        api.get(`/dashboard/${childId}/`),
      ]);
      setGoals(goalsRes.data.goals || []);
      setDashboard(dashRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleProgress = async () => {
    if (!progressValue || !selectedGoal) return;
    try {
      await api.post(`/progress/${selectedGoal.id}/`, { 
        value: parseInt(progressValue) 
      });
      setProgressValue('');
      setDetailModal(false);
      await loadData();
      Alert.alert('Success', 'Progress updated! 🎉');
    } catch (e) {
      Alert.alert('Error', 'Failed to update progress');
    }
  };

  const handleComplete = async (goalId) => {
    try {
      await api.post(`/complete/${goalId}/`);
      await loadData();
      Alert.alert('Amazing!', '🎉 Goal completed! Points earned!');
    } catch (e) {
      Alert.alert('Error', 'Failed to complete goal');
    }
  };

  const PRIORITY_COLORS = {
    high: '#ef4444',
    medium: '#3b82f6',
    low: '#9ca3af',
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <ScrollView
      style={s.tabContent}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={() => { 
            setRefreshing(true); 
            loadData(); 
          }} 
        />
      }
    >
      {/* Dashboard Card */}
      {dashboard?.points && (
        <View style={s.dashboardCard}>
          <View style={s.dashRow}>
            <View>
              <Text style={s.dashLevel}>Level {dashboard.points.level}</Text>
              <Text style={s.dashPoints}>{dashboard.points.total_points} points</Text>
            </View>
            <View style={s.dashStats}>
              <View style={s.dashStat}>
                <Ionicons name="flame" size={20} color="#f59e0b" />
                <Text style={s.dashStatText}>
                  {dashboard.points.current_streak} day streak
                </Text>
              </View>
            </View>
          </View>
          <View style={s.levelProgress}>
            <View style={s.levelProgressBg}>
              <View 
                style={[
                  s.levelProgressFill, 
                  { width: `${dashboard.points.progress_to_next_level || 0}%` }
                ]} 
              />
            </View>
            <Text style={s.levelProgressText}>
              {dashboard.points.points_to_next_level - dashboard.points.total_points} pts to Level {dashboard.points.level + 1}
            </Text>
          </View>
        </View>
      )}

      {/* Quick Stats */}
      <View style={s.quickStats}>
        <View style={s.quickStat}>
          <Text style={s.quickStatValue}>{goals.length}</Text>
          <Text style={s.quickStatLabel}>Active</Text>
        </View>
        <View style={s.quickStat}>
          <Text style={s.quickStatValue}>
            {dashboard?.today_completed_count || 0}
          </Text>
          <Text style={s.quickStatLabel}>Today</Text>
        </View>
        <View style={s.quickStat}>
          <Text style={s.quickStatValue}>
            {dashboard?.completion_rate || 0}%
          </Text>
          <Text style={s.quickStatLabel}>Success</Text>
        </View>
      </View>

      {/* Goals List */}
      {goals.length === 0 ? (
        <View style={s.emptyBox}>
          <Ionicons name="flag-outline" size={64} color="#c4b5fd" />
          <Text style={s.emptyText}>No active goals yet!</Text>
          <Text style={s.emptySub}>Tap + to create your first goal</Text>
        </View>
      ) : (
        goals.map((goal) => {
          const progressPct = goal.progress_percentage || 0;
          const priorityColor = PRIORITY_COLORS[goal.priority] || '#3b82f6';

          return (
            <TouchableOpacity
              key={goal.id}
              style={s.goalCard}
              onPress={() => {
                setSelectedGoal(goal);
                setDetailModal(true);
              }}
            >
              <View style={[s.priorityBar, { backgroundColor: priorityColor }]} />
              
              <View style={[s.goalIcon, { backgroundColor: goal.color + '20' }]}>
                <Ionicons 
                  name={goal.icon_name || 'flag-outline'} 
                  size={28} 
                  color={goal.color || '#3b82f6'} 
                />
              </View>

              <View style={s.goalContent}>
                <Text style={s.goalTitle} numberOfLines={2}>
                  {goal.title}
                </Text>

                <View style={s.goalMeta}>
                  <Text style={s.goalMetaText}>{goal.frequency}</Text>
                  {goal.category_name && (
                    <View style={[s.categoryBadge, { backgroundColor: goal.category_color + '20' }]}>
                      <Text style={[s.categoryBadgeText, { color: goal.category_color }]}>
                        {goal.category_name}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={s.progressSection}>
                  <View style={s.progressHeader}>
                    <Text style={s.progressText}>
                      {goal.current_value}/{goal.target_value} {goal.unit}
                    </Text>
                    <Text style={[s.progressPct, { color: priorityColor }]}>
                      {progressPct}%
                    </Text>
                  </View>
                  <View style={s.progressBar}>
                    <View style={[
                      s.progressFill, 
                      { 
                        width: `${progressPct}%`, 
                        backgroundColor: priorityColor 
                      }
                    ]} />
                  </View>
                </View>

                <View style={s.goalActions}>
                  <TouchableOpacity
                    style={[s.actionBtn, { borderColor: goal.color }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      setSelectedGoal(goal);
                      setDetailModal(true);
                    }}
                  >
                    <Ionicons name="add" size={16} color={goal.color} />
                    <Text style={[s.actionBtnText, { color: goal.color }]}>
                      Add Progress
                    </Text>
                  </TouchableOpacity>

                  {goal.current_value >= goal.target_value && (
                    <TouchableOpacity
                      style={s.completeBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleComplete(goal.id);
                      }}
                    >
                      <Ionicons name="checkmark" size={16} color="#fff" />
                      <Text style={s.completeBtnText}>Complete</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })
      )}

      <View style={{ height: 80 }} />

      {/* Detail Modal */}
      <Modal visible={detailModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.detailModal}>
            <TouchableOpacity
              style={s.modalClose}
              onPress={() => {
                setDetailModal(false);
                setProgressValue('');
              }}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>

            {selectedGoal && (
              <>
                <View style={[
                  s.modalIconHeader, 
                  { backgroundColor: selectedGoal.color + '20' }
                ]}>
                  <Ionicons 
                    name={selectedGoal.icon_name} 
                    size={40} 
                    color={selectedGoal.color} 
                  />
                </View>

                <Text style={s.modalTitle}>{selectedGoal.title}</Text>
                
                {selectedGoal.description && (
                  <Text style={s.modalDesc}>{selectedGoal.description}</Text>
                )}

                <View style={s.modalProgress}>
                  <Text style={s.modalProgressLabel}>Current Progress</Text>
                  <Text style={s.modalProgressValue}>
                    {selectedGoal.current_value}/{selectedGoal.target_value} {selectedGoal.unit}
                  </Text>
                  <View style={s.modalProgressBar}>
                    <View style={[
                      s.progressFill, 
                      {
                        width: `${selectedGoal.progress_percentage}%`,
                        backgroundColor: selectedGoal.color
                      }
                    ]} />
                  </View>
                </View>

                <View style={s.addProgressSection}>
                  <Text style={s.addProgressLabel}>Add Progress</Text>
                  <View style={s.addProgressRow}>
                    <TextInput
                      style={s.progressInput}
                      placeholder={`Enter ${selectedGoal.unit}`}
                      keyboardType="numeric"
                      value={progressValue}
                      onChangeText={setProgressValue}
                    />
                    <TouchableOpacity
                      style={[s.addProgressBtn, { backgroundColor: selectedGoal.color }]}
                      onPress={handleProgress}
                    >
                      <Ionicons name="add" size={20} color="#fff" />
                      <Text style={s.addProgressBtnText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {selectedGoal.reward_description && (
                  <View style={s.rewardBox}>
                    <Ionicons name="gift-outline" size={20} color="#f59e0b" />
                    <Text style={s.rewardText}>
                      Reward: {selectedGoal.reward_description}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// ===========================================================================
// COMPLETED GOALS TAB
// ===========================================================================
function CompletedGoalsTab({ childId }) {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await api.get(`/list/${childId}/?status=completed`);
      setGoals(res.data.goals || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color="#6366f1" />
      </View>
    );
  }

  return (
    <ScrollView style={s.tabContent}>
      {goals.length === 0 ? (
        <View style={s.emptyBox}>
          <Ionicons name="checkmark-circle-outline" size={64} color="#c4b5fd" />
          <Text style={s.emptyText}>No completed goals yet!</Text>
          <Text style={s.emptySub}>Complete your first goal to see it here</Text>
        </View>
      ) : (
        goals.map((goal) => (
          <View key={goal.id} style={s.completedCard}>
            <View style={s.completedCheck}>
              <Ionicons name="checkmark-circle" size={32} color="#10b981" />
            </View>
            <View style={s.completedContent}>
              <Text style={s.completedTitle}>{goal.title}</Text>
              <Text style={s.completedMeta}>
                {goal.target_value} {goal.unit} • {goal.reward_points} pts earned
              </Text>
              {goal.completed_at && (
                <Text style={s.completedDate}>
                  Completed {new Date(goal.completed_at).toLocaleDateString()}
                </Text>
              )}
            </View>
          </View>
        ))
      )}
      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

// ===========================================================================
// TEMPLATES TAB
// ===========================================================================
function TemplatesTab({ childId, onGoalCreated }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await api.get('/templates/');
      setTemplates(res.data.templates || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = async (templateId) => {
    try {
      await api.post('/templates/create-from/', {
        child_id: childId,
        template_id: templateId
      });
      Alert.alert('Success', 'Goal created from template! 🎉');
      onGoalCreated();
    } catch (e) {
      Alert.alert('Error', 'Failed to create goal');
    }
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color="#6366f1" />
      </View>
    );
  }

  return (
    <ScrollView style={s.tabContent}>
      <Text style={s.sectionTitle}>🎯 Popular Templates</Text>

      {templates.length === 0 ? (
        <View style={s.emptyBox}>
          <Text style={s.emptyText}>No templates available</Text>
        </View>
      ) : (
        templates.map((template) => (
          <View key={template.id} style={s.templateCard}>
            <View style={[s.templateIcon, { backgroundColor: template.color + '20' }]}>
              <Ionicons name={template.icon_name} size={28} color={template.color} />
            </View>
            <View style={s.templateContent}>
              <Text style={s.templateTitle}>{template.title}</Text>
              <Text style={s.templateDesc} numberOfLines={2}>
                {template.description}
              </Text>
              <Text style={s.templateMeta}>
                {template.default_target} {template.default_unit} • {template.default_frequency}
              </Text>
            </View>
            <TouchableOpacity
              style={[s.useTemplateBtn, { backgroundColor: template.color }]}
              onPress={() => handleUseTemplate(template.id)}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        ))
      )}
      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

// ===========================================================================
// ANALYTICS TAB
// ===========================================================================
function AnalyticsTab({ childId }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('week');

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      const res = await api.get(`/analytics/${childId}/?period=${period}`);
      setAnalytics(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color="#6366f1" />
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

      {/* Stats Grid */}
      <View style={s.statsGrid}>
        <View style={s.statBox}>
          <Text style={s.statValue}>{analytics?.total_goals || 0}</Text>
          <Text style={s.statLabel}>Total</Text>
        </View>
        <View style={s.statBox}>
          <Text style={[s.statValue, { color: '#10b981' }]}>
            {analytics?.completed || 0}
          </Text>
          <Text style={s.statLabel}>Completed</Text>
        </View>
        <View style={s.statBox}>
          <Text style={[s.statValue, { color: '#3b82f6' }]}>
            {analytics?.active || 0}
          </Text>
          <Text style={s.statLabel}>Active</Text>
        </View>
        <View style={s.statBox}>
          <Text style={[s.statValue, { color: '#6366f1' }]}>
            {analytics?.completion_rate || 0}%
          </Text>
          <Text style={s.statLabel}>Success</Text>
        </View>
      </View>

      {/* Daily Trend Chart */}
      <Text style={s.sectionTitle}>📈 Daily Completions</Text>
      <View style={s.chartCard}>
        <View style={s.chartBars}>
          {analytics?.daily_trend?.map((day, idx) => {
            const maxCompleted = Math.max(
              ...(analytics.daily_trend.map(d => d.completed) || [1])
            );
            const height = (day.completed / maxCompleted) * 100;
            
            return (
              <View key={idx} style={s.chartBarContainer}>
                <View style={s.chartBarBg}>
                  <View style={[s.chartBar, { height: `${height}%` }]} />
                </View>
                <Text style={s.chartLabel}>{day.day}</Text>
                <Text style={s.chartValue}>{day.completed}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Category Performance */}
      <Text style={s.sectionTitle}>📊 Performance by Category</Text>
      {analytics?.category_performance?.map((cat, idx) => (
        <View key={idx} style={s.categoryPerf}>
          <View style={s.categoryPerfHeader}>
            <Text style={s.categoryPerfName}>{cat.category}</Text>
            <Text style={[s.categoryPerfRate, { color: cat.color }]}>
              {cat.rate}%
            </Text>
          </View>
          <View style={s.categoryPerfBar}>
            <View style={[
              s.progressFill, 
              { width: `${cat.rate}%`, backgroundColor: cat.color }
            ]} />
          </View>
          <Text style={s.categoryPerfText}>
            {cat.completed}/{cat.total} completed
          </Text>
        </View>
      ))}

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

// ===========================================================================
// MAIN SCREEN
// ===========================================================================
export default function GoalsScreen({ navigation }) {
  const [childId, setChildId] = useState(null);
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    AsyncStorage.getItem('selectedChildId').then((id) => {
      setChildId(id ? parseInt(id) : 1);
    });
  }, []);

  const TABS = [
    { key: 'active', label: 'Active', icon: 'flag-outline' },
    { key: 'completed', label: 'Done', icon: 'checkmark-circle-outline' },
    { key: 'templates', label: 'Templates', icon: 'apps-outline' },
    { key: 'analytics', label: 'Stats', icon: 'stats-chart-outline' },
  ];

  if (!childId) {
    return (
      <View style={s.center}>
        <ActivityIndicator color="#6366f1" />
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
        <Text style={s.headerTitle}>Goals</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CreateGoal')}>
          <Ionicons name="add-circle-outline" size={28} color="#6366f1" />
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
              color={activeTab === tab.key ? '#6366f1' : '#9ca3af'}
            />
            <Text style={[s.tabText, activeTab === tab.key && s.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {activeTab === 'active' && <ActiveGoalsTab childId={childId} />}
      {activeTab === 'completed' && <CompletedGoalsTab childId={childId} />}
      {activeTab === 'templates' && (
        <TemplatesTab
          childId={childId}
          onGoalCreated={() => setActiveTab('active')}
        />
      )}
      {activeTab === 'analytics' && <AnalyticsTab childId={childId} />}
    </View>
  );
}

// ===========================================================================
// STYLES
// ===========================================================================
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f9fafb' },
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
    borderBottomColor: '#e5e7eb' 
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12, gap: 4 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#6366f1' },
  tabText: { fontSize: 11, color: '#9ca3af', fontWeight: '500' },
  tabTextActive: { color: '#6366f1', fontWeight: '700' },

  tabContent: { flex: 1, padding: 16 },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#111827', 
    marginTop: 16, 
    marginBottom: 12 
  },

  dashboardCard: { 
    backgroundColor: '#6366f1', 
    borderRadius: 16, 
    padding: 20, 
    marginBottom: 16 
  },
  dashRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 12 
  },
  dashLevel: { fontSize: 18, fontWeight: '700', color: '#fff' },
  dashPoints: { fontSize: 14, color: '#c7d2fe', marginTop: 2 },
  dashStats: { alignItems: 'flex-end' },
  dashStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dashStatText: { fontSize: 13, color: '#e0e7ff', fontWeight: '600' },
  levelProgress: { marginTop: 8 },
  levelProgressBg: { 
    height: 8, 
    backgroundColor: 'rgba(255,255,255,0.3)', 
    borderRadius: 4, 
    marginBottom: 6 
  },
  levelProgressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 4 },
  levelProgressText: { fontSize: 12, color: '#c7d2fe', textAlign: 'center' },

  quickStats: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    marginBottom: 16 
  },
  quickStat: { alignItems: 'center' },
  quickStatValue: { fontSize: 24, fontWeight: '700', color: '#6366f1' },
  quickStatLabel: { fontSize: 12, color: '#6b7280', marginTop: 2 },

  goalCard: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 12, 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 3, 
    position: 'relative' 
  },
  priorityBar: { 
    position: 'absolute', 
    left: 0, 
    top: 0, 
    bottom: 0, 
    width: 4, 
    borderTopLeftRadius: 16, 
    borderBottomLeftRadius: 16 
  },
  goalIcon: { 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 12 
  },
  goalContent: { flex: 1 },
  goalTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 6 },
  goalMeta: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    marginBottom: 10 
  },
  goalMetaText: { fontSize: 12, color: '#6b7280' },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  categoryBadgeText: { fontSize: 11, fontWeight: '600' },
  
  progressSection: { marginBottom: 10 },
  progressHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 6 
  },
  progressText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  progressPct: { fontSize: 16, fontWeight: '700' },
  progressBar: { 
    height: 8, 
    backgroundColor: '#e5e7eb', 
    borderRadius: 4, 
    overflow: 'hidden' 
  },
  progressFill: { height: '100%', borderRadius: 4 },
  
  goalActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingVertical: 8, 
    borderRadius: 8, 
    borderWidth: 1.5, 
    gap: 4 
  },
  actionBtnText: { fontSize: 13, fontWeight: '600' },
  completeBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingVertical: 8, 
    borderRadius: 8, 
    gap: 4, 
    backgroundColor: '#10b981' 
  },
  completeBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },

  completedCard: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 10, 
    alignItems: 'center', 
    gap: 12 
  },
  completedCheck: {},
  completedContent: { flex: 1 },
  completedTitle: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 4 },
  completedMeta: { fontSize: 13, color: '#6b7280', marginBottom: 2 },
  completedDate: { fontSize: 12, color: '#9ca3af' },

  templateCard: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 14, 
    marginBottom: 10, 
    alignItems: 'center', 
    gap: 12 
  },
  templateIcon: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  templateContent: { flex: 1 },
  templateTitle: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 4 },
  templateDesc: { fontSize: 13, color: '#6b7280', marginBottom: 6 },
  templateMeta: { fontSize: 12, color: '#9ca3af' },
  useTemplateBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },

  periodSelector: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  periodBtn: { 
    flex: 1, 
    paddingVertical: 10, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#e5e7eb', 
    alignItems: 'center', 
    backgroundColor: '#fff' 
  },
  periodBtnActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  periodBtnText: { fontSize: 14, color: '#6b7280', fontWeight: '600' },
  periodBtnTextActive: { color: '#fff' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statBox: { 
    flex: 1, 
    minWidth: '45%', 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 16, 
    alignItems: 'center', 
    elevation: 1 
  },
  statValue: { fontSize: 28, fontWeight: '700', color: '#6366f1', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#6b7280' },

  chartCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
  chartBars: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    alignItems: 'flex-end', 
    height: 120 
  },
  chartBarContainer: { flex: 1, alignItems: 'center', gap: 4 },
  chartBarBg: { 
    width: 24, 
    height: 100, 
    backgroundColor: '#f3f4f6', 
    borderRadius: 4, 
    justifyContent: 'flex-end', 
    overflow: 'hidden' 
  },
  chartBar: { width: '100%', backgroundColor: '#6366f1', borderRadius: 4 },
  chartLabel: { fontSize: 11, color: '#6b7280', fontWeight: '600' },
  chartValue: { fontSize: 10, color: '#9ca3af' },

  categoryPerf: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  categoryPerfHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  categoryPerfName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  categoryPerfRate: { fontSize: 16, fontWeight: '700' },
  categoryPerfBar: { 
    height: 8, 
    backgroundColor: '#f3f4f6', 
    borderRadius: 4, 
    overflow: 'hidden', 
    marginBottom: 6 
  },
  categoryPerfText: { fontSize: 12, color: '#6b7280' },

  emptyBox: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  emptySub: { fontSize: 13, color: '#9ca3af', textAlign: 'center' },

  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'flex-end' 
  },
  detailModal: { 
    backgroundColor: '#fff', 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    padding: 24, 
    maxHeight: '80%' 
  },
  modalClose: { position: 'absolute', top: 16, right: 16, zIndex: 10, padding: 8 },
  modalIconHeader: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    justifyContent: 'center', 
    alignItems: 'center', 
    alignSelf: 'center', 
    marginBottom: 16 
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#111827', 
    textAlign: 'center', 
    marginBottom: 8 
  },
  modalDesc: { 
    fontSize: 14, 
    color: '#6b7280', 
    textAlign: 'center', 
    marginBottom: 20 
  },
  modalProgress: { 
    backgroundColor: '#f9fafb', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 16 
  },
  modalProgressLabel: { fontSize: 13, color: '#6b7280', marginBottom: 6 },
  modalProgressValue: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#111827', 
    marginBottom: 10 
  },
  modalProgressBar: { 
    height: 12, 
    backgroundColor: '#e5e7eb', 
    borderRadius: 6, 
    overflow: 'hidden' 
  },
  addProgressSection: { marginBottom: 16 },
  addProgressLabel: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#111827', 
    marginBottom: 8 
  },
  addProgressRow: { flexDirection: 'row', gap: 8 },
  progressInput: { 
    flex: 1, 
    borderWidth: 1, 
    borderColor: '#d1d5db', 
    borderRadius: 8, 
    paddingHorizontal: 12, 
    paddingVertical: 10, 
    fontSize: 16 
  },
  addProgressBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    borderRadius: 8, 
    gap: 6 
  },
  addProgressBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  rewardBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fef3c7', 
    padding: 12, 
    borderRadius: 10, 
    gap: 8 
  },
  rewardText: { fontSize: 13, color: '#92400e', fontWeight: '600' },
});