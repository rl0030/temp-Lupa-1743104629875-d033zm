import React, {useState} from 'react';
import {Alert, ScrollView, View} from 'react-native';
import {
  Center,
  Button,
  Modal,
  ModalBackdrop,
  ModalCloseButton,
  Heading,
  ModalBody,
  ModalFooter,
  ButtonText,
  Icon,
  CloseIcon,
  Text,
  ModalHeader,
  ModalContent,
  CheckboxGroup,
  Checkbox,
  CheckboxIndicator,
  CheckIcon,
  CheckboxIcon,
  CheckboxLabel,
  VStack,
} from '@gluestack-ui/themed';
import {ICommonModalProps} from '../../../types/components';
import {StyleSheet} from 'react-native';
import {screenHeight, screenWidth} from '../../../constant/size';
import {PROGRAM_CATEGORIES} from '../../../constant/program';

interface ISelectUserInterestProps {
  onCheckedCategoriesUpdated: (updatedCheckedCategories: Array<string>) => void;
}

function SelectUserInterest(
  props: ISelectUserInterestProps & ICommonModalProps,
) {
  const {isOpen, onClose, onCheckedCategoriesUpdated} = props;
  const [checkedCategories, setCheckedCategories] = useState<Array<string>>([]);

  const handleOnChange = (keys: Array<string>) => {
    setCheckedCategories(keys);
    onCheckedCategoriesUpdated(keys)
  };

  const ref = React.useRef(null);

  return (
      <Modal isOpen={isOpen} onClose={onClose} finalFocusRef={ref}>
        <ModalBackdrop />
        <ModalContent style={styles.content}>
          <ModalHeader>
            <Heading size="sm">Change Interest</Heading>
            <ModalCloseButton onPress={onClose}>
              <Icon as={CloseIcon} />
            </ModalCloseButton>
          </ModalHeader>
          <ModalBody>
            <View
              style={{
                borderRadius: 10,
                padding: 20,
                minHeight: '100%',
                backgroundColor: '#FFF',
              }}>
              <CheckboxGroup
                value={checkedCategories}
                onChange={keys => handleOnChange(keys)}>
                <VStack space="md">
                  {PROGRAM_CATEGORIES.map(category => {
                    return (
                      <Checkbox
                      key={category}
                        isDisabled={false}
                        value={category}>
                        <CheckboxIndicator mr="$2">
                          <CheckboxIcon as={CheckIcon} />
                        </CheckboxIndicator>
                        <CheckboxLabel size="md" style={{color: 'black'}}>
                          {category}
                        </CheckboxLabel>
                      </Checkbox>
                    );
                  })}
                </VStack>
              </CheckboxGroup>
            </View>
          </ModalBody>
          <ModalFooter>
            <Button size="sm" width="100%" action="primary" onPress={onClose}>
              <ButtonText>Finish Selection</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
  );
}

const styles = StyleSheet.create({
  content: {
    height: screenHeight - 200,
    width: screenWidth,
    backgroundColor: '#646464',
  },
});

export default SelectUserInterest
