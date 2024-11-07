// screens/PhysioDashboard.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Menu, MenuOptions, MenuOption, MenuTrigger, MenuProvider } from 'react-native-popup-menu'; // Popup menu for account options
import { auth } from '../firebaseConfig'; // Firebase configuration for authentication
import { getDatabase, ref, get } from 'firebase/database'; // Firebase Realtime Database functions

// Main component for the physio dashboard
export default function PhysioDashboard({ navigation }) {
  // State to store initial letter of the physio's name
  const [initial, setInitial] = useState('');

  // State to store list of athletes assigned to the physio
  const [athletes, setAthletes] = useState([]);

  // State to control visibility of athlete list section
  const [showAthleteList, setShowAthleteList] = useState(false);

  // Effect to fetch physio's name initial from Firebase when the component mounts
  useEffect(() => {
    const user = auth.currentUser; // Get current authenticated user
    if (user) {
      const db = getDatabase();
      const userRef = ref(db, `physios/${user.uid}`); // Reference to physio's data in Firebase

      get(userRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.val();
            setInitial(userData.name.charAt(0).toUpperCase()); // Extract and set initial from the user's name
          } else {
            setInitial('P'); // Default to 'P' if no data found
          }
        })
        .catch((error) => {
          console.error('Error fetching user data:', error); // Log error
          setInitial('P'); // Set default initial in case of error
        });

      Alert.alert('Success', 'You have registered successfully!');
    }
  }, []);

  // Function to fetch athletes list from Firebase
  const fetchAthletes = () => {
    const db = getDatabase();
    const athletesRef = ref(db, 'athletes'); // Reference to the 'athletes' section in Firebase

    get(athletesRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const athleteList = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));
          setAthletes(athleteList); // Set the list of athletes in state
          setShowAthleteList(true); // Show athlete list section
        }
      })
      .catch((error) => {
        console.error('Error fetching athletes:', error);
      });
  };

  // Function to handle selection of an athlete, navigating to ChatWithAthleteScreen
  const handleAthleteClick = (athlete) => {
    navigation.navigate('ChatWithAthleteScreen', { athleteId: athlete.id });
  };

  // Function to handle user logout
  const handleLogout = () => {
    auth.signOut()
      .then(() => {
        navigation.navigate('Login'); // Redirect to Login screen
      })
      .catch((error) => {
        Alert.alert('Logout Error', error.message); // Show alert on logout error
      });
  };

  return (
    <MenuProvider>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header with profile icon and dropdown menu */}
        <View style={styles.header}>
          <Menu>
            <MenuTrigger>
              <View style={styles.profileIcon}>
                <Text style={styles.profileInitial}>{initial}</Text> {/* Display initial */}
              </View>
            </MenuTrigger>
            <MenuOptions>
              <MenuOption onSelect={() => navigation.navigate('EditProfile')}>
                <Text style={styles.menuText}>Edit Profile</Text>
              </MenuOption>
              <MenuOption onSelect={() => navigation.navigate('AccountPreferences')}>
                <Text style={styles.menuText}>Account Preferences</Text>
              </MenuOption>
              <MenuOption onSelect={handleLogout}>
                <Text style={[styles.menuText, { color: 'red' }]}>Logout</Text>
              </MenuOption>
            </MenuOptions>
          </Menu>
        </View>

        {/* Dashboard image */}
        <Image source={require('../assets/physioacc.jpeg')} style={styles.image} />

        {/* Dashboard description */}
        <Text style={styles.description}>
          Welcome to your dashboard. Manage patients, upload programs, and stay connected with them.
        </Text>

        {/* Buttons for main dashboard functionalities */}
        <TouchableOpacity style={styles.button} onPress={fetchAthletes}>
          <Text style={styles.buttonText}>View Patient List</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('UploadProgram')}>
          <Text style={styles.buttonText}>Upload Programs</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={fetchAthletes}>
          <Text style={styles.buttonText}>Contact Patients</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('ClientProgress')}>
          <Text style={styles.buttonText}>View Client Progress</Text>
        </TouchableOpacity>

        {/* Athlete list displayed conditionally based on showAthleteList */}
        {showAthleteList && (
          <View style={styles.athleteList}>
            {athletes.map((athlete) => (
              <TouchableOpacity
                key={athlete.id}
                style={styles.athleteItem}
                onPress={() => handleAthleteClick(athlete)}
              >
                <Text style={styles.athleteName}>{athlete.name}</Text> {/* Display athlete name */}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </MenuProvider>
  );
}

// Styles for PhysioDashboard component
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#E5E5E5', // Light background color for entire dashboard
    alignItems: 'center',
    padding: 20,
  },
  header: {
    width: '100%',
    alignItems: 'flex-end', // Align menu to the right
    marginBottom: 20,
  },
  profileIcon: {
    backgroundColor: '#004D40', // Dark green background for profile icon
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    color: '#FFFFFF', // White color for profile initial text
    fontSize: 18,
    fontWeight: 'bold',
  },
  menuText: {
    padding: 10,
    fontSize: 16,
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 20, // Space between image and description
  },
  description: {
    fontSize: 16,
    color: '#333', // Dark grey for readable description text
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#004D40', // Dark green color for main buttons
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 5,
    marginBottom: 15, // Space between buttons
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF', // White text for button text
    fontSize: 16,
    fontWeight: 'bold',
  },
  athleteList: {
    width: '100%',
    marginTop: 20, // Space above athlete list section
  },
  athleteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#FFFFFF', // White background for athlete item
    borderRadius: 5,
    width: '100%',
  },
  athleteName: {
    fontSize: 16,
    color: '#333', // Dark grey for athlete name text
  },
});
