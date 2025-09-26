// Email-based authentication screen for DropFlow onboarding
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  StyleSheet, 
  Alert, 
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../hooks/useAuth';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { Colors } from '../constants/theme';

export default function AuthScreen() {
  const { register, verifyEmail, resendVerification, login, user } = useAuth();
  const [mode, setMode] = useState<'signup' | 'login' | 'verify'>('signup');
  const [isLoading, setIsLoading] = useState(false);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingEmail, setPendingEmail] = useState(''); // Email pending verification

  // Redirect if already authenticated
  React.useEffect(() => {
    if (user?.isVerified) {
      router.replace('/onboarding');
    }
  }, [user]);

  const handleSignup = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const result = await register(email, password, firstName, lastName);
      
      if (result.success) {
        setPendingEmail(result.email || email);
        setMode('verify');
        Alert.alert(
          'Check Your Email', 
          'We\'ve sent a 6-digit verification code to your email address. Please enter it below to verify your account.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Registration Failed', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email and password');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(email, password);
      
      if (result.success && result.user) {
        if (result.user.isVerified) {
          router.replace('/onboarding');
        } else {
          setPendingEmail(email);
          setMode('verify');
          Alert.alert(
            'Email Verification Required', 
            'Please verify your email address to continue.',
            [{ text: 'OK' }]
          );
        }
      } else {
        Alert.alert('Login Failed', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestLogin = async () => {
    setEmail('nyaclay@gmail.com');
    setPassword('testpass123');
    
    // Short delay to let the state update
    setTimeout(async () => {
      setIsLoading(true);
      try {
        const result = await login('nyaclay@gmail.com', 'testpass123');
        
        if (result.success && result.user) {
          if (result.user.isVerified) {
            router.replace('/onboarding');
          } else {
            setPendingEmail('nyaclay@gmail.com');
            setMode('verify');
            Alert.alert(
              'Email Verification Required', 
              'Please verify your email address to continue.',
              [{ text: 'OK' }]
            );
          }
        } else {
          Alert.alert('Login Failed', result.message);
        }
      } catch (error) {
        Alert.alert('Error', 'Login failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }, 100);
  };

  const handleVerifyEmail = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit verification code');
      return;
    }

    setIsLoading(true);
    try {
      const result = await verifyEmail(pendingEmail, verificationCode);
      
      if (result.success) {
        Alert.alert(
          'Email Verified!', 
          'Your email has been verified successfully. Welcome to DropFlow!',
          [{ text: 'Continue', onPress: () => router.replace('/onboarding') }]
        );
      } else {
        Alert.alert('Verification Failed', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      const result = await resendVerification(pendingEmail);
      
      if (result.success) {
        Alert.alert('Code Sent', result.message);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to resend verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderSignupForm = () => (
    <>
      <ThemedText style={styles.title}>Create Your Account</ThemedText>
      <ThemedText style={styles.subtitle}>
        Join thousands of drivers optimizing their delivery routes
      </ThemedText>

      <View style={styles.form}>
        <View style={styles.nameRow}>
          <TextInput
            style={[styles.input, styles.nameInput]}
            placeholder="First Name"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
            autoComplete="given-name"
          />
          <TextInput
            style={[styles.input, styles.nameInput]}
            placeholder="Last Name"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
            autoComplete="family-name"
          />
        </View>

        <TextInput
          style={styles.input}
          placeholder="Email Address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />

        <TextInput
          style={styles.input}
          placeholder="Password (min. 8 characters)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
        />

        <Pressable 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={handleSignup}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create Account</Text>
          )}
        </Pressable>

        <Pressable onPress={() => setMode('login')}>
          <ThemedText style={styles.linkText}>
            Already have an account? <Text style={styles.linkHighlight}>Sign In</Text>
          </ThemedText>
        </Pressable>
      </View>
    </>
  );

  const renderLoginForm = () => (
    <>
      <ThemedText style={styles.title}>Welcome Back</ThemedText>
      <ThemedText style={styles.subtitle}>
        Sign in to your DropFlow account
      </ThemedText>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
        />

        <Pressable 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </Pressable>

        <Pressable onPress={() => setMode('signup')}>
          <ThemedText style={styles.linkText}>
            Don't have an account? <Text style={styles.linkHighlight}>Sign Up</Text>
          </ThemedText>
        </Pressable>

        {/* Quick Test Login */}
        <Pressable 
          style={[styles.button, styles.testButton, { marginTop: 16 }]} 
          onPress={() => handleTestLogin()}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Quick Test Login</Text>
        </Pressable>

        <Pressable onPress={() => router.push('/admin-setup')}>
          <ThemedText style={styles.linkText}>
            <Text style={styles.linkHighlight}>Admin Setup</Text>
          </ThemedText>
        </Pressable>
      </View>
    </>
  );

  const renderVerificationForm = () => (
    <>
      <ThemedText style={styles.title}>Verify Your Email</ThemedText>
      <ThemedText style={styles.subtitle}>
        We sent a 6-digit code to {pendingEmail}
      </ThemedText>

      <View style={styles.form}>
        <TextInput
          style={[styles.input, styles.codeInput]}
          placeholder="000000"
          value={verificationCode}
          onChangeText={setVerificationCode}
          keyboardType="number-pad"
          maxLength={6}
          textAlign="center"
        />

        <Pressable 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={handleVerifyEmail}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verify Email</Text>
          )}
        </Pressable>

        <Pressable onPress={handleResendCode} disabled={isLoading}>
          <ThemedText style={styles.linkText}>
            Didn't receive the code? <Text style={styles.linkHighlight}>Resend</Text>
          </ThemedText>
        </Pressable>

        <Pressable onPress={() => setMode('login')}>
          <ThemedText style={styles.linkText}>
            <Text style={styles.linkHighlight}>Back to Sign In</Text>
          </ThemedText>
        </Pressable>
      </View>
    </>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.content}>
          <View style={styles.header}>
            <ThemedText style={styles.logo}>🚛 DropFlow</ThemedText>
            <ThemedText style={styles.tagline}>Smart Route Optimization</ThemedText>
          </View>

          {mode === 'signup' && renderSignupForm()}
          {mode === 'login' && renderLoginForm()}
          {mode === 'verify' && renderVerificationForm()}
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    gap: 16,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nameInput: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  codeInput: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  button: {
    backgroundColor: '#dc2626',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: '#059669',
  },
  linkText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  linkHighlight: {
    color: '#dc2626',
    fontWeight: '600',
  },
});
