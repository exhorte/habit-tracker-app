import { DATABASE_ID, databases, HABITS_COLLECTION_ID } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { ID } from "react-native-appwrite";
import { Text, TextInput } from "react-native-paper";

const FREQUENCIES = [
  { value: "daily", label: "Daily", icon: "calendar-today", emoji: "📅" },
  { value: "weekly", label: "Weekly", icon: "calendar-week", emoji: "📆" },
  { value: "monthly", label: "Monthly", icon: "calendar-month", emoji: "🗓️" },
] as const;

type Frequency = (typeof FREQUENCIES)[number]["value"];

export default function AddHabitScreen() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("daily");
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!user || isSubmitting) return;
    setIsSubmitting(true);

    try {
      await databases.createDocument(
        DATABASE_ID,
        HABITS_COLLECTION_ID,
        ID.unique(),
        {
          user_id: user.$id,
          title,
          description,
          frequency,
          streak_count: 0,
          last_completed: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
      );

      // Reset form fields before navigating back (tabs keep screens mounted)
      setTitle("");
      setDescription("");
      setFrequency("daily");
      setError("");
      router.back();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("There was an error creating the habit. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = title.trim().length > 0 && description.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero Header */}
        <View style={styles.heroContainer}>
          <View style={styles.heroIconWrapper}>
            <Text style={styles.heroEmoji}>✨</Text>
          </View>
          <Text style={styles.heroTitle}>New Habit</Text>
          <Text style={styles.heroSubtitle}>
            Build a better you, one habit at a time
          </Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          {/* Title Input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Habit Name</Text>
            <TextInput
              placeholder="e.g. Morning meditation"
              mode="outlined"
              value={title}
              onChangeText={setTitle}
              style={styles.input}
              outlineStyle={styles.inputOutline}
              outlineColor="#e8e8ed"
              activeOutlineColor="#7c4dff"
              placeholderTextColor="#b0b0c0"
              left={
                <TextInput.Icon
                  icon="lightning-bolt"
                  color="#7c4dff"
                  size={20}
                />
              }
            />
          </View>

          {/* Description Input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              placeholder="Why is this habit important to you?"
              mode="outlined"
              value={description}
              onChangeText={setDescription}
              style={[styles.input, styles.textArea]}
              outlineStyle={styles.inputOutline}
              outlineColor="#e8e8ed"
              activeOutlineColor="#7c4dff"
              placeholderTextColor="#b0b0c0"
              multiline
              numberOfLines={3}
              left={
                <TextInput.Icon
                  icon="text-box-outline"
                  color="#7c4dff"
                  size={20}
                />
              }
            />
          </View>

          {/* Frequency Selector */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Frequency</Text>
            <View style={styles.frequencyRow}>
              {FREQUENCIES.map((freq) => {
                const isSelected = frequency === freq.value;
                return (
                  <Pressable
                    key={freq.value}
                    onPress={() => setFrequency(freq.value)}
                    style={[
                      styles.frequencyCard,
                      isSelected && styles.frequencyCardSelected,
                    ]}
                  >
                    <View
                      style={[
                        styles.frequencyIconWrapper,
                        isSelected && styles.frequencyIconWrapperSelected,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={freq.icon as any}
                        size={24}
                        color={isSelected ? "#fff" : "#7c4dff"}
                      />
                    </View>
                    <Text
                      style={[
                        styles.frequencyLabel,
                        isSelected && styles.frequencyLabelSelected,
                      ]}
                    >
                      {freq.label}
                    </Text>
                    {isSelected && (
                      <View style={styles.frequencyCheck}>
                        <MaterialCommunityIcons
                          name="check-circle"
                          size={16}
                          color="#7c4dff"
                        />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* Error Message */}
        {error !== "" && (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={18}
              color="#e53935"
            />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Submit Button */}
        <Pressable
          onPress={handleSubmit}
          disabled={!isFormValid || isSubmitting}
          style={({ pressed }) => [
            styles.submitButton,
            !isFormValid && styles.submitButtonDisabled,
            pressed && isFormValid && styles.submitButtonPressed,
          ]}
        >
          <MaterialCommunityIcons
            name={isSubmitting ? "loading" : "plus-circle-outline"}
            size={22}
            color="#fff"
          />
          <Text style={styles.submitButtonText}>
            {isSubmitting ? "Creating..." : "Create Habit"}
          </Text>
        </Pressable>

        {/* Motivational footer */}
        <Text style={styles.footerText}>
          🚀 It takes 21 days to build a habit — start today!
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // Hero
  heroContainer: {
    alignItems: "center",
    marginBottom: 28,
    marginTop: 8,
  },
  heroIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#ede7f6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    shadowColor: "#7c4dff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  heroEmoji: {
    fontSize: 34,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#22223b",
    letterSpacing: 0.3,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#8e8ea0",
    marginTop: 4,
    letterSpacing: 0.2,
  },

  // Card
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f0f0f5",
  },

  // Fields
  fieldGroup: {
    marginBottom: 22,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6c6c80",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 2,
  },
  input: {
    backgroundColor: "#fafafd",
    fontSize: 15,
  },
  inputOutline: {
    borderRadius: 14,
    borderWidth: 1.5,
  },
  textArea: {
    minHeight: 80,
  },

  // Frequency
  frequencyRow: {
    flexDirection: "row",
    gap: 10,
  },
  frequencyCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: "#fafafd",
    borderWidth: 1.5,
    borderColor: "#e8e8ed",
    position: "relative",
  },
  frequencyCardSelected: {
    borderColor: "#7c4dff",
    backgroundColor: "#f3eeff",
    shadowColor: "#7c4dff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  frequencyIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#ede7f6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  frequencyIconWrapperSelected: {
    backgroundColor: "#7c4dff",
  },
  frequencyLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6c6c80",
  },
  frequencyLabelSelected: {
    color: "#7c4dff",
    fontWeight: "700",
  },
  frequencyCheck: {
    position: "absolute",
    top: 8,
    right: 8,
  },

  // Error
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fdecea",
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    gap: 8,
  },
  errorText: {
    color: "#e53935",
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },

  // Submit
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7c4dff",
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 24,
    gap: 10,
    shadowColor: "#7c4dff",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  submitButtonPressed: {
    backgroundColor: "#6a3de8",
    transform: [{ scale: 0.98 }],
  },
  submitButtonDisabled: {
    backgroundColor: "#c5b8e8",
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  // Footer
  footerText: {
    textAlign: "center",
    color: "#b0b0c0",
    fontSize: 13,
    marginTop: 20,
    letterSpacing: 0.2,
  },
});
