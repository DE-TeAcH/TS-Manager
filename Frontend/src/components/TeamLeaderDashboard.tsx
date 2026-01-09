import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Users, Calendar, TrendingUp, User, ArrowUpRight, Building, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

interface TeamLeaderDashboardProps {
  currentUser: any;
}

export function TeamLeaderDashboard({ currentUser }: TeamLeaderDashboardProps) {
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalEvents: 0,
    eventsThisMonth: 0
  });
  const [recentMembers, setRecentMembers] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDashboardData = async () => {
    if (!currentUser?.teamId) return;

    setIsLoading(true);
    try {
      const [membersRes, eventsRes, tasksRes] = await Promise.all([
        api.users.get({ team_id: currentUser.teamId }),
        api.events.get(currentUser.teamId),
        api.tasks.get()
      ]) as any[];

      if (membersRes.success && Array.isArray(membersRes.data)) {
        setStats(prev => ({ ...prev, totalMembers: membersRes.data.length }));
        setRecentMembers(membersRes.data.slice(0, 4).map((m: any) => ({
          id: m.id,
          name: m.name,
          role: m.role,
          department: m.department_name || 'Unassigned',
          joinDate: m.join_date || m.created_at || '',
          avatar: m.avatar
        })));
      }

      if (eventsRes.success && Array.isArray(eventsRes.data)) {
        const fetchedTasks = tasksRes.success && Array.isArray(tasksRes.data) ? tasksRes.data : [];

        // Calculate Events This Month (events overlapping with current month)
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const eventsThisMonthCount = eventsRes.data.filter((e: any) => {
          const startDate = new Date(e.date);
          const endDate = new Date(e.end_date || e.date);

          // Normalize dates to remove time component
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(0, 0, 0, 0);
          startOfMonth.setHours(0, 0, 0, 0);
          endOfMonth.setHours(23, 59, 59, 999);

          // Check if there is overlap with the current month
          // START <= END_OF_MONTH AND END >= START_OF_MONTH
          return startDate <= endOfMonth && endDate >= startOfMonth;
        }).length;

        setStats(prev => ({
          ...prev,
          totalEvents: eventsRes.data.length,
          eventsThisMonth: eventsThisMonthCount
        }));

        // Filter for upcoming events (active/future)
        const upcomingFiltered = eventsRes.data.filter((e: any) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const endDate = new Date(e.end_date || e.date);
          endDate.setHours(0, 0, 0, 0);
          return endDate >= today;
        });

        // Set upcoming events
        setUpcomingEvents(upcomingFiltered.slice(0, 3).map((e: any) => {
          // Get tasks for this event
          const eventTasks = fetchedTasks.filter((t: any) => t.event_id === e.id);

          // Count unique assigned members across all tasks for this event
          const uniqueMembers = new Set();
          eventTasks.forEach((t: any) => {
            if (Array.isArray(t.assigned_members)) {
              t.assigned_members.forEach((m: any) => uniqueMembers.add(m.id));
            }
          });

          return {
            id: e.id,
            title: e.title,
            date: e.date,
            endDate: e.end_date,
            assignedMembers: uniqueMembers.size,
            status: 'upcoming'
          };
        }));
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [currentUser]);

  const statsDisplay = [
    {
      title: 'Total Members',
      value: stats.totalMembers.toString(),
      change: 'Team members',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-brand-0',
    },
    {
      title: 'Total Events',
      value: stats.totalEvents.toString(),
      change: 'All events',
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-brand-0',
    },
    {
      title: 'Events This Month',
      value: stats.eventsThisMonth.toString(),
      change: 'Active',
      icon: Building,
      color: 'text-purple-600',
      bgColor: 'bg-brand-0',
    },
  ];

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word.charAt(0).toUpperCase()).join('').slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'text-yellow-600 border-yellow-200 bg-yellow-50';
      case 'team-leader':
        return 'text-purple-700 border-purple-300 bg-purple-100';
      case 'dept-head':
        return 'text-blue-600 border-blue-200 bg-blue-50';
      case 'member':
        return 'text-green-600 border-green-200 bg-green-50';
      default:
        return 'text-gray-600 border-gray-200 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 border-green-200 bg-green-50';
      case 'upcoming':
        return 'text-orange-600 border-orange-200 bg-orange-50';
      default:
        return 'text-gray-600 border-gray-200 bg-gray-50';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Team Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Overview of your team's performance and recent activities
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchDashboardData} disabled={isLoading} className="w-full md:w-auto">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {statsDisplay.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-semibold text-foreground mb-2">{stat.value}</div>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span>{stat.change}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Team Members */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
              <div>
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Users className="h-5 w-5 text-blue-500" />
                  <span className="text-lg font-semibold">Recent Team Members</span>
                </CardTitle>
                <CardDescription className="mt-1">
                  Latest members who joined your team
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentMembers.length > 0 ? recentMembers.map((member) => (
              <div key={member.id} className="flex flex-row items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors gap-4">
                <div className="flex items-center space-x-4 min-w-0">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={member.avatar || ''} alt={member.name} />
                    <AvatarFallback className="bg-gradient-to-br from-brand-500 to-purple-600 text-white text-xs">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{member.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{member.department}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <Badge variant="outline" className={getRoleColor(member.role)}>
                    {member.role.replace('-', ' ')}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(member.joinDate)}</p>
                </div>
              </div>
            )) : (
              <p className="text-center text-muted-foreground py-8">No members found</p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
              <div>
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Calendar className="h-5 w-5 text-purple-500" />
                  <span className="text-lg font-semibold">Upcoming Events</span>
                </CardTitle>
                <CardDescription className="mt-1">
                  Events scheduled for your team
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingEvents.length > 0 ? upcomingEvents.map((event) => (
              <div key={event.id} className="p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-foreground">{event.title}</h4>
                  <Badge variant="outline" className={getStatusColor(event.status)}>
                    {event.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {formatDate(event.date)}
                      {event.endDate && event.endDate !== event.date && ` - ${formatDate(event.endDate)}`}
                    </span>
                  </span>
                  <span className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>{event.assignedMembers} assigned</span>
                  </span>
                </div>
              </div>
            )) : (
              <p className="text-center text-muted-foreground py-8">No upcoming events</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}