import React, { memo, useCallback, useMemo } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { HStack, VStack, Text, Button, ButtonText, Divider } from '@gluestack-ui/themed';
import PriceDisplay from '../../containers/PriceDisplay';
import { Program } from '../../types/program';

import CalendarThirtyOneIcon from '../../assets/icons/CalendarThirtyOneIcon.png';
import TimerIcon from '../../assets/icons/TimerIcon.png';

interface ProgramInformationProps {
  program: Program;
  updateSessionMetadata: (metadata: any) => void;
  updatePricing: (price: number) => void;
  setAverageWorkoutDurationSelectionModalIsOpen: (isOpen: boolean) => void;
}

const ProgramInformation: React.FC<ProgramInformationProps> = memo(({
  program,
  updateSessionMetadata,
  updatePricing,
  setAverageWorkoutDurationSelectionModalIsOpen,
}) => {
  const averageSessionsPerWeek = useMemo(() => {
    return Math.round(program?.weeks?.reduce((sum, week) => sum + (week?.sessions?.length || 0), 0) / (program?.weeks?.length || 1));
  }, [program?.weeks]);

  const handleOpenDurationModal = useCallback(() => {
    setAverageWorkoutDurationSelectionModalIsOpen(true);
  }, [setAverageWorkoutDurationSelectionModalIsOpen]);

  const handlePriceChange = useCallback((price: number) => {
    updatePricing(price);
  }, [updatePricing]);

  return (
    <View style={styles.programInformationSection}>
      <VStack space="sm">
        <HStack space="md" alignItems="center">
          <Image source={CalendarThirtyOneIcon} style={styles.infoIcon} />
          <VStack>
            <Text color="#BDBDBD">{program?.weeks?.length || 0} Week Program</Text>
            <Text fontSize={16} textAlign="center" color="#BDBDBD">
              {averageSessionsPerWeek} Session(s) per Week
            </Text>
          </VStack>
        </HStack>

        <HStack space="md" alignItems="center" paddingRight={15}>
          <Image source={TimerIcon} style={styles.infoIcon} />
          <Button
            onPress={handleOpenDurationModal}
            style={styles.durationButton}
            variant="link"
            action="primary">
            <ButtonText fontWeight="$medium" style={styles.durationButtonText}>
              {!program?.sessionMetadata?.averageWorkoutDuration
                ? 'Input Average Session Duration'
                : `${program?.sessionMetadata?.averageWorkoutDuration} Minutes`}
            </ButtonText>
          </Button>
        </HStack>
      </VStack>
      <Divider orientation="vertical" mx="$2.5" bg="$white900" h={60} $dark-bg="$emerald400" />
      <View>
        <PriceDisplay
          icon="barbell"
          priceTextColor="#69DA4D"
          initialPrice={program?.pricing?.value}
          productText={'Workout Program'}
          onChangePrice={handlePriceChange}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  programInformationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    marginBottom: 30,
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
});

export default ProgramInformation;