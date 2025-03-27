import React from 'react';
import { StyleSheet } from 'react-native';
import { Input, InputField } from '@gluestack-ui/themed';
import { Program } from '../../types/program';

interface NameInputProps {
  program: Program;
  updateProgramMetadata: (metadata: any) => void;
}

export const NameInput: React.FC<NameInputProps> = ({ program, updateProgramMetadata }) => {
  return (
    <Input variant="outline" size="md" style={styles.nameInput} isDisabled={false} isInvalid={false} isReadOnly={false}>
      <InputField
        placeholderTextColor="$blue500"
        sx={styles.nameInputField}
        placeholder="Program name..."
        value={program?.metadata.name}
        onChangeText={text => updateProgramMetadata({ name: text })}
      />
    </Input>
  );
};

const styles = StyleSheet.create({
  nameInput: {
    color: '$blue500',
    borderColor: '#2D8BFA',
    borderRadius: 12,
    height: 68,
    marginBottom: 12,
  },
  nameInputField: {
    color: '$blue500',
    p: 10,
    px: 10,
    h: 'auto',
    padding: 10,
    fontSize: 30,
    fontWeight: '800',
    _input: {
      fontSize: 30,
      color: '$blue500',
    },
  },
});