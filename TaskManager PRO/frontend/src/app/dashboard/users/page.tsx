'use client';

import React, { useState, useEffect } from 'react';
import { Box, Container, Heading, Button, VStack, Text } from '@chakra-ui/react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from 'react-query';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';
import { toast, Toaster } from 'react-hot-toast';

// User interface
interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export default function UsersPage() {
  // Create a client
  const queryClientInstance = new QueryClient();
  
  return (
    <QueryClientProvider client={queryClientInstance}>
      <UsersPageContent />
    </QueryClientProvider>
  );
}

function UsersPageContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  useEffect(() => {
    const user = getUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);
  
  // Get users with search filter
  const { data: users, isLoading } = useQuery<User[]>(
    ['users', searchTerm],
    async () => {
      const params: Record<string, string> = {};
      if (searchTerm) params.search = searchTerm;
      
      const response = await api.get('/users', { params });
      return response.data;
    },
    {
      enabled: !!currentUser && currentUser.role === 'admin',
      staleTime: 60000, // 1 minute
      refetchOnWindowFocus: false
    }
  );
  
  // Create/update user mutation
  const userMutation = useMutation(
    async (formData: any) => {
      if (selectedUser) {
        return api.put(`/users/${selectedUser._id}`, formData);
      } else {
        return api.post('/users', formData);
      }
    },
    {
      onSuccess: () => {
        toast.success(selectedUser ? 'User updated successfully' : 'User created successfully');
        queryClient.invalidateQueries(['users']);
        setIsOpen(false);
      },
      onError: (error: any) => {
        toast.error(`Failed: ${error.response?.data?.message || 'Error saving user'}`);
      }
    }
  );
  
  // Delete user mutation
  const deleteMutation = useMutation(
    async (userId: string) => {
      return api.delete(`/users/${userId}`);
    },
    {
      onSuccess: () => {
        toast.success('User deleted successfully');
        queryClient.invalidateQueries(['users']);
      },
      onError: () => {
        toast.error('Failed to delete user');
      }
    }
  );
  
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsOpen(true);
  };
  
  const handleNewUser = () => {
    setSelectedUser(null);
    setIsOpen(true);
  };
  
  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteMutation.mutate(userId);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const userData = {
      name: formData.get('name'),
      email: formData.get('email'),
      role: formData.get('role'),
      ...(selectedUser ? {} : { password: formData.get('password') })
    };
    
    userMutation.mutate(userData);
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    setSearchTerm(form.search.value);
  };
  
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return '#E53E3E'; // red
      case 'manager': return '#805AD5'; // purple
      default: return '#3182CE'; // blue
    }
  };
  
  // Check if user has admin permission
  if (currentUser && currentUser.role !== 'admin') {
    return (
      <Container maxW="container.xl" py={8}>
        <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg" bg="red.50">
          <Heading size="md" color="red.500">Access Denied</Heading>
          <Box mt={4}>
            You don't have permission to access the User Management section.
            Please contact your administrator for access.
          </Box>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Toaster position="top-right" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <Heading size="lg">User Management</Heading>
        <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={handleNewUser}>
          Add User
        </Button>
      </div>
      
      {/* Search Bar */}
      <Box mb={6}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            name="search"
            placeholder="Search users..."
            defaultValue={searchTerm}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: '0.375rem',
              border: '1px solid #E2E8F0',
              color: '#000000',
              backgroundColor: '#FFFFFF'
            }}
          />
          <Button type="submit" leftIcon={<FiSearch />}>
            Search
          </Button>
        </form>
      </Box>
      
      {isLoading ? (
        <Box textAlign="center" py={10}>
          <div className="spinner" style={{ 
            width: '50px', 
            height: '50px', 
            border: '4px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '50%',
            borderTop: '4px solid #3182ce',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
          <Box mt={4}>Loading users...</Box>
        </Box>
      ) : users && users.length > 0 ? (
        <Box overflowX="auto">
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <thead style={{ backgroundColor: '#F7FAFC' }}>
              <tr>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'semibold', borderBottom: '1px solid #E2E8F0' }}>Name</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'semibold', borderBottom: '1px solid #E2E8F0' }}>Email</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'semibold', borderBottom: '1px solid #E2E8F0' }}>Role</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'semibold', borderBottom: '1px solid #E2E8F0' }}>Created</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'semibold', borderBottom: '1px solid #E2E8F0', width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0', fontWeight: '500' }}>{user.name}</td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0' }}>{user.email}</td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0' }}>
                    <span style={{ 
                      backgroundColor: getRoleColor(user.role),
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0' }}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0' }}>
                    <Button
                      size="sm"
                      leftIcon={<FiEdit2 />}
                      mr={2}
                      onClick={() => handleEditUser(user)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="red"
                      leftIcon={<FiTrash2 />}
                      onClick={() => handleDeleteUser(user._id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      ) : (
        <Box textAlign="center" py={10} borderWidth="1px" borderRadius="lg">
          <Text fontSize="xl">No users found</Text>
          <Text mt={2} color="gray.500">Add your first user to get started</Text>
        </Box>
      )}
      
      {/* User Form Modal */}
      {isOpen && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div className="modal" style={{
            backgroundColor: '#171923',
            color: '#E2E8F0',
            borderRadius: '0.375rem',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '1.5rem',
            position: 'relative',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
            backgroundImage: 'linear-gradient(to bottom right, #1A202C, #171923, #0D1117)'
          }}>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#E2E8F0'
              }}
            >
              ×
            </button>
            <h3 style={{ 
              marginBottom: '1.5rem', 
              fontSize: '1.75rem',
              textAlign: 'center',
              fontWeight: 'bold',
              borderBottom: '1px solid #4A5568',
              paddingBottom: '0.75rem'
            }}>
              {selectedUser ? 'Edit User' : 'Add New User'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Name *
                  </label>
                  <input
                    name="name"
                    defaultValue={selectedUser?.name}
                    required
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #4A5568',
                      backgroundColor: '#2D3748',
                      color: '#E2E8F0'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Email *
                  </label>
                  <input
                    name="email"
                    type="email"
                    defaultValue={selectedUser?.email}
                    required
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #4A5568',
                      backgroundColor: '#2D3748',
                      color: '#E2E8F0'
                    }}
                  />
                </div>
                
                {!selectedUser && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                      Password *
                    </label>
                    <input
                      name="password"
                      type="password"
                      required={!selectedUser}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        borderRadius: '0.375rem',
                        border: '1px solid #4A5568',
                        backgroundColor: '#2D3748',
                        color: '#E2E8F0'
                      }}
                    />
                  </div>
                )}
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Role *
                  </label>
                  <select 
                    name="role" 
                    defaultValue={selectedUser?.role || 'user'}
                    required
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #4A5568',
                      backgroundColor: '#2D3748',
                      color: '#E2E8F0'
                    }}
                  >
                    <option value="user">User</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                
                <Button 
                  type="submit" 
                  colorScheme="blue" 
                  mt={4}
                  isLoading={userMutation.isLoading}
                  style={{
                    background: 'linear-gradient(to right, #3182CE, #2B6CB0)',
                    padding: '0.75rem',
                    fontWeight: 'bold',
                    letterSpacing: '0.5px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    width: '100%'
                  }}
                >
                  {selectedUser ? 'Update User' : 'Create User'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </Container>
  );
} 