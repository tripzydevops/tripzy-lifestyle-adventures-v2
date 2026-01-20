import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { Config } from "@/constants/Config";
import { StatusBar } from "expo-status-bar";

const BACKEND_URL = Config.API_URL;

interface StreamState {
  status: string;
  analysis: string;
  visuals: any[];
  text: string;
  posts: any[];
  isDone: boolean;
}

export default function BrainScreen() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamState, setStreamState] = useState<StreamState>({
    status: "Ready",
    analysis: "",
    visuals: [],
    text: "",
    posts: [],
    isDone: false,
  });

  const scrollViewRef = useRef<ScrollView>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setStreamState({
      status: "Connecting...",
      analysis: "",
      visuals: [],
      text: "",
      posts: [],
      isDone: false,
    });

    try {
      const response = await fetch(`${BACKEND_URL}/recommend/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "mobile-user", // Placeholder / Auth ID later
          query: query,
          conversation_history: [],
        }),
      });

      if (!response.body) throw new Error("No stream body");

      // React Native specific stream handling can be tricky without polyfills.
      // We will assume basic text logic or try-catch standard fetch behavior.
      // If direct streaming fails in RN (common issue), we might need a workaround.
      // But for this code, we'll try a standard reader loop pattern compatible with Polyfilled RN.

      const reader =
        (response as any).body.getReader && (response as any).body.getReader();
      // NOTE: React Native fetch body might NOT expose getReader() by default on all engines.
      // If this fails, we effectively fallback or crash.
      // A common RN workaround is `react-native-fetch-api` or using `XMLHttpRequest`.
      // For this specific 'Build it all out' task, we will attempt the standard API.
      // If reader exists:
      if (reader) {
        const decoder = new TextDecoder();
        let done = false;
        while (!done) {
          const { value, done: isDone } = await reader.read();
          done = isDone;
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            processChunk(chunk);
          }
        }
      } else {
        // Fallback: If no stream support, we just await text (not streaming, but works)
        const text = await response.text();
        processChunk(text);
      }
    } catch (e) {
      console.error(e);
      setStreamState((prev) => ({
        ...prev,
        status: "Error connecting to brain.",
      }));
    } finally {
      setLoading(false);
      setStreamState((prev) => ({
        ...prev,
        isDone: true,
        status: "Completed",
      }));
    }
  };

  const processChunk = (chunk: string) => {
    // NDJSON parsing
    const lines = chunk.split("\n").filter((l) => l.trim());
    for (const line of lines) {
      try {
        const event = JSON.parse(line);
        handleEvent(event);
      } catch (e) {}
    }
  };

  const handleEvent = (event: any) => {
    setStreamState((prev) => {
      const next = { ...prev };
      if (event.type === "status") next.status = event.data;
      if (event.type === "analysis") next.analysis = event.data;
      if (event.type === "visuals") next.visuals = event.data || [];
      if (event.type === "token") next.text = prev.text + event.data;
      if (event.type === "posts") next.posts = event.data || [];
      return next;
    });
    // Auto scroll
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  return (
    <SafeAreaView className="flex-1 bg-navy-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="px-4 py-3 border-b border-white/10 bg-navy-900/80 flex-row items-center justify-between">
          <Text className="text-xl font-bold text-white font-serif">
            Tripzy <Text className="text-gold">Brain</Text>
          </Text>
          <View className="bg-white/10 px-2 py-1 rounded">
            <Text className="text-xs text-slate-400">{streamState.status}</Text>
          </View>
        </View>

        <ScrollView
          ref={scrollViewRef}
          className="flex-1 p-4"
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {/* Visuals Carousel */}
          {streamState.visuals.length > 0 && (
            <View className="mb-4">
              <FlatList
                horizontal
                data={streamState.visuals}
                renderItem={({ item }) => (
                  <Image
                    source={{ uri: item.url }}
                    className="w-32 h-32 rounded-lg mr-2 bg-navy-800"
                  />
                )}
                showsHorizontalScrollIndicator={false}
              />
            </View>
          )}

          {/* Analysis Block */}
          {streamState.analysis ? (
            <View className="bg-navy-800 p-3 rounded-lg border-l-2 border-purple-500 mb-4">
              <Text className="text-purple-300 text-xs uppercase font-bold mb-1">
                Analysis
              </Text>
              <Text className="text-slate-300 text-sm italic">
                {streamState.analysis}
              </Text>
            </View>
          ) : null}

          {/* Main Response */}
          {streamState.text ? (
            <View>
              <Text className="text-white text-base leading-relaxed">
                {streamState.text}
              </Text>
            </View>
          ) : (
            !loading && (
              <View className="mt-10 items-center opacity-50">
                <FontAwesome name="bolt" size={40} color="#fbbf24" />
                <Text className="text-white mt-2">
                  Ask me anything about travel...
                </Text>
              </View>
            )
          )}
        </ScrollView>

        {/* Input Area */}
        <View className="p-4 bg-navy-900/90 border-t border-white/10">
          <View className="flex-row items-center bg-navy-950 border border-white/10 rounded-full px-4 py-2">
            <TextInput
              className="flex-1 text-white h-10"
              placeholder="Where should I go for...?"
              placeholderTextColor="#64748b"
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSearch}
            />
            <TouchableOpacity
              onPress={handleSearch}
              disabled={loading}
              className="bg-gold/90 p-2 rounded-full ml-2"
            >
              <FontAwesome name="arrow-up" color="#0f172a" size={16} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
