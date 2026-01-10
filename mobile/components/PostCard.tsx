import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { Post } from "../types";

interface PostCardProps {
  post: Post;
  onPress: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      className="bg-navy-800 rounded-xl overflow-hidden mb-6 border border-white/10 shadow-lg"
    >
      {/* Image Container */}
      <View className="h-48 w-full bg-navy-900 relative">
        <Image
          source={{ uri: post.featuredMediaUrl }}
          className="w-full h-full object-cover"
          alt={post.title}
        />
        <View className="absolute top-3 left-3 bg-navy-950/80 px-3 py-1 rounded-full border border-gold/50">
          <Text className="text-gold text-xs font-bold uppercase tracking-wider">
            {post.category}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View className="p-4">
        {/* Meta */}
        {post.intelligenceMetadata?.lifestyleVibe && (
          <View className="flex-row items-center mb-2">
            <Text className="text-xs text-white/60 bg-white/10 px-2 py-0.5 rounded mr-2">
              ✨ {post.intelligenceMetadata?.lifestyleVibe}
            </Text>
          </View>
        )}

        <Text className="text-white text-xl font-bold mb-2 leading-tight font-serif">
          {post.title}
        </Text>

        <Text
          className="text-slate-400 text-sm leading-relaxed"
          numberOfLines={2}
        >
          {post.excerpt}
        </Text>

        <View className="mt-4 flex-row items-center justify-between border-t border-white/5 pt-3">
          <Text className="text-xs text-slate-500">
            {new Date(post.createdAt).toLocaleDateString()}
          </Text>
          <Text className="text-gold font-bold text-sm">Read Story &rarr;</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};
