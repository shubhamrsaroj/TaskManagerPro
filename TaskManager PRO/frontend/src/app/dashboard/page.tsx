'use client';

import { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import api from '@/lib/api';
import { FiFileText, FiCheckCircle, FiBarChart2, FiClock, FiAlertTriangle } from 'react-icons/fi';

// Dark theme colors
const colors = {
  background: {
    primary: '#111827',    // Main background
    secondary: '#1F2937',  // Sidebar, cards background
    tertiary: '#374151',   // Hover states, borders
    highlight: '#243046',  // Slightly lighter for hover states
  },
  text: {
    primary: '#F9FAFB',    // Main text
    secondary: '#D1D5DB',  // Secondary text
    muted: '#9CA3AF',      // Muted text
    accent: '#60A5FA',     // Accent text (links, etc)
  },
  border: '#374151',
  accent: '#3B82F6',       // Primary accent color
  green: '#10B981',
  red: '#EF4444',
  orange: '#F59E0B',
  purple: '#8B5CF6',
};

interface TaskStats {
  statusCounts: {
    completed?: number;
    'in-progress'?: number;
    todo?: number;
  };
  priorityCounts: {
    high?: number;
    medium?: number;
    low?: number;
  };
  overdueCount: number;
  dueTodayCount: number;
  dueThisWeekCount: number;
}

export default function DashboardPage() {
  const [userData, setUserData] = useState({ name: 'User' });

  // Load user data from localStorage instead of direct store access
  useEffect(() => {
    try {
      const authData = localStorage.getItem('auth-storage');
      if (authData) {
        const { state } = JSON.parse(authData);
        if (state.user) {
          setUserData(state.user);
        }
      }
    } catch (err) {
      console.error('Error accessing auth data:', err);
    }
  }, []);

  const { data: stats, isLoading } = useQuery<TaskStats>(
    'taskStats',
    async () => {
      const response = await api.get('/tasks/stats');
      return response.data;
    }
  );

  const { data: recentTasks, isLoading: isLoadingTasks } = useQuery(
    'recentTasks',
    async () => {
      const response = await api.get('/tasks', {
        params: {
          limit: 5,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        },
      });
      return response.data;
    }
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return colors.red;
      case 'medium': return colors.orange;
      case 'low': return colors.green;
      default: return colors.text.muted;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return colors.green;
      case 'in-progress': return colors.accent;
      case 'todo': return colors.text.muted;
      default: return colors.text.muted;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  // Calculate completion percentage
  const calculateCompletionPercentage = () => {
    if (!stats) return 0;
    
    const completed = stats.statusCounts?.completed || 0;
    const total = (stats.statusCounts?.completed || 0) + 
                 (stats.statusCounts?.['in-progress'] || 0) + 
                 (stats.statusCounts?.todo || 0);
    
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  const completionPercentage = calculateCompletionPercentage();

  return (
    <div>
      {/* Welcome section with summary */}
      <div className="welcome-card" style={{
        backgroundColor: colors.background.secondary,
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: colors.text.primary, 
              marginBottom: '8px'
            }}>
              Welcome back, {userData.name}!
            </h1>
            <p style={{ color: colors.text.secondary, fontSize: '14px' }}>
              Here's what's happening with your tasks today.
            </p>
          </div>
          <div style={{
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            padding: '12px 16px',
            borderRadius: '8px',
            color: colors.accent,
            fontSize: '14px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FiBarChart2 size={18} />
            <span>Task Completion: {completionPercentage}%</span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <StatCard 
          title="Total Tasks"
          value={isLoading ? '...' : (
            ((stats?.statusCounts?.completed || 0) + 
             (stats?.statusCounts?.['in-progress'] || 0) + 
             (stats?.statusCounts?.todo || 0)).toString()
          )}
          icon={<FiFileText size={20} />}
          color={colors.purple}
          isLoading={isLoading}
        />
        <StatCard 
          title="Completed"
          value={isLoading ? '...' : (stats?.statusCounts?.completed || 0).toString()}
          icon={<FiCheckCircle size={20} />}
          color={colors.green}
          isLoading={isLoading}
        />
        <StatCard 
          title="In Progress"
          value={isLoading ? '...' : (stats?.statusCounts?.['in-progress'] || 0).toString()}
          icon={<FiBarChart2 size={20} />}
          color={colors.accent}
          isLoading={isLoading}
        />
        <StatCard 
          title="Overdue"
          value={isLoading ? '...' : (stats?.overdueCount || 0).toString()}
          icon={<FiAlertTriangle size={20} />}
          color={colors.red}
          isLoading={isLoading}
        />
      </div>

      {/* Recent tasks */}
      <div style={{
        backgroundColor: colors.background.secondary,
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)'
      }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: 'bold', 
          color: colors.text.primary, 
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <FiClock size={18} />
          Recent Tasks
        </h2>
        
        {isLoadingTasks ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            padding: '40px',
            color: colors.text.secondary
          }}>
            <div className="loading-spinner"></div>
          </div>
        ) : !recentTasks || recentTasks.length === 0 ? (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center',
            color: colors.text.secondary,
            backgroundColor: colors.background.tertiary,
            borderRadius: '8px'
          }}>
            <p>No tasks found. Create your first task to get started!</p>
          </div>
        ) : (
          <div style={{ overflow: 'hidden', borderRadius: '8px', border: `1px solid ${colors.border}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: colors.background.tertiary, borderBottom: `1px solid ${colors.border}` }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: colors.text.muted, fontWeight: 500 }}>Task</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: colors.text.muted, fontWeight: 500 }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: colors.text.muted, fontWeight: 500 }}>Priority</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: colors.text.muted, fontWeight: 500 }}>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {recentTasks.map((task: any, index: number) => (
                  <tr 
                    key={task._id} 
                    style={{ 
                      borderBottom: index === recentTasks.length - 1 ? 'none' : `1px solid ${colors.border}`,
                      backgroundColor: index % 2 === 0 ? colors.background.secondary : colors.background.tertiary,
                    }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 500, fontSize: '14px', color: colors.text.primary }}>{task.title}</div>
                      <div style={{ fontSize: '13px', color: colors.text.secondary, marginTop: '4px', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {task.description}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ 
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 500,
                        backgroundColor: `${getStatusColor(task.status)}20`,
                        color: getStatusColor(task.status)
                      }}>
                        {task.status === 'in-progress' ? 'In Progress' : 
                          task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ 
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 500,
                        backgroundColor: `${getPriorityColor(task.priority)}20`,
                        color: getPriorityColor(task.priority)
                      }}>
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: colors.text.secondary }}>
                      {formatDate(task.dueDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx>{`
        .loading-spinner {
          width: 30px;
          height: 30px;
          border: 3px solid rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          border-top-color: ${colors.accent};
          animation: spin 1s ease-in-out infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  isLoading?: boolean;
}

function StatCard({ title, value, icon, color, isLoading = false }: StatCardProps) {
  return (
    <div style={{
      backgroundColor: colors.background.secondary,
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center' 
      }}>
        <span style={{ 
          fontSize: '14px', 
          fontWeight: 500, 
          color: colors.text.secondary 
        }}>
          {title}
        </span>
        <div style={{ 
          backgroundColor: `${color}20`, 
          width: '36px', 
          height: '36px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color
        }}>
          {icon}
        </div>
      </div>
      
      {isLoading ? (
        <div className="loading-shimmer" style={{ 
          height: '32px', 
          width: '60%', 
          borderRadius: '4px',
          backgroundColor: colors.background.tertiary
        }}></div>
      ) : (
        <span style={{ 
          fontSize: '32px', 
          fontWeight: 'bold', 
          color: colors.text.primary, 
          lineHeight: 1 
        }}>
          {value}
        </span>
      )}
    </div>
  );
} 