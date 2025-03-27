import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Input, InputField } from '@gluestack-ui/themed';

const OutlinedInput = ({ 
  value, 
  onChangeText, 
  placeholder, 
  textColor = '#2D8BFA', 
  outlineColor = 'white', 
  fontSize = 30,
  ...props 
}) => {
  const renderOutlinedText = (text) => {
    return [-1, 0, 1].map((i) =>
      [-1, 0, 1].map((j) => (
        <TextInput
          key={`${i}-${j}`}
          style={[
            styles.outlineText,
            {
              left: i,
              top: j,
              color: outlineColor,
              fontSize,
            },
          ]}
          value={text}
          editable={false}
        />
      ))
    );
  };

  return (
    <View style={styles.container}>
      {renderOutlinedText(value || placeholder)}
      <Input
        variant="outline"
        size="md"
        style={[styles.input, { height: fontSize * 2 }]}
        isDisabled={false}
        isInvalid={false}
        isReadOnly={false}
        {...props}
      >
        <InputField
          placeholderTextColor={textColor}
          style={[
            styles.inputField,
            {
              color: textColor,
              fontSize,
              fontWeight: '800',
            },
          ]}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
        />
      </Input>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  input: {
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  inputField: {
    padding: 10,
  },
  outlineText: {
    position: 'absolute',
    padding: 10,
    backgroundColor: 'transparent',
  },
});

export { OutlinedInput }