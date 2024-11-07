// screens/SymptomLogScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { getDatabase, ref, push, set } from 'firebase/database'; // Firebase Realtime Database for data handling
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'; // Firebase Storage for media uploads
import * as ImagePicker from 'expo-image-picker'; // Expo Image Picker for selecting media
import { Video } from 'expo-av'; // Expo Video component for displaying video previews
import { auth } from '../firebaseConfig'; // Firebase authentication configuration

// Main component for logging symptoms
export default function SymptomLogScreen({ navigation }) {
  // State for storing symptom description
  const [symptomDescription, setSymptomDescription] = useState('');

  // State for storing pain level
  const [painLevel, setPainLevel] = useState('');

  // State to store URI of selected media file
  const [mediaUri, setMediaUri] = useState('');

  // State to store media type (image or video)
  const [mediaType, setMediaType] = useState('');

  // Function to open media picker for selecting a photo or video
  const handlePickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All, // Allow both photos and videos
      allowsEditing: true,
      quality: 1, // High-quality media
    });

    // Set media URI and type if selection is successful
    if (!result.canceled) {
      setMediaUri(result.assets[0].uri);
      setMediaType(result.assets[0].type);
    }
  };

  // Function to submit symptom log with optional media attachment
  const handleSubmitLog = async () => {
    // Check if description and pain level are provided
    if (!symptomDescription || !painLevel) {
      Alert.alert('Error', 'Please enter a description of the symptom and a pain level.');
      return;
    }

    try {
      const user = auth.currentUser; // Get current authenticated user
      const db = getDatabase();
      const symptomRef = push(ref(db, `symptomLogs/${user.uid}`)); // Create new entry in the 'symptomLogs' node for the user
      let mediaUrl = '';

      // Upload selected media to Firebase Storage if available
      if (mediaUri) {
        const storage = getStorage();
        const fileRef = storageRef(storage, `symptoms/${user.uid}/${Date.now()}`); // Generate a unique path for each media file
        const response = await fetch(mediaUri);
        const blob = await response.blob();

        await uploadBytes(fileRef, blob); // Upload media as a blob
        mediaUrl = await getDownloadURL(fileRef); // Get downloadable URL for the uploaded media
      }

      // Save the symptom log details in Firebase Realtime Database
      await set(symptomRef, {
        symptomDescription,
        painLevel,
        mediaUrl, // Store URL of uploaded media
        mediaType, // Store media type for rendering in the app
        timestamp: new Date().toISOString(), // Save timestamp in ISO format
      });

      // Show success alert and reset form or navigate based on user choice
      Alert.alert('Success', 'Symptom log submitted successfully.', [
        {
          text: 'Log Another Symptom',
          onPress: () => {
            // Reset form fields for new entry
            setSymptomDescription('');
            setPainLevel('');
            setMediaUri('');
            setMediaType('');
          },
        },
        {
          text: 'Return to Dashboard',
          onPress: () => navigation.navigate('AthleteDashboard'), // Navigate back to dashboard
        },
      ]);
    } catch (error) {
      console.error('Error submitting symptom log:', error); // Log any error encountered
      Alert.alert('Error', 'Failed to submit symptom log.'); // Show error alert to user
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Page Title */}
      <Text style={styles.title}>Symptom Log</Text>

      {/* App Logo */}
      <Image source={require('../assets/asclepius.png')} style={styles.asclepiusImage} />

      {/* Input for Symptom Description */}
      <Text style={styles.label}>Describe Your Symptom:</Text>
      <TextInput
        style={styles.input}
        placeholder="Describe the symptoms you're experiencing"
        value={symptomDescription}
        onChangeText={setSymptomDescription}
        multiline
      />

      {/* Input for Pain Level */}
      <Text style={styles.label}>Pain Level (1-10):</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter pain level"
        value={painLevel}
        onChangeText={setPainLevel}
        keyboardType="numeric"
      />

      {/* Media Upload Section */}
      <Text style={styles.label}>Upload Photo of Symptom (Optional):</Text>
      {/* Preview selected image or video if available */}
      {mediaUri ? (
        mediaType === 'image' ? (
          <Image source={{ uri: mediaUri }} style={styles.mediaPreview} />
        ) : (
          <Video
            source={{ uri: mediaUri }}
            style={styles.mediaPreview}
            useNativeControls // Enable native video controls
            resizeMode="contain" // Contain video within bounds
            isLooping
          />
        )
      ) : null}

      {/* Button to pick media */}
      <TouchableOpacity onPress={handlePickMedia} style={styles.mediaButton}>
        <Text style={styles.mediaButtonText}>{mediaUri ? 'Change Media' : 'Upload Media'}</Text>
      </TouchableOpacity>

      {/* Button to submit symptom log */}
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmitLog}>
        <Text style={styles.submitButtonText}>Submit Symptom Log</Text>
      </TouchableOpacity>

      {/* Button to view symptom log history */}
      <TouchableOpacity
        style={styles.historyButton}
        onPress={() => navigation.navigate('SymptomLogHistoryScreen')}
      >
        <Text style={styles.historyButtonText}>View Symptom Log History</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// Styles for SymptomLogScreen component
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#F5F5F5', // Light background color
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#004D40', // Dark green color for title
    marginBottom: 20,
  },
  asclepiusImage: {
    width: 200,
    height: 200,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333', // Dark grey for readability
    alignSelf: 'flex-start',
    marginBottom: 5,
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#CCCCCC', // Light grey border for input
    borderRadius: 5,
    backgroundColor: '#FFFFFF', // White background for input
    marginBottom: 15,
  },
  mediaButton: {
    backgroundColor: '#D3D3D3', // Light grey button background
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  mediaButtonText: {
    color: '#004D40', // Dark green text color
    fontWeight: 'bold',
  },
  mediaPreview: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
    resizeMode: 'contain',
  },
  submitButton: {
    backgroundColor: '#004D40', // Dark green submit button
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitButtonText: {
    color: '#FFFFFF', // White text for submit button
    fontWeight: 'bold',
  },
  historyButton: {
    backgroundColor: '#004D40', // Dark green history button
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  historyButtonText: {
    color: '#FFFFFF', // White text for history button
    fontWeight: 'bold',
  },
});
