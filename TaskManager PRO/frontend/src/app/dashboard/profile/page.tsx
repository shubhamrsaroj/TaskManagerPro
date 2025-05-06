'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Text,
  VStack,
  useToast,
} from '@chakra-ui/react';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';

interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const toast = useToast();

  useEffect(() => {
    // Try to get user from auth system first
    const authUser = getUser();
    if (authUser) {
      console.log('Loading user profile from auth system:', authUser);
      setUser(authUser);
      setFormData({
        ...formData,
        name: authUser.name,
        email: authUser.email,
      });
      return;
    }
    
    // Fallback to localStorage if needed
    try {
      const authData = localStorage.getItem('auth-storage');
      if (authData) {
        const { state } = JSON.parse(authData);
        if (state.user) {
          console.log('Loading user profile from localStorage:', state.user);
          setUser(state.user);
          setFormData({
            ...formData,
            name: state.user.name,
            email: state.user.email,
          });
        }
      }
    } catch (err) {
      console.error('Error accessing auth data:', err);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    // Validate form
    if (!formData.name || !formData.email) {
      toast({
        title: 'Error',
        description: 'Name and email are required',
        status: 'error',
        duration: 3000,
      });
      return;
    }
    
    try {
      setIsUpdating(true);
      
      // Only send required fields
      const updateData = {
        name: formData.name,
        email: formData.email,
      };
      
      const userId = user._id || user.id;
      await api.put(`/users/${userId}`, updateData);
      
      // Update local storage
      const authData = localStorage.getItem('auth-storage');
      if (authData) {
        const parsedData = JSON.parse(authData);
        parsedData.state.user = {
          ...parsedData.state.user,
          name: formData.name,
          email: formData.email,
        };
        localStorage.setItem('auth-storage', JSON.stringify(parsedData));
      }
      
      toast({
        title: 'Profile updated',
        status: 'success',
        duration: 3000,
      });
      
      // Update user state
      setUser({
        ...user,
        name: formData.name,
        email: formData.email,
      });
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error.response?.data?.message || 'Something went wrong',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords
    if (!formData.currentPassword) {
      toast({
        title: 'Current password is required',
        status: 'error',
        duration: 3000,
      });
      return;
    }
    
    if (!formData.newPassword || formData.newPassword.length < 6) {
      toast({
        title: 'New password must be at least 6 characters',
        status: 'error',
        duration: 3000,
      });
      return;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: 'Passwords do not match',
        status: 'error',
        duration: 3000,
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      await api.put('/users/password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      
      toast({
        title: 'Password updated successfully',
        status: 'success',
        duration: 3000,
      });
      
      // Clear password fields
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      toast({
        title: 'Password update failed',
        description: error.response?.data?.message || 'Something went wrong',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading size="lg" mb={4}>Profile Settings</Heading>
          <div 
            style={{
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              backgroundColor: '#3182CE',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              fontWeight: 'bold',
              margin: '0 auto 1rem auto'
            }}
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <Text fontWeight="bold" fontSize="xl">{user?.name}</Text>
          <Text color="gray.500">{user?.role}</Text>
        </Box>
        
        <Box 
          bg="#2D3748" 
          p={6} 
          borderRadius="lg" 
          boxShadow="md"
          borderLeft="4px solid"
          borderColor="#3182CE"
        >
          <Heading size="md" mb={4} color="#90CDF4">Personal Information</Heading>
          <form onSubmit={handleProfileUpdate}>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel color="#90CDF4">Name</FormLabel>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  bg="#1A202C"
                  borderColor="#4A5568"
                  color="white"
                  _hover={{ borderColor: "#63B3ED" }}
                  _focus={{ borderColor: "#3182CE", boxShadow: "0 0 0 1px #3182CE" }}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel color="#90CDF4">Email</FormLabel>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  bg="#1A202C"
                  borderColor="#4A5568"
                  color="white"
                  _hover={{ borderColor: "#63B3ED" }}
                  _focus={{ borderColor: "#3182CE", boxShadow: "0 0 0 1px #3182CE" }}
                />
              </FormControl>
              
              <Button
                type="submit"
                isLoading={isUpdating}
                bgGradient="linear(to-r, #3182CE, #2B6CB0)"
                _hover={{ bgGradient: "linear(to-r, #2B6CB0, #1A365D)" }}
                color="white"
              >
                Update Profile
              </Button>
            </VStack>
          </form>
        </Box>
        
        <Box 
          bg="#2D3748" 
          p={6} 
          borderRadius="lg" 
          boxShadow="md"
          borderLeft="4px solid"
          borderColor="#3182CE"
        >
          <Heading size="md" mb={4} color="#90CDF4">Change Password</Heading>
          <form onSubmit={handlePasswordUpdate}>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel color="#90CDF4">Current Password</FormLabel>
                <Input
                  name="currentPassword"
                  type="password"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  bg="#1A202C"
                  borderColor="#4A5568"
                  color="white"
                  _hover={{ borderColor: "#63B3ED" }}
                  _focus={{ borderColor: "#3182CE", boxShadow: "0 0 0 1px #3182CE" }}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel color="#90CDF4">New Password</FormLabel>
                <Input
                  name="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  bg="#1A202C"
                  borderColor="#4A5568"
                  color="white"
                  _hover={{ borderColor: "#63B3ED" }}
                  _focus={{ borderColor: "#3182CE", boxShadow: "0 0 0 1px #3182CE" }}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel color="#90CDF4">Confirm New Password</FormLabel>
                <Input
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  bg="#1A202C"
                  borderColor="#4A5568"
                  color="white"
                  _hover={{ borderColor: "#63B3ED" }}
                  _focus={{ borderColor: "#3182CE", boxShadow: "0 0 0 1px #3182CE" }}
                />
              </FormControl>
              
              <Button
                type="submit"
                isLoading={isLoading}
                bgGradient="linear(to-r, #3182CE, #2B6CB0)"
                _hover={{ bgGradient: "linear(to-r, #2B6CB0, #1A365D)" }}
                color="white"
              >
                Update Password
              </Button>
            </VStack>
          </form>
        </Box>
      </VStack>
    </Container>
  );
} 