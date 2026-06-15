import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { fetchCategories, fetchActivities } from "../src/api/familyBondingApi";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";


export default function TemplatesScreen() {
  const [categories, setCategories] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [parentId, setParentId] = useState(null);
const API_BASE = "http://10.176.131.220:8000/api/familybonding";

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("authToken");
  if (token) config.headers.Authorization = `Token ${token}`;
  return config;
});

  useEffect(() => {
    loadInitialData();
    AsyncStorage.getItem("parentId").then((id) => {
    setParentId(id ? parseInt(id) : 1);
  });
  }, []);

  
  const handleAddToPlan = async (template) => {
    try {
      await api.post(`/activities/create/`, {
        title: template.title,
        description: template.description,
        category: template.category,
        duration_minutes: template.duration_minutes,
        difficulty: template.difficulty,
        instructions: template.instructions,
        is_outdoor: template.is_outdoor,

        parent_id: parentId,
        scheduled_date: new Date().toISOString(),
        status: "planned",
      });

      Alert.alert("Success 🎉", "Activity added to plan!");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to add activity");
    }
  };

  const loadInitialData = async () => {
    try {
      const cats = await fetchCategories();
      setCategories(cats);

      const acts = await fetchActivities();
      setTemplates(acts);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const filterByCategory = async (categoryId) => {
    setSelectedCategory(categoryId);
    setLoading(true);

    try {
      const data = await fetchActivities({ category: categoryId });
      setTemplates(data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#EC4899" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Category Filter */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={categories}
        keyExtractor={(item) => item.id.toString()}
        style={styles.categoryList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryBtn,
              selectedCategory === item.id && styles.categoryActive,
            ]}
            onPress={() => filterByCategory(item.id)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === item.id && styles.categoryTextActive,
              ]}
            >
              {item.display_name}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Templates List */}
      <FlatList
        data={templates}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 80 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.desc}>{item.description}</Text>

            <View style={styles.metaRow}>
              <Text style={styles.meta}>
                ⏱ {item.duration_minutes} min
              </Text>
              <Text style={styles.meta}>
                🎯 {item.difficulty}
              </Text>
              {item.is_outdoor && (
                <Text style={styles.meta}>🌤 Outdoor</Text>
              )}
            </View>

            <Text style={styles.instructions}>
              {item.instructions}
            </Text>

            <TouchableOpacity
                style={styles.addBtn}
                onPress={() => handleAddToPlan(item)}
                >
                <Text style={styles.addBtnText}>➕ Add to Plan</Text>
            </TouchableOpacity>

          </View>
        )}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    paddingTop: 50,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  categoryList: {
    maxHeight: 60,
    paddingHorizontal: 10,
    marginBottom: 10,
  },

  categoryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 20,
    marginRight: 8,
  },

  categoryActive: {
    backgroundColor: "#EC4899",
  },

  categoryText: {
    fontSize: 13,
    color: "#374151",
  },

  categoryTextActive: {
    color: "#fff",
    fontWeight: "600",
  },

  card: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 14,
    borderRadius: 12,
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },

  desc: {
    fontSize: 13,
    color: "#6B7280",
    marginVertical: 6,
  },

  metaRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 6,
  },

  meta: {
    fontSize: 12,
    color: "#6B7280",
  },

  instructions: {
    fontSize: 13,
    color: "#374151",
  },

  addBtn: {
  marginTop: 10,
  backgroundColor: "#EC4899",
  paddingVertical: 8,
  borderRadius: 8,
  alignItems: "center",
},

addBtnText: {
  color: "#fff",
  fontWeight: "600",
},
});