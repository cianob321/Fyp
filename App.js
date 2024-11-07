import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MenuProvider } from 'react-native-popup-menu';
import HomeScreen from './screens/HomeScreen';
import Login from './screens/Login';
import Register from './screens/Register';
import PhysioReg from './screens/PhysioReg';
import AthleteReg from './screens/AthleteReg';
import PhysioDashboard from './screens/PhysioDashboard';
import AthleteDashboard from './screens/AthleteDashboard';
import UploadProgramScreen from './screens/UploadProgramScreen';
import AthleteProgramScreen from './screens/AthleteProgramScreen';
import ClientProgressScreen from './screens/ClientProgressScreen';
import SymptomLogScreen from './screens/SymptomLogScreen';
import SymptomLogHistoryScreen from './screens/SymptomLogHistoryScreen';
import AthleteSymptomLogScreen from './screens/AthleteSymptomLogScreen';
import FeedbackScreen from './screens/FeedbackScreen';
import ChatWithPhysioScreen from './screens/ChatWithPhysioScreen';
import ChatWithAthleteScreen from './screens/ChatWithAthleteScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <MenuProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Asclepius Home' }} />
          <Stack.Screen name="Login" component={Login} options={{ title: 'Login' }} />
          <Stack.Screen name="Register" component={Register} options={{ title: 'Register' }} />
          <Stack.Screen name="PhysioReg" component={PhysioReg} options={{ title: 'Physio Registration' }} />
          <Stack.Screen name="AthleteReg" component={AthleteReg} options={{ title: 'Athlete Registration' }} />
          <Stack.Screen name="PhysioDashboard" component={PhysioDashboard} options={{ title: 'Dashboard' }} />
          <Stack.Screen name="AthleteDashboard" component={AthleteDashboard} options={{ title: 'Athlete Dashboard' }} />
          <Stack.Screen name="UploadProgram" component={UploadProgramScreen} options={{ title: 'Upload Program' }} />
          <Stack.Screen name="AthleteProgramScreen" component={AthleteProgramScreen} options={{ title: 'Athlete Program' }} />
          <Stack.Screen name="ClientProgress" component={ClientProgressScreen} options={{ title: 'Client Progress' }} />
          <Stack.Screen name="SymptomLogScreen" component={SymptomLogScreen} options={{ title: 'Symptom Log' }} />
          <Stack.Screen name="SymptomLogHistoryScreen" component={SymptomLogHistoryScreen} options={{ title: 'Symptom Log History' }} />
          <Stack.Screen name="AthleteSymptomLogScreen" component={AthleteSymptomLogScreen} options={{ title: 'Athlete Symptom Log' }} />
          <Stack.Screen name="FeedbackScreen" component={FeedbackScreen} options={{ title: 'Feedback' }} />
          <Stack.Screen name="ChatWithPhysioScreen" component={ChatWithPhysioScreen} options={{ title: 'Chat with Physio' }} />
          <Stack.Screen name="ChatWithAthleteScreen" component={ChatWithAthleteScreen} options={{ title: 'Chat with Athlete' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </MenuProvider>
  );
}
