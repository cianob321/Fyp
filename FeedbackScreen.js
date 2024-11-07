// screens/FeedbackProgram.js
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av'; // Import video component from Expo for media display
import { getDatabase, ref, update } from 'firebase/database'; // Firebase database functions to update feedback
import { Ionicons } from '@expo/vector-icons'; // Icon package from Expo
import moment from 'moment'; // Moment.js for date handling

// Main component for submitting feedback on an exercise
export default function FeedbackProgram({ route, navigation }) {
  // Destructure route parameters to access exercise data and athlete ID
  const { exercise, athleteId } = route.params;

  // State for feedback input
  const [feedback, setFeedback] = useState(exercise.feedback || '');

  // State for pain level input
  const [painLevel, setPainLevel] = useState(exercise.painLevel || '');

  // State to manage video loading indicator
  const [loadingVideo, setLoadingVideo] = useState(false);

  // State to handle countdown timer (in seconds)
  const [countdown, setCountdown] = useState(exercise.timer * 60);

  // State to track whether the timer has started
  const [timerStarted, setTimerStarted] = useState(false);

  // Reference to the timer interval, so it can be cleared when needed
  const timerRef = useRef();

  // Effect to handle countdown timer logic
  useEffect(() => {
    if (timerStarted && countdown > 0) {
      // Start countdown if timer is active and time is remaining
      timerRef.current = setInterval(() => {
        setCountdown((prevCountdown) => prevCountdown - 1); // Decrement countdown every second
      }, 1000);
    } else if (countdown <= 0) {
      // Stop timer and alert user when countdown reaches zero
      clearInterval(timerRef.current);
      Alert.alert('Time is up!', 'Please submit your feedback.');
    }
    return () => clearInterval(timerRef.current); // Clean up interval on component unmount
  }, [timerStarted, countdown]);

  // Format countdown timer as "MM:SS"
  const formatCountdown = () => {
    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Start the countdown timer
  const handleStartTimer = () => {
    setTimerStarted(true); // Set timer as started
  };

  // Function to handle submitting feedback to Firebase
  const handleSubmitFeedback = async () => {
    try {
      const db = getDatabase();
      const exerciseRef = ref(db, `exercises/${athleteId}/${exercise.id}`); // Reference to exercise path in Firebase

      // Parse pain level input to integer, defaulting to 0 if invalid
      const parsedPainLevel = parseInt(painLevel, 10) || 0;

      console.log('Saving feedback to path:', exerciseRef.toString()); // Debugging output
      console.log('Feedback data:', { feedback, painLevel: parsedPainLevel });

      // Update exercise entry in Firebase with feedback, pain level, and status
      await update(exerciseRef, {
        feedback: feedback || 'No feedback provided', // Default message if feedback is empty
        painLevel: parsedPainLevel,
        status: 'completed', // Set status to completed
        completionDate: moment().format(), // Record completion date in ISO format
      });

      Alert.alert('Success', 'Feedback submitted successfully!');
      navigation.goBack(); // Return to AthleteProgramScreen
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Error', 'Failed to submit feedback.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Title */}
          <Text style={styles.title}>Exercise Feedback</Text>

          {/* Media Display: Show video or image based on media type */}
          {exercise.mediaUrl && (exercise.mediaUrl.endsWith('.mp4') || exercise.mediaUrl.endsWith('.mov')) ? (
            <>
              {loadingVideo && <ActivityIndicator size="large" color="#004D40" />} {/* Loading indicator for video */}
              <Video
                source={{ uri: exercise.mediaUrl }} // Video source from URL
                style={styles.media}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN} // Contain video within view
                shouldPlay={false}
                onLoadStart={() => setLoadingVideo(true)} // Show loading indicator
                onLoad={() => setLoadingVideo(false)} // Hide loading indicator
                onError={(e) => {
                  console.error('Video Error:', e); // Log video error
                  Alert.alert('Error', 'This video format may not be supported on all devices.');
                  setLoadingVideo(false);
                }}
              />
            </>
          ) : (
            // Display image if media is not a video
            <Image source={{ uri: exercise.mediaUrl }} style={styles.media} />
          )}

          {/* Countdown Timer Display */}
          <Text style={styles.timer}>Time Remaining: {formatCountdown()}</Text>

          {/* Start Timer Button */}
          {!timerStarted && (
            <TouchableOpacity style={styles.startButton} onPress={handleStartTimer}>
              <Text style={styles.startButtonText}>Start Timer</Text>
            </TouchableOpacity>
          )}

          {/* Pain Level Input */}
          <Text style={styles.label}>Pain Level (0-10):</Text>
          <TextInput
            style={styles.input}
            placeholder="Pain Level"
            value={painLevel}
            onChangeText={setPainLevel}
            keyboardType="numeric" // Numeric keyboard for pain level input
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss} // Dismiss keyboard on pressing "Done"
          />

          {/* Feedback Input */}
          <Text style={styles.label}>Your Feedback:</Text>
          <TextInput
            style={[styles.input, styles.feedbackInput]}
            placeholder="Describe your experience..."
            value={feedback}
            onChangeText={setFeedback}
            multiline // Multiline input for detailed feedback
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss} // Dismiss keyboard on pressing "Done"
          />

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmitFeedback} // Submit feedback
            disabled={!timerStarted || countdown <= 0} // Disable if timer hasn't started or has ended
          >
            <Text style={styles.submitButtonText}>Submit Feedback</Text>
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

// Styles for the FeedbackProgram component
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#E5E5E5', // Light background color
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  media: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
    resizeMode: 'contain', // Contain media within its view
  },
  timer: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
    color: '#333333',
  },
  startButton: {
    backgroundColor: '#4CAF50', // Green background for start timer button
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 10,
  },
  startButtonText: {
    color: '#FFFFFF', // White text color for start timer button
    fontWeight: 'bold',
    fontSize: 16,
  },
  label: {
    fontSize: 16,
    color: '#333333', // Dark text color for label
    marginVertical: 10,
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#CCCCCC', // Light grey border color
    borderRadius: 5,
    backgroundColor: '#FFFFFF', // White background color for input
    marginBottom: 10,
  },
  feedbackInput: {
    height: 100,
    textAlignVertical: 'top', // Align text to the top for feedback input
  },
  submitButton: {
    backgroundColor: '#1E90FF', // Blue background for submit button
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#FFFFFF', // White text color for submit button
    fontWeight: 'bold',
    fontSize: 16,
  },
});
