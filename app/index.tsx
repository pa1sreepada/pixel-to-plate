import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import axios from 'axios';
import { Link, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { styles } from '../constants/styles';

interface Recipe {
  image_hash: string;
  title: string;
  cuisine: string;
  dietary_preference: string;
  image_path: string;
}

export default function HomeScreen() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { cuisine, dietary_preference } = useLocalSearchParams();

  useEffect(() => {
    fetchRecipes();
  }, [cuisine, dietary_preference]);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      let url = 'http://localhost:8080/recipes';
      const params = new URLSearchParams();
      if (cuisine) {
        params.append('cuisine', cuisine as string);
      }
      if (dietary_preference) {
        params.append('dietary_preference', dietary_preference as string);
      }
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      const response = await axios.get(url);
      setRecipes(response.data || []);
    } catch (err: any) {
      console.error('Error fetching recipes:', err);
      setError('Failed to load recipes. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const renderRecipeItem = ({ item }: { item: Recipe }) => (
    <Link href={{ pathname: "/recipe-detail", params: { image_hash: item.image_hash } }} asChild>
      <TouchableOpacity style={styles.recipeCard}>
        <Image source={{ uri: `http://localhost:8080/${item.image_path}` }} style={styles.recipeImage} />
        <Text style={styles.homeRecipeTitle}>{item.title}</Text>
      </TouchableOpacity>
    </Link>
  );

  return (
    <View style={{ flex: 1 }}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : recipes.length === 0 ? (
        <View style={styles.emptyRecipesContainer}>
          <MaterialIcons name="camera-alt" size={80} color="#ccc" />
          <Text style={styles.emptyRecipesText}>
            Oops! No recipes found. Don't worry, your culinary adventure awaits!
            Click the camera icon below to snap a pic of your ingredients and discover delicious possibilities!
          </Text>
        </View>
      ) : (
        <>
          {(cuisine || dietary_preference) && (
            <Link href="/" asChild>
              <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>View All Recipes</Text>
              </TouchableOpacity>
            </Link>
          )}
          <FlatList
            data={recipes}
            renderItem={renderRecipeItem}
            keyExtractor={(item) => item.image_hash}
            contentContainerStyle={styles.listContent}
          />
        </>
      )}
      <Link href={{ pathname: "/recipe-finder", params: { openModal: true } }} asChild>
        <TouchableOpacity style={styles.cameraButton}>
          <MaterialIcons name="camera-alt" size={30} color="white" />
        </TouchableOpacity>
      </Link>
    </View>
  );
}