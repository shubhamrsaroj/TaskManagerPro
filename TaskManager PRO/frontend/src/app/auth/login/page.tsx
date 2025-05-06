'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  useToast,
  Container,
  Link,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { saveAuthData } from '@/lib/auth';
import { FiMail, FiLock, FiUser } from 'react-icons/fi';

// Dark theme colors
const colors = {
  background: {
    primary: '#111827',    // Main background
    secondary: '#1F2937',  // Cards background
    highlight: '#293445',  // Hover states, etc
  },
  text: {
    primary: '#F9FAFB',    // Main text
    secondary: '#D1D5DB',  // Secondary text
    accent: '#3B82F6',     // Links, etc
  },
  border: '#374151',
  accent: {
    primary: '#3B82F6',    // Primary accent (buttons, etc)
    gradient: 'linear-gradient(to right, #3B82F6, #2DD4BF)',
  },
};

interface LoginForm {
  email: string;
  password: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();
  const router = useRouter();
  const toast = useToast();

  const onSubmit = async (data: LoginForm) => {
    try {
      setIsLoading(true);
      const response = await api.post('/auth/login', data);
      const { token, user } = response.data;
      
      // Save auth data using our new helper function
      saveAuthData(token, user);
      
      toast({
        title: 'Login successful',
        status: 'success',
        duration: 3000,
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Login failed',
        description: error.response?.data?.message || 'Something went wrong',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box 
      minH="100vh" 
      bg="linear-gradient(to bottom right, #1A202C, #171923, #0D1117)" 
      color="#E2E8F0"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Container maxW="container.sm" py={12}>
        <Box 
          p={8} 
          bg="#2D3748" 
          borderRadius="xl" 
          boxShadow="xl"
          borderLeft="4px solid"
          borderColor="#3182CE"
        >
          <VStack spacing={6} align="stretch">
            <VStack spacing={2} align="center">
              <Heading 
                fontSize="3xl" 
                fontWeight="bold"
                color="#90CDF4"
              >
                Welcome Back
              </Heading>
              <Text color="gray.400">Sign in to your account</Text>
            </VStack>
            
            <Box as="form" onSubmit={handleSubmit(onSubmit)}>
              <VStack spacing={4}>
                <FormControl isInvalid={!!errors.email}>
                  <FormLabel color="#90CDF4">Email</FormLabel>
                  <Input
                    type="email"
                    bg="#1A202C"
                    borderColor="#4A5568"
                    color="white"
                    _hover={{ borderColor: "#63B3ED" }}
                    _focus={{ borderColor: "#3182CE", boxShadow: "0 0 0 1px #3182CE" }}
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address',
                      },
                    })}
                  />
                  {errors.email && (
                    <div style={{ color: 'red', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                      {errors.email.message as string}
                    </div>
                  )}
                </FormControl>
                
                <FormControl isInvalid={!!errors.password}>
                  <FormLabel color="#90CDF4">Password</FormLabel>
                  <Input
                    type="password"
                    bg="#1A202C"
                    borderColor="#4A5568"
                    color="white"
                    _hover={{ borderColor: "#63B3ED" }}
                    _focus={{ borderColor: "#3182CE", boxShadow: "0 0 0 1px #3182CE" }}
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters',
                      },
                    })}
                  />
                  {errors.password && (
                    <div style={{ color: 'red', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                      {errors.password.message as string}
                    </div>
                  )}
                </FormControl>
                
                <Button
                  type="submit"
                  mt={4}
                  w="100%"
                  h="50px"
                  isLoading={isLoading}
                  bgGradient="linear(to-r, #3182CE, #2B6CB0)"
                  _hover={{ bgGradient: "linear(to-r, #2B6CB0, #1A365D)" }}
                  color="white"
                  fontSize="md"
                  fontWeight="bold"
                >
                  Sign In
                </Button>
              </VStack>
            </Box>
            
            <Text textAlign="center" pt={4}>
              Don't have an account?{' '}
              <Link color="#63B3ED" href="/auth/register">
                Sign up
              </Link>
            </Text>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
} 