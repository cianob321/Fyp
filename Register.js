// screens/Register.js
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

// Main component for selecting registration type (Physio or Athlete)
export default function Register({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Page Title */}
      <Text style={styles.title}>Register as:</Text>

      {/* Container for registration cards */}
      <View style={styles.imageContainer}>
        {/* Physio Registration Card */}
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('PhysioReg')}>
          <Image source={require('../assets/physio.jpeg')} style={styles.image} /> {/* Image for Physio */}
          <Text style={styles.cardTitle}>Physio</Text> {/* Card title for Physio */}
          <Text style={styles.cardDescription}>
            Register as a Physio to help athletes track their rehabilitation progress, provide guidance, and monitor performance.
          </Text>
        </TouchableOpacity>

        {/* Athlete Registration Card */}
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('AthleteReg')}>
          <Image source={require('../assets/athlete.jpeg')} style={styles.image} /> {/* Image for Athlete */}
          <Text style={styles.cardTitle}>Athlete</Text> {/* Card title for Athlete */}
          <Text style={styles.cardDescription}>
            Register as an Athlete to log your progress, communicate with your physio, and receive a customized rehabilitation program.
          </Text>
        </TouchableOpacity>
      </View>

      {/* Back Button */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backButtonText}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  );
}

// Styles for Register component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E5E5E5', // Light background color for the screen
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#004D40', // Dark green color for title
    marginBottom: 30, // Space below title
  },
  imageContainer: {
    flexDirection: 'row', // Arrange cards in a row
    justifyContent: 'space-between', // Space between cards
    width: '100%',
    marginBottom: 30, // Space below cards
  },
  card: {
    width: '45%', // Each card takes 45% of container width
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#FFFFFF', // White background color for cards
    borderRadius: 10,
    shadowColor: '#000', // Shadow for card
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5, // Shadow elevation for Android
  },
  image: {
    width: 100,
    height: 100,
    marginBottom: 10, // Space between image and text
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#004D40', // Dark green color for card title
    textAlign: 'center',
    marginBottom: 5, // Space below card title
  },
  cardDescription: {
    fontSize: 14,
    color: '#333333', // Dark grey for description text
    textAlign: 'center',
  },
  backButton: {
    marginTop: 20, // Space above back button
  },
  backButtonText: {
    color: '#004D40', // Dark green color for back button text
    fontWeight: '600',
  },
});
