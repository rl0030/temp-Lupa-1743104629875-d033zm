import {HStack, View, Text, Avatar, AvatarImage} from '@gluestack-ui/themed';

const TimeSlot = ({ time }) => {
  // Format time from ISO string or time string
  const formatTime = (timeStr) => {
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) {
      // If not a valid date, assume it's already a time string
      return timeStr;
    }
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View
      style={{
        backgroundColor: '#49BEFF',
        borderWidth: 1,
        borderColor: '#03063D',
        padding: 3,
        paddingHorizontal: 8,
        borderRadius: 10,
        width: 65,  // Fixed width
        height: 28, // Fixed height
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 2,
      }}>
      <Text bold size="xs" color="$white" numberOfLines={1}>
        {formatTime(time)}
      </Text>
    </View>
  );
};

const TrainerCard = ({trainer}) => {
  const renderAvailabilitySlots = () => {
    const slots = trainer.availabilitySlots.slice(0, 4);
    const rows = [slots.slice(0, 2), slots.slice(2, 4)];

    return (
      <View style={{ gap: 8 }}>
        {rows.map((row, rowIndex) => (
          <HStack key={rowIndex} space="sm" justifyContent="center">
            {row.map((slot, slotIndex) => (
              <TimeSlot key={slotIndex} time={slot.startTime} />
            ))}
            {/* Fill empty slots if needed */}
            {row.length === 1 && <View style={{ width: 65, height: 28 }} />}
          </HStack>
        ))}
      </View>
    );
  };

  return (
    <HStack
      style={{
        backgroundColor: '#D9D9D9',
        height: 133,
        borderRadius: 20,
        width: 180,
      }}
      mb={10}
      mx={20}
      my={25}
      space="md"
      alignItems="center"
      paddingY="md">
      <Avatar
        size="lg"
        style={{
          borderColor: '#03063D',
          borderWidth: 2,
          position: 'absolute',
          top: -14,
          left: -14,
        }}>
        <AvatarImage source={{uri: trainer.trainer.picture}} />
      </Avatar>
      <Text
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          maxWidth: 120,  // Prevent long names from overflowing
        }}
        color="#03063D"
        size="sm"
        bold
        numberOfLines={1}>
        {trainer.trainer.name}
      </Text>
      <View
        style={{
          paddingHorizontal: 20,
          paddingLeft: 40,
          paddingTop: 30,
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
        }}>
        {trainer.availabilitySlots.length > 0 ? (
          renderAvailabilitySlots()
        ) : (
          <View
            style={{width: '100%'}}
            alignItems="center"
            justifyContent="center">
            <Text alignSelf="center">
              No availability today
            </Text>
          </View>
        )}
      </View>
    </HStack>
  );
};

export default TrainerCard;