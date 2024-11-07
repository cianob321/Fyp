// screens/Login.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth'; // Firebase Authentication for signing in
import { getDatabase, ref, get } from 'firebase/database'; // Firebase Realtime Database functions
import { auth } from '../firebaseConfig'; // Firebase configuration, check path to firebaseConfig.js

// Main component for user login
export default function Login({ navigation }) {
  // State for storing email input
  const [email, setEmail] = useState('');

  // State for storing password input
  const [password, setPassword] = useState('');

  // Function to handle login with Firebase Authentication
  const handleLogin = async () => {
    // Check if both email and password fields are filled
    if (!email || !password) {
      Alert.alert('Error', 'Please fill out all fields.');
      return;
    }

    try {
      // Authenticate user with Firebase using email and password
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user; // User information from Firebase authentication

      // Reference to Firebase Realtime Database
      const db = getDatabase();

      // Check if the user is in the 'athletes' section in the database
      const athleteRef = ref(db, `athletes/${user.uid}`);
      const athleteSnapshot = await get(athleteRef);

      if (athleteSnapshot.exists()) {
        // User exists as an athlete, navigate to AthleteDashboard
        navigation.navigate('AthleteDashboard');
        return;
      }

      // Check if the user is in the 'physios' section in the database
      const physioRef = ref(db, `physios/${user.uid}`);
      const physioSnapshot = await get(physioRef);

      if (physioSnapshot.exists()) {
        // User exists as a physio, navigate to PhysioDashboard
        navigation.navigate('PhysioDashboard');
        return;
      }

      // Alert if user type is not recognized in the database
      Alert.alert('Error', 'Account does not exist or user type is unrecognized.');
    } catch (error) {
      // Show an error alert if login fails
      Alert.alert('Login Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>Login</Text>

      {/* Email Input */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address" // Use email-optimized keyboard
        autoCapitalize="none" // Disable auto-capitalization for email input
      />

      {/* Password Input */}
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry // Mask input for password
      />

      {/* Login Button */}
      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>Login</Text>
      </TouchableOpacity>

      {/* Back to Home Button */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backButtonText}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  );
}

// Styles for the Login component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E5E5E5', // Light background for login screen
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#004D40', // Dark green color for title
    marginBottom: 20,
  },
  input: {
    width: '100%',
    padding: 15,
    borderColor: '#CCCCCC', // Light grey border for inputs
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    backgroundColor: '#FFFFFF', // White background for input fields
  },
  loginButton: {
    backgroundColor: '#004D40', // Dark green color for login button
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: '#FFFFFF', // White text color for login button text
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 20, // Margin above the back button
  },
  backButtonText: {
    color: '#004D40', // Dark green color for back button text
    fontWeight: '600',
  },
});
