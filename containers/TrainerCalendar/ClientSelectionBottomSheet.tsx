import React, {useState} from 'react';
import {FlatList, TouchableOpacity} from 'react-native';
import {
  Text,
  Avatar,
  VStack,
  View,
  AvatarImage,
  Divider,
  Button,
  ButtonText,
  HStack,
} from '@gluestack-ui/themed';
import {useTrainerClients} from '../../hooks/lupa/useTrainer';
import {auth} from '../../services/firebase';
import {useClientPurchasedPackages} from '../../hooks/lupa/sessions/useSessionPackagePurchase';
import {LupaUser, Pack, TrainerAvailability} from '../../types/user';
interface IClientSelectionBottomSheetProps {
  availabilitySlot: TrainerAvailability;
  onClientSelect: (clientId: string, packageId: string) => void;
}

function ClientSelectionBottomSheet(props: IClientSelectionBottomSheetProps) {
  const {onClientSelect, availabilitySlot} = props;
  const [selectedClient, setSelectedClient] = useState<LupaUser | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const {data: clients} = useTrainerClients(auth?.currentUser?.uid);
  const {data: purchasedPackages} = useClientPurchasedPackages(selectedClient);

  const handleOnClientSelect = () => {
    if (selectedClient) {
      onClientSelect(selectedClient?.uid, null);
    }
  };

  const handleOnPackageSelect = () => {
    if (selectedClient && selectedPackage) {
      onClientSelect(selectedClient?.uid, selectedPackage?.id);
    }
  };

  const renderClient = ({item}) => {
    if (item.type === 'pack') {
      return (
        <TouchableOpacity onPress={() => setSelectedClient(item)}>
          <Text bold size='xs' style={{
                color: selectedClient?.uid === item.uid ? 'black' : '#aaa',
              }}>{item.name}</Text>
        </TouchableOpacity>
      );
    } else {
      return (
        <TouchableOpacity onPress={() => setSelectedClient(item)}>
          <VStack style={{width: '100%'}} alignItems="center">
            <Avatar
              style={{
                borderColor:
                  selectedClient?.uid === item.uid ? 'black' : '#aaa',
                borderWidth: 1,
              }}>
              <AvatarImage source={{uri: item?.picture}} />
            </Avatar>
            <Text
              bold
              size="xs"
              style={{
                color: selectedClient?.uid === item.uid ? 'black' : '#aaa',
              }}>
              {item.name}
            </Text>
          </VStack>
        </TouchableOpacity>
      );
    }
  };

  const renderPackage = ({item}) => (
    <TouchableOpacity
      onPress={() => {
        setSelectedPackage(item.id);
      }}>
      <Text>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{position: 'relative'}}>
      <HStack
        style={{paddingHorizontal: 10}}
        alignItems="center"
        justifyContent="space-between">
        <Text py={5} alignSelf="center" bold color="$black">
          Select Client
        </Text>

        {selectedClient && (
          <Button size="xs" onPress={handleOnClientSelect}>
            <ButtonText>Invite {selectedClient?.name}</ButtonText>
          </Button>
        )}

        {selectedClient && selectedPackage && (
          <Button onPress={handleOnPackageSelect}>
            <ButtonText>
              Add session to {selectedClient?.name}'s package
            </ButtonText>
          </Button>
        )}
      </HStack>

      <Divider my={10} />

      <View style={{height: 500}}>
        <FlatList
          data={clients}
          renderItem={renderClient}
          keyExtractor={item => item.id}
        />
      </View>

      {selectedClient && purchasedPackages?.length > 0 && (
        <View style={{height: 500}}>
          <Text>Select Package</Text>
          <FlatList
            data={purchasedPackages}
            renderItem={renderPackage}
            keyExtractor={item => item.id}
          />
        </View>
      )}
    </View>
  );
}

export default ClientSelectionBottomSheet;
