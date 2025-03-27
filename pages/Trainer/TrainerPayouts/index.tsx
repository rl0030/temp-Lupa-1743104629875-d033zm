import React, {FC, useEffect, useState} from 'react';
import {
  ScrollView,
  View,
  Text,
  RefreshControl,
  StyleSheet,
  Dimensions,
  Alert,
  Pressable,
  Linking,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Background from '../../../components/Background';
import ScrollableHeader from '../../../components/ScrollableHeader';
import {
  Avatar,
  AvatarImage,
  Box,
  Button,
  ButtonText,
  Divider,
  HStack,
  Image,
  VStack,
} from '@gluestack-ui/themed';
import OutlinedText from '../../../components/Typography/OutlinedText';
import CalendarThirtyOneIcon from '../../../assets/icons/CalendarThirtyOneIcon';
import {useTrainerPayouts} from '../../../hooks/stripe/useTrainerPayouts';
import {Chip} from '@rneui/themed';
import {screenWidth} from '../../../constant/size';
import useGetTaxTransactions from '../../../hooks/stripe/useTaxTransactions';
import {getUser} from '../../../api/user';
import {Program} from '../../../types/program';
import {ScheduledMeeting} from '../../../types/session';
import {ProductType} from '../../../types/purchase';
import {getProgram} from '../../../api/program/program';
import PersonIcon from '../../../assets/icons/PersonIcon';
import usePayoutReports from '../../../hooks/stripe/usePayoutReports';
import {format, fromUnixTime} from 'date-fns';
import {useSelector} from 'react-redux';
import {RootState} from '../../../services/redux/store';
import {useNavigation} from '@react-navigation/native';

export const TrainerPayouts: FC = () => {
  const navigation = useNavigation();
  const lupaUser = useSelector((state: RootState) => state.user.userData);

  const {
    accountInfo,
    loading,
    error,
    accountId,
    balance,
    sellerPayments,
    refreshData,
    handleInitiatePayout,
  } = useTrainerPayouts();

  const {
    mutate: getTaxTransactions,
    data: taxTransactionsData,
    isPending: isLoadingTaxTransactions,
  } = useGetTaxTransactions();


  const [enhancedPayments, setEnhancedPayments] = useState([]);

  useEffect(() => {
    refreshData();

    //onFetchPayoutReports()
  }, []);

  useEffect(() => {
    if (accountId && lupaUser?.time_created_utc) {
      getTaxTransactions({
        accountId,
        time_created_utc: lupaUser?.time_created_utc,
      });
    }
  }, [accountId, lupaUser?.time_created_utc]);

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (sellerPayments.length > 0) {
        const enhancedPaymentsData = await Promise.all(
          sellerPayments.map(async payment => {
            const {metadata} = payment;
            const {product_uid, seller_uid, product_type, client_uid} =
              metadata;

            try {
              let productDetails: Program | ScheduledMeeting;
              if (product_type == ProductType.PROGRAM) {
                productDetails = (await getProgram(product_uid)) as Program;
              } else {
                // @ts-ignore
                productDetails = {};
              }

              const clientDetails = await getUser(client_uid);
              const sellerDetails = await getUser(seller_uid);

              return {
                ...payment,
                productDetails,
                sellerDetails,
                clientDetails,
              };
            } catch (error) {
              console.error('Error fetching details:', error);
              return payment;
            }
          }),
        );

        setEnhancedPayments(enhancedPaymentsData);
      }
    };

    fetchProductDetails();
  }, [sellerPayments]);

  const BlueBox = ({children}) => (
    <Box style={{padding: 5, borderColor: 'black', borderRadius: 12}}>
      {children}
    </Box>
  );

  const recentPayouts = accountInfo?.recentPayouts;
  console.log(recentPayouts);
  const formatDate = unixTimestamp => {
    return format(fromUnixTime(unixTimestamp), 'EEEE, MMMM do');
  };

  const getNextPayoutDate = () => {
    if (Array.isArray(recentPayouts) && recentPayouts.length > 0) {
      const mostRecentPayout = recentPayouts[0];
      const nextPayoutDate = fromUnixTime(mostRecentPayout.arrivalDate + 86400); // Adding 1 day (86400 seconds)
      return formatDate(nextPayoutDate.getTime() / 1000);
    }
    return 'Not available';
  };

  return (
    <Background>
      <SafeAreaView style={styles.container}>
        <ScrollableHeader showBackButton />
        <View style={styles.contentWrapper}>
          <View style={styles.blueBackground}>
            <ScrollView
              refreshControl={
                <RefreshControl
                  tintColor="#FFF"
                  refreshing={loading}
                  onRefresh={refreshData}
                />
              }
              contentContainerStyle={styles.scrollContent}>
              {error && <Text style={styles.errorText}>{error}</Text>}
              <View style={styles.contentContainer}>
                <HStack
                  style={styles.balanceContainer}
                  justifyContent="space-between"
                  alignItems="flex-start">
                  <Box style={styles.balanceBox}>
                    <Text style={styles.balanceTitle}>Available Balance</Text>
                    <Text style={styles.balanceAmount}>${balance}</Text>
                  </Box>

                  <Box
                    alignItems="center"
                    style={{
                      width: '48%',
                      maxWidth: '50%',
                    }}>
                    <Box style={styles.depositBox}>
                      <Text style={styles.depositTitle}>
                        Next Automatic Deposit
                      </Text>
                      <HStack alignItems="center">
                        <CalendarThirtyOneIcon width={26} height={26} />
                        <Text style={styles.depositDate}>
                          {getNextPayoutDate()}
                        </Text>
                      </HStack>
                    </Box>

                    <Button variant="link">
                      <ButtonText style={{fontWeight: 400, fontSize: 14}}>
                        Edit Auto Deposit
                      </ButtonText>
                    </Button>
                  </Box>
                </HStack>

                <Box>
                  <Text style={styles.recentSalesTitle}>Recent Sales</Text>
                  <VStack space="md">
                    {enhancedPayments.map((payment, index) => {
                      const {
                        metadata,
                        amount,
                        productDetails,
                        clientDetails,
                        sellerDetails,
                      } = payment;

                      if (Object.keys(metadata).length == 0) {
                        return;
                      }

                      const {
                        product_type,
                        notification_type,
                        payout_text,
                        product_uid,
                        product_name,
                      } = metadata;

                      return (
                        <Box key={index} style={styles.paymentBox}>
                          <VStack space="lg">
                            <HStack
                              style={{width: '100%'}}
                              alignItems="center"
                              justifyContent="flex-start"
                              space="sm">
                              <Avatar>
                                <AvatarImage src={clientDetails?.picture} />
                              </Avatar>

                              <Text
                                style={{
                                  width: '85%',
                                  fontSize: 14,
                                  fontWeight: 'bold',
                                  color: 'white',
                                  flexWrap: 'wrap',
                                  textAlign: 'center',
                                }}>
                                {payout_text ?? 'Payout Text'}
                              </Text>
                            </HStack>

                            <HStack width="100%" justifyContent="space-evenly">
                              <HStack space="sm" alignItems="center">
                                {product_type == ProductType.PROGRAM ? (
                                  // @ts-ignore
                                  <Image
                                    style={{
                                      width: 40,
                                      height: 40,
                                      borderRadius: 8,
                                    }}
                                    source={
                                      productDetails?.metadata?.media
                                        ? productDetails?.metadata?.media
                                        : ''
                                    }
                                  />
                                ) : (
                                  <BlueBox>
                                    <HStack
                                      paddingHorizontal={2}
                                      space="sm"
                                      alignItems="center">
                                      <PersonIcon />
                                      <Divider style={{width: 12}} />

                                      <PersonIcon />
                                    </HStack>
                                  </BlueBox>
                                )}

                                <Text
                                  style={{
                                    color: 'white',
                                    fontSize: 12,
                                    fontWeight: 'bold',
                                  }}>
                                  {product_name ?? product_uid}
                                </Text>
                              </HStack>

                              <Chip
                             
                              buttonStyle={{ backgroundColor: '#226416', paddingHorizontal: 30, marginVertical: 1, borderRadius: 100 }}
                                title={`$${String(amount / 100)}` || '0'}
                                  titleStyle={{ fontSize: 15}}
                              />
                            </HStack>

                            <HStack
                              style={{
                                borderWidth: 0.5,
                                padding: 4,
                                paddingVertical: 6,
                                borderColor: 'white',
                                borderRadius: 12,
                                paddingHorizontal: 10,
                              }}
                              justifyContent="space-between">
                              <Text
                                style={{
                                  color: '#BDBDBD',
                                  fontSize: 16,
                                  fontWeight: '700',
                                }}>
                                {product_type == ProductType.PROGRAM
                                  ? `Program:${String(product_uid).slice(0, 8)}`
                                  : `Appointment`}
                              </Text>

                              <Text
                                style={{
                                  color: '#BDBDBD',
                                  fontSize: 16,
                                  fontWeight: '700',
                                }}>
                                -
                              </Text>

                              <Pressable
                                disabled={!taxTransactionsData}
                                onPress={() =>
                                  Linking.openURL(
                                    taxTransactionsData?.downloadUrl,
                                  )
                                }>
                                <Text
                                  style={{
                                    color: 'blue',
                                    fontSize: 16,
                                    fontWeight: '700',
                                  }}>
                                  Details+
                                  {taxTransactionsData?.reportId?.slice(0, 6)}
                                </Text>
                              </Pressable>
                            </HStack>
                          </VStack>
                        </Box>
                      );
                    })}
                  </VStack>
                </Box>
              </View>
            </ScrollView>
          </View>
          {accountId && accountInfo && (
            <View style={styles.buttonContainer}>
              <Button
                style={styles.button}
                bgColor="rgba(20, 174, 92, 0.5)"
                onPress={handleInitiatePayout}
                isDisabled={loading || balance <= 0}>
                <ButtonText>
                  <OutlinedText
                    textColor="white"
                    outlineColor="black"
                    fontSize={24}
                    style={{fontWeight: '800'}}>
                    Deposit to Bank
                  </OutlinedText>
                </ButtonText>
              </Button>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Background>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  blueBackground: {
    flex: 1,
    backgroundColor: 'rgba(3, 6, 61, .75)',
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentContainer: {
    padding: 10,
    paddingBottom: 20, // Reduced padding at the bottom
  },
  balanceContainer: {
    marginTop: 10,
    width: '100%',
  },
  balanceBox: {
    width: '48%',
    maxWidth: '50%',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  balanceTitle: {
    fontSize: 20,
    color: 'white',
    textDecorationLine: 'underline',
  },
  balanceAmount: {
    fontSize: 24,
    color: 'white',
  },
  depositBox: {
    width: '100%',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  depositTitle: {
    fontSize: 12,
    color: 'white',
    paddingBottom: 5,
    textDecorationLine: 'underline',
  },
  depositDate: {
    paddingHorizontal: 12,
    fontSize: 16,
    flexWrap: 'wrap',
    color: 'white',
  },
  recentSalesTitle: {
    paddingBottom: 10,
    fontSize: 20,
    color: 'white',
  },
  paymentBox: {
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 8,
    width: '100%',
    padding: 8,
  },
  paymentText: {
    color: 'white',
    textAlign: 'center',
  },
  chipButton: {
    backgroundColor: '#226416',
    borderRadius: 100,
    width: 80,
    height: 25,
    display: 'flex',
    alignContent: 'center',
    justifyContent: 'center',
  },
  chipTitle: {
    fontSize: 14,
    height: 25,
  },
  buttonContainer: {
    padding: 10,
    backgroundColor: 'transparent', // Changed to transparent
  },
  button: {
    marginTop: 20,
    height: 60,
    borderRadius: 9,
    fontWeight: '800',
    width: screenWidth - 60,
    alignSelf: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ff0000',
    textAlign: 'center',
    marginBottom: 10,
  },
});
