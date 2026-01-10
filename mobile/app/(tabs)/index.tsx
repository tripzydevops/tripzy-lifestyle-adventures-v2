import { StyleSheet, FlatList, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Post } from "@/types";
import { PostCard } from "@/components/PostCard";
import { router } from "expo-router";

export default function TabOneScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setLoading(true);
      const { data, error } = await supabase
        .schema("blog")
        .from("posts")
        .select("*")
        .eq("status", "published") // published is lowercase in DB usually
        .order("published_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Error fetching posts:", error);
      } else {
        // Map DB columns to Post interface
        const mappedPosts: Post[] = data.map((d: any) => ({
          id: d.id,
          title: d.title,
          slug: d.slug,
          content: d.content,
          excerpt: d.excerpt,
          featuredMediaUrl: d.featured_image,
          featuredMediaType: d.youtube_url ? "video" : "image",
          category: d.category,
          tags: d.tags || [],
          authorId: d.author_id,
          status: d.status,
          publishedAt: d.published_at,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
          views: d.views,
          intelligenceMetadata: d.metadata,
        }));
        setPosts(mappedPosts);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-navy-950">
      {/* Header */}
      <View className="px-4 py-4 border-b border-white/5 bg-navy-900/50">
        <Text className="text-2xl font-serif font-bold text-white">
          Tripzy<Text className="text-gold">.</Text>
        </Text>
        <Text className="text-slate-400 text-xs uppercase tracking-widest">
          Lifestyle Adventures
        </Text>
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
            tintColor="#fbbf24"
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View className="p-10 items-center">
              <Text className="text-white/50">No stories found.</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
