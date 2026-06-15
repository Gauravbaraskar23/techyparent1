// screens/LearningSuggestionsScreen.js
// Complete Learning Suggestions + AI Chatbot Screen

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, FlatList, ActivityIndicator, Modal,
  RefreshControl, Animated, KeyboardAvoidingView,
  Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';

const API_BASE = 'http://10.176.131.220:8000/api/learningsuggestions';

const api = axios.create({ baseURL: API_BASE });
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Token ${token}`;
  return config;
});

// ===========================================================================
// TAB: SUGGESTIONS
// ===========================================================================
function SuggestionsTab({ childId }) {
  const [suggestions, setSuggestions] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ratingModal, setRatingModal] = useState({ visible: false, suggestion: null });
  const [selectedRating, setSelectedRating] = useState(0);

  useFocusEffect(useCallback(() => {
    loadData();
  }, [childId]));

  const loadData = async () => {
    try {
      const [dashRes, sugRes] = await Promise.all([
        api.get(`/dashboard/${childId}/`),
        api.get(`/suggestions/${childId}/`),
      ]);
      setDashboard(dashRes.data);
      setSuggestions(sugRes.data.suggestions || fallbackSuggestions);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAction = async (suggestionId, action) => {
    try {
      const payload = { action };
      if (action === 'complete' && selectedRating > 0) {
        payload.rating = selectedRating;
      }
      await api.post(`/suggestions/action/${suggestionId}/`, payload);
      setRatingModal({ visible: false, suggestion: null });
      setSelectedRating(0);
      await loadData();
    } catch (e) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const RESOURCE_ICONS = {
    video: 'play-circle-outline',
    book: 'book-outline',
    activity: 'color-palette-outline',
    game: 'game-controller-outline',
    worksheet: 'document-text-outline',
    website: 'globe-outline',
    quiz: 'help-circle-outline',
    podcast: 'mic-outline',
  };

  const DIFFICULTY_COLORS = {
    easy: '#10b981',
    medium: '#f59e0b',
    hard: '#ef4444',
  };

  if (loading) return <View style={s.center}><ActivityIndicator color="#6366f1" size="large" /></View>;
const fallbackSuggestions = [
  {
    id: 101,
    category_name: "Math",
    category_color: "#6366f1",
    reason: "Great for improving problem solving skills",
    status: "pending",
    resource: {
      title: "Learn Addition Basics",
      description: "Simple and fun way to learn addition with examples.",
      resource_type: "video",
      difficulty: "easy",
      duration_minutes: 10,
    }
  },
  {
    id: 102,
    category_name: "Science",
    category_color: "#10b981",
    reason: "Boost curiosity with experiments",
    status: "pending",
    resource: {
      title: "Fun Science Experiment",
      description: "Try a cool experiment using household items.",
      resource_type: "activity",
      difficulty: "medium",
      duration_minutes: 15,
    }
  },
  {
    id: 103,
    category_name: "English",
    category_color: "#f59e0b",
    reason: "Improve vocabulary",
    status: "pending",
    resource: {
      title: "Basic English Words",
      description: "Learn daily use English vocabulary.",
      resource_type: "quiz",
      difficulty: "easy",
      duration_minutes: 8,
    }
  }
];
  return (
    <ScrollView
      style={s.tabContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
    >
      {/* Daily Goal Card */}
      {dashboard?.today_goal && (
        <View style={s.goalCard}>
          <View style={s.goalHeader}>
            <View>
              <Text style={s.goalTitle}>Today's Goal 🎯</Text>
              <Text style={s.goalSub}>{dashboard.today_goal.resources_completed}/{dashboard.today_goal.resources_target} resources</Text>
            </View>
            <Text style={[s.goalPct, { color: dashboard.today_goal.is_achieved ? '#10b981' : '#6366f1' }]}>
              {dashboard.today_goal.completion_percentage}%
            </Text>
          </View>
          <View style={s.progressBg}>
            <View style={[s.progressFill, {
              width: `${dashboard.today_goal.completion_percentage}%`,
              backgroundColor: dashboard.today_goal.is_achieved ? '#10b981' : '#6366f1'
            }]} />
          </View>
          <View style={s.statsRow}>
            <View style={s.statItem}>
              <Ionicons name="flame-outline" size={16} color="#f59e0b" />
              <Text style={s.statText}>{dashboard.streak_days} day streak</Text>
            </View>
            <View style={s.statItem}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#10b981" />
              <Text style={s.statText}>{dashboard.total_completed} completed</Text>
            </View>
            <View style={s.statItem}>
              <Ionicons name="trophy-outline" size={16} color="#f59e0b" />
              <Text style={s.statText}>{dashboard.total_achievements} badges</Text>
            </View>
          </View>
        </View>
      )}

      {/* Suggestions */}
      <Text style={s.sectionTitle}>📚 Suggested For You</Text>

      {suggestions.length === 0 ? (
        <View style={s.emptyBox}>
          <Ionicons name="book-outline" size={48} color="#c4b5fd" />
          <Text style={s.emptyText}>No suggestions yet!</Text>
          <Text style={s.emptySub}>Set your interests to get personalized picks</Text>
        </View>
      ) : (
        suggestions.map((item) => (
          <View key={item.id} style={s.suggestionCard}>
            {/* Top Row */}
            <View style={s.cardTop}>
              <View style={[s.resourceTypeBadge, { backgroundColor: item.category_color + '20' }]}>
                <Ionicons
                  name={RESOURCE_ICONS[item.resource?.resource_type] || 'book-outline'}
                  size={20} color={item.category_color}
                />
              </View>
              <View style={s.cardTopInfo}>
                <Text style={s.cardTitle} numberOfLines={2}>{item.resource?.title}</Text>
                <View style={s.cardBadges}>
                  <View style={[s.badge, { backgroundColor: item.category_color + '20' }]}>
                    <Text style={[s.badgeText, { color: item.category_color }]}>{item.category_name}</Text>
                  </View>
                  <View style={[s.badge, { backgroundColor: DIFFICULTY_COLORS[item.resource?.difficulty] + '20' }]}>
                    <Text style={[s.badgeText, { color: DIFFICULTY_COLORS[item.resource?.difficulty] }]}>
                      {item.resource?.difficulty}
                    </Text>
                  </View>
                  {item.resource?.duration_minutes && (
                    <View style={s.badge}>
                      <Ionicons name="time-outline" size={11} color="#6b7280" />
                      <Text style={s.badgeText}>{item.resource.duration_minutes}min</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            <Text style={s.cardDesc} numberOfLines={2}>{item.resource?.description}</Text>
            <Text style={s.cardReason}>💡 {item.reason}</Text>

            {/* Actions */}
            {item.status === 'pending' && (
              <View style={s.cardActions}>
                <TouchableOpacity
                  style={s.skipBtn}
                  onPress={() => handleAction(item.id, 'skip')}
                >
                  <Text style={s.skipBtnText}>Skip</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.acceptBtn, { backgroundColor: item.category_color }]}
                  onPress={() => handleAction(item.id, 'accept')}
                >
                  <Ionicons name="play" size={14} color="#fff" />
                  <Text style={s.acceptBtnText}>Start</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.doneBtn}
                  onPress={() => setRatingModal({ visible: true, suggestion: item })}
                >
                  <Ionicons name="checkmark" size={14} color="#fff" />
                  <Text style={s.doneBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}

            {item.status === 'accepted' && (
              <TouchableOpacity
                style={s.completedBtn}
                onPress={() => setRatingModal({ visible: true, suggestion: item })}
              >
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <Text style={s.completedBtnText}>Mark Complete</Text>
              </TouchableOpacity>
            )}

            {item.status === 'completed' && (
              <View style={s.completedStatus}>
                <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                <Text style={s.completedStatusText}>Completed! ⭐</Text>
                {item.rating && (
                  <Text style={s.ratingText}>{'⭐'.repeat(item.rating)}</Text>
                )}
              </View>
            )}
          </View>
        ))
      )}

      <View style={{ height: 80 }} />

      {/* Rating Modal */}
      <Modal visible={ratingModal.visible} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.ratingModal}>
            <Text style={s.ratingTitle}>How was it? 🌟</Text>
            <Text style={s.ratingSubtitle}>{ratingModal.suggestion?.resource?.title}</Text>
            <View style={s.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setSelectedRating(star)}>
                  <Ionicons
                    name={star <= selectedRating ? 'star' : 'star-outline'}
                    size={40} color="#f59e0b"
                  />
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.ratingActions}>
              <TouchableOpacity style={s.ratingCancel} onPress={() => setRatingModal({ visible: false, suggestion: null })}>
                <Text style={s.ratingCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.ratingConfirm}
                onPress={() => ratingModal.suggestion && handleAction(ratingModal.suggestion.id, 'complete')}
              >
                <Text style={s.ratingConfirmText}>Submit ✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// ===========================================================================
// TAB: CHATBOT
// ===========================================================================
function ChatbotTab({ childId }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(true);
  const [botName, setBotName] = useState('Techy');
  const [quizData, setQuizData] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [moodModal, setMoodModal] = useState(true);
  const [selectedMood, setSelectedMood] = useState('');
  const scrollRef = useRef();

  const MOODS = [
    { key: 'happy', label: 'Happy', emoji: '😊' },
    { key: 'sad', label: 'Sad', emoji: '😢' },
    { key: 'confused', label: 'Confused', emoji: '🤔' },
    { key: 'excited', label: 'Excited', emoji: '🎉' },
    { key: 'frustrated', label: 'Frustrated', emoji: '😤' },
    { key: 'bored', label: 'Bored', emoji: '😴' },
  ];

  const startSession = async (mood) => {
    setMoodModal(false);
    setStarting(true);
    try {
      const res = await api.post('/chat/start/', { child_id: childId, mood });
      setSessionId(res.data.session_id);
      setBotName(res.data.bot_name);
      setMessages([{
        id: Date.now(),
        sender: 'assistant',
        content: res.data.welcome_message,
        message_type: 'text',
        time_display: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      }]);
    } catch (e) {
      console.error(e);
    } finally {
      setStarting(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !sessionId || loading) return;

    const userMsg = {
      id: Date.now(),
      sender: 'child',
      content: inputText,
      message_type: 'text',
      time_display: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    };

    setMessages(prev => [...prev, userMsg]);
    const text = inputText;
    setInputText('');
    setLoading(true);

    try {
      const res = await api.post('/chat/send/', { session_id: sessionId, message: text });

      const botMsg = {
        id: Date.now() + 1,
        sender: 'assistant',
        content: res.data.response,
        message_type: res.data.message_type,
        time_display: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      };

      setMessages(prev => [...prev, botMsg]);

      // Fetch quiz if triggered
      if (res.data.should_quiz) {
        fetchQuiz();
      }

    } catch (e) {
      console.log("🔥 ERROR:", e.response?.data);
      console.log("🔥 RESPONSE:", e.response?.data);
      console.log("🔥 STATUS:", e.response?.status);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'assistant',
        content: "Oops! Something went wrong. Try again!",
        message_type: 'text',
        time_display: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const fetchQuiz = async () => {
    try {
      const res = await api.get(`/quiz/${childId}/`);
      setQuizData(res.data);
    } catch (e) {
      console.error('Quiz fetch error:', e);
    }
  };

  const submitQuizAnswer = async (answer) => {
    if (!quizData || selectedAnswer) return;
    setSelectedAnswer(answer);

    try {
      const res = await api.post(`/quiz/${childId}/`, {
        question_id: quizData.id,
        answer,
        session_id: sessionId,
        time_taken: 10,
      });

      const quizResultMsg = {
        id: Date.now(),
        sender: 'assistant',
        content: res.data.message,
        message_type: 'text',
        time_display: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      };

      setMessages(prev => [...prev, quizResultMsg]);
      setTimeout(() => {
        setQuizData(null);
        setSelectedAnswer(null);
      }, 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const renderMessage = ({ item }) => {
    const isChild = item.sender === 'child';
    return (
      <View style={[s.msgRow, isChild && s.msgRowRight]}>
        {!isChild && (
          <View style={s.botAvatar}>
            <Text style={s.botAvatarText}>T</Text>
          </View>
        )}
        <View style={[s.msgBubble, isChild ? s.childBubble : s.botBubble]}>
          <Text style={[s.msgText, isChild && s.childMsgText]}>{item.content}</Text>
          <Text style={[s.msgTime, isChild && s.childMsgTime]}>{item.time_display}</Text>
        </View>
      </View>
    );
  };

  // Mood selection modal
  if (moodModal) {
    return (
      <View style={s.moodModal}>
        <Text style={s.moodTitle}>Hi! How are you feeling today? 👋</Text>
        <Text style={s.moodSub}>Tell {botName} your mood to get started</Text>
        <View style={s.moodsGrid}>
          {MOODS.map((mood) => (
            <TouchableOpacity
              key={mood.key}
              style={[s.moodBtn, selectedMood === mood.key && s.moodBtnActive]}
              onPress={() => setSelectedMood(mood.key)}
            >
              <Text style={s.moodEmoji}>{mood.emoji}</Text>
              <Text style={[s.moodLabel, selectedMood === mood.key && s.moodLabelActive]}>{mood.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={[s.startChatBtn, !selectedMood && s.startChatBtnDisabled]}
          onPress={() => selectedMood && startSession(selectedMood)}
          disabled={!selectedMood}
        >
          <Text style={s.startChatBtnText}>Start Chatting 🚀</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (starting) {
    return <View style={s.center}><ActivityIndicator color="#6366f1" size="large" /><Text style={s.loadingTxt}>Starting chat...</Text></View>;
  }

  return (
    <KeyboardAvoidingView
      style={s.chatContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={120}
    >
      {/* Header */}
      <View style={s.chatHeader}>
        <View style={s.botAvatarLg}>
          <Text style={s.botAvatarLgText}>T</Text>
        </View>
        <View>
          <Text style={s.chatBotName}>{botName}</Text>
          <View style={s.onlineRow}>
            <View style={s.onlineDot} />
            <Text style={s.onlineTxt}>Always here to help</Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={scrollRef}
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMessage}
        contentContainerStyle={s.msgList}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Typing indicator */}
      {loading && (
        <View style={s.typingRow}>
          <View style={s.botAvatar}><Text style={s.botAvatarText}>T</Text></View>
          <View style={s.typingBubble}>
            <Text style={s.typingDots}>• • •</Text>
          </View>
        </View>
      )}

      {/* Quiz Card */}
      {quizData && (
        <View style={s.quizCard}>
          <Text style={s.quizLabel}>🎯 Quick Quiz!</Text>
          <Text style={s.quizQuestion}>{quizData.question}</Text>
          {['a', 'b', 'c', 'd'].map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[
                s.quizOption,
                selectedAnswer === opt && s.quizOptionSelected
              ]}
              onPress={() => submitQuizAnswer(opt)}
              disabled={!!selectedAnswer}
            >
              <Text style={[s.quizOptLetter, selectedAnswer === opt && s.quizOptLetterSelected]}>
                {opt.toUpperCase()}
              </Text>
              <Text style={[s.quizOptText, selectedAnswer === opt && s.quizOptTextSelected]}>
                {quizData[`option_${opt}`]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Quick Prompts */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.quickPrompts}>
        {['What should I learn?', "I'm bored 😴", 'Give me a quiz! 🎯', 'I need help 🆘', "What's next? ➡️"].map((prompt) => (
          <TouchableOpacity
            key={prompt}
            style={s.quickPromptBtn}
            onPress={() => { setInputText(prompt); }}
          >
            <Text style={s.quickPromptText}>{prompt}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Input */}
      <View style={s.inputRow}>
        <TextInput
          style={s.chatInput}
          placeholder={`Message ${botName}...`}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[s.sendBtn, (!inputText.trim() || loading) && s.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || loading}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ===========================================================================
// TAB: ACHIEVEMENTS
// ===========================================================================
function AchievementsTab({ childId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAchievements(); }, []);

  const loadAchievements = async () => {
    try {
      const res = await api.get(`/achievements/${childId}/`);
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <View style={s.center}><ActivityIndicator color="#6366f1" /></View>;

  return (
    <ScrollView style={s.tabContent}>
      {/* Points Banner */}
      <View style={s.pointsBanner}>
        <Ionicons name="trophy" size={40} color="#f59e0b" />
        <Text style={s.pointsTotal}>{data?.total_points || 0}</Text>
        <Text style={s.pointsLabel}>Total Points</Text>
        <Text style={s.pointsSub}>{data?.total_earned}/{data?.total_available} badges earned</Text>
      </View>

      {/* Earned */}
      <Text style={s.sectionTitle}>🏆 Your Badges</Text>
      {data?.earned?.length === 0 ? (
        <View style={s.emptyBox}>
          <Text style={s.emptyText}>No badges yet!</Text>
          <Text style={s.emptySub}>Complete activities to earn your first badge</Text>
        </View>
      ) : (
        <View style={s.badgesGrid}>
          {data?.earned?.map((item) => (
            <View key={item.id} style={s.badgeCard}>
              <View style={[s.badgeIcon, { backgroundColor: item.achievement.color + '20' }]}>
                <Ionicons name={item.achievement.icon_name} size={32} color={item.achievement.color} />
              </View>
              <Text style={s.badgeName}>{item.achievement.name}</Text>
              <Text style={s.badgeDesc} numberOfLines={2}>{item.achievement.description}</Text>
              <Text style={s.badgePoints}>+{item.points_earned} pts</Text>
            </View>
          ))}
        </View>
      )}

      {/* Available */}
      <Text style={s.sectionTitle}>🔒 More To Unlock</Text>
      <View style={s.badgesGrid}>
        {data?.available?.map((item) => (
          <View key={item.id} style={[s.badgeCard, s.badgeCardLocked]}>
            <View style={s.badgeIconLocked}>
              <Ionicons name="lock-closed" size={32} color="#9ca3af" />
            </View>
            <Text style={s.badgeNameLocked}>{item.name}</Text>
            <Text style={s.badgeDesc} numberOfLines={2}>{item.description}</Text>
            <Text style={s.badgePointsLocked}>{item.points} pts</Text>
          </View>
        ))}
      </View>
      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

// ===========================================================================
// MAIN SCREEN
// ===========================================================================
export default function LearningScreen({ navigation }) {
  const [childId, setChildId] = useState(null);
  const [activeTab, setActiveTab] = useState('suggestions');

  useEffect(() => {
    AsyncStorage.getItem('selectedChildId').then((id) => {
      setChildId(id ? parseInt(id) : 1);
    });
  }, []);

  const TABS = [
    { key: 'suggestions', label: 'Learn', icon: 'book-outline' },
    { key: 'chat', label: 'Chat', icon: 'chatbubble-ellipses-outline' },
    { key: 'achievements', label: 'Badges', icon: 'trophy-outline' },
  ];

  if (!childId) return <View style={s.center}><ActivityIndicator color="#6366f1" /></View>;

  return (
    <View style={s.screen}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Learning Hub</Text>
        <TouchableOpacity onPress={() => navigation.navigate('LearningInterests', { childId })}>
          <Ionicons name="options-outline" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={s.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[s.tabBtn, activeTab === tab.key && s.tabBtnActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon}
              size={20}
              color={activeTab === tab.key ? '#6366f1' : '#9ca3af'}
            />
            <Text style={[s.tabLabel, activeTab === tab.key && s.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {activeTab === 'suggestions' && <SuggestionsTab childId={childId} />}
      {activeTab === 'chat' && <ChatbotTab childId={childId} />}
      {activeTab === 'achievements' && <AchievementsTab childId={childId} />}
    </View>
  );
}

// ===========================================================================
// STYLES
// ===========================================================================
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f5f3ff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingTxt: { color: '#6b7280', fontSize: 14 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, backgroundColor: '#fff' },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },

  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, gap: 4 },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: '#6366f1' },
  tabLabel: { fontSize: 12, color: '#9ca3af', fontWeight: '500' },
  tabLabelActive: { color: '#6366f1', fontWeight: '700' },

  tabContent: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginTop: 20, marginBottom: 12 },

  goalCard: { backgroundColor: '#6366f1', borderRadius: 16, padding: 20, marginBottom: 8 },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  goalTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  goalSub: { fontSize: 13, color: '#c7d2fe', marginTop: 2 },
  goalPct: { fontSize: 32, fontWeight: '900' },
  progressBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4, marginBottom: 16 },
  progressFill: { height: '100%', borderRadius: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, color: '#e0e7ff', fontWeight: '600' },

  suggestionCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
  cardTop: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  resourceTypeBadge: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardTopInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 6 },
  cardBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, gap: 3 },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#6b7280' },
  cardDesc: { fontSize: 13, color: '#6b7280', lineHeight: 18, marginBottom: 8 },
  cardReason: { fontSize: 12, color: '#8b5cf6', fontStyle: 'italic', marginBottom: 12 },
  cardActions: { flexDirection: 'row', gap: 8 },
  skipBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' },
  skipBtnText: { fontSize: 14, color: '#6b7280', fontWeight: '600' },
  acceptBtn: { flex: 1.5, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 10, borderRadius: 8, gap: 4 },
  acceptBtnText: { fontSize: 14, color: '#fff', fontWeight: '700' },
  doneBtn: { flex: 1.5, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 10, borderRadius: 8, gap: 4, backgroundColor: '#10b981' },
  doneBtnText: { fontSize: 14, color: '#fff', fontWeight: '700' },
  completedBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#10b981', paddingVertical: 10, borderRadius: 8, gap: 6 },
  completedBtnText: { fontSize: 14, color: '#fff', fontWeight: '700' },
  completedStatus: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  completedStatusText: { fontSize: 14, color: '#10b981', fontWeight: '600' },
  ratingText: { fontSize: 14 },

  emptyBox: { alignItems: 'center', padding: 40, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  emptySub: { fontSize: 13, color: '#9ca3af', textAlign: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  ratingModal: { backgroundColor: '#fff', borderRadius: 24, padding: 28, width: '80%', alignItems: 'center' },
  ratingTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 4 },
  ratingSubtitle: { fontSize: 14, color: '#6b7280', marginBottom: 20, textAlign: 'center' },
  starsRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  ratingActions: { flexDirection: 'row', gap: 12, width: '100%' },
  ratingCancel: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' },
  ratingCancelText: { color: '#6b7280', fontWeight: '600' },
  ratingConfirm: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#6366f1', alignItems: 'center' },
  ratingConfirmText: { color: '#fff', fontWeight: '700' },

  // Chatbot
  moodModal: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f3ff' },
  moodTitle: { fontSize: 22, fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: 8 },
  moodSub: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 32 },
  moodsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginBottom: 32 },
  moodBtn: { width: 90, paddingVertical: 16, borderRadius: 16, borderWidth: 2, borderColor: '#e5e7eb', backgroundColor: '#fff', alignItems: 'center', gap: 6 },
  moodBtnActive: { borderColor: '#6366f1', backgroundColor: '#ede9fe' },
  moodEmoji: { fontSize: 28 },
  moodLabel: { fontSize: 13, color: '#6b7280', fontWeight: '600' },
  moodLabelActive: { color: '#6366f1' },
  startChatBtn: { backgroundColor: '#6366f1', paddingHorizontal: 40, paddingVertical: 16, borderRadius: 16 },
  startChatBtnDisabled: { backgroundColor: '#c4b5fd' },
  startChatBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  chatContainer: { flex: 1 },
  chatHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  botAvatarLg: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center' },
  botAvatarLgText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  chatBotName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981' },
  onlineTxt: { fontSize: 12, color: '#6b7280' },

  msgList: { padding: 16, gap: 12 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 8 },
  msgRowRight: { flexDirection: 'row-reverse' },
  botAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center' },
  botAvatarText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  msgBubble: { maxWidth: '75%', padding: 12, borderRadius: 18, gap: 4 },
  botBubble: { backgroundColor: '#fff', borderBottomLeftRadius: 4, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  childBubble: { backgroundColor: '#6366f1', borderBottomRightRadius: 4 },
  msgText: { fontSize: 15, color: '#111827', lineHeight: 20 },
  childMsgText: { color: '#fff' },
  msgTime: { fontSize: 11, color: '#9ca3af', alignSelf: 'flex-end' },
  childMsgTime: { color: '#c7d2fe' },

  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  typingBubble: { backgroundColor: '#fff', padding: 12, borderRadius: 18, borderBottomLeftRadius: 4 },
  typingDots: { fontSize: 18, color: '#9ca3af', letterSpacing: 2 },

  quizCard: { backgroundColor: '#fff', margin: 12, padding: 16, borderRadius: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  quizLabel: { fontSize: 13, fontWeight: '700', color: '#6366f1', marginBottom: 8 },
  quizQuestion: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 12, lineHeight: 22 },
  quizOption: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 8 },
  quizOptionSelected: { backgroundColor: '#ede9fe', borderColor: '#6366f1' },
  quizOptLetter: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f3f4f6', textAlign: 'center', lineHeight: 28, fontSize: 13, fontWeight: '700', color: '#6b7280' },
  quizOptLetterSelected: { backgroundColor: '#6366f1', color: '#fff' },
  quizOptText: { flex: 1, fontSize: 14, color: '#374151' },
  quizOptTextSelected: { color: '#6366f1', fontWeight: '600' },

  quickPrompts: { paddingHorizontal: 12, paddingVertical: 8, maxHeight: 52 },
  quickPromptBtn: { backgroundColor: '#ede9fe', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  quickPromptText: { fontSize: 13, color: '#6366f1', fontWeight: '600' },

  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  chatInput: { flex: 1, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { backgroundColor: '#c4b5fd' },

  // Achievements
  pointsBanner: { backgroundColor: '#6366f1', borderRadius: 20, padding: 24, alignItems: 'center', gap: 4, marginBottom: 8 },
  pointsTotal: { fontSize: 48, fontWeight: '900', color: '#fff' },
  pointsLabel: { fontSize: 16, color: '#c7d2fe', fontWeight: '600' },
  pointsSub: { fontSize: 13, color: '#a5b4fc' },
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  badgeCard: { width: '47%', backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center', gap: 8, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 },
  badgeCardLocked: { opacity: 0.6 },
  badgeIcon: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  badgeIconLocked: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
  badgeName: { fontSize: 14, fontWeight: '700', color: '#111827', textAlign: 'center' },
  badgeNameLocked: { fontSize: 14, fontWeight: '700', color: '#9ca3af', textAlign: 'center' },
  badgeDesc: { fontSize: 12, color: '#6b7280', textAlign: 'center', lineHeight: 16 },
  badgePoints: { fontSize: 13, fontWeight: '700', color: '#f59e0b' },
  badgePointsLocked: { fontSize: 13, fontWeight: '700', color: '#9ca3af' },
});