import { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native"
import { Link, router } from "expo-router"
import { useAuth } from "@/hooks/useAuth"

export default function AuthScreen() {
  const { login, register, isInitializing } = useAuth()
  const [mode, setMode] = useState<"login" | "register">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [isSubmitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    setError(null)
    setInfo(null)

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required")
      return
    }

    setSubmitting(true)
    try {
      if (mode === "login") {
        const result = await login(email.trim().toLowerCase(), password)
        if (!result.success) {
          setError(result.message)
          return
        }
        router.replace("/(tabs)/home")
      } else {
        const result = await register({
          email: email.trim().toLowerCase(),
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        })
        if (!result.success) {
          setError(result.message)
          return
        }
        setInfo(result.message)
        router.replace("/(tabs)/home")
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>Welcome to DropFlow</Text>
          <View style={styles.switchRow}>
            <TouchableOpacity
              style={[styles.switchButton, mode === "login" && styles.switchButtonActive]}
              onPress={() => setMode("login")}
              disabled={isSubmitting}
            >
              <Text style={[styles.switchButtonText, mode === "login" && styles.switchButtonTextActive]}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.switchButton, mode === "register" && styles.switchButtonActive]}
              onPress={() => setMode("register")}
              disabled={isSubmitting}
            >
              <Text style={[styles.switchButtonText, mode === "register" && styles.switchButtonTextActive]}>Register</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              editable={!isSubmitting && !isInitializing}
            />
          </View>

          {mode === "register" && (
            <>
              <View style={styles.formGroup}>
                <Text style={styles.label}>First name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Jane"
                  placeholderTextColor="#9ca3af"
                  value={firstName}
                  onChangeText={setFirstName}
                  editable={!isSubmitting && !isInitializing}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Last name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Doe"
                  placeholderTextColor="#9ca3af"
                  value={lastName}
                  onChangeText={setLastName}
                  editable={!isSubmitting && !isInitializing}
                />
              </View>
            </>
          )}

          <View style={styles.formGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!isSubmitting && !isInitializing}
            />
          </View>

          {error && <Text style={styles.error}>{error}</Text>}
          {info && <Text style={styles.info}>{info}</Text>}

          <TouchableOpacity
            style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.primaryButtonText}>{mode === "login" ? "Sign in" : "Create account"}</Text>
          </TouchableOpacity>

          <Text style={styles.helper}>Use demo@dropflow.com / demo123 to explore instantly.</Text>

          <Link href="/(tabs)/home" asChild>
            <TouchableOpacity>
              <Text style={styles.link}>Skip for now</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#0f172a",
  },
  card: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#1f2937",
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "white",
    textAlign: "center",
  },
  switchRow: {
    flexDirection: "row",
    backgroundColor: "#1f2937",
    borderRadius: 12,
    padding: 4,
  },
  switchButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
  },
  switchButtonActive: {
    backgroundColor: "#ef4444",
  },
  switchButtonText: {
    color: "#9ca3af",
    textAlign: "center",
    fontWeight: "500",
  },
  switchButtonTextActive: {
    color: "white",
  },
  formGroup: {
    gap: 6,
  },
  label: {
    color: "#d1d5db",
    fontSize: 14,
  },
  input: {
    backgroundColor: "#1f2937",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "white",
    borderWidth: 1,
    borderColor: "#374151",
  },
  primaryButton: {
    backgroundColor: "#ef4444",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  error: {
    color: "#fca5a5",
    textAlign: "center",
  },
  info: {
    color: "#a7f3d0",
    textAlign: "center",
  },
  helper: {
    color: "#9ca3af",
    textAlign: "center",
  },
  link: {
    textAlign: "center",
    color: "#60a5fa",
  },
})
