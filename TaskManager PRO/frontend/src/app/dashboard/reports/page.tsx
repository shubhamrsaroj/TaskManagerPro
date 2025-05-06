'use client';

import React, { useState, useEffect } from 'react';
import { Box, Container, Heading, Text, VStack } from '@chakra-ui/react';
import { FiBarChart2, FiPieChart, FiTrendingUp, FiClock, FiUsers, FiCheckCircle } from 'react-icons/fi';
import { getUser } from '@/lib/auth';

// Demo data for the reports page
const reportData = {
  taskCompletion: {
    total: 124,
    completed: 89,
    rate: 71.8,
    change: 12.4
  },
  userActivity: {
    activeUsers: 8,
    tasksPerUser: 15.5,
    topUser: "John Doe"
  },
  timeMetrics: {
    avgCompletionTime: "2.4 days",
    onTimeRate: 83.5,
    change: 5.2
  }
};

export default function ReportsPage() {
  const [userData, setUserData] = useState<any>(null);
  
  // Get user data
  useEffect(() => {
    const user = getUser();
    if (user) {
      setUserData(user);
    }
  }, []);

  return (
    <Container maxW="container.xl" py={8}>
      <Heading size="lg" mb={6}>Reports & Analytics</Heading>
      
      {/* Section: Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <StatCard 
          title="Task Completion" 
          value={`${reportData.taskCompletion.completed}/${reportData.taskCompletion.total}`}
          description={`${reportData.taskCompletion.rate}% completion rate`}
          icon={<FiCheckCircle size={20} />}
          change={reportData.taskCompletion.change}
          color="#3182CE"
        />
        
        <StatCard 
          title="User Activity" 
          value={`${reportData.userActivity.activeUsers} active users`}
          description={`Avg ${reportData.userActivity.tasksPerUser} tasks per user`}
          icon={<FiUsers size={20} />}
          color="#805AD5"
        />
        
        <StatCard 
          title="Time Metrics" 
          value={reportData.timeMetrics.avgCompletionTime}
          description={`${reportData.timeMetrics.onTimeRate}% on-time completion`}
          icon={<FiClock size={20} />}
          change={reportData.timeMetrics.change}
          color="#38A169"
        />
      </div>
      
      {/* Main Report Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: '2rem' }}>
        {/* Task Distribution Chart */}
        <ChartPlaceholder 
          title="Task Status Distribution" 
          icon={<FiPieChart size={20} />}
          description="Distribution of tasks by current status"
          height="300px"
        />
        
        {/* Completion Trend Chart */}
        <ChartPlaceholder 
          title="Task Completion Trend" 
          icon={<FiTrendingUp size={20} />}
          description="Weekly task completion rate over time"
          height="300px"
        />
        
        {/* User Performance Chart */}
        <ChartPlaceholder 
          title="User Performance" 
          icon={<FiUsers size={20} />}
          description="Tasks completed per user"
          height="300px"
        />
        
        {/* Priority Distribution Chart */}
        <ChartPlaceholder 
          title="Task Priority Distribution" 
          icon={<FiBarChart2 size={20} />}
          description="Distribution of tasks by priority level"
          height="300px"
        />
      </div>
      
      {/* Access Restriction Message */}
      {userData && userData.role !== 'admin' && userData.role !== 'manager' && (
        <Box mt={8} p={4} borderRadius="md" borderWidth="1px" borderLeft="4px solid" borderLeftColor="red.500" bg="red.50">
          <Text color="red.600" fontWeight="medium">
            You don't have sufficient permissions to view the complete reports.
            Please contact your administrator for access.
          </Text>
        </Box>
      )}
    </Container>
  );
}

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  change?: number;
  color: string;
}

function StatCard({ title, value, description, icon, change, color }: StatCardProps) {
  return (
    <Box
      p={5}
      borderRadius="lg"
      borderWidth="1px"
      borderLeft="4px solid"
      borderLeftColor={color}
      boxShadow="md"
      bg="gray.800"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <Text fontWeight="medium" fontSize="lg" color="gray.200">{title}</Text>
        <Box color={color}>{icon}</Box>
      </div>
      
      <Text fontSize="2xl" fontWeight="bold" color="white" mb={1}>{value}</Text>
      <Text fontSize="sm" color="gray.400">
        {description}
        {change && (
          <span style={{ display: 'inline-flex', alignItems: 'center', marginLeft: '0.5rem' }}>
            <span style={{ 
              color: change > 0 ? '#38A169' : '#E53E3E',
              marginRight: '0.25rem'
            }}>
              {change > 0 ? '↑' : '↓'}
            </span>
            {Math.abs(change)}% from last month
          </span>
        )}
      </Text>
    </Box>
  );
}

// Chart Placeholder Component
interface ChartPlaceholderProps {
  title: string;
  icon: React.ReactNode;
  description: string;
  height: string;
}

function ChartPlaceholder({ title, icon, description, height }: ChartPlaceholderProps) {
  return (
    <Box
      p={5}
      borderRadius="lg"
      borderWidth="1px"
      boxShadow="md"
      height={height}
      bg="gray.800"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <Heading size="md" color="gray.200">{title}</Heading>
        <Box color="#3182CE">{icon}</Box>
      </div>
      <Text fontSize="sm" color="gray.400" mb={4}>{description}</Text>
      
      <div style={{ 
        height: 'calc(100% - 80px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        borderRadius: '0.375rem',
        backgroundColor: '#2D3748',
        color: '#718096',
        padding: '1rem'
      }}>
        <Text textAlign="center" fontStyle="italic">
          Chart visualization would appear here.
        </Text>
        <Text fontSize="sm" mt={2} textAlign="center">
          Connect to your data visualization library of choice.
        </Text>
      </div>
    </Box>
  );
} 