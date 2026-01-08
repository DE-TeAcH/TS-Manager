import React from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  userRole: 'admin' | 'team-leader' | 'dept-head' | 'member';
  teamName: string;
  userName: string;
  userAvatar?: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export function Layout({
  children,
  currentPage,
  userRole,
  teamName,
  userName,
  userAvatar,
  onNavigate,
  onLogout
}: LayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        currentPage={currentPage}
        userRole={userRole}
        onNavigate={onNavigate}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          teamName={teamName}
          userName={userName}
          userRole={userRole}
          userAvatar={userAvatar}
          onLogout={onLogout}
        />
        <main className="flex-1 p-8 overflow-auto bg-muted/30 dark:bg-background">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}