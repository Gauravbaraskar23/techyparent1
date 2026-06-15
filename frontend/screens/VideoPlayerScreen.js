import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from "react-native";
import YoutubePlayer from "react-native-youtube-iframe";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";

export default function VideoPlayerScreen({ route }) {
  const { video } = route.params; // video object from LearningSuggestionsScreen
  const { title, description, video_url } = video;

  const [playing, setPlaying] = useState(false);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);

  const navigation = useNavigation();

  // Animation for Like button
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Handle video state
  const onStateChange = useCallback((state) => {
    if (state === "ended") {
      setPlaying(false);
    }
  }, []);

  // Extract YouTube video ID
  const getYouTubeId = (url) => {
    const match = url.match(
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    return match ? match[1] : null;
  };

  const videoId = getYouTubeId(video_url);

  // Like button animation
  const handleLike = () => {
    setLiked(!liked);

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.3,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Learning Video</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Video Player */}
        <View style={styles.videoContainer}>
          {videoId ? (
            <YoutubePlayer
              height={Dimensions.get("window").width * 0.56}
              play={playing}
              videoId={videoId}
              onChangeState={onStateChange}
              onReady={() => setLoading(false)}
            />
          ) : (
            <Text style={styles.errorText}>Invalid video URL</Text>
          )}
          {loading && <ActivityIndicator size="large" color="#3b82f6" style={styles.loader} />}
        </View>

        {/* Video Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>

          {/* Like Button */}
          <View style={styles.actionsRow}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity
                style={[styles.likeButton, liked && styles.liked]}
                onPress={handleLike}
              >
                <Ionicons
                  name={liked ? "heart" : "heart-outline"}
                  size={26}
                  color={liked ? "#e11d48" : "#555"}
                />
                <Text
                  style={[
                    styles.likeText,
                    { color: liked ? "#e11d48" : "#555" },
                  ]}
                >
                  {liked ? "Liked" : "Like"}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3b82f6",
    paddingVertical: 15,
    paddingHorizontal: 20,
    elevation: 4,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 15,
  },
  // videoContainer: {
  //   width: "100%",
  //   backgroundColor: "#000",
  //   marginTop: 15,
  //   borderRadius: 15,
  //   overflow: "hidden",
  //   justifyContent: "center",
  //   alignItems: "center",
  // },
  videoContainer: {
  width: "100%",
  borderRadius: 15,
  overflow: "hidden",
  marginTop: 15,
  backgroundColor: "#000", // optional for loader background
  aspectRatio: 16 / 9, // fixes the black bars issue
},

  loader: { position: "absolute", top: "45%" },
  infoContainer: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: "#555",
    lineHeight: 22,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },
  likeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 25,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  liked: {
    backgroundColor: "#fee2e2",
    borderColor: "#e11d48",
  },
  likeText: {
    fontSize: 15,
    fontWeight: "500",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    padding: 20,
  },
});

// import React, { useState, useCallback } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   Dimensions,
//   TouchableOpacity,
//   Animated,
// } from "react-native";
// import YoutubePlayer from "react-native-youtube-iframe";
// import { Ionicons } from "@expo/vector-icons";
// import { useNavigation } from "@react-navigation/native";

// export default function VideoPlayerScreen({ route }) {
//   const { title, description, video_url } = route.params;
//   const [playing, setPlaying] = useState(false);
//   const [liked, setLiked] = useState(false);
//   const navigation = useNavigation();
//   const scaleAnim = new Animated.Value(1);

//   // ✅ Handle player state
//   const onStateChange = useCallback((state) => {
//     if (state === "ended") {
//       setPlaying(false);
//     }
//   }, []);

//   // ✅ Extract YouTube ID from full URL
//   const getYouTubeId = (url) => {
//     const match = url.match(
//       /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
//     );
//     return match ? match[1] : null;
//   };

//   const videoId = getYouTubeId(video_url);

//   // ❤️ Like button animation
//   const handleLike = () => {
//     setLiked(!liked);
//     Animated.sequence([
//       Animated.timing(scaleAnim, {
//         toValue: 1.3,
//         duration: 100,
//         useNativeDriver: true,
//       }),
//       Animated.timing(scaleAnim, {
//         toValue: 1,
//         duration: 100,
//         useNativeDriver: true,
//       }),
//     ]).start();
//   };

//   return (
//     <View style={styles.container}>
//       {/* 🔙 Header with back button */}
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => navigation.goBack()}>
//           <Ionicons name="arrow-back" size={26} color="#fff" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle} numberOfLines={1}>
//           Learning Video
//         </Text>
//         <View style={{ width: 26 }} /> {/* Spacer for alignment */}
//       </View>

//       <ScrollView style={styles.scrollArea}>
//         {/* 🎥 Video player */}
//         <View style={styles.videoContainer}>
//           {videoId ? (
//             <YoutubePlayer
//               height={Dimensions.get("window").width * 0.56}
//               play={playing}
//               videoId={videoId}
//               onChangeState={onStateChange}
//             />
//           ) : (
//             <Text style={styles.errorText}>Invalid video URL</Text>
//           )}
//         </View>

//         {/* 🧠 Video Details */}
//         <View style={styles.infoContainer}>
//           <Text style={styles.title}>{title}</Text>
//           <Text style={styles.description}>{description}</Text>

//           <View style={styles.actionsRow}>
//             <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
//               <TouchableOpacity
//                 style={[styles.likeButton, liked && styles.liked]}
//                 onPress={handleLike}
//               >
//                 <Ionicons
//                   name={liked ? "heart" : "heart-outline"}
//                   size={26}
//                   color={liked ? "#e11d48" : "#555"}
//                 />
//                 <Text
//                   style={[
//                     styles.likeText,
//                     { color: liked ? "#e11d48" : "#555" },
//                   ]}
//                 >
//                   {liked ? "Liked" : "Like"}
//                 </Text>
//               </TouchableOpacity>
//             </Animated.View>
//           </View>
//         </View>
//       </ScrollView>
//     </View>
//   );
// }

// // 🎨 Styles
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#fff",
//   },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     backgroundColor: "#3b82f6",
//     paddingHorizontal: 15,
//     paddingTop: 50,
//     paddingBottom: 15,
//   },
//   headerTitle: {
//     color: "#fff",
//     fontSize: 18,
//     fontWeight: "600",
//   },
//   scrollArea: {
//     flex: 1,
//   },
//   videoContainer: {
//     width: "100%",
//     backgroundColor: "#000",
//   },
//   infoContainer: {
//     padding: 16,
//   },
//   title: {
//     fontSize: 22,
//     fontWeight: "700",
//     color: "#111",
//     marginBottom: 8,
//   },
//   description: {
//     fontSize: 15,
//     color: "#555",
//     lineHeight: 22,
//   },
//   actionsRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginTop: 20,
//   },
//   likeButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 6,
//     borderWidth: 1,
//     borderColor: "#ccc",
//     borderRadius: 25,
//     paddingHorizontal: 14,
//     paddingVertical: 8,
//   },
//   liked: {
//     backgroundColor: "#fee2e2",
//     borderColor: "#e11d48",
//   },
//   likeText: {
//     fontSize: 15,
//     fontWeight: "500",
//   },
//   errorText: {
//     color: "red",
//     textAlign: "center",
//     padding: 20,
//   },
// });
