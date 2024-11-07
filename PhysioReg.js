// screens/PhysioReg.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth'; // Firebase authentication function to create new users
import { getDatabase, ref, set } from 'firebase/database'; // Firebase database functions to set user data
import { auth } from '../firebaseConfig'; // Firebase configuration file for authentication setup

// Main component for Physio registration
export default function PhysioReg({ navigation }) {
  // State for storing physio's name input
  const [name, setName] = useState('');

  // State for storing physio's email input
  const [email, setEmail] = useState('');

  // State for storing physio's password input
  const [password, setPassword] = useState('');

  // State for storing physio's specialization
  const [specialization, setSpecialization] = useState('');

  // State for storing physio's license number
  const [licenseNumber, setLicenseNumber] = useState('');

  // Function to handle registration
  const handleRegister = async () => {
    // Check if all input fields are filled
    if (!name || !email || !password || !specialization || !licenseNumber) {
      Alert.alert('Error', 'Please fill out all fields.');
      return;
    }

    try {
      console.log('Attempting to register physio...');

      // Register the physio using Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user; // Retrieve user information after registration

      console.log('Physio registered:', user.uid);

      // Initialize Firebase Realtime Database and save additional user data
      const db = getDatabase();
      await set(ref(db, 'physios/' + user.uid), {
        name, // Physio's name
        email, // Physio's email
        specialization, // Physio's area of expertise
        licenseNumber, // Physio's license number
      });

      Alert.alert('Success', 'Physio Registered Successfully!');
      navigation.navigate('Login'); // Redirect to the login screen after successful registration
    } catch (error) {
      console.error('Registration Error:', error); // Log any registration errors
      Alert.alert('Registration Error', error.message); // Display alert for registration error
    }
  };

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>Physio Registration</Text>

      {/* Name Input */}
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />

      {/* Email Input */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address" // Set keyboard layout suitable for email input
        autoCapitalize="none" // Disable auto-capitalization for email input
      />

      {/* Password Input */}
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry // Mask input for secure password entry
      />

      {/* Specialization Input */}
      <TextInput
        style={styles.input}
        placeholder="Specialization (e.g., Sports Rehab)"
        value={specialization}
        onChangeText={setSpecialization}
      />

      {/* License Number Input */}
      <TextInput
        style={styles.input}
        placeholder="License Number"
        value={licenseNumber}
        onChangeText={setLicenseNumber}
      />

      {/* Register Button */}
      <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
        <Text style={styles.registerButtonText}>Register</Text>
      </TouchableOpacity>

      {/* Back Button */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

// Styles for the PhysioReg component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E5E5E5', // Light grey background color
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
    borderColor: '#CCCCCC', // Light grey border color for inputs
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    backgroundColor: '#FFFFFF', // White background color for input fields
  },
  registerButton: {
    backgroundColor: '#004D40', // Dark green background for register button
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  registerButtonText: {
    color: '#FFFFFF', // White text color for register button
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 20, // Space above the back button
  },
  backButtonText: {
    color: '#004D40', // Dark green color for back button text
    fontWeight: '600',
  },
});
