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
import EnhancedButton from '../../../components/Button/GluestackEnhancedButton';

interface ISelectProgramCategoriesProps {
  defaultChecked: Array<string>;
  onCheckedCategoriesUpdated: (updatedCheckedCategories: Array<string>) => void;
}

function SelectProgramCategories(
  props: ISelectProgramCategoriesProps & ICommonModalProps,
) {
  const {isOpen, onClose, onCheckedCategoriesUpdated, defaultChecked = []} = props;
  const [checkedCategories, setCheckedCategories] = useState<Array<string>>([...defaultChecked]);

  const handleOnChange = (keys: Array<string>) => {
    setCheckedCategories(keys);
    onCheckedCategoriesUpdated(keys);
  };

  const ref = React.useRef(null);

  return (
    <Modal isOpen={isOpen} onClose={onClose} finalFocusRef={ref}>
      <ModalBackdrop />
      <ModalContent style={styles.content}>
        <ModalHeader>
          <Heading size="sm">Add Program Category Tags</Heading>
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
          <EnhancedButton
            onPress={onClose}
            style={{
              width: '100%',
              backgroundColor: 'rgba(73, 190, 255, 0.50)',
              borderColor: '#49BEFF',
              borderWidth: 1,
              borderRadius: 10,
            }}
            outlineColor="black"
            outlineText
            textColor="white">
            Finish Selection
          </EnhancedButton>
          {/* <Button size="sm" width="100%" action="primary" onPress={onClose}>
            <ButtonText>Finish Selection</ButtonText>
          </Button> */}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: {
    height: screenHeight - 200,
    width: screenWidth - 20,
    backgroundColor: '#646464',
  },
});

export default SelectProgramCategories;
