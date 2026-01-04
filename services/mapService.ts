import { supabase } from "../lib/supabase";
import { MapItem } from "../types";

const mapMapFromSupabase = (data: any): MapItem => ({
  id: data.id,
  postId: data.post_id,
  name: data.name,
  type: data.type,
  centerLat: Number(data.center_lat),
  centerLng: Number(data.center_lng),
  zoom: data.zoom,
  mapStyle: data.map_style,
  data: data.data,
  createdAt: data.created_at,
});

export const mapService = {
  async getMapsByPostId(postId: string): Promise<MapItem[]> {
    const { data, error } = await supabase
      .schema("blog")
      .from("maps")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Supabase Error (getMapsByPostId):", error);
      return [];
    }

    return data.map(mapMapFromSupabase);
  },

  async addMap(map: Omit<MapItem, "id" | "createdAt">): Promise<MapItem> {
    const supabaseData = {
      post_id: map.postId,
      name: map.name,
      type: map.type,
      center_lat: map.centerLat,
      center_lng: map.centerLng,
      zoom: map.zoom,
      map_style: map.mapStyle,
      data: map.data,
    };

    const { data, error } = await supabase
      .schema("blog")
      .from("maps")
      .insert([supabaseData])
      .select()
      .single();

    if (error) {
      console.error("Supabase Error (addMap):", error);
      throw error;
    }

    return mapMapFromSupabase(data);
  },

  async updateMap(id: string, updates: Partial<MapItem>): Promise<MapItem> {
    const supabaseUpdates: any = {};
    if (updates.name) supabaseUpdates.name = updates.name;
    if (updates.type) supabaseUpdates.type = updates.type;
    if (updates.centerLat) supabaseUpdates.center_lat = updates.centerLat;
    if (updates.centerLng) supabaseUpdates.center_lng = updates.centerLng;
    if (updates.zoom) supabaseUpdates.zoom = updates.zoom;
    if (updates.mapStyle) supabaseUpdates.map_style = updates.mapStyle;
    if (updates.data) supabaseUpdates.data = updates.data;

    const { data, error } = await supabase
      .schema("blog")
      .from("maps")
      .update(supabaseUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase Error (updateMap):", error);
      throw error;
    }

    return mapMapFromSupabase(data);
  },

  async deleteMap(id: string): Promise<void> {
    const { error } = await supabase
      .schema("blog")
      .from("maps")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Supabase Error (deleteMap):", error);
      throw error;
    }
  },

  subscribeToMaps(postId: string, onUpdate: () => void) {
    return supabase
      .channel(`blog-maps-${postId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "blog",
          table: "maps",
          filter: `post_id=eq.${postId}`,
        },
        () => {
          onUpdate();
        }
      )
      .subscribe();
  },
};
