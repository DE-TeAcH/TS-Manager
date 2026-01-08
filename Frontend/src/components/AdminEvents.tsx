import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import {
  Calendar,
  Users,
  Building,
  Clock,
  CheckCircle2,
  ListTodo,
  Eye,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { api } from '../services/api';

interface Task {
  id: number;
  title: string;
  description: string;
  assignedDepartment: string;
  departmentId: number;
  assignedMembers: Member[];
  status: 'pending' | 'in-progress' | 'completed';
}

interface Member {
  id: number;
  name: string;
  role: 'dept-head' | 'member';
  avatar?: string;
}

interface Event {
  id: number;
  name: string;
  description: string;
  team: string;
  teamId: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'upcoming' | 'completed';
  tasks: Task[];
  createdBy: string;
  createdAt: string;
}

export function AdminEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [eventFilter, setEventFilter] = useState<'active' | 'completed'>('active');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Build query params
      const params: any = {
        sort_by: sortBy,
        sort_order: sortOrder
      };
      if (selectedTeam !== 'all') {
        params.team_id = selectedTeam;
      }

      const [eventsResponse, tasksResponse, teamsResponse, usersResponse] = await Promise.all([
        api.events.get(params),
        api.tasks.get(),
        teams.length === 0 ? api.teams.get() : Promise.resolve({ success: true, data: teams }),
        users.length === 0 ? api.users.get() : Promise.resolve({ success: true, data: users })
      ]);

      if (eventsResponse.success && Array.isArray(eventsResponse.data)) {
        const fetchedEvents = eventsResponse.data;
        const fetchedTasks = tasksResponse.success && Array.isArray(tasksResponse.data) ? tasksResponse.data : [];
        const fetchedUsers = usersResponse.success && Array.isArray(usersResponse.data) ? usersResponse.data : [];

        // Create user map for quick lookup
        const userMap = new Map(fetchedUsers.map((u: any) => [u.id, u]));

        // Admin can see all events immediately (no 24h restriction)
        const mappedEvents = fetchedEvents.map((e: any) => {
          const eventTasks = fetchedTasks.filter((t: any) => t.event_id === e.id).map((t: any) => ({
            id: t.id,
            title: t.title,
            description: t.description || '',
            assignedDepartment: t.department_name || 'General',
            departmentId: t.department_id || 0,
            assignedMembers: Array.isArray(t.assigned_members) ? t.assigned_members.map((m: any) => {
              const userDetails = userMap.get(Number(m.id));
              return {
                id: Number(m.id),
                name: m.name,
                role: userDetails?.role || 'member',
                avatar: userDetails?.avatar
              };
            }) : [],
            status: t.status
          }));

          return {
            id: e.id,
            name: e.title, // API returns title
            description: e.description || '',
            team: e.team_name || 'Unassigned',
            teamId: e.team_id || 0,
            startDate: e.date, // API returns date
            endDate: (e.end_date && e.end_date !== '0000-00-00') ? e.end_date : e.date, // Handle invalid end_date
            status: e.status || 'active', // Default status or infer from date
            createdBy: 'Team Leader', // Changed from Admin
            createdAt: e.created_at,
            tasks: eventTasks
          };
        });

        // Filter events based on active/completed toggle
        const visibleEvents = mappedEvents.filter((e) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          // Handle potential invalid dates safely
          let endDate = new Date(e.endDate);
          if (isNaN(endDate.getTime())) {
            // Try valid start date as fallback
            endDate = new Date(e.startDate);
          }
          // If still invalid, treat as far past
          if (isNaN(endDate.getTime())) {
            endDate = new Date(0);
          }

          endDate.setHours(0, 0, 0, 0);

          if (eventFilter === 'active') {
            return endDate >= today;
          } else {
            return endDate < today;
          }
        });

        setEvents(visibleEvents);
      }

      // Store teams and users
      if (teamsResponse.success && Array.isArray(teamsResponse.data) && teams.length === 0) {
        setTeams(teamsResponse.data);
      }
      if (usersResponse.success && Array.isArray(usersResponse.data) && users.length === 0) {
        setUsers(usersResponse.data);
      }
    } catch (error) {
      console.error('Failed to fetch events', error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, [selectedTeam, sortBy, sortOrder, eventFilter]);

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [expandedEvents, setExpandedEvents] = useState<Set<number>>(new Set([1]));

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word.charAt(0).toUpperCase()).join('').slice(0, 2);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const toggleEventExpansion = (eventId: number) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const getTotalMembers = (event: Event) => {
    const memberSet = new Set<number>();
    event.tasks.forEach(task => {
      task.assignedMembers.forEach(member => memberSet.add(member.id));
    });
    return memberSet.size;
  };

  const handleDeleteEvent = async (eventId: number, eventName: string) => {
    if (!window.confirm(`Are you sure you want to delete the event "${eventName}"? This will remove all associated tasks.`)) {
      return;
    }

    try {
      const response = await api.events.delete(eventId);
      if (response.success) {
        fetchData(); // Refresh list
      } else {
        alert(response.message || 'Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event');
    }
  };

  const handleDeleteTask = async (taskId: number, taskTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete the task "${taskTitle}"?`)) {
      return;
    }

    try {
      const response = await api.tasks.delete(taskId);
      if (response.success) {
        fetchData(); // Refresh list to remove the deleted task
      } else {
        alert(response.message || 'Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task');
    }
  };

  return (
    <div className="space-y-6" style={{ padding: '24px' }}>
      <div className="flex items-center justify-between">
        <div>
          <h1>Events Management</h1>
          <p className="text-muted-foreground" style={{ marginTop: '8px' }}>
            Manage events and their tasks assigned to departments
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* View Toggle */}
      <div className="flex justify-center">
        <div className="bg-muted p-1 rounded-lg inline-flex items-center">
          <Button
            variant={eventFilter === 'active' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setEventFilter('active')}
            className={`text-xs ${eventFilter === 'active' ? 'shadow-sm' : 'hover:bg-transparent'}`}
          >
            Active Events
          </Button>
          <Button
            variant={eventFilter === 'completed' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setEventFilter('completed')}
            className={`text-xs ${eventFilter === 'completed' ? 'shadow-sm' : 'hover:bg-transparent'}`}
          >
            Past Events
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent style={{ padding: '16px' }}>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium" style={{ marginBottom: '8px', display: 'block' }}>Filter by Team</label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
              >
                <option value="all">All Teams</option>
                {teams.map((team: any) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium" style={{ marginBottom: '8px', display: 'block' }}>Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'title')}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
              >
                <option value="date">Date</option>
                <option value="title">Title (A-Z)</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium" style={{ marginBottom: '8px', display: 'block' }}>Order</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
              >
                <option value="asc">{sortBy === 'date' ? 'Oldest First' : 'A → Z'}</option>
                <option value="desc">{sortBy === 'date' ? 'Newest First' : 'Z → A'}</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4" style={{ marginTop: '24px' }}>
        {events.map((event) => {
          const isExpanded = expandedEvents.has(event.id);
          const totalMembers = getTotalMembers(event);
          const completedTasks = event.tasks.filter(t => t.status === 'completed').length;

          return (
            <Card key={event.id} className="border-0 shadow-sm" style={{ borderRadius: '10px' }}>
              <CardHeader style={{ paddingBottom: '16px' }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3" style={{ marginBottom: '8px' }}>
                      <CardTitle className="text-lg" style={{ fontWeight: '500' }}>
                        {event.name}
                      </CardTitle>
                      <Badge variant="outline" className={getStatusColor(event.status)}>
                        {event.status}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground" style={{ marginTop: '8px' }}>
                      <span className="flex items-center space-x-1">
                        <Building className="h-4 w-4" />
                        <span>{event.team}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <ListTodo className="h-4 w-4" />
                        <span>{event.tasks.length} tasks</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{totalMembers} members</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleEventExpansion(event.id)}
                      style={{ fontWeight: '500' }}
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-4 w-4" style={{ marginRight: '4px' }} />
                          Collapse
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" style={{ marginRight: '4px' }} />
                          Expand
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedEvent(event)}
                    >
                      Details
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Assuming event object has the name. If it's `event.title` on API but mapped to `name` in state.
                        // Checked `AdminEvents.tsx` logic: mapped as `name: e.title`. So `event.name` is correct.
                        handleDeleteEvent(event.id, event.name);
                      }}
                      title="Delete Event"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {
                isExpanded && (
                  <CardContent style={{ paddingTop: '0' }}>
                    <div className="space-y-4">
                      {/* Event Overview */}
                      <div className="bg-muted/50 rounded-lg" style={{ padding: '16px' }}>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Start Date</p>
                              <p style={{ fontWeight: '500' }}>{formatDate(event.startDate)}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">End Date</p>
                              <p style={{ fontWeight: '500' }}>{formatDate(event.endDate)}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Progress</p>
                              <p style={{ fontWeight: '500' }}>{completedTasks}/{event.tasks.length} tasks done</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Tasks List */}
                      <div>
                        <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
                          <h4 style={{ fontWeight: '500' }}>Tasks</h4>
                          <Badge variant="secondary">{event.tasks.length} total</Badge>
                        </div>
                        <div className="space-y-3">
                          {event.tasks.map((task) => (
                            <div key={task.id} className="border rounded-lg bg-card" style={{ padding: '12px' }}>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2" style={{ marginBottom: '6px' }}>
                                    <p style={{ fontWeight: '500' }}>{task.title}</p>
                                    <Badge variant="outline" className={getStatusColor(task.status)}>
                                      {task.status}
                                    </Badge>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-gray-400 hover:text-red-600 hover:bg-red-50 ml-2"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteTask(task.id, task.title);
                                      }}
                                      title="Delete Task"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  <p className="text-sm text-muted-foreground" style={{ marginBottom: '8px' }}>
                                    {task.description}
                                  </p>
                                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                    <div className="flex items-center space-x-1">
                                      <Building className="h-3 w-3" />
                                      <span>{task.assignedDepartment}</span>
                                    </div>

                                    <div className="flex items-center space-x-1">
                                      <Users className="h-3 w-3" />
                                      <span>{task.assignedMembers.length} assigned</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Assigned Members */}
                              {task.assignedMembers.length > 0 && (
                                <div className="flex items-center space-x-2" style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid hsl(var(--border))' }}>
                                  <div className="flex -space-x-2">
                                    {task.assignedMembers.slice(0, 3).map((member) => (
                                      <Avatar key={member.id} className="h-7 w-7 border-2 border-white">
                                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                                          {getInitials(member.name)}
                                        </AvatarFallback>
                                      </Avatar>
                                    ))}
                                    {task.assignedMembers.length > 3 && (
                                      <div className="h-7 w-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs text-gray-600">
                                        +{task.assignedMembers.length - 3}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {task.assignedMembers.slice(0, 2).map((member) => (
                                      <span key={member.id} className="text-xs text-muted-foreground">
                                        {member.name}
                                        {member.role === 'dept-head' && ' (Head)'}
                                      </span>
                                    ))}
                                    {task.assignedMembers.length > 2 && (
                                      <span className="text-xs text-muted-foreground">
                                        +{task.assignedMembers.length - 2} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {task.assignedMembers.length === 0 && (
                                <div className="flex items-center space-x-2 text-xs text-orange-600" style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid hsl(var(--border))' }}>
                                  <Users className="h-3 w-3" />
                                  <span>No members assigned yet - Waiting for department head</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )
              }
            </Card>
          );
        })}
      </div>

      {
        events.length === 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="flex items-center justify-center" style={{ padding: '48px' }}>
              <div className="text-center space-y-2">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground" style={{ fontWeight: '500' }}>No events found</p>
                <p className="text-sm text-muted-foreground">
                  Team leaders will create events with tasks here
                </p>
              </div>
            </CardContent>
          </Card>
        )
      }

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
                  {/* Event Info */}
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
                    <h4 style={{ fontWeight: '500', marginBottom: '12px' }}>Tasks ({selectedEvent.tasks.length})</h4>
                    <div className="space-y-4">
                      {selectedEvent.tasks.map((task) => (
                        <div key={task.id} className="bg-muted/50 rounded-lg" style={{ padding: '12px' }}>
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
                          {task.assignedMembers.length > 0 && (
                            <div>
                              <p className="text-xs text-muted-foreground" style={{ marginBottom: '6px' }}>Assigned Members:</p>
                              <div className="space-y-2">
                                {task.assignedMembers.map((member) => (
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
    </div >
  );
}
