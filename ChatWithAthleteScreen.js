// screens/ChatWithAthleteScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, Linking } from 'react-native';
import { getDatabase, ref, push, onValue } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av'; // Correct import for Audio permissions and recording
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import { auth } from '../firebaseConfig';

export default function ChatWithAthleteScreen({ route }) {
  const { athleteId } = route.params; // Get athlete's ID from route params
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [recording, setRecording] = useState(null); // State to store audio recording

  // Unique chat room ID for physio-athlete conversation
  const chatRoomId = [auth.currentUser.uid, athleteId].sort().join('_');

  // Retrieve messages in real-time
  useEffect(() => {
    const db = getDatabase();
    const chatRef = ref(db, `chats/${chatRoomId}`);
    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messageList = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
        setMessages(messageList.reverse()); // Sort messages in descending order
      }
    });
    return () => unsubscribe();
  }, []);

  // Send a text message
  const sendMessage = async () => {
    if (message.trim()) {
      const db = getDatabase();
      const chatRef = ref(db, `chats/${chatRoomId}`);
      await push(chatRef, {
        senderId: auth.currentUser.uid,
        text: message,
        timestamp: moment().format(),
        type: 'text',
      });
      setMessage('');
    } else {
      Alert.alert('Message Error', 'Please enter a message.');
    }
  };

  // Send a file message
  const sendFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({});
    if (result.type === 'success') {
      const storage = getStorage();
      const fileRef = storageRef(storage, `chatFiles/${chatRoomId}/${Date.now()}_${result.name}`);
      const fileBlob = await fetch(result.uri).then((r) => r.blob());
      await uploadBytes(fileRef, fileBlob);
      const fileUrl = await getDownloadURL(fileRef);

      const db = getDatabase();
      const chatRef = ref(db, `chats/${chatRoomId}`);
      await push(chatRef, {
        senderId: auth.currentUser.uid,
        fileUrl,
        timestamp: moment().format(),
        type: 'file',
        fileName: result.name,
      });
    }
  };

  // Start recording a voice message
  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to record audio');
        return;
      }

      if (recording) {
        await recording.stopAndUnloadAsync();
        setRecording(null);
      }

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      setRecording(newRecording);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  // Stop recording and send the voice message
  const stopRecording = async () => {
    if (!recording) return;

    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);

    if (uri) {
      const storage = getStorage();
      const voiceRef = storageRef(storage, `chatVoices/${chatRoomId}/${Date.now()}.m4a`);
      const voiceBlob = await fetch(uri).then((r) => r.blob());
      await uploadBytes(voiceRef, voiceBlob);
      const voiceUrl = await getDownloadURL(voiceRef);

      const db = getDatabase();
      const chatRef = ref(db, `chats/${chatRoomId}`);
      await push(chatRef, {
        senderId: auth.currentUser.uid,
        voiceUrl,
        timestamp: moment().format(),
        type: 'voice',
      });
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        inverted
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={item.senderId === auth.currentUser.uid ? styles.myMessage : styles.theirMessage}>
            {item.type === 'text' && <Text style={styles.messageText}>{item.text}</Text>}
            {item.type === 'file' && (
              <TouchableOpacity onPress={() => Linking.openURL(item.fileUrl)}>
                <Text style={styles.messageText}>📎 {item.fileName}</Text>
              </TouchableOpacity>
            )}
            {item.type === 'voice' && (
              <TouchableOpacity onPress={() => Audio.Sound.createAsync({ uri: item.voiceUrl }).then(({ sound }) => sound.playAsync())}>
                <Text style={styles.messageText}>🎤 Voice Message</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.timestamp}>{moment(item.timestamp).fromNow()}</Text>
          </View>
        )}
      />

      {/* Message Input and Controls */}
      <View style={styles.inputContainer}>
        <TouchableOpacity onPress={sendFile} style={styles.iconButton}>
          <Ionicons name="attach" size={24} color="gray" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Type a message"
          value={message}
          onChangeText={setMessage}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
        />
        {recording ? (
          <TouchableOpacity onPress={stopRecording} style={styles.iconButton}>
            <Ionicons name="stop" size={24} color="red" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={startRecording} style={styles.iconButton}>
            <Ionicons name="mic" size={24} color="gray" />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={sendMessage} style={styles.iconButton}>
          <Ionicons name="send" size={24} color="#004D40" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f0f0f0',
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#004D40',
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
    maxWidth: '75%',
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0E0E0',
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
    maxWidth: '75%',
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  timestamp: {
    fontSize: 10,
    color: '#FFFFFF',
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#DDD',
    backgroundColor: '#FFF',
  },
  input: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 25,
    marginRight: 10,
    backgroundColor: '#FFFFFF',
  },
  iconButton: {
    marginHorizontal: 5,
  },
});
