import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { getDatabase, ref, get, update } from 'firebase/database'; // Firebase database functions
import moment from 'moment'; // Moment.js for date formatting
import { Video, ResizeMode } from 'expo-av'; // Video component from Expo AV for handling video media
import { Ionicons } from '@expo/vector-icons'; // Ionicons for icons
import Modal from 'react-native-modal'; // Modal component for full-screen images
import { getStorage, ref as storageRef, getDownloadURL } from 'firebase/storage'; // Firebase storage functions
import { useFocusEffect } from '@react-navigation/native'; // Hook to trigger effects when the screen is focused

// Component for each individual exercise item
const ExerciseItem = ({
  item,
  isCompleted,
  isExpired,
  onSaveFeedback,
  onStartExercise,
  openFullscreenImage,
}) => {
  const [feedback, setFeedback] = useState(item.feedback || ''); // State for feedback text
  const [rating, setRating] = useState(item.rating || ''); // State for rating
  const [loadingVideo, setLoadingVideo] = useState(false); // State for video loading indicator

  // Save feedback and rating for the exercise
  const handleSave = () => {
    if (onSaveFeedback) {
      onSaveFeedback(item.id, feedback, rating); // Trigger parent function to save feedback
    }
  };

  return (
    <View style={[styles.exerciseItem, isExpired && styles.expiredExerciseItem]}>
      {/* Exercise title and expiration info */}
      <Text style={[styles.exerciseTitle, isExpired && styles.expiredText]}>
        {item.title}{' '}
        {isExpired ? `(Expired on ${moment(item.completionDate).format('MMMM Do, YYYY')})` : ''}
      </Text>

      {/* Display media (video or image) if available */}
      {item.mediaUrl && (item.mediaUrl.endsWith('.mp4') || item.mediaUrl.endsWith('.mov')) ? (
        <>
          {loadingVideo && <ActivityIndicator size="large" color="#004D40" />}
          <Video
            key={item.mediaUrl}
            source={{ uri: item.mediaUrl }}
            style={styles.fullMedia}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={false}
            onLoadStart={() => setLoadingVideo(true)}
            onLoad={() => setLoadingVideo(false)}
            onError={(e) => {
              console.error('Video Error:', e);
              Alert.alert('Error', 'This video format may not be supported on all devices.');
              setLoadingVideo(false);
            }}
          />
        </>
      ) : (
        item.mediaUrl && (
          <TouchableOpacity onPress={() => openFullscreenImage(item.mediaUrl)}>
            <Image source={{ uri: item.mediaUrl }} style={styles.fullMedia} />
          </TouchableOpacity>
        )
      )}

      {/* Display timer info */}
      <Text>Timer: {item.timer} minutes</Text>

      {/* Display feedback and rating input fields if exercise is completed */}
      {isCompleted ? (
        <>
          <Text style={styles.feedbackLabel}>Edit Feedback:</Text>
          <TextInput
            style={styles.input}
            placeholder="Feedback"
            value={feedback}
            onChangeText={setFeedback}
            multiline
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss} // Dismiss keyboard on "Done"
          />
          <Text style={styles.feedbackLabel}>Rating:</Text>
          <TextInput
            style={styles.input}
            placeholder="Rate out of 10"
            value={rating}
            onChangeText={setRating}
            keyboardType="numeric"
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
          >
            <Text style={styles.buttonText}>Save Feedback</Text>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity style={styles.startButton} onPress={() => onStartExercise(item)}>
          <Text style={styles.buttonText}>Start</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Main screen component for displaying the athlete's training program
export default function AthleteProgramScreen({ route, navigation }) {
  const [exercises, setExercises] = useState([]); // State for the list of exercises
  const [fullscreenImageUri, setFullscreenImageUri] = useState(''); // State for the full-screen image URI
  const [isImageModalVisible, setIsImageModalVisible] = useState(false); // State for image modal visibility
  const [showCompletedExercises, setShowCompletedExercises] = useState(false); // Toggle state for completed exercises

  const { athleteId } = route.params; // Get the athlete's ID from route parameters

  // Fetch exercises from Firebase database
  const fetchExercises = async () => {
    const db = getDatabase();
    const exercisesRef = ref(db, `exercises/${athleteId}`);

    try {
      const snapshot = await get(exercisesRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const exerciseList = await Promise.all(
          Object.keys(data).map(async (key) => {
            const exercise = data[key];
            if (exercise.mediaUrl && !exercise.mediaUrl.startsWith('http')) {
              const downloadUrl = await getDownloadURL(storageRef(getStorage(), exercise.mediaUrl));
              return { id: key, ...exercise, mediaUrl: downloadUrl };
            }
            return { id: key, ...exercise };
          })
        );
        setExercises(exerciseList);
      }
    } catch (error) {
      console.error('Error fetching exercises:', error);
    }
  };

  // Automatically refresh data when the screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchExercises(); // Fetch exercises when the screen is focused
    }, [athleteId])
  );

  // Save feedback for a specific exercise
  const handleSaveFeedback = async (exerciseId, newFeedback, newRating) => {
    try {
      const db = getDatabase();
      const exerciseRef = ref(db, `exercises/${athleteId}/${exerciseId}`);
      await update(exerciseRef, {
        feedback: newFeedback,
        rating: newRating,
      });
      Alert.alert('Success', 'Feedback updated successfully!');
      setExercises((prevExercises) =>
        prevExercises.map((exercise) =>
          exercise.id === exerciseId ? { ...exercise, feedback: newFeedback, rating: newRating } : exercise
        )
      );
    } catch (error) {
      console.error('Error updating feedback:', error);
      Alert.alert('Error', 'Failed to update feedback.');
    }
  };

  // Open image in full-screen mode
  const openFullscreenImage = (uri) => {
    setFullscreenImageUri(uri);
    setIsImageModalVisible(true);
  };

  // Start the selected exercise and navigate to the feedback screen
  const handleStartExercise = (exercise) => {
    navigation.navigate('FeedbackScreen', { exercise, athleteId });
  };

  // Group exercises by date and status (completed or upcoming)
  const groupedExercises = exercises.reduce(
    (groups, exercise) => {
      const dueDate = moment(exercise.completionDate).format('YYYY-MM-DD');
      const category = exercise.status === 'completed' ? 'completed' : 'upcoming';

      if (!groups[category][dueDate]) {
        groups[category][dueDate] = [];
      }
      groups[category][dueDate].push(exercise);
      return groups;
    },
    { completed: {}, upcoming: {} }
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Your Training Schedule</Text>

          {/* Display upcoming exercises grouped by date */}
          {Object.keys(groupedExercises.upcoming).map((date) => (
            <View key={date}>
              <Text style={styles.sectionTitle}>
                {moment(date).isSame(moment(), 'day') ? "Today's Workout" : `Workout for ${moment(date).format('MMMM Do, YYYY')}`}
              </Text>
              {groupedExercises.upcoming[date].map((item) => (
                <ExerciseItem
                  key={item.id}
                  item={item}
                  isCompleted={false}
                  isExpired={moment(item.completionDate).isBefore(moment(), 'day')}
                  onSaveFeedback={handleSaveFeedback}
                  onStartExercise={handleStartExercise}
                  openFullscreenImage={openFullscreenImage}
                />
              ))}
              {groupedExercises.upcoming[date].length === 0 && <Text>No upcoming exercises for this day.</Text>}
            </View>
          ))}

          {/* Button to toggle completed exercises view */}
          <TouchableOpacity
            style={styles.toggleCompletedButton}
            onPress={() => setShowCompletedExercises(!showCompletedExercises)}
          >
            <Text style={styles.toggleButtonText}>
              {showCompletedExercises ? 'Hide Completed Exercises' : 'Show Completed Exercises'}
            </Text>
          </TouchableOpacity>

          {/* Display completed exercises if toggle is enabled */}
          {showCompletedExercises && (
            Object.keys(groupedExercises.completed).map((date) => (
              <View key={date}>
                <Text style={styles.sectionTitle}>Completed on {moment(date).format('MMMM Do, YYYY')}</Text>
                {groupedExercises.completed[date].map((item) => (
                  <ExerciseItem
                    key={item.id}
                    item={item}
                    isCompleted={true}
                    isExpired={moment(item.completionDate).isBefore(moment(), 'day')}
                    onSaveFeedback={handleSaveFeedback}
                    onStartExercise={handleStartExercise}
                    openFullscreenImage={openFullscreenImage}
                  />
                ))}
                {groupedExercises.completed[date].length === 0 && <Text>No completed exercises for this day.</Text>}
              </View>
            ))
          )}

          {/* Modal for displaying full-screen images */}
          <Modal isVisible={isImageModalVisible} onBackdropPress={() => setIsImageModalVisible(false)}>
            <View style={styles.fullscreenImageContainer}>
              <Image source={{ uri: fullscreenImageUri }} style={styles.fullscreenImage} />
              <TouchableOpacity style={styles.closeButton} onPress={() => setIsImageModalVisible(false)}>
                <Ionicons name="close" size={30} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </Modal>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

// Styles for the AthleteProgramScreen component
const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#E5E5E5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#333333',
  },
  toggleCompletedButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    marginVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  toggleButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  exerciseItem: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 5,
    elevation: 3,
  },
  expiredExerciseItem: {
    borderColor: 'red',
    borderWidth: 1,
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333333',
  },
  expiredText: {
    color: 'red',
  },
  fullMedia: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
    resizeMode: 'contain',
  },
  startButton: {
    backgroundColor: '#004D40',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButton: {
    backgroundColor: '#1E90FF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  feedbackLabel: {
    fontSize: 16,
    color: '#333',
    marginTop: 10,
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  fullscreenImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  fullscreenImage: {
    width: '100%',
    height: '80%',
    resizeMode: 'contain',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 5,
    borderRadius: 15,
  },
});
