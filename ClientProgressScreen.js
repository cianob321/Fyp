// screens/ClientProgressScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  Image,
  ScrollView,
} from 'react-native';
import { getDatabase, ref, get } from 'firebase/database'; // Firebase database methods to retrieve client and exercise data
import moment from 'moment'; // Moment.js for date formatting
import { Video } from 'expo-av'; // Expo Video component for media display

// Main component for displaying client progress and exercise history
export default function ClientProgressScreen({ navigation }) {
  // State to store the list of clients (athletes)
  const [clients, setClients] = useState([]);
  
  // State to store the currently selected client
  const [selectedClient, setSelectedClient] = useState(null);
  
  // State to store exercises for the selected client
  const [exercises, setExercises] = useState([]);
  
  // State to manage the current view type (completed or uncompleted exercises)
  const [viewType, setViewType] = useState('completed');
  
  // State to store media URI for full-screen display
  const [mediaUri, setMediaUri] = useState(null);
  
  // State to identify the type of media (image or video) for full-screen display
  const [mediaType, setMediaType] = useState(null);

  // Fetch client (athlete) data from Firebase when the component mounts
  useEffect(() => {
    const db = getDatabase();
    const clientsRef = ref(db, 'athletes'); // Reference path for athletes data

    get(clientsRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const clientList = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));
          setClients(clientList); // Update state with the list of clients
        }
      })
      .catch((error) => {
        console.error('Error fetching clients:', error); // Log error in console
      });
  }, []);

  // Function to handle selecting a client and fetching their exercises
  const handleSelectClient = (client, type) => {
    setSelectedClient(client); // Set the currently selected client
    setViewType(type); // Set view type to either 'completed' or 'uncompleted'

    // Reference to the selected client's exercises in Firebase
    const db = getDatabase();
    const exercisesRef = ref(db, `exercises/${client.id}`);

    get(exercisesRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const exerciseList = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));

          // Filter exercises based on completion status
          const filteredExercises = exerciseList.filter((exercise) =>
            type === 'completed'
              ? exercise.status === 'completed'
              : exercise.status !== 'completed'
          );

          // Sort exercises by completion date in descending order
          setExercises(
            filteredExercises.sort(
              (a, b) => new Date(b.completionDate) - new Date(a.completionDate)
            )
          );
        } else {
          setExercises([]); // Clear exercises if no data is available
        }
      })
      .catch((error) => {
        console.error('Error fetching exercises:', error);
        Alert.alert('Error', 'Failed to fetch exercises.'); // Show alert on error
      });
  };

  // Open media (image or video) in a full-screen modal
  const openMediaModal = (uri, type) => {
    setMediaUri(uri); // Set the URI for full-screen media
    setMediaType(type); // Set the media type
  };

  // Close the media modal
  const closeMediaModal = () => {
    setMediaUri(null); // Clear media URI
    setMediaType(null); // Clear media type
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Client Progress</Text>

      {/* Display list of clients if no client is selected */}
      {!selectedClient ? (
        <>
          <Text style={styles.label}>Select a Client:</Text>
          <FlatList
            data={clients} // Data source for client list
            keyExtractor={(item) => item.id} // Unique key for each client
            renderItem={({ item }) => (
              <View style={styles.clientItem}>
                <Text style={styles.clientName}>{item.name}</Text>
                {/* Button to view completed exercises */}
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() => handleSelectClient(item, 'completed')}
                >
                  <Text style={styles.buttonText}>View Completed</Text>
                </TouchableOpacity>
                {/* Button to view uncompleted exercises */}
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() => handleSelectClient(item, 'uncompleted')}
                >
                  <Text style={styles.buttonText}>View Uncompleted</Text>
                </TouchableOpacity>
                {/* Button to navigate to the athlete's symptom logs */}
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() =>
                    navigation.navigate('AthleteSymptomLogScreen', {
                      athleteId: item.id,
                      athleteName: item.name,
                    })
                  }
                >
                  <Text style={styles.buttonText}>View Logged Symptoms</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={<Text>No clients found.</Text>} // Message when no clients are available
          />
        </>
      ) : (
        // Display exercises for the selected client
        <ScrollView style={styles.scrollView}>
          <Text style={styles.sectionTitle}>
            {viewType === 'completed'
              ? `Completed Workouts for ${selectedClient.name}`
              : `Uncompleted Workouts for ${selectedClient.name}`}
          </Text>
          <FlatList
            data={exercises} // Data source for exercises list
            keyExtractor={(item) => item.id} // Unique key for each exercise
            renderItem={({ item }) => (
              <View style={styles.exerciseItem}>
                {/* Exercise title and completion date */}
                <Text style={styles.exerciseTitle}>{item.title}</Text>
                <Text>Date: {moment(item.completionDate).format('MMMM Do, YYYY')}</Text>

                {/* Button to view media if available */}
                {item.mediaUrl && (
                  <TouchableOpacity
                    onPress={() => openMediaModal(item.mediaUrl, item.mediaType)}
                    style={styles.mediaButton}
                  >
                    <Text style={styles.mediaButtonText}>View Media</Text>
                  </TouchableOpacity>
                )}

                {/* Display rating and feedback if the exercise is completed */}
                {viewType === 'completed' && (
                  <>
                    <Text>Rating: {item.rating}/10</Text>
                    <Text>Feedback: {item.feedback}</Text>
                  </>
                )}
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyMessage}>
                {viewType === 'completed'
                  ? 'No completed exercises for this client.'
                  : 'No uncompleted exercises for this client.'}
              </Text>
            }
          />
          {/* Button to go back to the client list */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedClient(null)}
          >
            <Text style={styles.buttonText}>Back to Client List</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Modal for full-screen media display */}
      <Modal visible={!!mediaUri} transparent={true} onRequestClose={closeMediaModal}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Display image or video based on media type */}
            {mediaType === 'image' ? (
              <Image source={{ uri: mediaUri }} style={styles.fullscreenMedia} />
            ) : (
              <Video
                source={{ uri: mediaUri }}
                style={styles.fullscreenMedia}
                useNativeControls
                resizeMode="contain"
                shouldPlay
              />
            )}
            {/* Button to close the full-screen media modal */}
            <TouchableOpacity onPress={closeMediaModal} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Styles for ClientProgressScreen component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5', // Light background color
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    marginBottom: 10,
  },
  clientItem: {
    backgroundColor: '#FFFFFF', // White background for client item
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  viewButton: {
    backgroundColor: '#004D40', // Dark green button color
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF', // White text color for button
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  exerciseItem: {
    backgroundColor: '#DFF2E1', // Light green background for exercise item
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  mediaButton: {
    backgroundColor: '#2196F3', // Blue button for viewing media
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  mediaButtonText: {
    color: '#FFFFFF', // White text color for media button
    fontWeight: 'bold',
  },
  emptyMessage: {
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 16,
    color: '#666', // Grey color for empty message text
  },
  backButton: {
    backgroundColor: '#004D40',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Dark overlay for modal background
  },
  modalContent: {
    width: '90%',
    height: '80%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenMedia: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFFFFF', // White background for close button
    padding: 10,
    borderRadius: 20,
  },
  closeButtonText: {
    color: '#000', // Black text color for close button
    fontWeight: 'bold',
  },
});
