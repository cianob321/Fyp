// screens/AthleteDashboard.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { Menu, MenuOptions, MenuOption, MenuTrigger, MenuProvider } from 'react-native-popup-menu';
import { auth } from '../firebaseConfig'; // Import the Firebase authentication configuration
import { getDatabase, ref, get } from 'firebase/database'; // Import database functions from Firebase

export default function AthleteDashboard({ navigation }) {
  const [firstNameInitial, setFirstNameInitial] = useState(''); // State to store the initial of the user's first name

  useEffect(() => {
    const user = auth.currentUser; // Get the currently authenticated user
    if (user) {
      const db = getDatabase(); // Initialize Firebase database
      const userRef = ref(db, `athletes/${user.uid}`); // Reference to the athlete's data in the database

      // Fetch athlete data from the database
      get(userRef).then((snapshot) => {
        if (snapshot.exists()) {
          const userData = snapshot.val();
          setFirstNameInitial(userData.name.charAt(0).toUpperCase()); // Set the first initial of the user's name
        } else {
          setFirstNameInitial('A'); // Default initial if no data exists
        }
      }).catch((error) => {
        console.error('Error fetching user data:', error);
        setFirstNameInitial('A'); // Default initial if there's an error
      });

      Alert.alert('Success', 'You have registered successfully!'); // Show success alert on registration
    }
  }, []);

  // Function to handle user logout
  const handleLogout = () => {
    auth.signOut().then(() => {
      navigation.navigate('Login'); // Navigate to the Login screen after signing out
    }).catch((error) => {
      Alert.alert('Logout Error', error.message); // Show an error alert if logout fails
    });
  };

  return (
    <MenuProvider>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>Athlete Dashboard</Text>
          <Menu>
            <MenuTrigger>
              <View style={styles.profileIcon}>
                <Text style={styles.profileText}>{firstNameInitial || 'A'}</Text> {/* Display the user's initial */}
              </View>
            </MenuTrigger>
            <MenuOptions>
              <MenuOption onSelect={() => navigation.navigate('Settings')}>
                <Text style={styles.menuText}>Account Settings</Text>
              </MenuOption>
              <MenuOption onSelect={() => navigation.navigate('UpdateDetails')}>
                <Text style={styles.menuText}>Update Details</Text>
              </MenuOption>
              <MenuOption onSelect={() => navigation.navigate('Preferences')}>
                <Text style={styles.menuText}>Preferences</Text>
              </MenuOption>
              <MenuOption onSelect={handleLogout}>
                <Text style={[styles.menuText, { color: 'red' }]}>Logout</Text> {/* Logout option */}
              </MenuOption>
            </MenuOptions>
          </Menu>
        </View>

        {/* Main Content Section */}
        <View style={styles.mainContent}>
          {/* Athlete image */}
          <Image source={require('../assets/Athleteacc.jpeg')} style={styles.image} />
          <Text style={styles.description}>
            Welcome to your personalized dashboard! As an athlete, you can track your progress,
            schedule training, connect with peers, and gain feedback to help improve your performance.
          </Text>
          
          {/* Navigation buttons */}
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('AthleteProgramScreen', { athleteId: auth.currentUser.uid })}>
            <Text style={styles.buttonText}>View Training Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('SymptomLogScreen')}>
            <Text style={styles.buttonText}>Track Symptoms</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('ConnectWithPeers')}>
            <Text style={styles.buttonText}>Connect with Peers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('ChatWithPhysio')}>
            <Text style={styles.buttonText}>Chat with Physio</Text>
          </TouchableOpacity>
          {/* Navigate to ChatWithPhysioScreen with physioId */}
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('ChatWithPhysioScreen', { physioId: 'PHYSIO_ID' })}>
            <Text style={styles.buttonText}>Chat with Physio</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </MenuProvider>
  );
}

// Styles for the AthleteDashboard component
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F5F5', // Light background color
    padding: 20,
    flexGrow: 1,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#004D40', // Dark green color for title
  },
  profileIcon: {
    backgroundColor: '#004D40',
    borderRadius: 25,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileText: {
    color: '#FFFFFF', // White text color for profile icon
    fontSize: 18,
    fontWeight: 'bold',
  },
  mainContent: {
    alignItems: 'center',
    width: '100%',
  },
  image: {
    width: 300,
    height: 200,
    borderRadius: 10, // Rounded corners for the image
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#333333', // Dark text color for description
    textAlign: 'center',
    paddingHorizontal: 10,
    marginBottom: 30,
  },
  menuText: {
    padding: 10,
    fontSize: 16,
    color: '#004D40', // Text color for menu options
  },
  button: {
    backgroundColor: '#004D40', // Dark green color for buttons
    padding: 15,
    borderRadius: 5,
    marginVertical: 10,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF', // White text color for button text
    fontWeight: 'bold',
  },
});
