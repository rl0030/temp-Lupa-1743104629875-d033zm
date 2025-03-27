import React, {useEffect, useState} from 'react';
import {
  Modal,
  Input,
  Button,
  Box,
  VStack,
  HStack,
  Text,
  ModalBackdrop,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  ModalContent,
  ModalHeader,
  Image,
  InputField,
  Heading,
  ButtonText,
  Avatar,
  AvatarImage,
} from '@gluestack-ui/themed';
import {
  launchCamera,
  launchImageLibrary,
  Asset,
} from 'react-native-image-picker';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: {
    name: string;
    biography: string;
    picture: string;
  };
  editTrainerMetadataDocument: (updatedData: any) => Promise<void>;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  initialData,
  editTrainerMetadataDocument,
}) => {
  const [name, setName] = useState(initialData.name);
  const [biography, setBiography] = useState(initialData.biography);
  const [picture, setPicture] = useState<string>(initialData.picture ?? '');

  useEffect(() => {
    setName(initialData.name)
    setBiography(initialData.biography)
    setPicture(initialData.picture)
  }, [initialData])
  const handleChoosePhoto = async () => {
    const options = {
      mediaType: 'photo',
      quality: 1,
      selectionLimit: 1,
    };
    const result = await launchImageLibrary(options);
    if (!result.didCancel && result.assets && result.assets.length > 0) {
      const downloadUrl = await uploadToFirebase(result.assets[0]);
      setPicture(downloadUrl);
    }
  };

  const handleTakePhoto = async () => {
    const options = {
      mediaType: 'photo',
      quality: 1,
    };
    const result = await launchCamera(options);
    if (!result.didCancel && result.assets && result.assets.length > 0) {
      const downloadUrl = await uploadToFirebase(result.assets[0]);
      setPicture(downloadUrl);
    }
  };

  const uploadToFirebase = async (asset: Asset) => {
    
  };

  const handleSave = async () => {
    const updatedData = {
      name,
      biography,
      picture: picture || initialData.picture,
    };

    try {
    await editTrainerMetadataDocument(updatedData);
    } catch(error) {
        console.log(error)
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader>
          <Heading>Edit Profile</Heading>
        </ModalHeader>
        <ModalBody>
          <VStack space="md" alignItems="center">
            {
              <Avatar onPress={handleChoosePhoto}>
                <AvatarImage
                  alt="profile picture"
                  size="md"
                  source={{uri: picture}}
                />
              </Avatar>
            }

            <Input>
              <InputField
                value={name}
                onChangeText={setName}
                placeholder="Name"
              />
            </Input>

            <Input>
              <InputField
                value={biography}
                onChangeText={setBiography}
                placeholder="Biography"
              />
            </Input>
          </VStack>
        </ModalBody>
        <ModalFooter>
            <HStack alignItems='center' space='md'>
            <Button action='secondary' onPress={onClose}>
            <ButtonText>Cancel</ButtonText>
          </Button>
          <Button action='primary' onPress={handleSave}>
            <ButtonText>Save</ButtonText>
          </Button>
            </HStack>
     
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditProfileModal;
