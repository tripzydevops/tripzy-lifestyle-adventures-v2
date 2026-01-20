import {
  StyleSheet,
  FlatList,
  RefreshControl,
  Text,
  View,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState, useCallback } from "react";
import { Post, RecommendationResponse } from "@/types";
import { PostCard } from "@/components/PostCard";
import { router } from "expo-router";
import { Config } from "@/constants/Config";
import { StatusBar } from "expo-status-bar";

export default function TabOneScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [persona, setPersona] = useState<string | null>(null);
  const [reasoning, setReasoning] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    try {
      setLoading(true);

      // Generate a random session ID if not stored
      // In a real app, use AsyncStorage to persist this
      const sessionId =
        "mobile-session-" + Math.random().toString(36).substring(7);
      const userId = "mobile-user-1"; // Mock user ID for now

      console.log(`Fetching from: ${Config.API_URL}/recommend`);

      const response = await fetch(`${Config.API_URL}/recommend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          user_id: userId,
          query: "", // Empty query triggers Cold Start / Default Persona
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data: RecommendationResponse = await response.json();

      setPosts(data.recommendations);
      setPersona(data.persona);
      setReasoning(data.reasoning);
    } catch (e) {
      console.error("Error fetching recommendations:", e);
      // Fallback: Could fetch from Supabase here if API fails, but for now we show empty/error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRecommendations();
  };

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return (
    <SafeAreaView className="flex-1 bg-navy-950">
      <StatusBar style="light" />

      {/* Header */}
      <View className="px-4 py-4 border-b border-white/5 bg-navy-900/50 flex-row justify-between items-center">
        <View>
          <Text className="text-2xl font-serif font-bold text-white">
            Tripzy<Text className="text-gold">.</Text>
          </Text>
          <Text className="text-slate-400 text-xs uppercase tracking-widest">
            Lifestyle Adventures
          </Text>
        </View>
        {persona && (
          <View className="bg-navy-800 px-3 py-1 rounded-full border border-white/10">
            <Text className="text-gold text-xs font-bold">{persona}</Text>
          </View>
        )}
      </View>

      {/* Feed */}
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fbbf24" // Gold color
            colors={["#fbbf24"]} // Android
          />
        }
        ListHeaderComponent={
          reasoning ? (
            <View className="px-4 py-4 bg-navy-900 border-b border-white/5 mb-2">
              <Text className="text-slate-400 text-xs uppercase font-bold mb-1">
                AI Insight
              </Text>
              <Text className="text-white/80 text-sm italic leading-relaxed">
                "{reasoning}"
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View className="p-10 items-center">
              <Text className="text-white/50">No stories found.</Text>
            </View>
          ) : (
            <View className="py-20 items-center">
              <ActivityIndicator size="large" color="#fbbf24" />
              <Text className="text-slate-400 mt-4 text-sm">
                Curating your adventure...
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}
