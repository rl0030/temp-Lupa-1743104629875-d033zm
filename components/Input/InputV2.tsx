import {
  Input,
  InputField,
  InputSlot,
  InputIcon,
  SearchIcon,
  CloseIcon,
} from '@gluestack-ui/themed';
import React from 'react';
import {
  NativeSyntheticEvent,
  StyleSheet,
  TextInputChangeEventData,
} from 'react-native';

interface IInputV2Props {
  isSearchBar?: boolean;
  placeholder: string;
  onChangeText: (text: string) => void;
  bgColor?: string;
  onClearText: () => void;
  value: string;
}

export default function InputV2(props: IInputV2Props) {
  const {isSearchBar, placeholder, value, onChangeText, onClearText, bgColor} =
    props;
  return (
    <Input style={styles.input} bgColor={bgColor ?? '$white'}>
      {isSearchBar && (
        <InputSlot pl="$3">
          <InputIcon as={SearchIcon} />
        </InputSlot>
      )}

      <InputField
        value={value}
        onChangeText={text => onChangeText(text)}
        placeholder={placeholder}
      />

      <InputSlot pr="$3" onPress={onClearText}>
        <InputIcon as={CloseIcon} />
      </InputSlot>
    </Input>
  );
}

const styles = StyleSheet.create({
  input: {
    borderRadius: 25,
  },
});
