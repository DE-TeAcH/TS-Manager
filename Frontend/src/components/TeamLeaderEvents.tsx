import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
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
    Plus,
    MapPin,
    Trash2,
    FileText
} from 'lucide-react';
import { api } from '../services/api';

interface TeamLeaderEventsProps {
    currentUser: any;
}

interface Task {
    id: number;
    title: string;
    description: string;
    assignedDepartment: string;
    departmentId: number;
    assignedMembers: any[];
    status: 'pending' | 'in-progress' | 'completed';

}

interface Event {
    id: number;
    name: string;
    description: string;
    team: string;
    teamId: number;
    startDate: string;
    endDate: string;
    status: 'active' | 'upcoming' | 'completed' | 'pending';
    tasks: Task[];
    createdBy: string;
    createdAt: string;
    location?: string;
}

export function TeamLeaderEvents({ currentUser }: TeamLeaderEventsProps) {
    const [events, setEvents] = useState<Event[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [expandedEvents, setExpandedEvents] = useState<Set<number>>(new Set());
    const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);

    // New Event State
    const [newEvent, setNewEvent] = useState({
        title: '',
        description: '',
        date: '',
        endDate: '',
        startTime: '',
        endTime: '',
        requestRoom: false,
        roomName: ''
    });

    // New Task State
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        department: ''
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
            case 'in-progress':
            case 'in_progress':
                return 'text-blue-600 border-blue-200 bg-blue-50';
            case 'completed':
                return 'text-green-600 border-green-200 bg-green-50';
            case 'upcoming':
                return 'text-purple-600 border-purple-200 bg-purple-50';
            case 'pending':
                return 'text-yellow-600 border-yellow-200 bg-yellow-50';
            default:
                return 'text-gray-600 border-gray-200 bg-gray-50';
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const fetchData = async () => {
        if (!currentUser?.teamId) return;

        setIsLoading(true);
        try {
            console.log('Fetching departments for team_id:', currentUser.teamId);
            const [eventsResponse, tasksResponse, deptsResponse, usersResponse] = await Promise.all([
                api.events.get(currentUser.teamId),
                api.tasks.get(),
                api.departments.get({ team_id: currentUser.teamId }),
                api.users.get({ team_id: currentUser.teamId })
            ]);

            // Fetch departments
            console.log('Departments response:', deptsResponse);
            if (deptsResponse.success && Array.isArray(deptsResponse.data)) {
                console.log('Setting departments:', deptsResponse.data);
                setDepartments(deptsResponse.data);
            }

            // Store users
            let userMap = new Map();
            if (usersResponse.success && Array.isArray(usersResponse.data)) {
                setUsers(usersResponse.data);
                userMap = new Map(usersResponse.data.map((u: any) => [u.id, u]));
            }

            if (eventsResponse.success && Array.isArray(eventsResponse.data)) {
                const fetchedEvents = eventsResponse.data;
                const fetchedTasks = tasksResponse.success && Array.isArray(tasksResponse.data) ? tasksResponse.data : [];

                const mappedEvents = fetchedEvents.map((e: any) => {
                    const eventTasks = fetchedTasks.filter((t: any) => t.event_id === e.id).map((t: any) => ({
                        id: t.id,
                        title: t.title,
                        description: t.description || '',
                        assignedDepartment: t.department_name || 'Unassigned',
                        departmentId: 0,
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
                        name: e.title,
                        description: e.description || '',
                        team: e.team_name || 'Unassigned',
                        teamId: e.team_id || 0,
                        startDate: e.date,
                        endDate: e.end_date || e.date,
                        status: e.status || 'active',
                        createdBy: 'Team Leader',
                        createdAt: e.created_at,
                        location: e.location,
                        tasks: eventTasks
                    };
                });
                // Filter out past events (where end date is before today)
                const visibleEvents = mappedEvents.filter(e => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const endDate = new Date(e.endDate);
                    endDate.setHours(0, 0, 0, 0); // Compare dates only
                    return endDate >= today;
                });

                setEvents(visibleEvents);
            }
        } catch (error) {
            console.error('Failed to fetch events', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [currentUser]);

    const handleCreateEvent = async () => {
        try {
            const eventData = {
                title: newEvent.title,
                description: newEvent.description,
                date: newEvent.date,
                end_date: newEvent.endDate || newEvent.date,
                start_time: newEvent.startTime,
                end_time: newEvent.endTime,
                team_id: currentUser.teamId,
                location: newEvent.requestRoom ? newEvent.roomName : 'Online/TBD',
                request_room: newEvent.requestRoom
            };

            console.log('Creating event with data:', eventData);
            const response = await api.events.create(eventData);
            console.log('Event creation response:', response);

            if (response.success) {
                console.log('Event created successfully!');
                setIsCreateDialogOpen(false);
                setNewEvent({
                    title: '',
                    description: '',
                    date: '',
                    endDate: '',
                    startTime: '',
                    endTime: '',
                    requestRoom: false,
                    roomName: ''
                });
                fetchData();
            } else {
                console.error('Event creation failed:', response);
                alert('Failed to create event: ' + (response.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Failed to create event', error);
            alert('Error creating event. Check console for details.');
        }
    };

    const handleAddTask = async () => {
        if (!selectedEvent) return;

        try {
            const taskData = {
                event_id: selectedEvent.id,
                title: newTask.title,
                description: newTask.description,
                department_id: parseInt(newTask.department), // Send department ID
                status: 'pending'
            };

            const response = await api.tasks.create(taskData);
            if (response.success) {
                setIsAddTaskDialogOpen(false);
                setNewTask({
                    title: '',
                    description: '',
                    department: ''
                });
                fetchData();
                // Update selected event locally to show new task immediately
                // For now, fetchData handles it but might close dialog
            }
        } catch (error) {
            console.error('Failed to create task', error);
        }
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



    const getInitials = (name: string) => {
        return name.split(' ').map(word => word.charAt(0).toUpperCase()).join('').slice(0, 2);
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
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Team Events</h1>
                    <p className="text-muted-foreground mt-2">Manage your team's events and tasks</p>
                </div>
                <div className="flex flex-col md:flex-row gap-2">
                    <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading} className="w-full md:w-auto">
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-br from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white border-0 w-full md:w-auto">
                                <Plus className="h-4 w-4 mr-2" />
                                Create Event
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Create New Event</DialogTitle>
                                <DialogDescription>Add a new event for your team</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Event Title</Label>
                                    <Input
                                        value={newEvent.title}
                                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                        placeholder="e.g., Weekly Sprint Planning"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Textarea
                                        value={newEvent.description}
                                        onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                                        placeholder="Event details..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Date</Label>
                                        <Input
                                            type="date"
                                            value={newEvent.date}
                                            onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>End Date</Label>
                                        <Input
                                            type="date"
                                            value={newEvent.endDate}
                                            onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                                            min={newEvent.date}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 col-span-2">
                                        <div className="space-y-2">
                                            <Label>Start Time</Label>
                                            <Input
                                                type="time"
                                                value={newEvent.startTime}
                                                onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>End Time</Label>
                                            <Input
                                                type="time"
                                                value={newEvent.endTime}
                                                onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2 pt-2">
                                    <Checkbox
                                        id="request-room"
                                        checked={newEvent.requestRoom}
                                        onCheckedChange={(checked) => setNewEvent({ ...newEvent, requestRoom: checked as boolean })}
                                    />
                                    <Label htmlFor="request-room">Request University Room</Label>
                                </div>

                                {newEvent.requestRoom && (
                                    <div className="space-y-2 pl-6 border-l-2 border-gray-100">
                                        <Label>Room Name / Class</Label>
                                        <Input
                                            value={newEvent.roomName}
                                            onChange={(e) => setNewEvent({ ...newEvent, roomName: e.target.value })}
                                            placeholder="e.g., Amphi A, Lab 101"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            This request will be sent to Admin for approval.
                                        </p>
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleCreateEvent} className="bg-gradient-to-br from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white border-0">Create Event</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="space-y-4">
                {events.length > 0 ? (
                    events.map((event) => {
                        const isExpanded = expandedEvents.has(event.id);
                        return (
                            <Card key={event.id} className="border-0 shadow-sm">
                                <CardHeader className="pb-4">
                                    <div className="flex flex-col md:flex-row items-start justify-between gap-4 md:gap-0">
                                        <div className="flex-1 w-full">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <CardTitle className="text-lg">{event.name}</CardTitle>
                                                <Badge variant="outline" className={getStatusColor(event.status)}>
                                                    {event.status === 'pending' ? 'Pending Approval' : event.status}
                                                </Badge>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                                                <span className="flex items-center space-x-1">
                                                    <Calendar className="h-4 w-4" />
                                                    <span>
                                                        {formatDate(event.startDate)}
                                                        {event.endDate && event.endDate !== event.startDate && ` - ${formatDate(event.endDate)}`}
                                                    </span>
                                                </span>
                                                {event.location && (
                                                    <span className="flex items-center space-x-1">
                                                        <MapPin className="h-4 w-4" />
                                                        <span>{event.location}</span>
                                                    </span>
                                                )}
                                                <span className="flex items-center space-x-1">
                                                    <ListTodo className="h-4 w-4" />
                                                    <span>{event.tasks ? event.tasks.length : 0} tasks</span>
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
                                            <Button variant="ghost" size="sm" onClick={() => toggleEventExpansion(event.id)}>
                                                {isExpanded ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                                                {isExpanded ? 'Collapse' : 'Expand'}
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => { setSelectedEvent(event); setIsViewDetailsOpen(true); }}>
                                                <Eye className="h-4 w-4 mr-1" /> Details
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground hover:text-red-600 hover:bg-red-50"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteEvent(event.id, event.name);
                                                }}
                                                title="Delete Event"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    {event.description && (
                                        <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                                            <div className="flex items-start space-x-2">
                                                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                <p className="text-sm text-muted-foreground">{event.description}</p>
                                            </div>
                                        </div>
                                    )}
                                </CardHeader>
                                {isExpanded && (
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <h4 className="font-medium">Tasks</h4>
                                                <Dialog open={isAddTaskDialogOpen} onOpenChange={setIsAddTaskDialogOpen}>
                                                    <DialogTrigger asChild>
                                                        <Button size="sm" variant="outline" onClick={() => setSelectedEvent(event)}>
                                                            <Plus className="h-3 w-3 mr-1" /> Add Task
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>Add Task to {event.name}</DialogTitle>
                                                        </DialogHeader>
                                                        <div className="space-y-4 py-4">
                                                            <div className="space-y-2">
                                                                <Label>Task Title</Label>
                                                                <Input
                                                                    value={newTask.title}
                                                                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label>Description</Label>
                                                                <Textarea
                                                                    value={newTask.description}
                                                                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label>Department</Label>
                                                                <Select onValueChange={(val) => setNewTask({ ...newTask, department: val })}>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Select Dept" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {departments.map(d => (
                                                                            <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>
                                                        <DialogFooter>
                                                            <Button onClick={handleAddTask} className="bg-gradient-to-br from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white border-0">Add Task</Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                            <div className="space-y-2">
                                                {event.tasks && event.tasks.length > 0 ? (
                                                    event.tasks.map(task => (
                                                        <div key={task.id} className="border rounded-lg p-3">
                                                            <div className="flex justify-between">
                                                                <span className="font-medium">{task.title}</span>
                                                                <div className="flex items-center space-x-2">
                                                                    <Badge variant="secondary">{task.assignedDepartment}</Badge>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-6 w-6 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDeleteTask(task.id, task.title);
                                                                        }}
                                                                        title="Delete Task"
                                                                    >
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                                                            {task.assignedMembers && task.assignedMembers.length > 0 ? (
                                                                <div className="mt-3 pt-3 border-t border-border">
                                                                    <p className="text-xs text-muted-foreground mb-2">Assigned to:</p>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {task.assignedMembers.map((member: any) => (
                                                                            <div key={member.id} className="flex items-center space-x-2 bg-muted/50 px-2 py-1 rounded-full border border-border">
                                                                                <Avatar className="h-5 w-5">
                                                                                    <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
                                                                                        {getInitials(member.name)}
                                                                                    </AvatarFallback>
                                                                                </Avatar>
                                                                                <span className="text-xs font-medium text-foreground">{member.name}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="mt-3 pt-3 border-t border-border flex items-center text-xs text-orange-500">
                                                                    <Users className="h-3 w-3 mr-1" />
                                                                    <span>No members assigned yet - Waiting for department head</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                                                        <ListTodo className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                                        <p>No tasks created yet</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        );
                    })
                ) : (
                    <div className="text-center py-12 bg-white dark:bg-muted/10 rounded-xl border border-dashed">
                        <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                        <h3 className="text-lg font-medium text-foreground">No events scheduled</h3>
                        <p className="text-muted-foreground mt-1 mb-4">Create a new event to get started managing your team's activities.</p>
                        <Button onClick={() => setIsCreateDialogOpen(true)} variant="outline" className="gap-2">
                            <Plus className="h-4 w-4" />
                            Create Event
                        </Button>
                    </div>
                )}
            </div>
            {/* View Details Dialog */}
            <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Event Details</DialogTitle>
                    </DialogHeader>
                    {selectedEvent && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <h3 className="font-semibold text-lg">{selectedEvent.name}</h3>
                                <Badge variant="outline" className={getStatusColor(selectedEvent.status)}>
                                    {selectedEvent.status}
                                </Badge>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <Label className="text-muted-foreground text-xs">Description</Label>
                                    <p className="text-sm mt-1">{selectedEvent.description || "No description provided."}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-muted-foreground text-xs">Date</Label>
                                        <div className="flex items-center mt-1 text-sm">
                                            <Calendar className="h-4 w-4 mr-2" />
                                            <span>
                                                {formatDate(selectedEvent.startDate)}
                                                {selectedEvent.endDate && selectedEvent.endDate !== selectedEvent.startDate && ` - ${formatDate(selectedEvent.endDate)}`}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground text-xs">Location</Label>
                                        <div className="flex items-center mt-1 text-sm">
                                            <MapPin className="h-4 w-4 mr-2" />
                                            {selectedEvent.location || "Online"}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-muted-foreground text-xs">Total Tasks</Label>
                                    <div className="flex items-center mt-1 text-sm">
                                        <ListTodo className="h-4 w-4 mr-2" />
                                        {selectedEvent.tasks.length} tasks
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <p className="text-xs text-muted-foreground">Created on {new Date(selectedEvent.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={() => setIsViewDetailsOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
