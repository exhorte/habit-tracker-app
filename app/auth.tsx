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
import { Text, TextInput } from "react-native-paper";

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const router = useRouter();
  const { signUp, signIn } = useAuth();

  const handleSwitchMode = () => {
    setIsSignUp((prev) => !prev);
    setError(null);
  };

  const handleAuth = async () => {
    if (!email || !password) {
      setError("Please fill in all the fields");
      return;
    }

    if (password.length < 6) {
      setError("Passwords must be at least 6 characters long.");
      return;
    }
    
    setError(null);
    setIsSubmitting(true);

    try {
      if (isSignUp) {
        const signUpError = await signUp(email, password);
        if (signUpError) {
          setError(signUpError);
          setIsSubmitting(false);
          return;
        }
      } else {
        const signInError = await signIn(email, password);
        if (signInError) {
          setError(signInError);
          setIsSubmitting(false);
          return;
        }
      }
      router.replace("/");
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = email.trim().length > 0 && password.length >= 6;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.screen}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand/Hero Section */}
        <View style={styles.brandContainer}>
          <View style={styles.logoWrapper}>
            <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={42} color="#7c4dff" />
          </View>
          <Text style={styles.brandName}>HabitTracker</Text>
          <Text style={styles.brandSubtitle}>Consistency is the key to success</Text>
        </View>

        {/* Auth Form Card */}
        <View style={styles.card}>
          <Text style={styles.formTitle}>
            {isSignUp ? "Create Account" : "Welcome Back"}
          </Text>
          
          {/* Email field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email Address</Text>
            <TextInput
              placeholder="name@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              outlineColor="#e8e8ed"
              activeOutlineColor="#7c4dff"
              placeholderTextColor="#b0b0c0"
              left={
                <TextInput.Icon
                  icon="email-outline"
                  color="#7c4dff"
                  size={20}
                />
              }
            />
          </View>

          {/* Password field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Password</Text>
            <TextInput
              placeholder="••••••••"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              outlineColor="#e8e8ed"
              activeOutlineColor="#7c4dff"
              placeholderTextColor="#b0b0c0"
              left={
                <TextInput.Icon
                  icon="lock-outline"
                  color="#7c4dff"
                  size={20}
                />
              }
            />
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={18}
                color="#e53935"
              />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Action Button */}
          <Pressable
            onPress={handleAuth}
            disabled={!isFormValid || isSubmitting}
            style={({ pressed }) => [
              styles.submitButton,
              (!isFormValid || isSubmitting) && styles.submitButtonDisabled,
              pressed && isFormValid && !isSubmitting && styles.submitButtonPressed,
            ]}
          >
            <MaterialCommunityIcons
              name={isSubmitting ? "loading" : isSignUp ? "account-plus-outline" : "login"}
              size={20}
              color="#fff"
            />
            <Text style={styles.submitButtonText}>
              {isSubmitting ? "Processing..." : isSignUp ? "Sign Up" : "Sign In"}
            </Text>
          </Pressable>
        </View>

        {/* Switch Auth Mode Mode button */}
        <Pressable onPress={handleSwitchMode} style={styles.switchModeContainer}>
          <Text style={styles.switchModeText}>
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <Text style={styles.switchModeHighlight}>
              {isSignUp ? "Sign In" : "Sign Up"}
            </Text>
          </Text>
        </Pressable>
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
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
  },

  // Brand Header
  brandContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#7c4dff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  brandName: {
    fontSize: 28,
    fontWeight: "900",
    color: "#22223b",
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 14,
    color: "#8e8ea0",
    marginTop: 4,
    textAlign: "center",
    letterSpacing: 0.2,
  },

  // Form Card
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f0f0f5",
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#22223b",
    marginBottom: 24,
  },

  // Field group
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 12,
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

  // Error block
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fdecea",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: "#e53935",
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },

  // Primary Action Button
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7c4dff",
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 8,
    gap: 8,
    shadowColor: "#7c4dff",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
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
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  // Swtich Auth Mode
  switchModeContainer: {
    marginTop: 28,
    alignItems: "center",
  },
  switchModeText: {
    fontSize: 14,
    color: "#8e8ea0",
    fontWeight: "500",
  },
  switchModeHighlight: {
    color: "#7c4dff",
    fontWeight: "700",
  },
});

