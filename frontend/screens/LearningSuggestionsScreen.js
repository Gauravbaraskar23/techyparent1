import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import axios from "axios";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useRoute } from "@react-navigation/native";

export default function LearningSuggestionsScreen({ navigation }) {
  const route = useRoute();
  const { childId } = route.params; // ✅ coming from Dashboard
  const [videos, setVideos] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const CATEGORIES = ["All", "Education", "Creativity", "Devotional", "Motivational"];

  const fetchVideos = async (query = "") => {
    setLoading(true);
    try {
      const categoryParam =
        selectedCategory && selectedCategory !== "All"
          ? `&category=${selectedCategory.toLowerCase()}`
          : "";
      const res = await axios.get(
        `http://172.28.34.220:8000/api/suggestions/${childId}/?search=${query}${categoryParam}`
      );
      setVideos(res.data);
    } catch (error) {
      console.log("❌ Error fetching videos:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [selectedCategory]);

  const handleSearch = () => {
    fetchVideos(search);
  };

  return (
    <View style={styles.container}>
      {/* ✅ Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Learning Suggestions</Text>
      </View>

      {/* ✅ Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={{ marginRight: 8 }} />
        <TextInput
          placeholder="Search videos..."
          placeholderTextColor="#888"
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity onPress={handleSearch}>
          <Ionicons name="arrow-forward-circle" size={26} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {/* ✅ Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryChip,
              selectedCategory === cat && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === cat && styles.categoryTextActive,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ✅ Video List */}
      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 30 }} />
      ) : videos.length === 0 ? (
        <Text style={styles.noData}>No videos found.</Text>
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Image
                source={{ uri: item.thumbnail_url }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
              <View style={styles.cardInfo}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.category}>{item.category}</Text>
                <Text style={styles.description} numberOfLines={2}>
                  {item.description}
                </Text>
                <TouchableOpacity
                  style={styles.watchButton}
                  onPress={() => navigation.navigate("VideoPlayer", { title: video.title,
  description: video.description,
  video_url: video.video_url, })}
                >
                  <Text style={styles.watchText}>▶ Watch</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3b82f6",
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 15,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 15,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: { flex: 1, fontSize: 16, color: "#000" },
  categoryScroll: { marginHorizontal: 10, marginBottom: 10 },
  categoryChip: {
    backgroundColor: "#e5e7eb",
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipActive: { backgroundColor: "#3b82f6" },
  categoryText: { color: "#333", fontWeight: "500" },
  categoryTextActive: { color: "#fff" },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 10,
    overflow: "hidden",
    elevation: 2,
  },
  thumbnail: { width: "100%", height: 180 },
  cardInfo: { padding: 12 },
  title: { fontSize: 16, fontWeight: "700", color: "#111" },
  category: { color: "#3b82f6", fontWeight: "600", marginVertical: 2 },
  description: { fontSize: 13, color: "#666", marginBottom: 6 },
  watchButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  watchText: { color: "#fff", fontWeight: "600" },
  noData: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 15,
    color: "#666",
  },
});
