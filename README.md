# 🎯 HabitTracker

A beautiful, premium React Native application built with **Expo (v54)** and **Appwrite** for tracking daily habits, maintaining consistency, and visualizing streaks.

---

## 📱 Features

- **🔒 Premium Authentication**: Custom SignIn & SignUp screens with inputs validation and clean loading states.
- **✨ Daily Habit List**: View today's habits with a dynamic circular daily progress bar tracker.
- **✔️ Gestures Integration**: Swiping left to delete, and swiping right to complete daily habits with smooth animations.
- **⚡ Optimistic UI Updates**: State updates instantly on the client side when executing actions, providing zero-latency feedback before saving changes back to the database.
- **🏆 Streaks Leaderboard**: Tracks active habit streaks, best streaks, and lifetime completions, ranking habits in an interactive top podium layout.
- **📅 Interactive Forms**: Simple form to add new habits with controlled text fields, error notifications, and visual cards for choosing frequencies (daily, weekly, monthly).
- **🔄 Realtime Synchronization**: Appwrite Realtime WebSocket events synchronize habits and completions across multiple devices instantly.

---

## 📸 Screenshots

Here is a preview of the modernized user interface:

### Authentication
| Sign In | Sign Up |
| :---: | :---: |
| ![Sign In](./screenshot/signin.jpg) | ![Sign Up](./screenshot/signup.jpg) |

### Daily Dashboard & Interactions
| Today's Habits | Swipe to Complete | Swipe to Delete |
| :---: | :---: | :---: |
| ![Today's Habits](./screenshot/list-habits.jpg) | ![Swipe to Complete](./screenshot/completed-option-view.jpg) | ![Swipe to Delete](./screenshot/delete-option-view.jpg) |

### Statistics & Creation
| Habit Streaks | Add New Habit |
| :---: | :---: |
| ![Habit Streaks](./screenshot/streaks.jpg) | ![Add Habit](./screenshot/add%20habit.jpg) |

---

## 🛠️ Tech Stack & Key Libraries

This project uses the following major packages:

- **Core**: [React Native](https://reactnative.dev/) & [Expo (v54)](https://expo.dev/)
- **Backend & Sync**: [react-native-appwrite](https://github.com/appwrite/sdk-for-react-native) (Database, Authentication, Realtime WebSockets)
- **UI & Components**: [react-native-paper](https://reactnativepaper.com/) (Material Design UI components)
- **Gestures**: [react-native-gesture-handler](https://docs.swmansion.com/react-native-gesture-handler/) (Swipeable list rows)
- **Routing**: [expo-router](https://docs.expo.dev/router/introduction/) (File-based navigation)
- **Icons**: `@expo/vector-icons` (MaterialCommunityIcons integration)

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed and a simulator or [Expo Go](https://expo.dev/go) app ready on your mobile device.

### 2. Installation
Clone this repository and install all dependencies:
```bash
git clone https://github.com/exhorte/habit-tracker-app.git
cd habit-tracker-app
npm install
```

### 3. Environment Variables
Create a `.env` file in the root folder of the project containing your Appwrite endpoint configuration details:
```env
EXPO_PUBLIC_APPWRITE_ENDPOINT="https://cloud.appwrite.io/v1"
EXPO_PUBLIC_APPWRITE_PROJECT_ID="your_project_id"
EXPO_PUBLIC_APPWRITE_DATABASE_ID="your_database_id"
EXPO_PUBLIC_APPWRITE_HABITS_COLLECTION_ID="your_habits_collection_id"
EXPO_PUBLIC_APPWRITE_COMPLETIONS_COLLECTION_ID="your_completions_collection_id"
```

### 4. Running the Project
Start the development server:
```bash
# Start expo development server
npx expo start

# Run specifically on Web
npm run web

# Run on Android
npm run android

# Run on iOS
npm run ios
```

