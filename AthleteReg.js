// screens/AthleteReg.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth'; // Firebase authentication method to create a new user
import { getDatabase, ref, set } from 'firebase/database'; // Firebase database methods to store user data
import { auth } from '../firebaseConfig'; // Import Firebase configuration, ensure the path to firebaseConfig.js is correct

// Main component for athlete registration
export default function AthleteReg({ navigation }) {
  // State hooks to store input values
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [sport, setSport] = useState('');

  // Function to handle athlete registration
  const handleRegister = async () => {
    // Validate that all fields are filled
    if (!name || !email || !password || !age || !sport) {
      Alert.alert('Error', 'Please fill out all fields.'); // Alert if any field is empty
      return;
    }

    try {
      console.log('Attempting to register athlete...');
      
      // Register user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user; // Retrieve registered user info
  
      console.log('Athlete registered:', user.uid); // Log user ID after successful registration
      console.log('Athlete data:', { name, email, age, sport }); // Log data being saved for reference
  
      // Initialize Firebase Realtime Database and save additional user data
      const db = getDatabase();
      await set(ref(db, 'athletes/' + user.uid), {
        name,   // Athlete's name
        email,  // Athlete's email
        age,    // Athlete's age
        sport,  // Athlete's primary sport
      });

      Alert.alert('Success', 'Athlete Registered Successfully!'); // Show success alert
      navigation.navigate('AthleteDashboard'); // Navigate to Athlete Dashboard screen
    } catch (error) {
      console.error('Registration Error:', error); // Log registration error
      Alert.alert('Registration Error', error.message); // Show error alert with error message
    }
  };

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>Athlete Registration</Text>

      {/* Input field for athlete's name */}
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />

      {/* Input field for athlete's email */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address" // Sets keyboard layout suitable for email entry
        autoCapitalize="none" // Prevents auto-capitalization of email
      />

      {/* Input field for password */}
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry // Masks password entry for security
      />

      {/* Input field for athlete's age */}
      <TextInput
        style={styles.input}
        placeholder="Age"
        value={age}
        onChangeText={setAge}
        keyboardType="numeric" // Sets keyboard layout suitable for numeric entry
      />

      {/* Input field for primary sport */}
      <TextInput
        style={styles.input}
        placeholder="Primary Sport"
        value={sport}
        onChangeText={setSport}
      />

      {/* Register button to submit form */}
      <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
        <Text style={styles.registerButtonText}>Register</Text>
      </TouchableOpacity>

      {/* Back button to navigate to previous screen */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

// Styling for AthleteReg component elements
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E5E5E5', // Light background color
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#004D40', // Dark green color for title text
    marginBottom: 20,
  },
  input: {
    width: '100%',
    padding: 15,
    borderColor: '#CCCCCC', // Light border color for input field
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    backgroundColor: '#FFFFFF', // White background for input field
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
    marginTop: 20, // Adds margin above the back button
  },
  backButtonText: {
    color: '#004D40', // Dark green text color for back button
    fontWeight: '600',
  },
});
