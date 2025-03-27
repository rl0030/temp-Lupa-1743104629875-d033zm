import {
  ButtonText,
  CloseIcon,
  Divider,
  Heading,
  Icon,
  Image,
  Input,
  InputField,
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  Button,
  ModalFooter,
  ModalHeader,
  Text,
  View,
  VStack,
  HStack,
} from '@gluestack-ui/themed';
import React, {useRef, useState} from 'react';
import {Pressable, StyleSheet, TextInput} from 'react-native';
import BarbellImage from '../../assets/icons/Barbell.png';
import SessionIcon from '../../assets/icons/SessionIcon.png';
import PackIcon from '../../assets/icons/CirclesThreePlus.png';
import OutlinedText from '../../components/Typography/OutlinedText';
import BootcampIcon from '../../assets/icons/activities/bootcamp_icon.png';
import SeminarIcon from '../../assets/icons/activities/seminar_icon.png';
import User from '../../assets/icons/User.png';
import PersonIcon from '../../assets/icons/PersonIcon';
import { WhiteBootcampIcon, WhiteSeminarIcon } from '../../assets/icons/activities';
import VideoCameraIcon from '../../assets/icons/VideoCameraIcon';

interface IPriceDisplay {}

const PriceChangeDialog = ({isOpen, onClose, price, setPrice}) => {
  const ref = useRef(null);

  const handlePriceChange = (text: string) => {
    // Remove any non-numeric characters except for a single decimal point
    const sanitizedText = text
      .replace(/[^\d.]/g, '')
      .replace(/(\..*)\./g, '$1');

    // Update the input value directly
    setPrice(sanitizedText);

    // // Optionally, you can store the numeric value in a separate state if needed
    // const numericValue = parseFloat(sanitizedText);
    // if (!isNaN(numericValue)) {
    //   // setNumericPrice(numericValue);
    // }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} finalFocusRef={ref}>
      <ModalBackdrop />
      <ModalContent>
        <ModalHeader>
          <Heading size="lg">Pricing</Heading>
          <ModalCloseButton>
            <Icon as={CloseIcon} />
          </ModalCloseButton>
        </ModalHeader>
        <ModalBody>
          <TextInput
            style={{
              borderWidth: 1,
              padding: 10,
              borderColor: '#aaa',
              borderRadius: 4,
            }}
            value={price.toString()}
            onChangeText={handlePriceChange}
            keyboardType="numeric"
            autoCapitalize="none"
            autoComplete="off"
            inputMode="decimal"
            placeholder="99.99"
            autoCorrect={false}
          />
        </ModalBody>
        <ModalFooter>
          <Button style={{width: '100%'}} onPress={onClose}>
            <ButtonText>
              <OutlinedText
                style={{fontWeight: '800'}}
                textColor="white"
                outlineColor="black">
                Close
              </OutlinedText>
            </ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
export default function PriceDisplay({
  initialPrice = 0.0,
  onChangePrice,
  priceText,
  productText,
  priceTextColor,
  icon,
  discountText,
  expandHeight
}: {
  priceText?: string;
  initialPrice: number;
  onChangePrice?: (price: number) => void;
  productText: string;
  priceTextColor?: string;
  discountText?: string;
  expandHeight?: boolean;
  icon?: 'barbell' | 'one-one-one' | 'seminar' | 'bootcamp' | 'pack' | 'video' | 'session'
}) {
  const [price, setPrice] = useState<number>(initialPrice);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  const formattedNumber = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(price);

  const renderIcon = () => {
    switch (icon) {
      case 'barbell':
        return (
          <Image
            source={BarbellImage}
            style={{width: 32, height: 32, alignSelf: 'center'}}
          />
        );
      case 'pack':
        return (
          <Image
            source={PackIcon}
            style={{width: 36, height: 36, alignSelf: 'center'}}
          />
        );
      case 'bootcamp':
        return (
          <WhiteBootcampIcon />
        );
      case 'seminar':
        return (
          <WhiteSeminarIcon />
        );
      case 'session':
        return (
          <HStack paddingHorizontal={2} space="sm" alignItems="center">
            <PersonIcon />
            <Divider style={{width: 24}} />

            <PersonIcon />
          </HStack>
        );
      case 'video':
        return <VideoCameraIcon width={38} height={24} />
      default:
        return (
          <HStack paddingHorizontal={2} space="sm" alignItems="center">
            <Image
              source={User}
              style={{width: 20, height: 26, alignSelf: 'center'}}
            />
            <Divider style={{width: 24}} />
            <Image
              source={User}
              style={{width: 20, height: 26, alignSelf: 'center'}}
            />
          </HStack>
        );
    }
  };

  return (
    <VStack
      justifyContent="space-evenly"
   space='xs'
      alignItems="center"
      style={{...styles.container, height: 160 }}>
        <View style={{   }}>

      
      {renderIcon()}
      </View>

      <Text
        textAlign="center"
        px={2.5}
        style={{
          flexWrap: 'wrap',
          textAlign: 'center',
        
          fontSize: 15,
       //   minHeight: 30, // Increased from 20 to allow for multiple lines
        }}
        color="$white"
        numberOfLines={2} // Added to limit to 2 lines if text is too long
        ellipsizeMode="tail" // Added to show ellipsis if text is truncated
      >
        {productText}
      </Text>
      <Divider orientation="horizontal" />
      <VStack alignItems="center">
        <Pressable
          onPress={onChangePrice ? () => setIsDialogOpen(true) : () => {}}>
          <Text
            style={{fontSize: 24}}
     
            color={priceTextColor ? priceTextColor : '$blue500'}>
            ${formattedNumber}
          </Text>
        </Pressable>
        {priceText && (
          <Text style={{fontSize: 12, color: 'rgba(229, 229, 229, 0.7)'}}>
            {priceText}
          </Text>
        )}
        {
          discountText && (
            <Text style={{fontSize: 12, color: 'rgba(250, 21, 21, 0.7)', }} >
            {discountText}
          </Text>
          )
        }
      </VStack>

      <PriceChangeDialog
        isOpen={isDialogOpen}
        onClose={() => {
          if (onChangePrice) {
            onChangePrice(price);
          }

          setIsDialogOpen(false);
        }}
        price={price}
        setPrice={setPrice}
      />
    </VStack>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'black',
    width: 117,
    backgroundColor: '#264B71',
    borderRadius: 12,
  },
});
