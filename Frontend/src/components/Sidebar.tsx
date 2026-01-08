import React from 'react';
import { Button } from './ui/button';
import {
  LayoutDashboard,
  FileText,
  Users,
  Calendar,
  Settings,
  MessageSquare,
  Building,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  userRole: 'admin' | 'team-leader' | 'dept-head' | 'member';
  onNavigate: (page: string) => void;
  onLogout?: () => void;
  onClose?: () => void;
  className?: string;
}

const navigationItems = {
  admin: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'requests', label: 'Venue Requests', icon: FileText },
    { id: 'teams', label: 'Teams', icon: Building },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'settings', label: 'Settings', icon: Settings },
  ],
  'team-leader': [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'members', label: 'Team', icon: Building },
    { id: 'departments', label: 'Departments', icon: Users },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ],
  'dept-head': [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'team', label: 'Team', icon: Building },
    { id: 'members', label: 'My Department', icon: Users },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ],
  member: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'team', label: 'Team', icon: Building },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ],
};

export function Sidebar({ currentPage, userRole, onNavigate, onClose, onLogout, className = '' }: SidebarProps) {
  const items = navigationItems[userRole];

  const handleNavigate = (id: string) => {
    onNavigate(id);
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className={`w-72 bg-background border-r border-border flex flex-col shadow-sm ${className}`}>
      <div className="p-8 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-blue-700 dark:from-purple-600 dark:to-purple-700 rounded-xl flex items-center justify-center">
            <Building className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">TS Manager</h2>
            <p className="text-sm text-muted-foreground ml-9">By TE4CH</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-6 overflow-y-auto">
        <ul className="space-y-2">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <li key={item.id}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start px-4 py-3 h-auto transition-all duration-200 ${isActive
                    ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-r-4 border-blue-600 rounded-r-none dark:!bg-purple-700/20 dark:!text-purple-200 dark:!border-purple-500 dark:hover:!bg-purple-700/30'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    }`}
                  onClick={() => handleNavigate(item.id)}
                >
                  <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-brand-400' : 'text-muted-foreground'}`} />
                  <span className={isActive ? 'font-medium' : ''}>{item.label}</span>
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-6 pb-4">
        {onLogout && (
          <Button
            variant="ghost"
            className="w-full justify-start px-4 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10"
            onClick={onLogout}
          >
            <LogOut className="mr-3 h-5 w-5" />
            <span className="font-medium">Logout</span>
          </Button>
        )}
      </div>

      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">
          TS Manager v1.0
        </div>
      </div>
    </div>
  );
}