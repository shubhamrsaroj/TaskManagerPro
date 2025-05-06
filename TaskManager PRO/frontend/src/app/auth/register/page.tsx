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

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const router = useRouter();
  const toast = useToast();

  const password = watch('password');

  // Save auth data to localStorage
  const saveAuthData = (token: string, user: User) => {
    try {
      const authData = {
        state: {
          token,
          user,
          isAuthenticated: true
        }
      };
      localStorage.setItem('auth-storage', JSON.stringify(authData));
    } catch (error) {
      console.error('Failed to save auth data', error);
    }
  };

  const onSubmit = async (data: RegisterForm) => {
    try {
      setIsLoading(true);
      const response = await api.post('/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
      });
      const { token, user } = response.data;
      
      // Save auth data
      saveAuthData(token, user);
      
      toast({
        title: 'Registration successful',
        status: 'success',
        duration: 3000,
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Registration failed',
        description: error.response?.data?.message || 'Something went wrong',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="container.sm" py={20}>
      <VStack spacing={8}>
        <Heading>Create Account</Heading>
        <Text color="gray.600">Sign up to get started</Text>
        <Box w="100%" as="form" onSubmit={handleSubmit(onSubmit)}>
          <VStack spacing={4}>
            <FormControl isInvalid={!!errors.name}>
              <FormLabel>Name</FormLabel>
              <Input
                {...register('name', {
                  required: 'Name is required',
                })}
              />
            </FormControl>
            <FormControl isInvalid={!!errors.email}>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
              />
            </FormControl>
            <FormControl isInvalid={!!errors.password}>
              <FormLabel>Password</FormLabel>
              <Input
                type="password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
              />
            </FormControl>
            <FormControl isInvalid={!!errors.confirmPassword}>
              <FormLabel>Confirm Password</FormLabel>
              <Input
                type="password"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value: string) =>
                    value === password || 'Passwords do not match',
                })}
              />
            </FormControl>
            <FormControl isInvalid={!!errors.role}>
              <FormLabel>Account Type</FormLabel>
              <select
                {...register('role', {
                  required: 'Please select an account type',
                })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  backgroundColor: '#1A202C',
                  borderColor: '#4A5568',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  color: 'white',
                  outline: 'none'
                }}
              >
                <option value="">Select role</option>
                <option value="user">Employee</option>
                <option value="manager">Manager</option>
                <option value="admin">Administrator</option>
              </select>
              {errors.role && (
                <div style={{ color: 'red', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                  {errors.role.message as string}
                </div>
              )}
            </FormControl>
            <Button
              type="submit"
              colorScheme="blue"
              size="lg"
              width="100%"
              isLoading={isLoading}
            >
              Sign Up
            </Button>
          </VStack>
        </Box>
        <Text>
          Already have an account?{' '}
          <Link color="blue.500" href="/auth/login">
            Sign in
          </Link>
        </Text>
      </VStack>
    </Container>
  );
} 