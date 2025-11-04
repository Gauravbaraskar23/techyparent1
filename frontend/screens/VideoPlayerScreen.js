import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions } from "react-native";
import YoutubePlayer from "react-native-youtube-iframe";

export default function VideoPlayerScreen({ route }) {
  const { title, description, video_url } = route.params;
  const [playing, setPlaying] = useState(false);

  const onStateChange = useCallback((state) => {
    if (state === "ended") {
      setPlaying(false);
    }
  }, []);

  // ✅ Extract YouTube video ID (from full URL)
  const getYouTubeId = (url) => {
    const match = url.match(
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    return match ? match[1] : null;
  };

  const videoId = getYouTubeId(video_url);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.videoContainer}>
        {videoId ? (
          <YoutubePlayer
            height={Dimensions.get("window").width * 0.56}
            play={playing}
            videoId={videoId}
            onChangeState={onStateChange}
          />
        ) : (
          <Text style={styles.errorText}>Invalid video URL</Text>
        )}
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  videoContainer: {
    width: "100%",
    backgroundColor: "#000",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 15,
    paddingHorizontal: 16,
    color: "#222",
  },
  description: {
    fontSize: 16,
    color: "#555",
    marginTop: 10,
    paddingHorizontal: 16,
    marginBottom: 30,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    padding: 20,
  },
});
