import React, { memo, useCallback, useEffect, useState, useMemo } from 'react';
import { View, ScrollView, Alert, KeyboardAvoidingView, SafeAreaView, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { auth } from '../../services/firebase';
import { isUserProgramPurchaser } from '../../api';
import Background from '../../components/Background';
import ScrollableHeader from '../../components/ScrollableHeader';
import LoadingScreen from '../../components/LoadingScreen';
import { screenWidth } from '../../constant/size';
import { Button, ButtonText, HStack, VStack, Text, Input, InputField, useToast, Toast, ToastDescription } from '@gluestack-ui/themed';
import { Chip } from '@rneui/themed';
import * as ImagePicker from 'react-native-image-picker';
import { storeMediaFromBase64 } from '../../services/firebase/storage';
import UserHeader from '../../containers/UserHeader';
import OutlinedText from '../../components/Typography/OutlinedText';
import SelectProgramCategories from '../../containers/modal/SelectProgramCategories';
import SelectionModal from '../../components/SelectionModal';
import Share from 'react-native-share';

import { changeProgramMetadata, useProgramOperations } from '../../context/ProgramProvider';
import { renderMediaView, renderWeeksAndSessions } from './renderFunctions';
import { ActivityIndicator } from 'react-native';
import { NameInput } from './NameInput';
import  DescriptionSection  from './DescriptionSection';
import ProgramInformation  from './ProgramInformation';
import ActionButtons from './ActionButtons';
import { useDeleteProgram } from '../../hooks/lupa/programs/useDeleteProgram';
import { LupaUser } from '../../types/user';
import { RootState } from '../../services/redux/store';
import { useSelector } from 'react-redux';
import MixpanelManager from '../../services/mixpanel/mixpanel';

export enum ViewMode {
  CREATE,
  EDIT,
  PREVIEW,
}

const ProgramView = () => {
  const route = useRoute();
  const { programId, mode } = route.params;
  const {
    program,
    trainerDetails,
    isLoading,
    error,
    loadProgram,
    saveProgram,
    updateProgramMetadata,
    updateSessionMetadata,
    updatePricing,
    addWeek,
    addSession,
    removeSession,
    createNewProgram,
  } = useProgramOperations();

  const trainer = trainerDetails
  
  const lupaUser = useSelector((state: RootState) => state.user.userData) as LupaUser;

  const [isMediaLoading, setIsMediaLoading] = useState(false);
  const [isCheckingPurchaserValidity, setIsCheckingPurchaserValidity] = useState(false);
  const [hasPurchasedProgram, setHasPurchasedProgram] = useState(false);
  const [priceSelectionModalIsOpen, setPriceSelectionModalIsOpen] = useState(false);
  const [averageWorkoutDurationSelectionModalIsOpen, setAverageWorkoutDurationSelectionModalIsOpen] = useState(false);
  const [isSelectProgramCategoriesModalOpen, setSelectProgramCategoriesModalOpen] = useState(false);

  const navigate = useNavigation();
  const toast = useToast();

  useEffect(() => {
    MixpanelManager.trackScreen('BuildTool');
  }, [])

  useEffect(() => {
    if (mode === ViewMode.CREATE) {
      createNewProgram();
    } else if (programId) {

      loadProgram(programId);
    }
  }, [mode, programId]);

  useEffect(() => {
    async function checkPurchaseStatus() {
      if (mode === ViewMode.PREVIEW && program) {
        setIsCheckingPurchaserValidity(true);
        const isPurchaser = await isUserProgramPurchaser(auth?.currentUser?.uid as string, program?.uid);
        setHasPurchasedProgram(isPurchaser);
        setIsCheckingPurchaserValidity(false);
      }
    }
    // checkPurchaseStatus();
  }, [mode, program?.uid]);

  const selectProgramMedia = async () => {
    try {
      setIsMediaLoading(true);
      const result = await ImagePicker.launchImageLibrary({
        mediaType: 'photo',
        quality: 1,
        includeBase64: true,
      });
  
      if (result.assets && result.assets[0] && result.assets[0].uri) {
        const { uri } = result.assets[0];
        const downloadUrl = await storeMediaFromBase64(uri, `${program?.uid}/assets/index.png`);
        updateProgramMetadata({ media: downloadUrl });
      }
    } catch (error) {
      console.error('Error selecting media:', error);
      Alert.alert('Error', 'Failed to select media. Please try again.');
    } finally {
      setIsMediaLoading(false);
    }
  }


  const togglePublish = async () => {
   // if (!program) return;
    await changeProgramMetadata(program?.uid, { ...program?.metadata, is_published: !program?.metadata?.is_published });
    loadProgram(program?.uid);
  }

  const shareProgram = async () => {
    if (!program) return;

    const shareOptions = {
      message: `Check out this awesome workout program: ${program?.metadata?.name}`,
      title: 'Share Workout Program',
      url: `lupa://program/${program?.uid}`,
      type: 'image/jpeg',
      subject: 'New Workout Program',
      failOnCancel: false,
      showAppsToView: true,
    };

    try {
      const result = await Share.open(shareOptions);
      console.log('Share result:', result);
    } catch (error) {
      if (error.message === 'User did not share') {
        console.log('User cancelled sharing');
      } else {
        console.error('Error sharing:', error.message);
      }
    }
  }

  const { deleteProgram, isDeleting, error: deleteProgramError } = useDeleteProgram();

  const onCheckedCategoriesUpdated = (categories: Array<string>) => {
    updateProgramMetadata({ categories });
  }

  const handleSave = () => {
    saveProgram();
    navigate.goBack();
  }

  const handleDeleteProgram = async () => {
    const isDeleted = await deleteProgram(programId);
    if (isDeleted) {
      toast.show({
        render: () => (
          <Toast>
            <ToastDescription>Your program has been deleted.</ToastDescription>
          </Toast>
        ),
      });
      console.log('Program deleted successfully');
      navigate.goBack();
    } else if (error) {
      toast.show({
        render: () => (
          <Toast>
            <ToastDescription>Error Deleting Program. Please try again.</ToastDescription>
          </Toast>
        ),
      });
      console.error('Error deleting program:', error);
    }
  }

  const renderCreationUI = useMemo(() => {
   // if (mode !== ViewMode.CREATE && mode !== ViewMode.EDIT) return null;

    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollViewContent}>
        <ScrollableHeader showBackButton />
        <VStack space='lg'>
          <NameInput program={program} updateProgramMetadata={updateProgramMetadata} />
          <View style={styles.displaySection}>
            <View style={[styles.programMedia, styles.center]}>
              {renderMediaView(mode, program, trainer, selectProgramMedia, isMediaLoading)}
              <View style={styles.trainerInformation}>
                <UserHeader name={lupaUser?.name} photo_url={lupaUser?.picture} role={lupaUser?.role} />
              </View>
            </View>
          </View>

          <HStack alignItems='center' flexWrap='wrap' space='xs'>
            <Chip
              onPress={() => setSelectProgramCategoriesModalOpen(true)}
              containerStyle={styles.addTagChip}
              title="Add Tags >"
            />
            {program?.metadata?.categories?.map((category: string) => (
              <Chip
                key={category}
                title={category}
                size="sm"
                titleStyle={styles.categoryChipTitle}
                type="outline"
                containerStyle={styles.categoryChipContainer}
                buttonStyle={styles.categoryChipButton}
                style={{ marginVertical: 5 }}
              />
            ))}
          </HStack>

          <DescriptionSection program={program} updateProgramMetadata={updateProgramMetadata} mode={mode} />

          <ProgramInformation
            program={program}
            updateSessionMetadata={updateSessionMetadata}
            updatePricing={updatePricing}
            setAverageWorkoutDurationSelectionModalIsOpen={setAverageWorkoutDurationSelectionModalIsOpen}
          />

          <View style={styles.programDetailsSection}>
            {renderWeeksAndSessions(program, mode, addWeek, addSession, removeSession, navigate)}
          </View>
        </VStack>

        <Button
          isDisabled={!program?.uid || !program?.metadata.media || !program?.metadata.description || !program?.metadata.name || !program?.sessionMetadata.averageWorkoutDuration || program?.weeks.length === 0}
          onPress={handleSave}
          mt={20}
          style={styles.saveButton}
          action="primary"
          variant="outlined">
          <ButtonText>
            <OutlinedText fontSize={30} style={styles.saveButtonText}>
              Save
            </OutlinedText>
          </ButtonText>
        </Button>

        {mode === ViewMode.EDIT && String(program?.metadata?.owner).toLowerCase() === String(auth?.currentUser?.uid).toLowerCase() && (
          <Button
            onPress={handleDeleteProgram}
            isDisabled={!program?.uid || !program?.metadata.media || !program?.metadata.description || !program?.metadata.name || !program?.sessionMetadata.averageWorkoutDuration || program?.weeks.length === 0}
            mt={20}
            style={styles.deleteButton}
            action="error"
            variant="outlined">
            <ButtonText>
              <OutlinedText fontSize={30} style={styles.saveButtonText}>
                Delete
              </OutlinedText>
            </ButtonText>
          </Button>
        )}
      </ScrollView>
    );
  }, [program, handleDeleteProgram, renderMediaView, renderWeeksAndSessions, addSession, addWeek, removeSession, navigate, mode, updatePricing, updateSessionMetadata, updateProgramMetadata, selectProgramMedia, isMediaLoading])

  const renderPreviewUI = useMemo(() => {
  //  if (mode !== ViewMode.PREVIEW) return null;

    // if (isLoading) {
    //   return <ActivityIndicator />;
    // }

    return (
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <ScrollableHeader showBackButton />
        <View style={styles.previewContainer}>
          <VStack space="lg">
            <ActionButtons
              program={program}
              shareProgram={shareProgram}
              togglePublish={togglePublish}
              navigation={navigate}
            />
            
             <View>{renderMediaView(mode, program, trainer, selectProgramMedia, isMediaLoading)}</View>

            <DescriptionSection program={program} updateProgramMetadata={updateProgramMetadata} mode={mode} />

            <HStack alignItems='center' flexWrap='wrap' space='xs'>
              {program?.metadata?.categories?.map((category: string) => (
                <Chip
                  key={category}
                  title={category}
                  size="sm"
                  titleStyle={styles.categoryChipTitle}
                  type="outline"
                  containerStyle={styles.categoryChipContainer}
                  buttonStyle={styles.categoryChipButton}
                  style={{ marginTop: 2, marginBottom: 2 }}
                />
              ))}
            </HStack> 

            <ProgramInformation
              program={program}
              updateSessionMetadata={updateSessionMetadata}
              updatePricing={updatePricing}
              setAverageWorkoutDurationSelectionModalIsOpen={setAverageWorkoutDurationSelectionModalIsOpen}
            />

            {hasPurchasedProgram && renderWeeksAndSessions(program, mode, addWeek, addSession, removeSession, navigate)}
          </VStack>
        </View>

    {!hasPurchasedProgram && auth?.currentUser?.uid !== program?.metadata?.owner && ( 
          <Button
            action="positive"
            isDisabled={isCheckingPurchaserValidity}
            onPress={() => navigate.navigate('PurchaseHome', {
              uid: program?.uid,
              productType: 'program',
              clientType: 'user',
            })}
            style={styles.purchaseButton}
            variant="solid">
            <ButtonText>
              <OutlinedText fontSize={32} style={styles.purchaseButtonText}>
                Get Program
              </OutlinedText>
            </ButtonText>
          </Button>
       )}
      </ScrollView>
    );
  }, [program, handleDeleteProgram, renderMediaView, renderWeeksAndSessions, addSession, addWeek, removeSession, navigate, mode, updatePricing, updateSessionMetadata, updateProgramMetadata, selectProgramMedia, isMediaLoading])

  return (
    <>
      <SelectionModal
        title="Choose a price for your program"
        isOpen={priceSelectionModalIsOpen}
        onClose={() => setPriceSelectionModalIsOpen(false)}>
        <KeyboardAvoidingView>
          <Input variant="outline" size="md" aria-label="program price">
            <InputField
              value={String(program?.pricing?.value)}
              onChangeText={(text: string) => updatePricing(parseFloat(text) || 0)}
              placeholder="Set a price (Ex. 200.00)"
            />
          </Input>
        </KeyboardAvoidingView>
      </SelectionModal>

      <SelectionModal
        title="Input the average workout duration"
        isOpen={averageWorkoutDurationSelectionModalIsOpen}
        onClose={() => setAverageWorkoutDurationSelectionModalIsOpen(false)}>
        <KeyboardAvoidingView>
        <Input variant="outline" size="md" aria-label="program average workout duration">
            <InputField
              value={String(program?.sessionMetadata?.averageWorkoutDuration)}
              onChangeText={(text: string) => updateSessionMetadata({ averageWorkoutDuration: parseInt(text, 10) || 0 })}
              placeholder="duration in minutes (Ex. 5)"
            />
          </Input>
        </KeyboardAvoidingView>
      </SelectionModal>

      <SelectProgramCategories
        defaultChecked={mode === ViewMode.CREATE ? [] : program?.metadata?.categories}
        isOpen={isSelectProgramCategoriesModalOpen}
        onClose={() => setSelectProgramCategoriesModalOpen(false)}
        onCheckedCategoriesUpdated={onCheckedCategoriesUpdated}
      />

      <Background>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
          {mode === ViewMode.CREATE || mode === ViewMode.EDIT ? renderCreationUI : null}
          {mode === ViewMode.PREVIEW ? renderPreviewUI : null}
          </View>
        </SafeAreaView>
      </Background>
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    alignSelf: 'center',
  },
  container: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: 5,
  },
  displaySection: {},
  programMedia: {
    width: screenWidth - 20,
    height: 194,
    alignSelf: 'center',
    borderRadius: 10,
    backgroundColor: 'grey',
    position: 'relative',
  },
  trainerInformation: {
    position: 'absolute',
    left: 10,
    bottom: 10,
  },
  programInformationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    marginBottom: 30,
  },
  programDetailsSection: {},
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  textarea: {
    borderRadius: 15,
    fontSize: 14,
  },
  textareaInput: {
    fontSize: 14,
  },
  readOnlyTextarea: {
    borderRadius: 15,
    fontSize: 14,
    borderColor: '#BDBDBDB2',
  },
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
  categoriesContainer: {
    marginTop: 10,
    marginBottom: 6,
    minHeight: 20,
    width: 100
  },
  addTagChip: {
    color: '#49BEFF',
    borderColor: '#49BEFF',
  },
  categoryChipTitle: {
    color: '#BDBDBD',
    fontSize: 16,
    fontWeight: '600',
  },
  categoryChipContainer: {
    borderColor: '#BDBDBD',
    borderRadius: 0,
    marginVertical: 1,
    width: 'auto',
    margin: 5,
  },
  categoryChipButton: {
    padding: 7,
    borderRadius: 8,
    color: '#BDBDBD',
    borderColor: '#BDBDBD',
  },
  descriptionContainer: {
    marginBottom: 16,
  },
  infoIcon: {
    width: 38,
    height: 38,
  },
  durationButton: {
    color: '#0D99FF',
  },
  durationButtonText: {
    flexWrap: 'wrap',
    fontSize: 16,
    width: 140,
  },
  saveButton: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'black',
    position: 'fixed',
    bottom: 10,
    backgroundColor: 'rgba(73, 190, 255, 0.44)',
  },
  deleteButton: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'black',
    position: 'fixed',
    bottom: 10,
    backgroundColor: 'red',
  },
  saveButtonText: {
    fontWeight: '800',
  },
  previewContainer: {
    padding: 0,
  },
  actionButtonsContainer: {
    paddingVertical: 10,
    paddingBottom: 15,
  },
  reportButton: {
    alignSelf: 'flex-end',
    marginVertical: 5,
  },
  actionIcon: {
    width: 32,
    height: 28,
  },
  purchaseButton: {
    position: 'fixed',
    height: 68,
    bottom: 10,
    marginVertical: 15,
    width: screenWidth - 20,
    alignSelf: 'center',
    backgroundColor: '#50DC0E',
  },
  purchaseButtonText: {
    fontWeight: '700',
  },
});

export default ProgramView