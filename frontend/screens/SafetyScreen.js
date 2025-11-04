// screens/SafetyScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios'; // uncomment if you post to API

// Recommended daily screen time by age groups (hours)
const AGE_PRESETS = [
  { id: '3-5', label: '3–5 yrs', rec: 1 },    // 1 hour
  { id: '6-12', label: '6–12 yrs', rec: 2 },  // 2 hours
  { id: '13-17', label: '13–17 yrs', rec: 3 },// 3 hours
];

const CONTENT_PRESETS = {
  strict: { label: 'Strict', desc: 'Block most multimedia & social apps' },
  moderate: { label: 'Moderate', desc: 'Allow educational + light media' },
  relaxed: { label: 'Relaxed', desc: 'Minimal restrictions' },
};

export default function SafetyScreen({ navigation }) {
  // In a real app you'd fetch children from API. Here we show a demo child list:
  const [children] = useState([
    { id: 1, name: 'Aarav', age: 4 },
    { id: 2, name: 'Maya', age: 9 },
    { id: 3, name: 'Rohan', age: 15 },
  ]);

  const [selectedChild, setSelectedChild] = useState(children[0]);
  const [agePreset, setAgePreset] = useState('3-5'); // default based on first child
  const [webFilter, setWebFilter] = useState(true);
  const [appLock, setAppLock] = useState(true);
  const [locationTracking, setLocationTracking] = useState(true);
  const [contentPreset, setContentPreset] = useState('moderate');
  const [dailyLimit, setDailyLimit] = useState(AGE_PRESETS[0].rec); // hours, float e.g. 1.5
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // set preset based on selected child's age
    if (!selectedChild) return;
    const a = selectedChild.age;
    if (a >= 3 && a <= 5) setAgePreset('3-5');
    else if (a >= 6 && a <= 12) setAgePreset('6-12');
    else setAgePreset('13-17');

    // set recommended limit to preset rec
    const preset = AGE_PRESETS.find(p => p.id === agePreset);
    if (preset) setDailyLimit(preset.rec);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChild]);

  useEffect(() => {
    // update daily limit when agePreset changes
    const preset = AGE_PRESETS.find(p => p.id === agePreset);
    if (preset) setDailyLimit(preset.rec);
  }, [agePreset]);

  // Stepper: increment/decrement by 0.5 hours (30 minutes)
  const changeLimit = (delta) => {
    setDailyLimit(prev => {
      const next = Math.round((prev + delta) * 2) / 2; // keep to 0.5 steps
      if (next < 0) return 0;
      if (next > 12) return 12; // upper bound
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      child_id: selectedChild.id,
      daily_limit_hours: dailyLimit,
      web_filter: webFilter,
      app_lock: appLock,
      location_tracking: locationTracking,
      content_preset: contentPreset,
    };

    try {
      // example: save locally (for offline) — replace with API call as needed:
      await AsyncStorage.setItem(`safety_${selectedChild.id}`, JSON.stringify(payload));

      // example API call (uncomment & configure endpoint):
      // const token = await AsyncStorage.getItem('access');
      // await axios.post(`http://YOUR_IP:8000/api/children/${selectedChild.id}/safety/`, payload, {
      //   headers: token ? { Authorization: `Bearer ${token}` } : {}
      // });

      setSaving(false);
      Alert.alert('Saved', 'Safety settings saved successfully.');
    } catch (err) {
      console.log('Save error', err);
      setSaving(false);
      Alert.alert('Error', 'Could not save settings. Try again.');
    }
  };

  const renderChildChips = () => (
    <View style={styles.chipsRow}>
      {children.map(ch => (
        <TouchableOpacity
          key={ch.id}
          style={[
            styles.chip,
            selectedChild && selectedChild.id === ch.id ? styles.chipActive : null,
          ]}
          onPress={() => setSelectedChild(ch)}
        >
          <Text style={[
            styles.chipText,
            selectedChild && selectedChild.id === ch.id ? styles.chipTextActive : null,
          ]}>
            {ch.name} • {ch.age}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.header}>Safety & Parental Controls</Text>
      <Text style={styles.subHeader}>Configured for children aged 3–17 years. Choose a child to apply personalized controls.</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Child</Text>
        {renderChildChips()}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Age Group Presets</Text>
        <View style={styles.row}>
          {AGE_PRESETS.map(p => {
            const active = p.id === agePreset;
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.presetBtn, active ? styles.presetBtnActive : null]}
                onPress={() => setAgePreset(p.id)}
              >
                <Text style={[styles.presetLabel, active ? styles.presetLabelActive : null]}>{p.label}</Text>
                <Text style={[styles.presetSmall, active ? styles.presetLabelActive : null]}>{p.rec} h/day</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.hint}>Recommended for {agePreset} age group</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Content Restriction</Text>
        <View style={styles.row}>
          {Object.keys(CONTENT_PRESETS).map(key => {
            const active = key === contentPreset;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.contentBtn, active ? styles.contentBtnActive : null]}
                onPress={() => setContentPreset(key)}
              >
                <Text style={[styles.contentTitle, active ? styles.contentTitleActive : null]}>{CONTENT_PRESETS[key].label}</Text>
                <Text style={[styles.contentDesc, active ? styles.contentDescActive : null]} numberOfLines={2}>{CONTENT_PRESETS[key].desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Daily Screen Time Limit</Text>

        <View style={styles.limitRow}>
          <TouchableOpacity style={styles.stepperBtn} onPress={() => changeLimit(-0.5)}>
            <Ionicons name="remove" size={20} color="#2563eb" />
          </TouchableOpacity>

          <View style={styles.limitBox}>
            <Text style={styles.limitValue}>{dailyLimit} h</Text>
            <Text style={styles.limitSub}>Recommended: {AGE_PRESETS.find(p => p.id === agePreset)?.rec} h/day</Text>
          </View>

          <TouchableOpacity style={styles.stepperBtn} onPress={() => changeLimit(0.5)}>
            <Ionicons name="add" size={20} color="#2563eb" />
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>Tip: Use smaller increments for younger children (3–5 yrs).</Text>
      </View>

      <View style={[styles.section, { marginBottom: 8 }]}>
        <Text style={styles.sectionTitle}>Quick Controls</Text>

        <View style={styles.card}>
          <View style={styles.cardLeft}>
            <Ionicons name="globe-outline" size={22} color="#2563eb" />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.cardTitle}>Web Filter</Text>
              <Text style={styles.cardDesc}>Automatically block adult & harmful content.</Text>
            </View>
          </View>
          <Switch value={webFilter} onValueChange={setWebFilter} trackColor={{ true: '#93c5fd' }} thumbColor={webFilter ? '#2563eb' : '#f4f4f4'} />
        </View>

        <View style={styles.card}>
          <View style={styles.cardLeft}>
            <Ionicons name="lock-closed-outline" size={22} color="#2563eb" />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.cardTitle}>App Lock</Text>
              <Text style={styles.cardDesc}>Block games or social apps during study hours.</Text>
            </View>
          </View>
          <Switch value={appLock} onValueChange={setAppLock} trackColor={{ true: '#93c5fd' }} thumbColor={appLock ? '#2563eb' : '#f4f4f4'} />
        </View>

        <View style={styles.card}>
          <View style={styles.cardLeft}>
            <Ionicons name="location-outline" size={22} color="#2563eb" />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.cardTitle}>Location Tracking</Text>
              <Text style={styles.cardDesc}>Quickly find device location when needed.</Text>
            </View>
          </View>
          <Switch value={locationTracking} onValueChange={setLocationTracking} trackColor={{ true: '#93c5fd' }} thumbColor={locationTracking ? '#2563eb' : '#f4f4f4'} />
        </View>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveText}>{saving ? 'Saving...' : `Save settings for ${selectedChild.name}`}</Text>
      </TouchableOpacity>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  header: { fontSize: 22, fontWeight: '700', color: '#0f172a', marginBottom: 6 },
  subHeader: { color: '#6b7280', marginBottom: 12 },

  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 8 },

  chipsRow: { flexDirection: 'row', gap: 10 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e6eefc',
  },
  chipActive: { backgroundColor: '#e6f0ff', borderColor: '#cfe6ff' },
  chipText: { color: '#111827' },
  chipTextActive: { color: '#0f172a', fontWeight: '700' },

  row: { flexDirection: 'row', alignItems: 'center' },

  presetBtn: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 10,
    marginRight: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eef2ff',
    alignItems: 'center',
  },
  presetBtnActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  presetLabel: { fontWeight: '600', color: '#0f172a' },
  presetSmall: { fontSize: 12, color: '#6b7280' },
  presetLabelActive: { color: '#fff' },

  contentBtn: {
    flex: 1,
    marginRight: 8,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eef2ff',
  },
  contentBtnActive: { backgroundColor: '#1e3a8a' },
  contentTitle: { fontWeight: '700', color: '#111827' },
  contentTitleActive: { color: '#fff' },
  contentDesc: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  contentDescActive: { color: '#dbeafe' },

  hint: { color: '#6b7280', fontSize: 12, marginTop: 8 },

  limitRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepperBtn: {
    width: 44, height: 44, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e6eefc'
  },
  limitBox: { flex: 1, alignItems: 'center' },
  limitValue: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  limitSub: { fontSize: 12, color: '#6b7280' },

  card: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#eef2ff'
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontWeight: '700', color: '#111827' },
  cardDesc: { fontSize: 12, color: '#6b7280' },

  saveBtn: {
    backgroundColor: '#2563eb', padding: 14, borderRadius: 12, marginTop: 8, alignItems: 'center'
  },
  saveText: { color: '#fff', fontWeight: '700' },
});
