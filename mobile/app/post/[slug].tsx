import {
  View,
  Text,
  ScrollView,
  Image,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Post } from "@/types";
import RenderHtml from "react-native-render-html";

export default function PostDetailScreen() {
  const { slug } = useLocalSearchParams();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const { width } = useWindowDimensions();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .schema("blog")
          .from("posts")
          .select("*")
          .eq("slug", slug)
          .single();

        if (error) {
          console.error("Error fetching post:", error);
        } else if (data) {
          // Map Logic
          const mappedPost: Post = {
            id: data.id,
            title: data.title,
            slug: data.slug,
            content: data.content,
            excerpt: data.excerpt,
            featuredMediaUrl: data.featured_image,
            featuredMediaType: data.youtube_url ? "video" : "image",
            category: data.category,
            tags: data.tags || [],
            authorId: data.author_id,
            status: data.status,
            publishedAt: data.published_at,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            views: data.views,
            intelligenceMetadata: data.metadata,
          };
          setPost(mappedPost);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <View className="flex-1 bg-navy-950 items-center justify-center">
        <ActivityIndicator size="large" color="#fbbf24" />
      </View>
    );
  }

  if (!post) {
    return (
      <View className="flex-1 bg-navy-950 items-center justify-center">
        <Text className="text-white">Post not found.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: post.category,
          headerStyle: { backgroundColor: "#0f172a" },
          headerTintColor: "#fff",
        }}
      />
      <ScrollView className="flex-1 bg-navy-950">
        {/* Hero Image */}
        <Image
          source={{ uri: post.featuredMediaUrl }}
          className="w-full h-64 bg-navy-900"
          resizeMode="cover"
        />

        <View className="p-5">
          {/* Header */}
          <View className="mb-6">
            <Text className="text-gold text-xs font-bold uppercase tracking-widest mb-2">
              {new Date(post.createdAt).toLocaleDateString()} • {post.category}
            </Text>
            <Text className="text-3xl text-white font-serif font-bold leading-tight">
              {post.title}
            </Text>
          </View>

          {/* Content */}
          <View className="bg-white/5 p-4 rounded-xl">
            <RenderHtml
              contentWidth={width - 40} // padding * 2
              source={{ html: post.content }}
              tagsStyles={{
                p: {
                  color: "#cbd5e1",
                  lineHeight: 24,
                  marginBottom: 16,
                  fontSize: 16,
                },
                h1: {
                  color: "#fff",
                  fontSize: 24,
                  fontWeight: "bold",
                  marginTop: 10,
                  marginBottom: 10,
                },
                h2: {
                  color: "#fbbf24",
                  fontSize: 22,
                  fontWeight: "bold",
                  marginTop: 20,
                  marginBottom: 10,
                },
                h3: {
                  color: "#fff",
                  fontSize: 20,
                  fontWeight: "bold",
                  marginTop: 15,
                  marginBottom: 8,
                },
                li: { color: "#cbd5e1", marginBottom: 5 },
                strong: { color: "#fbbf24" },
              }}
            />
          </View>
        </View>
      </ScrollView>
    </>
  );
}
