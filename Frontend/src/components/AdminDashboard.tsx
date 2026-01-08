import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Users, Building, Calendar, FileText, TrendingUp, Clock, Trophy, MapPin, User, ArrowUpRight, RefreshCw, CheckCircle2, ListTodo } from 'lucide-react';
import { api } from '../services/api';

export function AdminDashboard() {
  const [stats, setStats] = useState({
    totalTeams: 0,
    totalUsers: 0,
    activeEvents: 0,
    pendingRequests: 0
  });
  const [topTeams, setTopTeams] = useState<any[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, teamsRes, eventsRes, tasksRes] = await Promise.all([
        api.users.get(),
        api.teams.get(),
        api.events.get(),
        api.tasks.get()
      ]) as any[];

      // Calculate stats
      if (usersRes.success && Array.isArray(usersRes.data)) {
        setStats(prev => ({ ...prev, totalUsers: usersRes.data.length }));
      }

      if (teamsRes.success && Array.isArray(teamsRes.data)) {
        setStats(prev => ({ ...prev, totalTeams: teamsRes.data.length }));

        // Get top teams (sorted by events_this_month DESC from backend)
        setTopTeams(teamsRes.data.slice(0, 3).map((t: any) => ({
          id: t.id,
          name: t.name,
          eventsThisMonth: t.events_this_month || 0,
          leader: t.leader_name || 'No Leader',
          members: t.total_members || 0,
          category: t.category || 'General',
          avatar: null
        })));
      }

      if (eventsRes.success && Array.isArray(eventsRes.data)) {
        // Filter for upcoming/active events
        const activeEventsList = eventsRes.data.filter((e: any) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const endDate = new Date(e.end_date || e.date);
          endDate.setHours(0, 0, 0, 0);
          return endDate >= today;
        });

        setStats(prev => ({ ...prev, activeEvents: activeEventsList.length }));

        // Prepare data for mapping
        const fetchedTasks = tasksRes.success && Array.isArray(tasksRes.data) ? tasksRes.data : [];
        const fetchedUsers = usersRes.success && Array.isArray(usersRes.data) ? usersRes.data : [];
        const userMap = new Map(fetchedUsers.map((u: any) => [u.id, u]));

        // Get recent events (upcoming) with full details for dialog
        setRecentEvents(activeEventsList.slice(0, 3).map((e: any) => {
          const eventTasks = fetchedTasks.filter((t: any) => t.event_id === e.id).map((t: any) => ({
            id: t.id,
            title: t.title,
            description: t.description || '',
            assignedDepartment: t.department_name || 'General',
            departmentId: t.department_id || 0,
            assignedMembers: Array.isArray(t.assigned_members) ? t.assigned_members.map((m: any) => {
              const userDetails = userMap.get(Number(m.id)) as any;
              return {
                id: Number(m.id),
                name: m.name,
                role: userDetails?.role || 'member',
                avatar: userDetails?.avatar
              };
            }) : [],
            status: t.status
          }));

          // Calculate total unique assigned members
          const uniqueMembers = new Set<number>();
          eventTasks.forEach((t: any) => {
            t.assignedMembers.forEach((m: any) => uniqueMembers.add(Number(m.id)));
          });

          return {
            id: e.id,
            title: e.title,
            name: e.title, // For consistency with dialog usage
            description: e.description || '',
            team: e.team_name || 'Unknown Team',
            createdBy: 'Team Leader', // Placeholder
            date: e.date,
            startDate: e.date, // For consistency
            endDate: e.end_date || e.date,
            location: 'TBD',
            assignedMembers: uniqueMembers.size,
            status: e.status || 'upcoming',
            tasks: eventTasks
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
  }, []);

  const statsDisplay = [
    {
      title: 'Total Teams',
      value: stats.totalTeams.toString(),
      change: 'Active teams',
      icon: Building,
      color: 'text-brand-600',
      bgColor: 'bg-brand-0',
    },
    {
      title: 'Total Users',
      value: stats.totalUsers.toString(),
      change: 'Registered users',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-brand-0',
    },
    {
      title: 'Active Events',
      value: stats.activeEvents.toString(),
      change: 'Scheduled events',
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-brand-0',
    },
    {
      title: 'Pending Requests',
      value: stats.pendingRequests.toString(),
      change: 'Awaiting review',
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-brand-0',
    },
  ];

  // topTeams is now fetched from API

  // Requests would come from a separate API endpoint (not yet implemented)
  const latestRequests: any[] = [];

  // recentEvents is now fetched from API

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map(word => word.charAt(0).toUpperCase()).join('').slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 border-green-200 bg-green-50 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
      case 'completed':
        return 'text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
      case 'upcoming':
        return 'text-orange-600 border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800';
      case 'in-progress':
        return 'text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
      case 'pending':
        return 'text-gray-600 border-gray-200 bg-gray-50 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700';
      default:
        return 'text-gray-600 border-gray-200 bg-gray-50 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-2">
            Monitor all teams, users, and platform activity from one central location
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchDashboardData} disabled={isLoading} className="w-full md:w-auto">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* Top Teams with Most Events - Full Width */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
            <div>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <span className="text-lg font-semibold">Most Active Teams</span>
              </CardTitle>
              <CardDescription className="mt-1 text-sm text-muted-foreground">
                Teams with the highest activity this month
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {topTeams.length > 0 ? topTeams.map((team, index) => (
            <div key={team.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors gap-4 md:gap-0">
              <div className="flex items-center space-x-4 w-full md:w-auto">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-100 text-brand-600 text-sm font-medium dark:bg-brand-900/20 dark:text-brand-400">
                  #{index + 1}
                </div>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={team.avatar || ''} alt={team.name} />
                  <AvatarFallback className="bg-gradient-to-br from-brand-500 to-purple-600 text-white text-xs">
                    {getInitials(team.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground">{team.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {team.leader} • {team.members} members
                  </p>
                </div>
              </div>
              <div className="flex flex-row md:flex-col items-center md:items-end justify-start md:justify-end gap-2 md:gap-0 w-full md:w-auto pl-12 md:pl-0">
                <p className="text-xl font-semibold text-foreground">{team.eventsThisMonth}</p>
                <p className="text-lg font-semibold text-muted-foreground">events</p>
              </div>
            </div>
          )) : (
            <p className="text-center text-muted-foreground py-8">No teams data available</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Team Requests - Side by Side */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <span className="text-lg font-semibold">Recent Venue Booking Requests</span>
                </CardTitle>
                <CardDescription className="mt-1 text-sm text-muted-foreground">
                  Latest classroom and amphitheater booking requests from teams
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {latestRequests.length > 0 ? latestRequests.map((request) => (
              <div key={request.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors gap-4 md:gap-0">
                <div className="flex items-center space-x-4 w-full md:w-auto">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs">
                      {getInitials(request.teamName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{request.eventTitle}</p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                      <span>{request.teamName}</span>
                      <span>•</span>
                      <span>{request.venueName}</span>
                      <span>•</span>
                      <span>{request.eventDate}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between w-full md:w-auto md:justify-end space-x-3 pl-14 md:pl-0">
                  <div className="text-right">
                    <Badge variant="outline" className={getStatusColor(request.status)}>
                      {request.status.replace('_', ' ')}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">{request.expectedAttendees} attendees</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Review
                  </Button>
                </div>
              </div>
            )) : (
              <p className="text-center text-muted-foreground py-8">No pending requests</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Events - Side by Side */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Calendar className="h-5 w-5 text-purple-500" />
                  <span className="text-lg font-semibold">Latest Events</span>
                </CardTitle>
                <CardDescription className="mt-1 text-sm text-muted-foreground">
                  Most recent events created across all teams
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentEvents.length > 0 ? recentEvents.map((event) => (
              <div key={event.id} className="p-4 md:p-5 bg-muted/50 rounded-xl hover:bg-muted transition-colors">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 md:gap-0">
                  <div className="space-y-3 flex-1 w-full">
                    <div className="flex items-center justify-between md:justify-start space-x-3">
                      <h4 className="font-medium text-foreground">{event.title}</h4>
                      <Badge variant="outline" className={getStatusColor(event.status)}>
                        {event.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center md:space-x-6 text-sm text-muted-foreground gap-2 md:gap-0">
                      <span className="flex items-center space-x-2">
                        <Building className="h-4 w-4" />
                        <span>{event.team}</span>
                      </span>
                      <span className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <div className="flex flex-col md:flex-col text-xs space-y-0.5">
                          <span>{event.date}</span>
                          {event.endDate && event.endDate !== event.date && <span>{event.endDate}</span>}
                        </div>
                      </span>
                      <span className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                      </span>
                      <span className="flex items-center space-x-2 whitespace-nowrap">
                        <Users className="h-4 w-4" />
                        <span>{event.assignedMembers} assigned</span>
                      </span>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground w-full md:w-auto mt-2 md:mt-0" onClick={() => setSelectedEvent(event)}>
                    View Details
                  </Button>
                </div>
              </div>
            )) : (
              <p className="text-center text-muted-foreground py-8">No recent events</p>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Event Details Dialog */}
      <Dialog open={selectedEvent !== null} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
          {selectedEvent && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-xl">{selectedEvent.name}</DialogTitle>
                    <DialogDescription className="mt-1">
                      Event details and task breakdown
                    </DialogDescription>
                  </div>
                  <Badge variant="outline" className={getStatusColor(selectedEvent.status)}>
                    {selectedEvent.status}
                  </Badge>
                </div>
              </DialogHeader>

              <ScrollArea className="max-h-[60vh] pr-4">
                <div className="space-y-6">

                  <div>
                    <h4 style={{ fontWeight: '500', marginBottom: '8px' }}>Description</h4>
                    <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>
                  </div>

                  <Separator />

                  {/* Event Details */}
                  <div className="grid grid-cols-2 gap-6 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground" style={{ marginBottom: '4px' }}>Team</p>
                      <p style={{ fontWeight: '500' }}>{selectedEvent.team}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground" style={{ marginBottom: '4px' }}>Created By</p>
                      <p style={{ fontWeight: '500' }}>{selectedEvent.createdBy}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground" style={{ marginBottom: '4px' }}>Start Date</p>
                      <p style={{ fontWeight: '500' }}>{formatDate(selectedEvent.startDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground" style={{ marginBottom: '4px' }}>End Date</p>
                      <p style={{ fontWeight: '500' }}>{formatDate(selectedEvent.endDate)}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Tasks */}
                  <div>
                    <h4 style={{ fontWeight: '500', marginBottom: '12px' }}>Tasks ({selectedEvent.tasks?.length || 0})</h4>
                    <div className="space-y-4">
                      {selectedEvent.tasks?.map((task: any) => (
                        <div key={task.id} className="border rounded-lg bg-card" style={{ padding: '12px' }}>
                          <div className="flex items-start justify-between" style={{ marginBottom: '8px' }}>
                            <p style={{ fontWeight: '500' }}>{task.title}</p>
                            <Badge variant="outline" className={`${getStatusColor(task.status)} text-xs`}>
                              {task.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground" style={{ marginBottom: '8px' }}>
                            {task.description}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground" style={{ marginBottom: '8px' }}>
                            <span className="flex items-center space-x-1">
                              <Building className="h-3 w-3" />
                              {task.assignedDepartment}
                            </span>

                          </div>

                          {/* Members */}
                          {task.assignedMembers?.length > 0 && (
                            <div>
                              <p className="text-xs text-muted-foreground" style={{ marginBottom: '6px' }}>Assigned Members:</p>
                              <div className="space-y-2">
                                {task.assignedMembers.map((member: any) => (
                                  <div key={member.id} className="flex items-center space-x-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                                        {getInitials(member.name)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs">{member.name}</span>
                                    {member.role === 'dept-head' && (
                                      <Badge variant="outline" className="text-xs text-blue-600 border-blue-200 bg-blue-50">Head</Badge>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedEvent(null)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}