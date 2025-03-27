import React, { useState, useEffect } from 'react';
import Background from '../../components/Background';
import { SafeAreaView, View, Box, Text, ScrollView } from '@gluestack-ui/themed';
import  CalendarStrip from 'react-native-calendar-strip';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { auth, db } from '../../services/firebase';
interface ScheduledNotification {
 receiver: string;
 title: string;
 message: string;
 scheduledFor: Timestamp;
 sent: boolean;
 createdAt: Timestamp;
 type: 'training_session';
}

const ScheduleSessionView = () => {
   const [selectedDate, setSelectedDate] = useState<Date>(new Date());
   const [loading, setLoading] = useState(false);
   const userId = auth?.currentUser?.uid;

   // Get week days from selected date
   const getWeekDays = (date: Date) => {
       const dayOfWeek = date.getDay();
       const week = [];
       
       const monday = new Date(date);
       monday.setDate(date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
       
       for (let i = 0; i < 7; i++) {
           const day = new Date(monday);
           day.setDate(monday.getDate() + i);
           week.push(day);
       }
       
       return week;
   };

   const scheduleNotification = async (date: Date) => {
       if (!userId) {
          
           return;
       }

       setLoading(true);
       try {
           const notificationsRef = collection(db, 'notifications');
           
           // Set notification time to 9 AM on the selected date
           const scheduledTime = new Date(date);
           scheduledTime.setHours(9, 0, 0, 0);

           const notification: ScheduledNotification = {
               receiver: userId,
               title: "Training Session Reminder",
               message: `Your training session is scheduled for ${format(scheduledTime, 'EEEE, MMMM d')} at 9:00 AM`,
               scheduledFor: Timestamp.fromDate(scheduledTime),
               sent: false,
               createdAt: Timestamp.now(),
               type: 'training_session'
           };

           await addDoc(notificationsRef, notification);
         
       } catch (error) {
           console.error('Error scheduling session:', error);
          
       } finally {
           setLoading(false);
       }
   };

   const handleDateSelected =  (date: Date) => {
       setSelectedDate(date);
      scheduleNotification(date);
   };

   const renderSessionLetter = (index: number) => {
       return (
           <Box
               width={50}
               height={50}
               borderRadius={10}
               borderWidth={1}
               borderColor={'$white'}
               bg={'rgba(255, 255, 255, 0.1)'}
               justifyContent="center"
               alignItems="center"
               position="relative"
           >
               <Text
                   position="absolute"
                   bottom={2}
                   right={4}
                   color={'#646464'}
                   fontSize={26}
                   fontWeight="400"
               >
                   {String.fromCharCode(97 + index)}
               </Text>
           </Box>
       );
   };

   return (
       <Background>
           <View style={{ flex: 1 }}>
               <SafeAreaView style={{ flex: 1 }}>
                   <ScrollView>
                       <CalendarStrip
                        
                           scrollable
                           style={{ height: 100, paddingTop: 20, paddingBottom: 10 }}
                           calendarColor={'transparent'}
                           calendarHeaderStyle={{ color: 'white' }}
                           dateNumberStyle={{ color: 'white' }}
                           dateNameStyle={{ color: 'white' }}
                           iconContainer={{ flex: 0.1 }}
                           selectedDate={selectedDate}
                           // @ts-ignore
                           onDateSelected={handleDateSelected}
                           useIsoWeekday={true}
                           highlightDateNumberStyle={{ color: '#FFFFFF' }}
                           highlightDateNameStyle={{ color: '#FFFFFF' }}
                           disabledDateNameStyle={{ color: 'grey' }}
                           disabledDateNumberStyle={{ color: 'grey' }}
                           styleWeekend={true}
                           minDate={new Date()} // Disable past dates
                       />

                       {loading && (
                           <View style={{ padding: 20 }}>
                               <Text color="white">Scheduling session...</Text>
                           </View>
                       )}

                       {selectedDate && (
                           <View style={{ padding: 20 }}>
                               <Text 
                                   style={{ 
                                       color: 'white', 
                                       fontSize: 18, 
                                       marginBottom: 20,
                                       fontWeight: 'bold'
                                   }}
                               >
                                   Selected Week Schedule
                               </Text>
                               
                               {getWeekDays(selectedDate).map((date, index) => (
                                   <View 
                                       key={index} 
                                       style={{ 
                                           flexDirection: 'row', 
                                           alignItems: 'center',
                                           marginBottom: 15,
                                           opacity: date < new Date() ? 0.5 : 1 // Dim past dates
                                       }}
                                   >
                                       {renderSessionLetter(index)}
                                       <View style={{ marginLeft: 15 }}>
                                           <Text 
                                               style={{ 
                                                   color: 'white',
                                                   fontSize: 16 
                                               }}
                                           >
                                               {format(date, 'EEEE')}
                                           </Text>
                                           <Text 
                                               style={{ 
                                                   color: 'rgba(255,255,255,0.7)',
                                                   fontSize: 14 
                                               }}
                                           >
                                               {format(date, 'MMMM d')}
                                           </Text>
                                       </View>
                                   </View>
                               ))}
                           </View>
                       )}
                   </ScrollView>
               </SafeAreaView>
           </View>
     
       </Background>
   );
};

export default ScheduleSessionView;