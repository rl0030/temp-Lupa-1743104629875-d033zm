import React, {useRef} from 'react';
import {ICommonModalProps} from '../../types/components';

import {
  Button,
  ButtonText,
  ButtonIcon,
  HStack,
  Modal,
  Icon as GlueIcon,
  Divider,
  VStack,
  Text,
  AddIcon,
  Textarea,
  TextareaInput,
  Pressable,
  Avatar,
  Image,
  Input,
  InputField,
  Box,
  Center,
  CloseIcon,
  Heading,
  ModalBackdrop,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  KeyboardAvoidingView,
  ScrollView,
} from '@gluestack-ui/themed';

export interface ISelectionModalProps {
  title: string;
  instructions?: string;
  children?: React.ReactNode;
}

export default function SelectionModal(
  props: ICommonModalProps & ISelectionModalProps,
) {
  const {isOpen, onClose, children, title, instructions} = props;
  const ref = useRef();
  return (
    <Modal isOpen={isOpen} onClose={onClose} finalFocusRef={ref}>
      <ModalBackdrop />
      <ModalContent>
        <ModalHeader>
          <Heading size="lg">{title}</Heading>
          <ModalCloseButton>
            <GlueIcon as={CloseIcon} />
          </ModalCloseButton>
        </ModalHeader>
        <ModalBody>{children}</ModalBody>
        <ModalFooter>
          <Button
            size="sm"
            action="positive"
            borderWidth="$0"
            onPress={onClose}>
            <ButtonText>Finish</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
