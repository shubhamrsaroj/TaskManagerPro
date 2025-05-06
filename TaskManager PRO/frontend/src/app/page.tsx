'use client';

import { useEffect } from 'react';
import { Box, Button, Container, Heading, Text, VStack } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { FiCalendar, FiUsers, FiRepeat, FiShield, FiBell, FiPieChart } from 'react-icons/fi';

export default function HomePage() {
  const router = useRouter();

  // Check if user is already logged in
  useEffect(() => {
    const authData = localStorage.getItem('auth-storage');
    if (authData) {
      try {
        const { state } = JSON.parse(authData);
        if (state.isAuthenticated) {
          router.push('/dashboard');
        }
      } catch (err) {
        console.error('Error parsing auth data:', err);
      }
    }
  }, [router]);

  const features = [
    {
      title: 'Role-Based Access Control',
      description: 'Secure your workflow with Admin, Manager, and User roles, each with appropriate permissions.',
      icon: FiShield,
    },
    {
      title: 'Recurring Tasks',
      description: 'Schedule tasks to repeat daily, weekly, or monthly. Perfect for routine work.',
      icon: FiRepeat,
    },
    {
      title: 'Team Collaboration',
      description: 'Assign tasks to team members and track progress in real-time.',
      icon: FiUsers,
    },
    {
      title: 'Real-time Notifications',
      description: 'Stay informed with instant notifications for task assignments and updates.',
      icon: FiBell,
    },
    {
      title: 'Task Management',
      description: 'Create, organize, and prioritize tasks with deadlines and status tracking.',
      icon: FiCalendar,
    },
    {
      title: 'Analytics Dashboard',
      description: 'Track productivity metrics and visualize task completion rates.',
      icon: FiPieChart,
    },
  ];

  return (
    <Box minH="100vh" bg="linear-gradient(to bottom right, #1A202C, #171923, #0D1117)" color="#E2E8F0">
      <Container maxW="container.xl" py={20}>
        <VStack spacing={12} align="center" textAlign="center">
          <VStack spacing={4}>
            <Heading 
              fontSize={{ base: '4xl', md: '6xl' }} 
              fontWeight="bold" 
              bgGradient="linear(to-r, #3182CE, #63B3ED)" 
              bgClip="text"
            >
              Welcome to TaskManager PRO
            </Heading>
            <Text fontSize={{ base: 'lg', md: 'xl' }} maxW="800px">
              A comprehensive task management system designed to boost productivity
              and streamline collaboration for teams of all sizes.
            </Text>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <Button 
                size="lg" 
                colorScheme="blue" 
                onClick={() => router.push('/auth/login')}
                bgGradient="linear(to-r, #3182CE, #2B6CB0)"
                _hover={{ bgGradient: "linear(to-r, #2B6CB0, #1A365D)" }}
              >
                Sign In
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                borderColor="#90CDF4"
                color="#90CDF4"
                onClick={() => router.push('/auth/register')}
                _hover={{ bg: 'rgba(144, 205, 244, 0.1)' }}
              >
                Register
              </Button>
            </div>
          </VStack>

          <Box w="100%" py={8}>
            <Heading size="xl" mb={12} textAlign="center" color="#90CDF4">
              Key Features
            </Heading>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
              gap: '2rem' 
            }}>
              {features.map((feature, index) => (
                <Box 
                  key={index} 
                  bg="#2D3748" 
                  p={6} 
                  borderRadius="lg" 
                  boxShadow="lg"
                  _hover={{ transform: 'translateY(-5px)', transition: 'transform 0.3s ease' }}
                  borderLeft="4px solid"
                  borderColor="#3182CE"
                >
                  <div style={{ fontSize: '2.5rem', color: '#90CDF4', marginBottom: '1rem' }}>
                    {<feature.icon />}
                  </div>
                  <Heading size="md" mb={2} color="white">
                    {feature.title}
                  </Heading>
                  <Text color="gray.300">
                    {feature.description}
                  </Text>
                </Box>
              ))}
            </div>
          </Box>

          <VStack spacing={4} pt={8}>
            <Heading size="lg" textAlign="center" color="#90CDF4">
              Ready to boost your productivity?
            </Heading>
            <Button
              size="lg"
              colorScheme="blue"
              onClick={() => router.push('/auth/register')}
              bgGradient="linear(to-r, #3182CE, #2B6CB0)"
              _hover={{ bgGradient: "linear(to-r, #2B6CB0, #1A365D)" }}
            >
              Get Started
            </Button>
          </VStack>
        </VStack>
      </Container>
    </Box>
  );
} 