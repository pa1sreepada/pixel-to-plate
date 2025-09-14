import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Image, TouchableOpacity, Modal, Button } from 'react-native';
import axios from 'axios';
import { styles } from '../constants/styles';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';


interface Recipe {
  image_hash: string;
  title: string;
  ingredients: { [key: string]: string };
  instructions: string[];
  shopping_cart: { [key: string]: string };
  cuisine: string;
  dietary_preference: string;
  cooking_time: string;
  servings: string;
  image_path: string;
}

export default function RecipeDetailScreen() {
  const { image_hash } = useLocalSearchParams();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCartModalVisible, setCartModalVisible] = useState(false);
  const [isImageModalVisible, setImageModalVisible] = useState(false);
  const [isTooltipVisible, setTooltipVisible] = useState(false);

  useEffect(() => {
    if (image_hash) {
      fetchRecipeByHash(image_hash as string);
    }
  }, [image_hash]);

  const fetchRecipeByHash = async (hash: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`http://localhost:8080/recipes/${hash}`);
      setRecipe(res.data);
    } catch (err: any) {
      console.error('Error fetching recipe by hash:', err);
      setError('Failed to load recipe. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const toggleCartModal = () => {
    setCartModalVisible(!isCartModalVisible);
  };

  const toggleImageModal = () => {
    setImageModalVisible(!isImageModalVisible);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.errorText}>Loading Recipe...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Recipe not found.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
        <TouchableOpacity 
          onPress={toggleImageModal} 
          style={{ width: '100%' }}
          onMouseEnter={() => setTooltipVisible(true)}
          onMouseLeave={() => setTooltipVisible(false)}
        >
          <Image source={{ uri: `http://localhost:8080/${recipe.image_path}` }} style={styles.recipeImage} />
          {isTooltipVisible && (
            <View style={styles.tooltipContainer}>
              <Text style={styles.tooltipText}>click to view the full picture</Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.recipeTitle}>{recipe.title}</Text>
        <View style={styles.tagContainer}>
          {recipe.cuisine && (
            <Link href={{ pathname: '/', params: { cuisine: recipe.cuisine } }} asChild>
              <TouchableOpacity>
                <Text style={styles.tag}>{recipe.cuisine}</Text>
              </TouchableOpacity>
            </Link>
          )}
          {recipe.dietary_preference && (
            <Link href={{ pathname: '/', params: { dietary_preference: recipe.dietary_preference } }} asChild>
              <TouchableOpacity>
                <Text style={styles.tag}>{recipe.dietary_preference}</Text>
              </TouchableOpacity>
            </Link>
          )}
        </View>
        <Text style={styles.recipeMetaData}>Cooking Time: {recipe.cooking_time} | Servings: {recipe.servings}</Text>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Ingredients Needs</Text>
          <View style={styles.listContainer}>
            {Object.entries(recipe.ingredients).map(([key, value]) => (
              <Text key={key} style={styles.listItem}>• {key}: {value}</Text>
            ))}
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>How to Cook :: Step by Step</Text>
          <View style={styles.listContainer}>
            {recipe.instructions.map((instruction: string, index: number) => (
              <Text key={index} style={styles.listItem}>{index + 1}. {instruction}</Text>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={toggleCartModal}>
          <Text style={styles.buttonText}>Shop Recipe</Text>
        </TouchableOpacity>

        <Modal
          animationType="slide"
          transparent={true}
          visible={isCartModalVisible}
          onRequestClose={toggleCartModal}
          aria-modal={true}
          role="dialog"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalView}>
              <Text style={styles.sectionTitle}>Shopping Cart Items</Text>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={styles.tableHeaderText}>Item</Text>
                  <Text style={styles.tableHeaderText}>Quantity</Text>
                </View>
                {recipe.shopping_cart && Object.entries(recipe.shopping_cart).map(([key, value]) => (
                  <View key={key} style={styles.tableRow}>
                    <Text style={styles.tableCell}>{key}</Text>
                    <Text style={styles.tableCell}>{value}</Text>
                  </View>
                ))}
              </View>
              <Button title="Close" onPress={toggleCartModal} />
            </View>
          </View>
        </Modal>

        <Modal
          animationType="fade"
          transparent={true}
          visible={isImageModalVisible}
          onRequestClose={toggleImageModal}
          aria-modal={true}
          role="dialog"
        >
          <View style={styles.fullImageModalContainer}>
            <Image source={{ uri: `http://localhost:8080/${recipe.image_path}` }} style={styles.fullImage} resizeMode="contain" />
            <TouchableOpacity style={styles.closeButton} onPress={toggleImageModal}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </ScrollView>
      <Link href={{ pathname: "/recipe-finder", params: { openModal: true } }} asChild>
        <TouchableOpacity style={styles.cameraButton}>
          <MaterialIcons name="camera-alt" size={30} color="white" />
        </TouchableOpacity>
      </Link>
    </View>
  );
}