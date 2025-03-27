import React, { useState, useCallback, useMemo, useRef } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, StyleSheet, Modal, Dimensions } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import debounce from 'lodash/debounce';
import { useFetchExerciseLibraryWithRedux } from '../../hooks/lupa/programs/useExerciseLibrary';

const ExerciseAutocomplete = ({ value, onChangeText, onSelectExercise }) => {
  const { flattenedExercises, loading } = useFetchExerciseLibraryWithRedux();
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const inputRef = useRef(null);

  const debouncedSearch = useMemo(
    () =>
      debounce((searchTerm: string) => {
        if (searchTerm.length > 1) {
          const filtered = flattenedExercises.filter(exercise =>
            exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
          ).slice(0, 5); // Limit to 5 suggestions for performance
          setFilteredSuggestions(filtered);
          setShowDropdown(filtered.length > 0);
          updateDropdownPosition();
        } else {
          setShowDropdown(false);
        }
      }, 300),
    [flattenedExercises]
  );

  const handleChangeText = useCallback((text) => {
    onChangeText(text);
    debouncedSearch(text);
  }, [onChangeText, debouncedSearch]);

  const handleSelectSuggestion = useCallback((exercise) => {
    onSelectExercise(exercise);
    setShowDropdown(false);
  }, [onSelectExercise]);

  const updateDropdownPosition = () => {
    if (inputRef.current) {
      inputRef.current.measureInWindow((x, y, width, height) => {
        setDropdownPosition({
          top: y + height,
          left: x,
          width: width
        });
      });
    }
  };

  if (loading) {
    return <Text>Loading exercises...</Text>;
  }

  return (
    <View style={styles.container}>
      <TextInput
        ref={inputRef}
        style={styles.input}
        value={value}
        onChangeText={handleChangeText}
        placeholder="Exercise Name"
      />
      <Modal
        visible={showDropdown}
        transparent={true}
        animationType="none"
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowDropdown(false)}
        >
          <View 
            style={[
              styles.dropdown, 
              { 
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: dropdownPosition.width 
              }
            ]}
          >
            <FlatList
              data={filteredSuggestions}
              keyExtractor={(item) => item.uid}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => handleSelectSuggestion(item)}>
                  <Text style={styles.suggestionItem}>{item.name} | {item?.category ? item?.category : 'Custom' | 'Custom'}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 5,
    width: 90,  // Increased width for better visibility
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',  // Lighter overlay
  },
  dropdown: {
    position: 'absolute',
    maxHeight: 200,
    backgroundColor: 'white',
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});

export default ExerciseAutocomplete;