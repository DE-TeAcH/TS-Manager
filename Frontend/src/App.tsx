import React, { useState, useEffect } from 'react';
import { Toaster } from './components/ui/sonner';
import { Layout } from './components/Layout';
import { LoginPage } from './components/LoginPage';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminRequests } from './components/AdminRequests';
import { AdminTeams } from './components/AdminTeams';
import { AdminUsers } from './components/AdminUsers';
import { AdminEvents } from './components/AdminEvents';
import { TeamLeaderDashboard } from './components/TeamLeaderDashboard';
import { TeamLeaderChats } from './components/TeamLeaderChats';
import { TeamLeaderTeam } from './components/TeamLeaderTeam';
import { TeamLeaderDepartments } from './components/TeamLeaderDepartments';
import { TeamLeaderEvents } from './components/TeamLeaderEvents';
import { DeptHeadDashboard } from './components/DeptHeadDashboard';
import { DeptHeadChats } from './components/DeptHeadChats';
import { DeptHeadMembers } from './components/DeptHeadMembers';
import { DeptHeadTeam } from './components/DeptHeadTeam';
import { DeptHeadEvents } from './components/DeptHeadEvents';
import { MemberDashboard } from './components/MemberDashboard';
import { MemberChats } from './components/MemberChats';
import { MemberTeam } from './components/MemberTeam';
import { MemberEvents } from './components/MemberEvents';
import { MemberSettings } from './components/MemberSettings';

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: 'admin' | 'team-leader' | 'dept-head' | 'member';
  teamName: string;
  teamId: number;
  departmentName?: string;
  departmentId?: number;
  avatar?: string;
}

const STORAGE_KEY = 'currentUser';
const PAGE_STORAGE_KEY = 'currentPage';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(() => {
    return localStorage.getItem(PAGE_STORAGE_KEY) || 'dashboard';
  });
  const [isLoading, setIsLoading] = useState(true);

  // Restore user session from localStorage on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEY);
      if (savedUser) {
        let userData = JSON.parse(savedUser);

        // Migration: Handle snake_case from legacy PHP backend if present
        if (!userData.teamName && userData.team_name) userData.teamName = userData.team_name;
        if (!userData.departmentName && userData.department_name) userData.departmentName = userData.department_name;
        if (!userData.teamId && userData.team_id) userData.teamId = userData.team_id;
        if (!userData.departmentId && userData.department_id) userData.departmentId = userData.department_id;

        setCurrentUser(userData);
      }
    } catch (error) {
      console.error('Failed to restore user session:', error);
      // Clear corrupted data
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLogin = (userRole: 'admin' | 'team-leader' | 'dept-head' | 'member', userData: User) => {
    setCurrentUser(userData);
    setCurrentPage('dashboard');
    // Persist user session to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      localStorage.setItem(PAGE_STORAGE_KEY, 'dashboard');
    } catch (error) {
      console.error('Failed to save user session:', error);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentPage('dashboard');
    // Clear user session from localStorage
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(PAGE_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear user session:', error);
    }
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    localStorage.setItem(PAGE_STORAGE_KEY, page);
  };

  const handleProfileUpdate = (updatedUser: Partial<User>) => {
    if (currentUser) {
      const newUser = { ...currentUser, ...updatedUser };
      setCurrentUser(newUser);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
      } catch (error) {
        console.error('Failed to update user session:', error);
      }
    }
  };

  const renderPage = () => {
    if (!currentUser) return null;

    switch (currentUser.role) {
      case 'admin':
        switch (currentPage) {
          case 'dashboard':
            return <AdminDashboard />;
          case 'requests':
            return <AdminRequests />;
          case 'teams':
            return <AdminTeams />;
          case 'users':
            return <AdminUsers />;
          case 'events':
            return <AdminEvents />;
          case 'settings':
            return <MemberSettings currentUser={currentUser} onLogout={handleLogout} onProfileUpdate={handleProfileUpdate} />;
          default:
            return <AdminDashboard />;
        }

      case 'team-leader':
        switch (currentPage) {
          case 'dashboard':
            return <TeamLeaderDashboard currentUser={currentUser} />;
          case 'messages':
            return <TeamLeaderChats userId={currentUser.id} userName={currentUser.name} teamId={currentUser.teamId} />;
          case 'members':
            return <TeamLeaderTeam currentUser={currentUser} />;
          case 'departments':
            return <TeamLeaderDepartments currentUser={currentUser} />;
          case 'events':
            return <TeamLeaderEvents currentUser={currentUser} />;
          case 'settings':
            return <MemberSettings currentUser={currentUser} onLogout={handleLogout} onProfileUpdate={handleProfileUpdate} />;
          default:
            return <TeamLeaderDashboard currentUser={undefined} />;
        }

      case 'dept-head':
        switch (currentPage) {
          case 'dashboard':
            return <DeptHeadDashboard currentUser={currentUser} />;
          case 'messages':
            return <DeptHeadChats userId={currentUser.id} userName={currentUser.name} />;
          case 'members':
            return <DeptHeadMembers currentUser={currentUser} />;
          case 'team':
            return <DeptHeadTeam currentUser={currentUser} />;
          case 'events':
            return <DeptHeadEvents currentUser={currentUser} />;
          case 'settings':
            return <MemberSettings currentUser={currentUser} onLogout={handleLogout} onProfileUpdate={handleProfileUpdate} />;
          default:
            return <DeptHeadDashboard currentUser={undefined} />;
        }

      case 'member':
        switch (currentPage) {
          case 'dashboard':
            return <MemberDashboard currentUser={currentUser} />;
          case 'messages':
            return <MemberChats userId={currentUser.id} userName={currentUser.name} />;
          case 'team':
            return <MemberTeam currentUser={currentUser} />;
          case 'events':
            return <MemberEvents currentUser={currentUser} />;
          case 'settings':
            return <MemberSettings currentUser={currentUser} onLogout={handleLogout} onProfileUpdate={handleProfileUpdate} />;
          default:
            return <MemberDashboard currentUser={undefined} />;
        }

      default:
        return <AdminDashboard />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <>
      <Layout
        currentPage={currentPage}
        userRole={currentUser.role}
        teamName={currentUser.teamName}
        userName={currentUser.name}
        userAvatar={currentUser.avatar}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      >
        {renderPage()}
      </Layout>
      <Toaster />
    </>
  );
}