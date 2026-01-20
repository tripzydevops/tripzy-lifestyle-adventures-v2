import {
  StyleSheet,
  TextInput,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { Config } from "@/constants/Config";
import { StatusBar } from "expo-status-bar";

export default function PlanTripScreen() {
  const [destination, setDestination] = useState("");
  const [budget, setBudget] = useState("");
  const [itinerary, setItinerary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePlan = async () => {
    if (!destination || !budget) return;
    setLoading(true);
    setItinerary(null);

    try {
      // Logic borrowed from FrontEnd PlanTripPage
      const prompt = `Plan a trip to ${destination} with a budget of ${budget}. Provide a day-by-day itinerary.`;

      const response = await fetch(`${Config.API_URL}/recommend`, {
        // Or a specific plan endpoint if we had one
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: "mobile-plan-" + Math.random(),
          user_id: "mobile-user-1",
          query: prompt,
        }),
      });

      const data = await response.json();
      // The reasoning/analysis usually contains the textual plan if request was general
      if (data.reasoning || data.analysis) {
        setItinerary(
          data.reasoning || "Here are some recommendations based on your plan.",
        );
      }
    } catch (e) {
      console.error(e);
      setItinerary("Failed to generate plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-navy-950">
      <StatusBar style="light" />
      <ScrollView className="flex-1 p-4">
        <Text className="text-3xl font-serif font-bold text-white mb-2">
          Plan Your <Text className="text-gold">Trip</Text>
        </Text>
        <Text className="text-slate-400 mb-8">
          Let AI design your perfect itinerary.
        </Text>

        <View className="space-y-4 mb-8">
          <View>
            <Text className="text-white mb-2 font-bold">Destination</Text>
            <TextInput
              className="bg-navy-800 border border-white/10 text-white p-4 rounded-xl"
              placeholder="e.g. Paris, Tokyo, Bali"
              placeholderTextColor="#64748b"
              value={destination}
              onChangeText={setDestination}
            />
          </View>

          <View>
            <Text className="text-white mb-2 font-bold">Budget (USD)</Text>
            <TextInput
              className="bg-navy-800 border border-white/10 text-white p-4 rounded-xl"
              placeholder="e.g. 2000"
              placeholderTextColor="#64748b"
              value={budget}
              onChangeText={setBudget}
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity
            onPress={handlePlan}
            disabled={loading}
            className="bg-gold p-4 rounded-xl items-center mt-4"
          >
            {loading ? (
              <ActivityIndicator color="#0f172a" />
            ) : (
              <Text className="text-navy-950 font-bold text-lg">
                Generate Itinerary
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {itinerary && (
          <View className="bg-navy-900 border border-white/10 rounded-xl p-6 mb-10">
            <Text className="text-gold font-bold mb-4 uppercase text-xs tracking-wider">
              Your Itinerary
            </Text>
            <Text className="text-slate-300 leading-relaxed">{itinerary}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
