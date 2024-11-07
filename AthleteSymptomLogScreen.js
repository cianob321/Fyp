// screens/AthleteSymptomLogScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Image,
} from 'react-native';
import { getDatabase, ref, get } from 'firebase/database'; // Firebase database methods to fetch symptom logs
import { auth } from '../firebaseConfig'; // Import Firebase authentication configuration
import moment from 'moment'; // Moment.js for formatting timestamps

// Main screen component for displaying an athlete's symptom logs
export default function AthleteSymptomLogScreen({ route, navigation }) {
  // Extract athleteId and athleteName from route parameters
  const { athleteId, athleteName } = route.params;

  // State to hold symptom logs
  const [symptomLogs, setSymptomLogs] = useState([]);
  
  // State to manage full-screen image URL
  const [fullscreenImage, setFullscreenImage] = useState(null);
  
  // State to control modal visibility for full-screen images
  const [modalVisible, setModalVisible] = useState(false);

  // Fetch symptom logs when the component mounts
  useEffect(() => {
    fetchAthleteSymptomLogs();
  }, []);

  // Function to retrieve symptom logs from Firebase Realtime Database
  const fetchAthleteSymptomLogs = async () => {
    const db = getDatabase(); // Initialize Firebase Realtime Database
    const logsRef = ref(db, `symptomLogs/${athleteId}`); // Reference path for symptom logs

    const snapshot = await get(logsRef); // Fetch data from the specified path
    if (snapshot.exists()) {
      const data = snapshot.val();
      
      // Transform data into an array, sort logs by timestamp (most recent first)
      const logsArray = Object.keys(data)
        .map((key) => ({
          id: key, // Unique log entry ID
          ...data[key], // Spread other data fields (timestamp, description, etc.)
        }))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort by timestamp in descending order
      setSymptomLogs(logsArray); // Update state with fetched symptom logs
    }
  };

  return (
    <View style={styles.container}>
      {/* Title displaying athlete's name */}
      <Text style={styles.title}>Logged Symptoms for {athleteName}</Text>

      {/* FlatList to render each symptom log */}
      <FlatList
        data={symptomLogs} // Data source for the list
        keyExtractor={(item) => item.id} // Unique key for each log item
        renderItem={({ item }) => (
          <View style={styles.logItem}>
            {/* Timestamp of the log formatted using moment.js */}
            <Text style={styles.date}>{moment(item.timestamp).format('MMMM Do YYYY, h:mm a')}</Text>
            {/* Symptom description */}
            <Text style={styles.description}>Symptom: {item.symptomDescription}</Text>
            {/* Pain level of the symptom */}
            <Text style={styles.painLevel}>Pain Level: {item.painLevel}</Text>

            {/* If there's an image (media URL), display it as a thumbnail */}
            {item.mediaUrl && (
              <TouchableOpacity onPress={() => { setFullscreenImage(item.mediaUrl); setModalVisible(true); }}>
                <Image source={{ uri: item.mediaUrl }} style={styles.thumbnail} />
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={<Text>No symptom logs available for this athlete.</Text>} // Message when no logs are available
      />

      {/* Modal to display a full-screen image when a thumbnail is clicked */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          {/* Full-screen image */}
          <Image source={{ uri: fullscreenImage }} style={styles.fullscreenImage} />
          {/* Close button to exit full-screen image view */}
          <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

// Styles for AthleteSymptomLogScreen component elements
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5', // Light background color
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#004D40', // Dark green title color
    marginBottom: 20,
  },
  logItem: {
    backgroundColor: '#FFFFFF', // White background for each log item
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  date: {
    fontSize: 14,
    color: '#666', // Grey color for date text
    marginBottom: 5,
  },
  description: {
    fontSize: 16,
    color: '#333', // Dark grey color for description text
  },
  painLevel: {
    fontSize: 16,
    color: '#333', // Dark grey color for pain level text
    marginBottom: 10,
  },
  thumbnail: {
    width: 100,
    height: 100,
    borderRadius: 5,
    marginTop: 10,
    marginBottom: 15,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)', // Dark overlay for modal background
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '90%',
    height: '70%',
    borderRadius: 10,
    resizeMode: 'contain', // Contain image without stretching
  },
  closeButton: {
    backgroundColor: '#FFFFFF', // White background for close button
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  closeButtonText: {
    color: '#333', // Dark color for close button text
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
