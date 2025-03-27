import * as React from 'react';
import {Input} from '@rneui/themed';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {StyleSheet} from 'react-native';

const styles = StyleSheet.create({
  containerStyle: {
    borderBottomWidth: 0,
    width: '100%',
  },
  disabledInputStyle: {
    backgroundColor: '#ddd',
  },
  inputContainerStyle: {
    backgroundColor: '#FFF',
    borderBottomWidth: 0,
    borderRadius: 20,
    width: '100%',
    paddingHorizontal: 15,
  },
  errorStyle: {},
  inputStyle: {
    border: 'none',
    fontSize: 14,
  },
  labelStyle: {},
  leftIconContainerStyle: {},
  rightIconContainerStyle: {},
});

interface IInputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
}

export default (props: IInputProps) => {
  return (
    <Input
      {...props}
      containerStyle={styles.containerStyle}
      disabledInputStyle={styles.disabledInputStyle}
      inputContainerStyle={styles.inputContainerStyle}
      errorStyle={styles.errorStyle}
      inputStyle={styles.inputStyle}
      labelStyle={styles.labelStyle}
      labelProps={{}}
      leftIconContainerStyle={styles.leftIconContainerStyle}
      rightIconContainerStyle={styles.rightIconContainerStyle}
    />
  );
};
