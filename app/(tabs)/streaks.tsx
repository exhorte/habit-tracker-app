import {
  client,
  COMPLETIONS_COLLECTION_ID,
  DATABASE_ID,
  databases,
  HABITS_COLLECTION_ID,
  RealtimeResponse,
} from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { Habit, HabitCompletion } from "@/types/database.type";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Query } from "react-native-appwrite";
import { Card, Text } from "react-native-paper";

export default function StreaksScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completedHabits, setCompletedHabits] = useState<HabitCompletion[]>([]);
  const { user } = useAuth();

  const fetchHabits = useCallback(async () => {
    try {
      const response = await databases.listDocuments<Habit>(
        DATABASE_ID,
        HABITS_COLLECTION_ID,
        [Query.equal("user_id", user?.$id ?? "")],
      );
      setHabits(response.documents);
    } catch (error) {
      console.error(error);
    }
  }, [user]);

  const fetchCompletions = useCallback(async () => {
    try {
      const response = await databases.listDocuments<HabitCompletion>(
        DATABASE_ID,
        COMPLETIONS_COLLECTION_ID,
        [Query.equal("user_id", user?.$id ?? "")],
      );
      setCompletedHabits(response.documents);
    } catch (error) {
      console.error(error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const habitsChannel = `databases.${DATABASE_ID}.collections.${HABITS_COLLECTION_ID}.documents`;
      const habitsSubscription = client.subscribe(
        habitsChannel,
        (response: RealtimeResponse) => {
          if (
            response.events.includes(
              "databases.*.collections.*.documents.*.create",
            ) ||
            response.events.includes(
              "databases.*.collections.*.documents.*.update",
            ) ||
            response.events.includes(
              "databases.*.collections.*.documents.*.delete",
            )
          ) {
            fetchHabits();
          }
        },
      );

      const completionsChannel = `databases.${DATABASE_ID}.collections.${COMPLETIONS_COLLECTION_ID}.documents`;
      const completionsSubscription = client.subscribe(
        completionsChannel,
        (response: RealtimeResponse) => {
          if (
            response.events.includes(
              "databases.*.collections.*.documents.*.create",
            )
          ) {
            fetchCompletions();
          }
        },
      );

      fetchHabits();
      fetchCompletions();

      return () => {
        habitsSubscription();
        completionsSubscription();
      };
    }
  }, [user, fetchHabits, fetchCompletions]);

  interface StreakData {
    streak: number;
    bestStreak: number;
    total: number;
  }

  const getStreakData = (habitId: string): StreakData => {
    const habitCompletions = completedHabits
      ?.filter((c) => c.habit_id === habitId)
      .sort(
        (a, b) =>
          new Date(a.completed_at).getTime() -
          new Date(b.completed_at).getTime(),
      );

    if (habitCompletions?.length === 0) {
      return { streak: 0, bestStreak: 0, total: 0 };
    }

    // build streak data
    let streak = 0;
    let bestStreak = 0;
    let total = habitCompletions.length;

    let lastDate: Date | null = null;
    let currentStreak = 0;

    habitCompletions?.forEach((c) => {
      const date = new Date(c.completed_at);
      if (lastDate) {
        const diff =
          (date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);

        if (diff <= 1.5) {
          currentStreak += 1;
        } else {
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }

      if (currentStreak > bestStreak) bestStreak = currentStreak;
      streak = currentStreak;
      lastDate = date;
    });

    return { streak, bestStreak, total };
  };

  const habitStreaks = habits.map((habit) => {
    const { streak, bestStreak, total } = getStreakData(habit.$id);
    return { habit, bestStreak, streak, total };
  });

  const rankedHabits = habitStreaks.sort((a, b) => b.bestStreak - a.bestStreak);

  const badgeEmojis = ["🥇", "🥈", "🥉"];

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleWrapper}>
          <Text style={styles.headerTitle}>Habit Streaks</Text>
          <Text style={styles.headerSubtitle}>Celebrate your consistency</Text>
        </View>
        <View style={styles.fireIconWrapper}>
          <MaterialCommunityIcons name="fire" size={26} color="#7c4dff" />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Top Streaks Leaderboard */}
        {rankedHabits.length > 0 && (
          <View style={styles.leaderboardCard}>
            <Text style={styles.leaderboardTitle}>🏆 Leaderboard</Text>
            {rankedHabits.slice(0, 3).map((item, index) => (
              <View key={item.habit.$id} style={[styles.leaderboardRow, index === 2 && styles.lastLeaderboardRow]}>
                <Text style={styles.leaderboardEmoji}>{badgeEmojis[index]}</Text>
                <View style={styles.leaderboardInfo}>
                  <Text style={styles.leaderboardHabitTitle} numberOfLines={1}>{item.habit.title}</Text>
                  <Text style={styles.leaderboardHabitStreak}>{item.bestStreak} days best</Text>
                </View>
                <View style={styles.leaderboardBadge}>
                  <MaterialCommunityIcons name="fire" size={14} color="#ff9800" />
                  <Text style={styles.leaderboardBadgeText}>{item.streak}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* List Header */}
        <Text style={styles.sectionTitle}>All Habits</Text>

        {habits.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrapper}>
              <Text style={styles.emptyEmoji}>📈</Text>
            </View>
            <Text style={styles.emptyTitle}>No habits recorded</Text>
            <Text style={styles.emptySubtext}>
              Once you add habits and mark them complete, your streak statistics will appear here!
            </Text>
          </View>
        ) : (
          rankedHabits.map(({ habit, streak, bestStreak, total }) => (
            <Card key={habit.$id} style={styles.habitCard}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Text style={styles.habitTitle}>{habit.title}</Text>
                  <View style={styles.smallFrequencyBadge}>
                    <Text style={styles.smallFrequencyText}>{habit.frequency}</Text>
                  </View>
                </View>
                <Text style={styles.habitDescription}>{habit.description}</Text>
                
                {/* Streak Stats Grid */}
                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statEmoji}>🔥</Text>
                    <Text style={styles.statValue}>{streak}</Text>
                    <Text style={styles.statLabel}>Current</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statEmoji}>🏆</Text>
                    <Text style={styles.statValue}>{bestStreak}</Text>
                    <Text style={styles.statLabel}>Best</Text>
                  </View>
                  <View style={[styles.statBox, styles.lastStatBox]}>
                    <Text style={styles.statEmoji}>✅</Text>
                    <Text style={styles.statValue}>{total}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  headerTitleWrapper: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#22223b",
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#8e8ea0",
    marginTop: 2,
  },
  fireIconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  // Leaderboard Card
  leaderboardCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f0f0f5",
    marginBottom: 24,
  },
  leaderboardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#6c6c80",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  leaderboardRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f5",
  },
  lastLeaderboardRow: {
    borderBottomWidth: 0,
    paddingBottom: 4,
  },
  leaderboardEmoji: {
    fontSize: 24,
    marginRight: 14,
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardHabitTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#22223b",
  },
  leaderboardHabitStreak: {
    fontSize: 12,
    color: "#8e8ea0",
    marginTop: 2,
  },
  leaderboardBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff3e0",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 3,
  },
  leaderboardBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ff9800",
  },

  // Section Title
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#6c6c80",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 14,
    marginLeft: 2,
  },

  // Habit Card
  habitCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f0f0f5",
  },
  cardContent: {
    padding: 18,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  habitTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#22223b",
    flex: 1,
    marginRight: 8,
  },
  smallFrequencyBadge: {
    backgroundColor: "#f3eeff",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  smallFrequencyText: {
    fontSize: 11,
    color: "#7c4dff",
    fontWeight: "700",
    textTransform: "capitalize",
  },
  habitDescription: {
    fontSize: 13,
    color: "#8e8ea0",
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },

  // Stats Row
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#fafafd",
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#f0f0f5",
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#edeef4",
  },
  lastStatBox: {
    borderRightWidth: 0,
  },
  statEmoji: {
    fontSize: 16,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#22223b",
  },
  statLabel: {
    fontSize: 10,
    color: "#8e8ea0",
    fontWeight: "600",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#ede7f6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  emptyEmoji: {
    fontSize: 38,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#22223b",
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#8e8ea0",
    textAlign: "center",
    lineHeight: 20,
  },
});
