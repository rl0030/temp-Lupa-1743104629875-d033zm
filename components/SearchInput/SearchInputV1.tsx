import React, {useEffect} from 'react';
import {
  HStack,
  Input,
  InputSlot,
  InputIcon,
  SearchIcon,
  InputField,
  Button,
  ButtonText,
  View,
} from '@gluestack-ui/themed';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Keyboard} from 'react-native';

const SearchInput = ({
  value,
  onChangeText,
  onFocus,
  onBlur,
  customStyles,
  containerStyles,
  placeholder,
  isVoiceEnabled = false,
  variant = 'normal',
}) => {
  const handleFocus = () => {
    if (onFocus) {
    onFocus();
    }
  };

  const handleBlur = () => {
    if (onBlur) {
    onBlur();
    }
  };

  const handleClose = () => {
    onChangeText('');
    handleBlur();
  };

  useEffect(() => {
    if (Keyboard.isVisible === false) {
      handleBlur();
    }
  }, [Keyboard.isVisible]);
  const isFocused = variant === 'focused';

  return (
    <HStack alignItems="center" justifyContent="space-between" width="100%">
      <View style={{width: '100%', ...containerStyles }} flex={1}  marginRight={isFocused ? '$2' : 0}>
        <Input
          style={[
            {
              //  flex: 1,
              width: '100%',
              // border: 'none',
              height: isFocused ? 30 : 40,
            },
            customStyles,
          ]}
          backgroundColor={!isFocused ? '$white' : '$coolGray600'}
          variant="rounded"
          size="md"
          isDisabled={false}
          isInvalid={false}
          isReadOnly={false}>
          <InputSlot pl="$3">
            <InputIcon
              as={SearchIcon}
              color={!isFocused ? '$coolGray600' : '$white'}
            />
          </InputSlot>
          <InputField
          placeholderTextColor={!isFocused ? '$coolGray600' : '$white'}
            value={value}
            placeholder={
              placeholder ? placeholder : 'What kind of workout would you like?'
            }
            style={{color: !isFocused ? '$coolGray600' : '$white'}}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          <InputSlot pr="$3">
            {!isFocused && isVoiceEnabled && (
              <InputIcon
                as={() => (
                  <MaterialCommunityIcon
                    size={18}
                    color={isFocused ? '$coolGray600' : '$white'}
                    name="microphone"
                  />
                )}
              />
            )}
          </InputSlot>
        </Input>
      </View>
      {isFocused && (
        <Button
          onPress={handleClose}
          size="sm"
          variant="solid"
          style={{height: 30}}
          backgroundColor="#595959"
          borderRadius="$full">
          <ButtonText style={{fontWeight: '400'}}>Cancel</ButtonText>
        </Button>
      )}
    </HStack>
  );
};

export default SearchInput;
