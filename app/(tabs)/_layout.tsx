import { Octicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: styles.tabBarIcon.color }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => {
            return focused ? (
              <Octicons name="home-fill" size={24} color={color} />
            ) : (
              <Octicons name="home" size={24} color={color} />
            );
          },
        }}
      />
      <Tabs.Screen name="login" options={{ title: "Login" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarIcon: {
    fontSize: 24,
    color: "black",
  },
});
