import {
  StyleSheet,
  FlatList,
  TextInput,
  View,
  Text,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { Post } from "@/types";
import { PostCard } from "@/components/PostCard";
import { router } from "expo-router";
import { Config } from "@/constants/Config";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { StatusBar } from "expo-status-bar";

export default function ExploreScreen() {
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setPosts([]); // Clear previous

    try {
      // Use the recommendation engine for semantic search!
      // Or we can use a dedicated /search endpoint if it exists.
      // Based on main.py, /recommend can take a query.
      const response = await fetch(`${Config.API_URL}/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: "mobile-search-" + Math.random(),
          user_id: "mobile-user-1",
          query: `Search for: ${query}`, // Hint to the agent?
        }),
      });

      const data = await response.json();
      if (data.recommendations) {
        setPosts(data.recommendations);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-navy-950">
      <StatusBar style="light" />
      <View className="px-4 py-4 border-b border-white/5 bg-navy-900/50">
        <Text className="text-2xl font-serif font-bold text-white mb-4">
          Explore
        </Text>

        {/* Search Bar */}
        <View className="flex-row items-center bg-navy-800 border border-white/10 rounded-xl px-4 py-3">
          <FontAwesome
            name="search"
            size={16}
            color="#64748b"
            style={{ marginRight: 10 }}
          />
          <TextInput
            className="flex-1 text-white text-base"
            placeholder="Search adventures..."
            placeholderTextColor="#64748b"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <FontAwesome
              name="times-circle"
              size={16}
              color="#64748b"
              onPress={() => {
                setQuery("");
                setPosts([]);
              }}
            />
          )}
        </View>
      </View>

      {/* Results */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="px-4 pt-4">
            <PostCard
              post={item}
              onPress={() => router.push(`/post/${item.slug}`)}
            />
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <View className="p-10 items-center">
            {loading ? (
              <ActivityIndicator size="large" color="#fbbf24" />
            ) : (
              <Text className="text-slate-500">
                {query
                  ? "No results found."
                  : "Search for destinations, tips, or vibes."}
              </Text>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}
