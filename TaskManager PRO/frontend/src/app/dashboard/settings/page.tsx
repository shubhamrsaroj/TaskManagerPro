'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Text,
  VStack,
  useToast,
} from '@chakra-ui/react';
import api from '@/lib/api';

interface NotificationSettings {
  emailNotifications: boolean;
  taskAssignedNotification: boolean;
  taskUpdatedNotification: boolean;
  taskCompletedNotification: boolean;
  dailyDigest: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    taskAssignedNotification: true,
    taskUpdatedNotification: true,
    taskCompletedNotification: true,
    dailyDigest: false,
  });
  const [timeZone, setTimeZone] = useState('UTC');
  const toast = useToast();

  useEffect(() => {
    // Get user from localStorage
    try {
      const authData = localStorage.getItem('auth-storage');
      if (authData) {
        const { state } = JSON.parse(authData);
        if (state.user) {
          setUser(state.user);
        }
      }
    } catch (err) {
      console.error('Error accessing auth data:', err);
    }

    // For demo purposes we're using local state
    // In a real app, you would fetch user settings from the backend
    // Example:
    // const fetchSettings = async () => {
    //   try {
    //     const response = await api.get('/users/settings');
    //     setSettings(response.data.settings);
    //   } catch (error) {
    //     console.error('Error fetching settings:', error);
    //   }
    // };
    // fetchSettings();
  }, []);

  const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setSettings({
      ...settings,
      [name]: checked,
    });
  };

  const handleTimeZoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeZone(e.target.value);
  };

  const handleSaveSettings = async () => {
    try {
      setIsLoading(true);
      // In a real app, you would save settings to the backend
      // Example:
      // await api.put('/users/settings', { settings, timeZone });
      
      toast({
        title: 'Settings saved',
        status: 'success',
        duration: 3000,
      });
    } catch (error: any) {
      toast({
        title: 'Failed to save settings',
        description: error.response?.data?.message || 'Something went wrong',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Time zone options
  const timeZones = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Australia/Sydney',
  ];

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading size="lg" mb={2}>Settings</Heading>
          <Text color="gray.500">Customize your TaskManager PRO experience</Text>
        </Box>
        
        <Box 
          bg="#2D3748" 
          p={6} 
          borderRadius="lg" 
          boxShadow="md"
          borderLeft="4px solid"
          borderColor="#3182CE"
        >
          <Heading size="md" mb={4} color="#90CDF4">Notification Preferences</Heading>
          <VStack spacing={4} align="stretch">
            <FormControl display="flex" alignItems="center" justifyContent="space-between">
              <FormLabel htmlFor="emailNotifications" mb="0" color="white">
                Email Notifications
              </FormLabel>
              <input
                type="checkbox"
                id="emailNotifications" 
                name="emailNotifications"
                checked={settings.emailNotifications}
                onChange={handleToggleChange}
                style={{ width: '20px', height: '20px', accentColor: '#3182CE' }}
              />
            </FormControl>
            
            <FormControl display="flex" alignItems="center" justifyContent="space-between">
              <FormLabel htmlFor="taskAssignedNotification" mb="0" color="white">
                Task Assigned Notifications
              </FormLabel>
              <input
                type="checkbox" 
                id="taskAssignedNotification" 
                name="taskAssignedNotification"
                checked={settings.taskAssignedNotification}
                onChange={handleToggleChange}
                style={{ width: '20px', height: '20px', accentColor: '#3182CE' }}
              />
            </FormControl>
            
            <FormControl display="flex" alignItems="center" justifyContent="space-between">
              <FormLabel htmlFor="taskUpdatedNotification" mb="0" color="white">
                Task Updated Notifications
              </FormLabel>
              <input
                type="checkbox"
                id="taskUpdatedNotification" 
                name="taskUpdatedNotification"
                checked={settings.taskUpdatedNotification}
                onChange={handleToggleChange}
                style={{ width: '20px', height: '20px', accentColor: '#3182CE' }}
              />
            </FormControl>
            
            <FormControl display="flex" alignItems="center" justifyContent="space-between">
              <FormLabel htmlFor="taskCompletedNotification" mb="0" color="white">
                Task Completed Notifications
              </FormLabel>
              <input
                type="checkbox"
                id="taskCompletedNotification" 
                name="taskCompletedNotification"
                checked={settings.taskCompletedNotification}
                onChange={handleToggleChange}
                style={{ width: '20px', height: '20px', accentColor: '#3182CE' }}
              />
            </FormControl>
            
            <FormControl display="flex" alignItems="center" justifyContent="space-between">
              <FormLabel htmlFor="dailyDigest" mb="0" color="white">
                Daily Digest Email
              </FormLabel>
              <input
                type="checkbox"
                id="dailyDigest" 
                name="dailyDigest"
                checked={settings.dailyDigest}
                onChange={handleToggleChange}
                style={{ width: '20px', height: '20px', accentColor: '#3182CE' }}
              />
            </FormControl>
          </VStack>
        </Box>
        
        <Box 
          bg="#2D3748" 
          p={6} 
          borderRadius="lg" 
          boxShadow="md"
          borderLeft="4px solid"
          borderColor="#3182CE"
        >
          <Heading size="md" mb={4} color="#90CDF4">Regional Settings</Heading>
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel color="#90CDF4">Time Zone</FormLabel>
              <select
                value={timeZone}
                onChange={handleTimeZoneChange}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  backgroundColor: '#1A202C',
                  borderColor: '#4A5568',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderRadius: '0.375rem',
                  color: 'white'
                }}
              >
                {timeZones.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </FormControl>
          </VStack>
        </Box>
        
        <Button
          onClick={handleSaveSettings}
          isLoading={isLoading}
          bgGradient="linear(to-r, #3182CE, #2B6CB0)"
          _hover={{ bgGradient: "linear(to-r, #2B6CB0, #1A365D)" }}
          color="white"
          size="lg"
        >
          Save Settings
        </Button>
      </VStack>
    </Container>
  );
} 