'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import socket from '@/lib/socket';
import { getUser, isAuthenticated, logout, initSession } from '@/lib/auth';
import dynamic from 'next/dynamic';
import { FiMenu, FiHome, FiList, FiUsers, FiSettings, FiBell, FiLogOut, FiUser } from 'react-icons/fi';

// Dark theme colors
const colors = {
  background: {
    primary: '#111827',    // Main background
    secondary: '#1F2937',  // Sidebar, cards background
    tertiary: '#374151',   // Hover states, borders
  },
  text: {
    primary: '#F9FAFB',    // Main text
    secondary: '#D1D5DB',  // Secondary text
    muted: '#9CA3AF',      // Muted text
    accent: '#60A5FA',     // Accent text (links, etc)
  },
  border: '#374151',
  accent: '#3B82F6',       // Primary accent color
};

// Dynamically import the notification center to avoid SSR hydration issues
const NotificationCenter = dynamic(
  () => import('@/components/NotificationCenter'),
  { ssr: false }
);

interface NavItemProps {
  icon: React.ReactNode;
  children: React.ReactNode;
  href: string;
  isActive?: boolean;
}

const NavItem = ({ icon, children, href, isActive = false }: NavItemProps) => {
  const router = useRouter();
  
  const handleNavigation = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    router.push(path);
    
    // Save the current path to sessionStorage (specific to this browser tab)
    sessionStorage.setItem('currentPath', path);
  };
  
  return (
    <a 
      href={href}
      onClick={(e) => handleNavigation(e, href)}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 16px',
          margin: '4px 12px',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          backgroundColor: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
          color: isActive ? colors.text.accent : colors.text.secondary,
          fontWeight: isActive ? 500 : 400,
        }}
        className="nav-item"
      >
        <span style={{ 
          fontSize: '18px', 
          opacity: isActive ? 1 : 0.75
        }}>
          {icon}
        </span>
        <span style={{ 
          marginLeft: '12px', 
          fontSize: '14px'
        }}>
          {children}
        </span>
      </div>
    </a>
  );
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();
  const [userData, setUserData] = useState<{name?: string; role?: string; id?: string} | null>(null);
  const [currentPath, setCurrentPath] = useState('/dashboard');
  
  // Initialize session and auth on component mount
  useEffect(() => {
    // Initialize session
    initSession();
    
    // Check if user is authenticated
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }
    
    // Get user data
    const user = getUser();
    if (user) {
      setUserData(user);
    } else {
      router.push('/auth/login');
    }
  }, [router]);
  
  // Update current path and store it in sessionStorage for tab-specific persistence
  useEffect(() => {
    const handleRouteChange = () => {
      const path = window.location.pathname;
      setCurrentPath(path);
      
      // Use sessionStorage for tab-specific persistence instead of localStorage
      // This ensures each browser tab maintains its own navigation state
      sessionStorage.setItem('currentPath', path);
    };
    
    // Initial path detection
    handleRouteChange();
    
    // Listen for future route changes within the app
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);
  
  // Handle logout
  const handleLogout = () => {
    try {
      // Use our new logout function
      logout();
      
      // Navigate to login page
      router.push('/auth/login');
    } catch (err) {
      console.error('Error during logout:', err);
    }
  };

  // Connect socket when dashboard mounts and reconnect if needed
  useEffect(() => {
    // Initialize reconnectInterval
    let reconnectInterval: NodeJS.Timeout | null = null;
    
    const setupSocket = () => {
      // Socket setup is now handled by our auth system
      // But we'll still set up reconnect handlers
      
      socket.on('connect', () => {
        console.log('Socket connected successfully');
        if (reconnectInterval) {
          clearInterval(reconnectInterval);
        }
      });
      
      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected, reason:', reason);
      });
    };
    
    // Setup socket connection
    setupSocket();
    
    // Handle visibility change (tab becomes active again)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Check auth status when tab becomes visible
        if (!isAuthenticated()) {
          router.push('/auth/login');
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup function
    return () => {
      if (reconnectInterval) {
        clearInterval(reconnectInterval);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [router]);

  // Toggle dropdown without affecting sidebar
  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDropdownOpen(!dropdownOpen);
  };

  const isAdmin = userData?.role === 'admin';
  const isManager = userData?.role === 'manager';
  
  // Define role-based access to pages
  const canAccessUsers = isAdmin;
  const canAccessReports = isAdmin || isManager;
  const canAccessAllTasks = isAdmin || isManager;

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: colors.background.primary,
      display: 'flex',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      color: colors.text.primary,
    }}>
      {/* Sidebar */}
      <div
        style={{
          width: sidebarOpen ? '260px' : '0',
          position: 'fixed',
          height: '100%',
          backgroundColor: colors.background.secondary,
          borderRight: `1px solid ${colors.border}`,
          transition: 'width 0.3s ease',
          overflow: 'hidden',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
          zIndex: 50,
        }}
      >
        <div style={{ padding: '24px 0', height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: '20px',
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: '32px',
              color: colors.text.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <div style={{ 
              width: '32px', 
              height: '32px', 
              backgroundColor: colors.accent, 
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '16px',
            }}>
              TM
            </div>
            TaskManager PRO
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <div style={{ padding: '0 24px', marginBottom: '8px', fontSize: '11px', fontWeight: 500, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Main Menu
            </div>
            <NavItem 
              icon={<FiHome />} 
              href="/dashboard"
              isActive={currentPath === '/dashboard'}
            >
              Dashboard
            </NavItem>
            <NavItem 
              icon={<FiList />} 
              href="/dashboard/tasks"
              isActive={currentPath.includes('/dashboard/tasks')}
            >
              {canAccessAllTasks ? 'All Tasks' : 'My Tasks'}
            </NavItem>
            
            {canAccessReports && (
              <NavItem 
                icon={<FiBell />} 
                href="/dashboard/reports"
                isActive={currentPath.includes('/dashboard/reports')}
              >
                Reports & Analytics
              </NavItem>
            )}
            
            {canAccessUsers && (
              <NavItem 
                icon={<FiUsers />} 
                href="/dashboard/users"
                isActive={currentPath.includes('/dashboard/users')}
              >
                User Management
              </NavItem>
            )}
          </div>
          
          <div style={{ marginTop: 'auto' }}>
            <div style={{ padding: '0 24px', marginBottom: '8px', fontSize: '11px', fontWeight: 500, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Settings
            </div>
            <NavItem 
              icon={<FiSettings />} 
              href="/dashboard/settings"
              isActive={currentPath.includes('/dashboard/settings')}
            >
              Settings
            </NavItem>
            <NavItem 
              icon={<FiUser />} 
              href="/dashboard/profile"
              isActive={currentPath.includes('/dashboard/profile')}
            >
              Profile
            </NavItem>
            <div 
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                margin: '4px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                color: '#F87171',
              }}
              className="nav-item"
            >
              <span style={{ fontSize: '18px' }}>
                <FiLogOut />
              </span>
              <span style={{ marginLeft: '12px', fontSize: '14px' }}>
                Logout
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div style={{ 
        flexGrow: 1,
        marginLeft: sidebarOpen ? '260px' : '0',
        transition: 'margin-left 0.3s ease',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <header
          style={{
            height: '64px',
            backgroundColor: colors.background.secondary,
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            position: 'sticky',
            top: 0,
            zIndex: 40,
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
          }}
        >
          <button
            style={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              borderRadius: '4px',
              padding: '8px',
              cursor: 'pointer',
              color: colors.text.secondary,
              fontSize: '20px',
            }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="toggle menu"
          >
            <FiMenu />
          </button>
          
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <NotificationCenter />
            
            <div style={{ position: 'relative' }}>
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  transition: 'all 0.2s ease',
                  border: '1px solid transparent',
                  backgroundColor: dropdownOpen ? colors.background.tertiary : 'transparent',
                }}
                onClick={toggleDropdown}
              >
                <div 
                  style={{ 
                    width: '36px', 
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: colors.accent,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  }}
                >
                  {userData?.name ? userData.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 500, fontSize: '14px', color: colors.text.primary }}>{userData?.name || 'User'}</div>
                  <div style={{ fontSize: '12px', color: colors.text.muted }}>{userData?.role || 'User'}</div>
                </div>
              </div>
              
              {dropdownOpen && (
                <div 
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    right: '0',
                    backgroundColor: colors.background.secondary,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    zIndex: 50,
                    width: '200px',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ padding: '12px 16px', borderBottom: `1px solid ${colors.border}` }}>
                    <div style={{ fontWeight: 500, fontSize: '14px', color: colors.text.primary }}>{userData?.name}</div>
                    <div style={{ fontSize: '12px', color: colors.text.muted, marginTop: '4px' }}>{userData?.role}</div>
                  </div>
                  
                  <div 
                    style={{ 
                      padding: '10px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'background-color 0.2s',
                      cursor: 'pointer',
                      color: colors.text.secondary,
                      fontSize: '14px',
                    }}
                    className="dropdown-item"
                    onClick={() => {
                      router.push('/dashboard/profile');
                      sessionStorage.setItem('currentPath', '/dashboard/profile');
                      setDropdownOpen(false);
                    }}
                  >
                    <FiUser size={14} />
                    Profile Settings
                  </div>
                  
                  <a 
                    href="/rbac-guide.html" 
                    target="_blank"
                    style={{ 
                      padding: '10px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'background-color 0.2s',
                      cursor: 'pointer',
                      color: colors.text.secondary,
                      fontSize: '14px',
                      textDecoration: 'none',
                    }}
                    className="dropdown-item"
                  >
                    <FiSettings size={14} />
                    Role Permissions Guide
                  </a>
                  
                  <div 
                    style={{ 
                      padding: '10px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      borderTop: `1px solid ${colors.border}`,
                      transition: 'background-color 0.2s',
                      cursor: 'pointer',
                      color: '#F87171',
                      fontSize: '14px',
                    }}
                    className="dropdown-item"
                    onClick={handleLogout}
                  >
                    <FiLogOut size={14} />
                    Logout
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        
        {/* Main content area */}
        <main style={{ 
          flexGrow: 1, 
          padding: '24px',
          backgroundColor: colors.background.primary,
        }}>
          {children}
        </main>
      </div>
      
      <style jsx>{`
        .nav-item:hover {
          background-color: ${colors.background.tertiary};
          color: ${colors.text.accent};
        }
        .dropdown-item:hover {
          background-color: ${colors.background.tertiary};
        }
      `}</style>
    </div>
  );
} 