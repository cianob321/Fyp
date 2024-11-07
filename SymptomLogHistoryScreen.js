// screens/SymptomLogHistoryScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import { getDatabase, ref, get, remove, update } from 'firebase/database'; // Firebase functions for data management
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'; // Firebase storage for media uploads
import * as ImagePicker from 'expo-image-picker'; // Expo image picker for selecting media
import { auth } from '../firebaseConfig'; // Firebase configuration
import moment from 'moment'; // Moment.js for date formatting

// Main component to display and manage symptom logs
export default function SymptomLogHistoryScreen({ navigation }) {
  // State for storing symptom logs data
  const [symptomLogs, setSymptomLogs] = useState([]);

  // State for managing fullscreen image view in modal
  const [fullscreenImage, setFullscreenImage] = useState(null);

  // State for controlling visibility of image and edit modals
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  // State to handle editing of symptom logs
  const [editDescription, setEditDescription] = useState('');
  const [editPainLevel, setEditPainLevel] = useState('');
  const [currentEditLogId, setCurrentEditLogId] = useState(null);

  // Fetch symptom logs on component mount
  useEffect(() => {
    fetchSymptomLogs(); // Fetch existing logs from Firebase
  }, []);

  // Fetch symptom logs from Firebase Realtime Database
  const fetchSymptomLogs = async () => {
    const user = auth.currentUser; // Get current user
    const db = getDatabase();
    const logsRef = ref(db, `symptomLogs/${user.uid}`); // Reference to user's symptom logs

    const snapshot = await get(logsRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      const logsArray = Object.keys(data)
        .map((key) => ({
          id: key,
          ...data[key],
        }))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort logs by timestamp
      setSymptomLogs(logsArray);
    }
  };

  // Function to delete a symptom log
  const handleDelete = (id) => {
    const db = getDatabase();
    const logRef = ref(db, `symptomLogs/${auth.currentUser.uid}/${id}`);
    const logToDelete = symptomLogs.find((log) => log.id === id);

    // Delete media associated with the log, if any
    if (logToDelete.mediaUrl) {
      const storage = getStorage();
      const fileRef = storageRef(storage, logToDelete.mediaUrl);
      deleteObject(fileRef).catch((error) => console.error('Error deleting file from storage:', error));
    }

    // Remove the log entry from Firebase Realtime Database
    remove(logRef)
      .then(() => {
        setSymptomLogs((prevLogs) => prevLogs.filter((log) => log.id !== id)); // Update UI to remove deleted log
        Alert.alert('Deleted', 'Symptom log deleted successfully.');
      })
      .catch((error) => console.error('Error deleting log:', error));
  };

  // Function to open edit modal and prefill with selected log data
  const openEditModal = (log) => {
    setCurrentEditLogId(log.id); // Set current log ID for editing
    setEditDescription(log.symptomDescription);
    setEditPainLevel(log.painLevel);
    setEditModalVisible(true); // Show edit modal
  };

  // Function to save edited log changes
  const handleSaveEdit = () => {
    const db = getDatabase();
    const logRef = ref(db, `symptomLogs/${auth.currentUser.uid}/${currentEditLogId}`);

    // Update log details in Firebase
    update(logRef, {
      symptomDescription: editDescription,
      painLevel: editPainLevel,
      timestamp: new Date().toISOString(), // Update timestamp to current time
    })
    .then(() => {
      Alert.alert('Updated', 'Symptom log updated successfully.');
      fetchSymptomLogs(); // Refresh logs after update
      setEditModalVisible(false); // Hide edit modal
    })
    .catch((error) => console.error('Error updating log:', error));
  };

  // Function to replace an image for a specific log
  const handleReplaceImage = async (log) => {
    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const newMediaUri = result.assets[0].uri; // Get new image URI
      const storage = getStorage();
      const fileRef = storageRef(storage, `symptoms/${auth.currentUser.uid}/${Date.now()}`);
      const response = await fetch(newMediaUri);
      const blob = await response.blob();

      await uploadBytes(fileRef, blob); // Upload new image to Firebase storage
      const newMediaUrl = await getDownloadURL(fileRef);

      const db = getDatabase();
      const logRef = ref(db, `symptomLogs/${auth.currentUser.uid}/${log.id}`);
      await update(logRef, { mediaUrl: newMediaUrl }); // Update log entry with new image URL

      // Delete old image from storage if it exists
      if (log.mediaUrl) {
        const oldFileRef = storageRef(storage, log.mediaUrl);
        deleteObject(oldFileRef).catch((error) => console.error('Error deleting old file:', error));
      }

      // Update UI with new image URL
      setSymptomLogs((prevLogs) =>
        prevLogs.map((item) =>
          item.id === log.id ? { ...item, mediaUrl: newMediaUrl } : item
        )
      );

      Alert.alert('Success', 'Image replaced successfully.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Symptom Log History</Text>
      <FlatList
        data={symptomLogs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.logItem}>
            <Text style={styles.date}>{moment(item.timestamp).format('MMMM Do YYYY, h:mm a')}</Text>
            <Text style={styles.description}>Symptom: {item.symptomDescription}</Text>
            <Text style={styles.painLevel}>Pain Level: {item.painLevel}</Text>

            {/* Display media if available */}
            {item.mediaUrl && (
              <TouchableOpacity onPress={() => { setFullscreenImage(item.mediaUrl); setModalVisible(true); }}>
                <Image source={{ uri: item.mediaUrl }} style={styles.thumbnail} />
              </TouchableOpacity>
            )}

            {/* Edit, Replace Image, and Delete buttons */}
            <TouchableOpacity style={styles.editButton} onPress={() => openEditModal(item)}>
              <Text style={styles.buttonText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.replaceButton} onPress={() => handleReplaceImage(item)}>
              <Text style={styles.buttonText}>Replace Image</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
              <Text style={styles.buttonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text>No symptom logs available.</Text>} // Show message if no logs
      />

      {/* Fullscreen Image Modal */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <Image source={{ uri: fullscreenImage }} style={styles.fullscreenImage} />
          <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Edit Symptom Modal */}
      <Modal visible={editModalVisible} transparent={true} animationType="slide">
        <View style={styles.editModalContainer}>
          <Text style={styles.modalTitle}>Edit Symptom Log</Text>
          <TextInput
            style={styles.input}
            placeholder="Edit Symptom Description"
            value={editDescription}
            onChangeText={setEditDescription}
          />
          <TextInput
            style={styles.input}
            placeholder="Edit Pain Level"
            value={editPainLevel}
            onChangeText={setEditPainLevel}
            keyboardType="numeric"
          />
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveEdit}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={() => setEditModalVisible(false)}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

// Styles for the SymptomLogHistoryScreen component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#004D40',
    marginBottom: 20,
  },
  logItem: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  description: {
    fontSize: 16,
    color: '#333',
  },
  painLevel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  thumbnail: {
    width: 100,
    height: 100,
    borderRadius: 5,
    marginTop: 10,
    marginBottom: 15,
  },
  editButton: {
    backgroundColor: '#005D6C',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  replaceButton: {
    backgroundColor: '#FFA500',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  deleteButton: {
    backgroundColor: '#FF6347',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '90%',
    height: '70%',
    borderRadius: 10,
    resizeMode: 'contain',
  },
  closeButton: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
    alignSelf: 'center',
  },
  closeButtonText: {
    color: '#333',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  editModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  saveButton: {
    backgroundColor: '#005D6C',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
