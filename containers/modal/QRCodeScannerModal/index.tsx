import React from 'react';
import {View, StyleSheet} from 'react-native';
import {RNCamera} from 'react-native-camera';
import QRCodeScanner from 'react-native-qrcode-scanner'
import {useNavigation} from '@react-navigation/native';
import {ICommonModalProps} from '../../../types/components';
import {Modal, ModalBody, ModalContent} from '@gluestack-ui/themed';

const QRCodeScannerModal = (
  props: ICommonModalProps & {onScanComplete: (sessionUid: string) => void},
) => {
  const {onClose, isOpen, onScanComplete} = props;

  const onSuccess = e => {
    const sessionUid = e.data;
    onScanComplete(sessionUid);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalBody>
          <QRCodeScanner
            onRead={onSuccess}
            flashMode={RNCamera.Constants.FlashMode.auto}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'black',
  },
});

export default QRCodeScannerModal;