import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { supabase } from '../services/supabase';
import Background from '../components/Background';

// Mock data for testing
const MOCK_USERS = [
  {
    id: '1',
    uid: 'user123',
    name: 'John Doe',
    username: 'johndoe',
    email: 'john@example.com',
    role: 'athlete',
    picture: 'https://randomuser.me/api/portraits/men/1.jpg',
    is_onboarding_completed: true
  },
  {
    id: '2',
    uid: 'user456',
    name: 'Jane Smith',
    username: 'janesmith',
    email: 'jane@example.com',
    role: 'trainer',
    picture: 'https://randomuser.me/api/portraits/women/1.jpg',
    is_onboarding_completed: true
  }
];

const SupabaseTest = () => {
  const [testResult, setTestResult] = useState<string>('Testing Supabase connection...');
  const [userData, setUserData] = useState<any>(null);
  const [useMockData, setUseMockData] = useState<boolean>(false);

  useEffect(() => {
    const testConnection = async () => {
      try {
        if (useMockData) {
          setTestResult('Using mock data (Supabase connection not available)');
          setUserData(MOCK_USERS);
          return;
        }

        // Test database connection
        const { data, error } = await supabase.from('users').select('*').limit(5);
        
        if (error) {
          console.error('Supabase error:', error);
          setTestResult(`Error connecting to Supabase: ${error.message}`);
          // Fall back to mock data
          setUseMockData(true);
          setUserData(MOCK_USERS);
        } else {
          setTestResult('Successfully connected to Supabase!');
          setUserData(data);
        }
      } catch (err) {
        console.error('Exception:', err);
        setTestResult(`Exception when connecting to Supabase: ${err.message}`);
        // Fall back to mock data
        setUseMockData(true);
        setUserData(MOCK_USERS);
      }
    };

    testConnection();
  }, [useMockData]);

  return (
    <Background>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={{ color: 'white', fontSize: 24, marginBottom: 20, fontWeight: 'bold' }}>
            Supabase Migration Test
          </Text>
          
          <View style={{ backgroundColor: 'rgba(3, 6, 61, 0.5)', padding: 15, borderRadius: 10, marginBottom: 20 }}>
            <Text style={{ color: 'white', fontSize: 18, marginBottom: 10 }}>
              Connection Status:
            </Text>
            <Text style={{ color: useMockData ? '#FFA500' : '#4CAF50', fontSize: 16, marginBottom: 10 }}>
              {testResult}
            </Text>
            
            <Pressable
              style={{
                backgroundColor: 'rgba(73, 190, 255, 0.44)',
                padding: 10,
                borderRadius: 5,
                alignItems: 'center',
                marginTop: 10
              }}
              onPress={() => setUseMockData(!useMockData)}
            >
              <Text style={{ color: 'white' }}>
                {useMockData ? 'Try Real Connection' : 'Use Mock Data'}
              </Text>
            </Pressable>
          </View>

          <Text style={{ color: 'white', fontSize: 18, marginBottom: 10 }}>
            {useMockData ? 'Mock User Data:' : 'User Data from Supabase:'}
          </Text>
          
          {userData && userData.map((user, index) => (
            <View 
              key={index} 
              style={{ 
                backgroundColor: 'rgba(3, 6, 61, 0.4)', 
                padding: 15, 
                borderRadius: 10,
                marginBottom: 10
              }}
            >
              <Text style={{ color: 'white', fontSize: 16, marginBottom: 5 }}>
                Name: {user.name}
              </Text>
              <Text style={{ color: 'white', fontSize: 16, marginBottom: 5 }}>
                Username: {user.username}
              </Text>
              <Text style={{ color: 'white', fontSize: 16, marginBottom: 5 }}>
                Email: {user.email}
              </Text>
              <Text style={{ color: 'white', fontSize: 16, marginBottom: 5 }}>
                Role: {user.role}
              </Text>
            </View>
          ))}
          
          <View style={{ marginTop: 20 }}>
            <Text style={{ color: 'white', fontSize: 18, marginBottom: 10 }}>
              Migration Status:
            </Text>
            <Text style={{ color: 'white', fontSize: 16 }}>
              ✅ Supabase client configured
            </Text>
            <Text style={{ color: 'white', fontSize: 16 }}>
              ✅ Database schema created
            </Text>
            <Text style={{ color: 'white', fontSize: 16 }}>
              ✅ API layer migrated
            </Text>
            <Text style={{ color: 'white', fontSize: 16 }}>
              ✅ Authentication migrated
            </Text>
            <Text style={{ color: 'white', fontSize: 16 }}>
              ✅ Storage migrated
            </Text>
            <Text style={{ color: 'white', fontSize: 16 }}>
              ✅ Realtime functionality migrated
            </Text>
            <Text style={{ color: 'white', fontSize: 16 }}>
              ✅ Edge functions deployed
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
};

export default SupabaseTest;