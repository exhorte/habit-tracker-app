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
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { ID, Query } from "react-native-appwrite";
import { Swipeable } from "react-native-gesture-handler";
import { Button, Surface, Text } from "react-native-paper";

export default function Index() {
  const { signOut, user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>();
  const [completedHabits, setCompletedHabits] = useState<string[]>();

  const swipeableRefs = useRef<{ [key: string]: Swipeable | null }>({});

  const fetchHabits = useCallback(async () => {
    try {
      const response = await databases.listDocuments<Habit>(
        DATABASE_ID,
        HABITS_COLLECTION_ID,
        [Query.equal("user_id", user?.$id ?? "")],
      );
      console.log(response.documents);
      setHabits(response.documents);
    } catch (error) {
      console.error("Error fetching habits", error);
    }
  }, [user]);

  const fetchTodayCompletions = useCallback(async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const response = await databases.listDocuments<HabitCompletion>(
        DATABASE_ID,
        COMPLETIONS_COLLECTION_ID,
        [
          Query.equal("user_id", user?.$id ?? ""),
          Query.greaterThanEqual("completed_at", today.toISOString()),
        ],
      );

      const completions = response.documents;
      setCompletedHabits(completions.map((c) => c.habit_id));
    } catch (error) {
      console.error("Error fetching completions", error);
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
              `databases.${DATABASE_ID}.collections.${HABITS_COLLECTION_ID}.documents.*.create`,
            ) ||
            response.events.includes(
              `databases.${DATABASE_ID}.collections.${HABITS_COLLECTION_ID}.documents.*.update`,
            ) ||
            response.events.includes(
              `databases.${DATABASE_ID}.collections.${HABITS_COLLECTION_ID}.documents.*.delete`,
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
              `databases.${DATABASE_ID}.collections.${COMPLETIONS_COLLECTION_ID}.documents.*.create`,
            )
          ) {
            fetchTodayCompletions();
          }
        },
      );

      fetchHabits();
      fetchTodayCompletions();

      return () => {
        habitsSubscription();
        completionsSubscription();
      };
    }
  }, [user, fetchHabits, fetchTodayCompletions]);

  const handleDeleteHabit = async (id: string) => {
    // Optimistic update: remove from local state immediately
    setHabits((prev) => prev?.filter((h) => h.$id !== id));
    try {
      await databases.deleteDocument(DATABASE_ID, HABITS_COLLECTION_ID, id);
    } catch (error) {
      console.error(error);
      // Revert on failure
      fetchHabits();
    }
  };

  const handleCompleteHabit = async (id: string) => {
    if (!user || completedHabits?.includes(id)) return;

    const habit = habits?.find((h) => h.$id === id);
    if (!habit) return;

    // Optimistic update: mark as completed and increment streak locally
    setCompletedHabits((prev) => [...(prev ?? []), id]);
    setHabits((prev) =>
      prev?.map((h) =>
        h.$id === id ? { ...h, streak_count: h.streak_count + 1 } : h,
      ),
    );

    try {
      const currentDate = new Date().toISOString();
      await databases.createDocument(
        DATABASE_ID,
        COMPLETIONS_COLLECTION_ID,
        ID.unique(),
        {
          habit_id: id,
          user_id: user.$id,
          completed_at: currentDate,
        },
      );

      await databases.updateDocument(DATABASE_ID, HABITS_COLLECTION_ID, id, {
        streak_count: habit.streak_count + 1,
        last_completed: currentDate,
      });
    } catch (error) {
      console.error(error);
      // Revert on failure
      fetchHabits();
      fetchTodayCompletions();
    }
  };

  const isHabitCompleted = (habitId: string) =>
    completedHabits?.includes(habitId);

  const completedCount = completedHabits?.length ?? 0;
  const totalCount = habits?.length ?? 0;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const renderLeftActions = () => (
    <View style={styles.swipeActionLeft}>
      <MaterialCommunityIcons name="trash-can-outline" size={26} color="#fff" />
      <Text style={styles.swipeLabel}>Delete</Text>
    </View>
  );

  const renderRightActions = (habitId: string) => (
    <View style={styles.swipeActionRight}>
      {isHabitCompleted(habitId) ? (
        <Text style={styles.swipeLabel}>Done!</Text>
      ) : (
        <>
          <MaterialCommunityIcons name="check-circle-outline" size={26} color="#fff" />
          <Text style={styles.swipeLabel}>Complete</Text>
        </>
      )}
    </View>
  );

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Today&apos;s Habits</Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </Text>
        </View>
        <Pressable onPress={signOut} style={styles.signOutBtn}>
          <MaterialCommunityIcons name="logout" size={20} color="#8e8ea0" />
        </Pressable>
      </View>

      {/* Progress Summary */}
      {totalCount > 0 && (
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Daily Progress</Text>
            <Text style={styles.progressPercent}>{progressPercent}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` as any }]} />
          </View>
          <Text style={styles.progressSubtext}>
            {completedCount} of {totalCount} habits completed
          </Text>
        </View>
      )}

      {/* Habit List */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
        {habits?.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrapper}>
              <Text style={styles.emptyEmoji}>🌱</Text>
            </View>
            <Text style={styles.emptyTitle}>No habits yet</Text>
            <Text style={styles.emptySubtext}>
              Start building better habits today!{"\n"}Tap the + tab to create your first one.
            </Text>
          </View>
        ) : (
          habits?.map((habit) => {
            const completed = isHabitCompleted(habit.$id);
            return (
              <Swipeable
                ref={(ref) => { swipeableRefs.current[habit.$id] = ref; }}
                key={habit.$id}
                overshootLeft={false}
                overshootRight={false}
                renderLeftActions={renderLeftActions}
                renderRightActions={() => renderRightActions(habit.$id)}
                onSwipeableOpen={(direction) => {
                  if (direction === "left") {
                    handleDeleteHabit(habit.$id);
                  } else {
                    handleCompleteHabit(habit.$id);
                  }
                  swipeableRefs.current[habit.$id]?.close();
                }}
              >
                <View style={[styles.card, completed && styles.cardCompleted]}>
                  <View style={[styles.cardAccent, completed && styles.cardAccentCompleted]} />
                  <View style={styles.cardBody}>
                    <View style={styles.cardTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.cardTitle, completed && styles.cardTitleCompleted]}>
                          {habit.title}
                        </Text>
                        <Text style={styles.cardDescription}>{habit.description}</Text>
                      </View>
                      {completed && (
                        <View style={styles.checkCircle}>
                          <MaterialCommunityIcons name="check" size={18} color="#fff" />
                        </View>
                      )}
                    </View>
                    <View style={styles.cardFooter}>
                      <View style={styles.streakBadge}>
                        <MaterialCommunityIcons name="fire" size={16} color="#ff9800" />
                        <Text style={styles.streakText}>{habit.streak_count} day streak</Text>
                      </View>
                      <View style={styles.frequencyBadge}>
                        <Text style={styles.frequencyText}>
                          {habit.frequency.charAt(0).toUpperCase() + habit.frequency.slice(1)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </Swipeable>
            );
          })
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 26,
    fontWeight: "800",
    color: "#22223b",
    letterSpacing: 0.3,
  },
  dateText: {
    fontSize: 14,
    color: "#8e8ea0",
    marginTop: 2,
  },
  signOutBtn: {
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

  // Progress
  progressCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f0f0f5",
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6c6c80",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  progressPercent: {
    fontSize: 20,
    fontWeight: "800",
    color: "#7c4dff",
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ede7f6",
    overflow: "hidden",
  },
  progressBarFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#7c4dff",
    minWidth: 8,
  },
  progressSubtext: {
    fontSize: 12,
    color: "#8e8ea0",
    marginTop: 8,
  },

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  // Card
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 18,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f0f0f5",
  },
  cardCompleted: {
    opacity: 0.65,
  },
  cardAccent: {
    width: 5,
    backgroundColor: "#7c4dff",
  },
  cardAccentCompleted: {
    backgroundColor: "#4caf50",
  },
  cardBody: {
    flex: 1,
    padding: 18,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  cardTitle: {
    fontWeight: "700",
    fontSize: 17,
    color: "#22223b",
    marginBottom: 3,
  },
  cardTitleCompleted: {
    textDecorationLine: "line-through",
    color: "#8e8ea0",
  },
  cardDescription: {
    fontSize: 13,
    color: "#8e8ea0",
    lineHeight: 18,
  },
  checkCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#4caf50",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff8e1",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
  },
  streakText: {
    color: "#e65100",
    fontWeight: "700",
    fontSize: 12,
  },
  frequencyBadge: {
    backgroundColor: "#f3eeff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  frequencyText: {
    color: "#7c4dff",
    fontWeight: "700",
    fontSize: 12,
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
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

  // Swipe Actions
  swipeActionLeft: {
    backgroundColor: "#ef5350",
    justifyContent: "center",
    alignItems: "center",
    width: 90,
    borderRadius: 18,
    marginBottom: 14,
    gap: 4,
  },
  swipeActionRight: {
    backgroundColor: "#4caf50",
    justifyContent: "center",
    alignItems: "center",
    width: 90,
    borderRadius: 18,
    marginBottom: 14,
    gap: 4,
  },
  swipeLabel: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
});

