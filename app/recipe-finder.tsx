import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Platform, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { styles } from '../constants/styles';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function RecipeFinderScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showPickerModal, setShowPickerModal] = useState<boolean>(false);
  const [showDescriptionModal, setShowDescriptionModal] = useState<boolean>(false);
  const [recipeDescription, setRecipeDescription] = useState<string | null>(null);

  const { image_hash, openModal } = useLocalSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (openModal) {
      setShowPickerModal(true);
    }
  }, [openModal]);

  const openCamera = async () => {
    setShowPickerModal(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      setError('Camera permissions are required to take photos.');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImage(uri);
      uploadImage(result);
    }
  };

  const openImageLibrary = async () => {
    setShowPickerModal(false);
    Alert.alert("Step 1", "Attempting to open image library...");

    try {
        Alert.alert("Step 2", "Checking current media library permissions...");
        let existingPermissions = await ImagePicker.getMediaLibraryPermissionsAsync();
        Alert.alert("Step 3", `Existing permissions: ${JSON.stringify(existingPermissions)}`);

        let finalStatus = existingPermissions.status;

        if (existingPermissions.status !== 'granted') {
            Alert.alert("Step 4", "Permission not granted, requesting now...");
            const newPermissions = await ImagePicker.requestMediaLibraryPermissionsAsync();
            Alert.alert("Step 5", `Permission request result: ${JSON.stringify(newPermissions)}`);
            finalStatus = newPermissions.status;
        }

        if (finalStatus !== 'granted') {
            Alert.alert("Error", "Media library permissions are required to pick photos.");
            return;
        }

        Alert.alert("Step 6", "Permissions are granted. Launching image library...");
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        Alert.alert("Step 7", `ImagePicker result: ${JSON.stringify(result)}`);

        if (!result.canceled) {
            const uri = result.assets[0].uri;
            setImage(uri);
            uploadImage(result);
        } else {
            Alert.alert("Info", "Image picking canceled.");
        }
    } catch (e) {
        Alert.alert("Error", `An error occurred: ${e.message || 'Unknown error'}`);
    }
  };

  const showImagePickerOptions = () => {
    setShowPickerModal(true);
  };

  const uploadImage = async (pickerResult: ImagePicker.ImagePickerResult) => {
    if (pickerResult.canceled) {
      return;
    }

    const uri = pickerResult.assets[0].uri;
    const file = pickerResult.assets[0].file; // This will be available on web

    setLoading(true);
    setError(null);

    const formData = new FormData();

    if (file) {
      // For web, append the File object directly
      formData.append('file', file);
    } else {
      // For native, convert uri to blob
      console.log('Mobile: Image URI:', uri);
      const response = await fetch(uri);
      console.log('Mobile: Fetch response status:', response.status);
      const blob = await response.blob();
      console.log('Mobile: Blob type:', blob.type, 'size:', blob.size);
      formData.append('file', blob, 'photo.jpg');
    }

    try {
      const backendUrl = Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080';
      console.log('Mobile: Sending request to:', backendUrl + '/v2/recipefinder');
      const res = await axios.post(backendUrl + '/v2/recipefinder', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.message) {
        // If the backend sent a message (e.g., for non-food images)
        setError(res.data.message);
        setLoading(false);
        return;
      }

      const imageHash = res.data.image_hash;

      // Show description modal while fetching full recipe details
      setShowDescriptionModal(true);
      try {
        const descRes = await axios.get(`${backendUrl}/image-metadata/${imageHash}`);
        setRecipeDescription(descRes.data.description || 'No description available.');
      } catch (descErr) {
        console.error('Error fetching description:', descErr);
        setRecipeDescription('Failed to load description.');
      }

      router.push({ pathname: "/recipe-detail", params: { image_hash: imageHash } });
    } catch (err: any) {
      console.error('Upload error:', err);
      if (err.response) {
        setError(`Error: ${err.response.data || err.response.statusText}`);
      } else if (err.request) {
        setError('Error: No response from server. Is the backend running?');
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
      

      {loading && (
        <LottieView
          source={require('../assets/chef-dancing.json')}
          autoPlay
          loop
          style={styles.lottieAnimation}
        />
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        animationType="slide"
        transparent={true}
        visible={showPickerModal}
        onRequestClose={() => setShowPickerModal(false)}
      >
        <View style={styles.pickerModalContainer}>
          <View style={styles.pickerModalContent}>
            <TouchableOpacity style={styles.pickerOptionButton} onPress={openCamera}>
              <Text style={styles.pickerOptionText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pickerOptionButton} onPress={openImageLibrary}>
              <Text style={styles.pickerOptionText}>Choose from Library</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pickerCancelButton} onPress={() => setShowPickerModal(false)}>
              <Text style={styles.pickerCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={showDescriptionModal}
        onRequestClose={() => setShowDescriptionModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.sectionTitle}>Recipe Description</Text>
            {recipeDescription ? (
              <Text style={styles.modalText}>{recipeDescription}</Text>
            ) : (
              <ActivityIndicator size="large" color="#0000ff" />
            )}
            <TouchableOpacity style={styles.button} onPress={() => setShowDescriptionModal(false)}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}