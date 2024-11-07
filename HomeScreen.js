// screens/HomeScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useBatteryLevel } from 'expo-battery'; // Hook to access battery level
import * as Location from 'expo-location'; // Location module to fetch user's location
import * as Device from 'expo-device'; // Device module to check device information

// Main component for the home screen
export default function HomeScreen({ navigation }) {
  const batteryLevel = useBatteryLevel(); // Retrieve the current battery level
  const [location, setLocation] = useState(null); // State to store user's location data
  const [errorMsg, setErrorMsg] = useState(null); // State for error message if location fails

  // Effect to fetch location on component mount
  useEffect(() => {
    (async () => {
      // Check if app is running on a real device, as location is not supported on Android Emulator
      if (Platform.OS === 'android' && !Device.isDevice) {
        setErrorMsg('Oops, this will not work on an Android Emulator. Try it on a device!');
        return;
      }

      // Request location permissions from the user
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied'); // Set error if permission is denied
        return;
      }

      // Fetch user's current location
      let location = await Location.getCurrentPositionAsync({});
      setLocation(location); // Set the location data in state
    })();
  }, []);

  // Display location or error message
  let locationText = 'Waiting...';
  if (errorMsg) {
    locationText = errorMsg;
  } else if (location) {
    locationText = `Latitude: ${location.coords.latitude}, Longitude: ${location.coords.longitude}`; // Format location data
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Logo Header */}
      <Image source={require('../assets/asclepius.png')} style={styles.logo} />
      
      {/* Header with Navigation */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Asclepius</Text>
        <View style={styles.nav}>
          {/* Navigation buttons */}
          <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.navLink}>
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Features')} style={styles.navLink}>
            <Text style={styles.navText}>Features</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Contact')} style={styles.navLink}>
            <Text style={styles.navText}>Contact</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.main}>
        <Text style={styles.mainTitle}>Asclepius Sports Rehabilitation App</Text>
        <Text style={styles.mainDescription}>
          Asclepius is an effective rehabilitation tracking application. Easily log, upload, and monitor progress.
          Communicate with professionals or other athletes through the community section. Schedule daily check-ins with your physio.
          Log pain levels, exercise details, and swelling for feedback.
        </Text>
        
        {/* Get Started Button */}
        <TouchableOpacity style={styles.getStartedButton} onPress={() => navigation.navigate('Register')}>
          <Text style={styles.getStartedText}>Get Started</Text>
        </TouchableOpacity>
        
        {/* Login Button */}
        <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>
      </View>

      {/* Information Section */}
      <View style={styles.infoSection}>
        <Text style={styles.infoText}>Current Battery Level: {Math.round(batteryLevel * 100)}%</Text>
        <Text style={styles.infoText}>Current Location: {locationText}</Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          © 2023 Asclepius. All rights reserved.
        </Text>
      </View>
    </ScrollView>
  );
}

// Styles for the HomeScreen component
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E5E5E5',  // Light grey background color for main container
    alignItems: 'center',
    padding: 20,
    flexGrow: 1,
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20, // Space between logo and header
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Space between title and navigation links
    alignItems: 'center',
    width: '100%',
    marginBottom: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#004D40',  // Dark green color for title
  },
  nav: {
    flexDirection: 'row',
  },
  navLink: {
    marginHorizontal: 10, // Space between navigation links
  },
  navText: {
    color: '#004D40',  // Dark green color for navigation text
    fontWeight: '600',
  },
  main: {
    alignItems: 'center',
    marginBottom: 40,
  },
  mainTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#004D40',  // Dark green color for main title
    marginBottom: 10,
  },
  mainDescription: {
    color: '#333333',  // Dark grey for main description text
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  getStartedButton: {
    backgroundColor: '#004D40',  // Match the dark green from the title and logo
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 10,  // Space between Get Started and Login buttons
  },
  getStartedText: {
    color: '#FFFFFF',  // White text color for button text
    fontWeight: 'bold',
  },
  loginButton: {
    backgroundColor: '#004D40',  // Consistent green with Get Started button
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  loginButtonText: {
    color: '#FFFFFF',  // White text for button text
    fontWeight: 'bold',
  },
  infoSection: {
    alignItems: 'center',
    marginBottom: 20, // Space between info and footer
  },
  infoText: {
    color: '#333333',  // Dark grey color for battery and location info text
    fontSize: 16,
    marginVertical: 5,
  },
  footer: {
    borderTopWidth: 1, // Border for footer separation
    borderTopColor: '#CCCCCC',  // Light grey border color for footer
    paddingVertical: 20,
    marginTop: 30, // Space above footer
    alignItems: 'center',
    width: '100%',
  },
  footerText: {
    color: '#555555',  // Mid-tone grey color for footer text
    fontSize: 14,
    textAlign: 'center',
  },
});
