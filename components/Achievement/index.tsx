import React from 'react'
import Background from '../../components/Background'
import { SafeAreaView, ScrollView, Text, View, VStack } from '@gluestack-ui/themed'
import ScrollableHeader from '../../components/ScrollableHeader'

export default function Achievement({ title, dateAchieved }) {
    return (
        <View style={{ width: 101, height: 161, backgroundColor: 'rgba(3,6,61,.75)', borderRadius: 8, borderColor: '#C0C0C0' }}>
            <VStack space='sm'>
                <Text style={{ textAlign: 'center' }}>
                    {title}
                </Text>

                <Text>
                    {dateAchieved}
                </Text>
            </VStack>
        </View>
    )
}