// screens/UploadProgramScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
  ScrollView,
  FlatList,
} from 'react-native';
import { getDatabase, ref, get, set, push } from 'firebase/database'; // Firebase Realtime Database for data handling
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'; // Firebase Storage for media uploads
import * as ImagePicker from 'expo-image-picker'; // Expo Image Picker for selecting media
import DateTimePicker from '@react-native-community/datetimepicker'; // Date picker component for setting exercise completion date
import { Video } from 'expo-av'; // Expo Video component for displaying video previews

// Main component for uploading rehabilitation programs to patient accounts
export default function UploadProgramScreen({ navigation }) {
  // State to store the list of patients fetched from Firebase
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null); // Currently selected patient
  const [exerciseTitle, setExerciseTitle] = useState(''); // Exercise title input
  const [timer, setTimer] = useState(''); // Timer input
  const [completionDate, setCompletionDate] = useState(new Date()); // Exercise completion date
  const [showDatePicker, setShowDatePicker] = useState(false); // Controls visibility of date picker
  const [mediaUri, setMediaUri] = useState(''); // URI for selected media
  const [mediaType, setMediaType] = useState(''); // Type of selected media (image or video)
  const [feedbackMessage, setFeedbackMessage] = useState(null); // Feedback message for the user

  // Fetch patients from Firebase Realtime Database when component mounts
  useEffect(() => {
    const db = getDatabase();
    const patientsRef = ref(db, 'athletes'); // Database path to athletes collection

    get(patientsRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const patientList = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          })); // Convert data to an array of patient objects
          setPatients(patientList);
        }
      })
      .catch((error) => {
        console.error('Error fetching patients:', error); // Log any fetching errors
        setFeedbackMessage('Error fetching patients'); // Display error message to user
      });
  }, []);

  // Function to select a patient from the list
  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
  };

  // Media picker for selecting photo or video from device library
  const handlePickMedia = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All, // Allow both images and videos
        allowsEditing: true,
        quality: 1, // High-quality media
      });

      // Set media URI and type if selection is successful
      if (!result.canceled) {
        const uri = result.assets[0].uri;
        setMediaUri(uri);
        setMediaType(result.assets[0].type);
      } else {
        setFeedbackMessage('No media selected'); // Display feedback if no media was chosen
      }
    } catch (error) {
      console.error('Error picking media:', error);
      setFeedbackMessage('Failed to pick media'); // Display error message if picking fails
    }
  };

  // Handle the upload of exercise details and media to Firebase
  const handleUploadExercise = async () => {
    // Check if all necessary fields are filled
    if (!selectedPatient || !exerciseTitle || !timer || !mediaUri) {
      setFeedbackMessage('Please fill out all fields and select a patient.');
      return;
    }

    try {
      const storage = getStorage(); // Initialize Firebase Storage
      const fileRef = storageRef(storage, `exercises/${selectedPatient.id}/${Date.now()}`); // Generate unique file path for the media file
      const response = await fetch(mediaUri);
      const blob = await response.blob(); // Convert media URI to blob for upload

      await uploadBytes(fileRef, blob); // Upload the media file to Firebase Storage
      const downloadUrl = await getDownloadURL(fileRef); // Get the download URL for the uploaded file

      const db = getDatabase(); // Initialize Firebase Database
      const exerciseRef = push(ref(db, `exercises/${selectedPatient.id}`)); // Create a new exercise entry under the selected patient's ID

      // Set exercise details in the Firebase Realtime Database
      await set(exerciseRef, {
        title: exerciseTitle, // Exercise title
        timer, // Timer duration
        mediaUrl: downloadUrl, // Media file download URL
        completionDate: completionDate.toISOString(), // Completion date in ISO format
      });

      // Clear form fields and display success message
      setFeedbackMessage('Exercise uploaded successfully!');
      setExerciseTitle('');
      setTimer('');
      setMediaUri('');
      setMediaType('');
    } catch (error) {
      console.error('Error uploading exercise:', error); // Log any upload errors
      setFeedbackMessage('Upload Error: ' + error.message); // Display error message to user
    }
  };

  return (
    <View style={styles.container}>
      {/* Scrollable content container */}
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Text style={styles.title}>Upload Program</Text>

        {/* Patient Selection Section */}
        <Text style={styles.label}>Select Patient:</Text>
      </ScrollView>

      {/* FlatList to display list of patients */}
      <FlatList
        data={patients}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.patientItem,
              selectedPatient && selectedPatient.id === item.id ? styles.selectedPatient : null,
            ]}
            onPress={() => handleSelectPatient(item)}
          >
            <Text>{item.name}</Text>
          </TouchableOpacity>
        )}
      />

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Exercise Title Input */}
        <TextInput
          style={styles.input}
          placeholder="Exercise Title"
          value={exerciseTitle}
          onChangeText={setExerciseTitle}
        />

        {/* Timer Input */}
        <TextInput
          style={styles.input}
          placeholder="Timer (minutes)"
          value={timer}
          onChangeText={setTimer}
          keyboardType="numeric" // Numeric keyboard for timer input
        />

        {/* Date Picker for setting completion date */}
        {Platform.OS === 'web' ? (
          // For web, use a native HTML date input wrapped in a <Text> component
          <View style={styles.datePickerWeb}>
            <Text style={{ marginBottom: 5 }}>Set Completion Date:</Text>
            <input
              type="date"
              value={completionDate.toISOString().substring(0, 10)}
              onChange={(e) => setCompletionDate(new Date(e.target.value))}
              style={{ width: '100%', padding: 10, borderColor: '#CCCCCC', borderWidth: 1, borderRadius: 5 }}
            />
          </View>
        ) : (
          // For mobile, use a DateTimePicker component
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerButton}>
            <Text>{`Set Completion Date: ${completionDate.toDateString()}`}</Text>
          </TouchableOpacity>
        )}
        {showDatePicker && (
          <DateTimePicker
            value={completionDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) setCompletionDate(date); // Update selected date
            }}
          />
        )}

        {/* Display selected media preview (image or video) */}
        {mediaUri ? (
          mediaType === 'image' ? (
            <Image source={{ uri: mediaUri }} style={styles.mediaPreview} />
          ) : (
            <Video
              source={{ uri: mediaUri }}
              style={styles.mediaPreview}
              useNativeControls // Enable video controls
              resizeMode="contain" // Contain video within bounds
              shouldPlay
              isLooping={false}
            />
          )
        ) : null}

        {/* Button to pick or change media */}
        <TouchableOpacity onPress={handlePickMedia} style={styles.mediaButton}>
          <Text>{mediaUri ? 'Change Media' : 'Upload Photo/Video'}</Text>
        </TouchableOpacity>

        {/* Button to upload exercise */}
        <TouchableOpacity onPress={handleUploadExercise} style={styles.uploadButton}>
          <Text style={styles.uploadButtonText}>Upload Exercise</Text>
        </TouchableOpacity>

        {/* Display feedback message */}
        {feedbackMessage && (
          <Text style={styles.feedbackText}>{feedbackMessage}</Text>
        )}
      </ScrollView>
    </View>
  );
}

// Styles for UploadProgramScreen component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E5E5E5',
  },
  scrollViewContent: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    marginVertical: 10,
  },
  patientItem: {
    padding: 10,
    backgroundColor: '#FFFFFF', // White background for each patient item
    borderRadius: 5,
    marginBottom: 10,
  },
  selectedPatient: {
    backgroundColor: '#D3F9D8', // Highlight selected patient
  },
  input: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#CCCCCC', // Light border for inputs
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  datePickerButton: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#D3F9D8', // Light green for date picker button
    marginBottom: 10,
    alignItems: 'center',
  },
  datePickerWeb: {
    marginBottom: 10,
    width: '100%',
  },
  mediaButton: {
    padding: 15,
    borderRadius: 5,
    backgroundColor: '#D3D3D3', // Light grey for media button
    alignItems: 'center',
    marginBottom: 20,
  },
  mediaPreview: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
  },
  uploadButton: {
    padding: 15,
    borderRadius: 5,
    backgroundColor: '#004D40', // Dark green for upload button
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  feedbackText: {
    color: 'red', // Red text for feedback messages
    textAlign: 'center',
    marginTop: 10,
  },
});
