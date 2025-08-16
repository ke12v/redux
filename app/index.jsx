import { configureStore, createSlice, nanoid } from "@reduxjs/toolkit";
import * as Device from "expo-device";
import * as Haptics from "expo-haptics";
import { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View
} from "react-native";
import {
  Appbar,
  Avatar,
  Banner,
  Button,
  Card,
  Divider,
  MD3DarkTheme,
  MD3LightTheme,
  Provider as PaperProvider,
  Switch,
  Text,
  TextInput
} from "react-native-paper";
import { Provider as ReduxProvider, useDispatch, useSelector } from "react-redux";

// UI slice
const uiSlice = createSlice({
  name: "ui",
  initialState: {
    darkMode: false,
    showBanner: true,
    doneNotificationVisible: false,
    undoNotificationVisible: false, // added for undo banner
  },
  reducers: {
    toggleDarkMode(state) {
      state.darkMode = !state.darkMode;
    },
    dismissBanner(state) {
      state.showBanner = false;
    },
    showDoneNotification(state) {
      state.doneNotificationVisible = true;
    },
    dismissDoneNotification(state) {
      state.doneNotificationVisible = false;
    },
    showUndoNotification(state) {
      state.undoNotificationVisible = true;
    },
    dismissUndoNotification(state) {
      state.undoNotificationVisible = false;
    },
  },
});

// Todos slice
const todosSlice = createSlice({
  name: "todos",
  initialState: { items: [] },
  reducers: {
    addTodo: {
      reducer(state, action) {
        state.items.unshift(action.payload); // add to top
      },
      prepare(title) {
        return { payload: { id: nanoid(), title, done: false, createdAt: Date.now() } };
      },
    },
    toggleTodo(state, action) {
      const t = state.items.find((x) => x.id === action.payload);
      if (t) t.done = !t.done;
    },
    removeTodo(state, action) {
      state.items = state.items.filter((x) => x.id !== action.payload);
    },
  },
});

const { toggleDarkMode, dismissBanner, showDoneNotification, dismissDoneNotification, showUndoNotification, dismissUndoNotification } = uiSlice.actions;
const { addTodo, toggleTodo, removeTodo } = todosSlice.actions;

const store = configureStore({
  reducer: {
    ui: uiSlice.reducer,
    todos: todosSlice.reducer,
  },
});

export default function App() {
  return (
    <ReduxProvider store={store}>
      <ThemedApp />
    </ReduxProvider>
  );
}

function ThemedApp() {
  const darkMode = useSelector((s) => s.ui.darkMode);
  const theme = useMemo(() => {
    const basetheme = darkMode ? MD3DarkTheme : MD3LightTheme;
    return {
      ...basetheme,
      colors: {
        ...basetheme.colors,
        primary: "#2f759eff",
        onPrimary: "#080000ff",
        background: darkMode ? "#121212" : "#F5F5F5",
        surface: darkMode ? "#222222" : "#ffffffff",
        onSurface: darkMode ? "#ffffff" : "#080000ff",
        accent: "#007AFF",
        text: darkMode ? "#ffffff" : "#000000",
      },
    };
  }, [darkMode]);

  return (
    <PaperProvider theme={theme}>
      <SafeAreaView style={{ flex: 1 }}>
        <AppScaffold />
      </SafeAreaView>
    </PaperProvider>
  );
}

function AppScaffold() {
  const dispatch = useDispatch();
  const showBanner = useSelector((s) => s.ui.showBanner);
  const doneNotificationVisible = useSelector((s) => s.ui.doneNotificationVisible);
  const undoNotificationVisible = useSelector((s) => s.ui.undoNotificationVisible);

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Expo + Redux Demo" subtitle={`Running on ${Device.osName ?? "Unknown OS"}`} />
        <DarkModeSwitch />
      </Appbar.Header>

      {showBanner && (
        <Banner
          visible
          actions={[{ label: "Got it", onPress: () => dispatch(dismissBanner()) }]}
          icon={({ size }) => <Avatar.Icon size={size} icon="information-outline" />}
        >
          Task added (Haptics, Device).
        </Banner>
      )}

      {doneNotificationVisible && (
        <Banner
          visible
          actions={[{ label: "Got it", onPress: () => dispatch(dismissDoneNotification()) }]}
          icon={({ size }) => <Avatar.Icon {...{ size, icon: "check-circle" }} />}
          style={{ backgroundColor: "#d4f7d4" }}
        >
          Task has been marked as completed.
        </Banner>
      )}

      {undoNotificationVisible && (
        <Banner
          visible
          actions={[{ label: "Got it", onPress: () => dispatch(dismissUndoNotification()) }]}
          icon={({ size }) => <Avatar.Icon {...{ size, icon: "undo" }} />}
          style={{ backgroundColor: "#d4f7d4" }}
        >
          Task has been undone.
        </Banner>
      )}

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 12 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.horizontalContainer}>
          <TodosCard />
          <DoneCard />
        </View>
      </ScrollView>

      <Appbar style={styles.footer}>
        <Appbar.Action icon="github" accessibilityLabel="GitHub" onPress={() => {}} />
        <Appbar.Content title="Footer" subtitle={Platform.select({ ios: "iOS", android: "Android", default: "Web" })} />
      </Appbar>
    </View>
  );
}

function DarkModeSwitch() {
  const dispatch = useDispatch();
  const darkMode = useSelector((s) => s.ui.darkMode);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingRight: 12 }}>
      <Text style={{ marginRight: 8 }}>{darkMode ? "Dark" : "Light"}</Text>
      <Switch
        value={darkMode}
        onValueChange={() => dispatch(toggleDarkMode())}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      />
    </View>
  );
}

function TodosCard() {
  const dispatch = useDispatch();
  const items = useSelector((s) => s.todos.items.filter((item) => !item.done));
  const [title, setTitle] = useState("");

  const addTask = () => {
    if (!title.trim()) return;
    dispatch(addTodo(title.trim()));
    setTitle("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleDone = (id) => {
    dispatch(toggleTodo(id));
    dispatch(showDoneNotification());
  };

  return (
    <Card style={[styles.card, { flex: 1 }]}>
      <Card.Title
        title="Todos"
        left={(props) => <Avatar.Icon {...props} icon="check-circle-outline" />}
      />
      <Card.Content>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput
            style={{ flex: 1 }}
            label="What needs doing?"
            value={title}
            onChangeText={setTitle}
            onSubmitEditing={addTask}
            returnKeyType="done"
          />
          <Button mode="contained" buttonColor="green" textColor="white" onPress={addTask}>
            Add
          </Button>
        </View>
        <Divider style={{ marginVertical: 12 }} />

        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => (
            <Card style={{ marginBottom: 8 }}>
              <Card.Title
                title={item.title}
                subtitle={new Date(item.createdAt).toLocaleString()}
                left={(props) => <Avatar.Icon {...props} icon="circle-outline" />}
              />
              <Card.Actions>
                <Button buttonColor="green" textColor="white" onPress={() => handleDone(item.id)}>
                  DONE
                </Button>
                <Button buttonColor="#fff" textColor="red" onPress={() => dispatch(removeTodo(item.id))}>
                  Remove
                </Button>
              </Card.Actions>
            </Card>
          )}
        />
      </Card.Content>
    </Card>
  );
}

function DoneCard() {
  const dispatch = useDispatch();
  const items = useSelector((s) => s.todos.items.filter((item) => item.done));

  return (
    <Card style={[styles.card, { flex: 1, backgroundColor: "#eafbee" }]}>
      <Card.Title title="Done / Completed" left={(props) => <Avatar.Icon {...props} icon="check-circle" />} />
      <Card.Content>
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => (
            <Card style={{ marginBottom: 8, backgroundColor: "#f0fff0" }}>
              <Card.Title
                title={item.title}
                subtitle={new Date(item.createdAt).toLocaleString()}
                left={(props) => <Avatar.Icon {...props} icon="check" />}
              />
              <Card.Actions>
                <Button
                  buttonColor="green"
                  textColor="white"
                  onPress={() => {
                    dispatch(toggleTodo(item.id));
                    dispatch(showUndoNotification());
                  }}
                >
                  Undo
                </Button>
                <Button buttonColor="#fff" textColor="red" onPress={() => dispatch(removeTodo(item.id))}>
                  Remove
                </Button>
              </Card.Actions>
            </Card>
          )}
        />
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  content: { flex: 1 },
  horizontalContainer: { flexDirection: "row", justifyContent: "center", gap: 16 },
  card: { marginBottom: 12, borderRadius: 16, overflow: "hidden" },
  footer: { justifyContent: "center" },
});
