import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
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
    UserPlus,
    MapPin
} from 'lucide-react';
import { api } from '../services/api';
import { toast } from 'sonner';

interface DeptHeadEventsProps {
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

export function DeptHeadEvents({ currentUser }: DeptHeadEventsProps) {
    const [events, setEvents] = useState<Event[]>([]);
    const [deptMembers, setDeptMembers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [expandedEvents, setExpandedEvents] = useState<Set<number>>(new Set());
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
    const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
    const [userDepartmentName, setUserDepartmentName] = useState<string>('');
    const [userDepartmentId, setUserDepartmentId] = useState<number | null>(null);

    const fetchData = async () => {
        console.log('DeptHead currentUser:', currentUser);
        if (!currentUser?.teamId) {
            console.log('Missing teamId, cannot fetch events');
            return;
        }

        setIsLoading(true);
        try {
            console.log('Fetching events for team:', currentUser.teamId);
            console.log('Department ID:', currentUser.departmentId);

            const promises = [
                api.events.get(currentUser.teamId),
                api.tasks.get(),
                api.departments.get({ team_id: currentUser.teamId })
            ];

            // Fetch department members only if we can identify the user's department
            const responses = await Promise.all(promises);
            const eventsResponse = responses[0];
            const tasksResponse = responses[1];
            const deptsResponse = responses[2];

            // Get current user's department name by finding where they are the dept_head
            console.log('Departments response:', deptsResponse);
            if (deptsResponse && deptsResponse.success && Array.isArray(deptsResponse.data)) {
                console.log('All departments:', deptsResponse.data);
                console.log('Looking for department where user (ID:', currentUser.id, ') is dept_head');

                // Find department where this user is the dept_head
                const userDept = deptsResponse.data.find((d: any) => d.dept_head_id === currentUser.id);
                console.log('Found user department:', userDept);

                if (userDept) {
                    setUserDepartmentName(userDept.name);
                    setUserDepartmentId(userDept.id);
                    console.log('Set user department name to:', userDept.name);
                    console.log('Set user department ID to:', userDept.id);

                    // Now fetch members of this department
                    const membersResponse = await api.users.get({ department_id: userDept.id });
                    if (membersResponse.success && Array.isArray(membersResponse.data)) {
                        setDeptMembers(membersResponse.data.map((m: any) => ({ ...m, id: Number(m.id) })));
                    }
                } else {
                    console.log('No department found where user is dept_head!');
                }
            } else {
                console.log('Departments response failed or invalid');
            }

            console.log('Events response:', eventsResponse);
            if (eventsResponse.success && Array.isArray(eventsResponse.data)) {
                const fetchedEvents = eventsResponse.data;
                const fetchedTasks = tasksResponse.success && Array.isArray(tasksResponse.data) ? tasksResponse.data : [];

                console.log('Fetched events:', fetchedEvents);
                console.log('Fetched tasks:', fetchedTasks);

                const mappedEvents = fetchedEvents.map((e: any) => {
                    const eventTasks = fetchedTasks.filter((t: any) => t.event_id === e.id).map((t: any) => ({
                        id: t.id,
                        title: t.title,
                        description: t.description || '',
                        assignedDepartment: t.department_name || 'Unassigned',
                        departmentId: t.department_id || null, // Department ID from backend
                        assignedMembers: Array.isArray(t.assigned_members) ? t.assigned_members.map((m: any) => ({
                            id: Number(m.id),
                            name: m.name,
                            role: 'member'
                        })) : [],
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
                // Filter out past events
                const visibleEvents = mappedEvents.filter((e) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const endDate = new Date(e.endDate);
                    endDate.setHours(0, 0, 0, 0);
                    return endDate >= today;
                });

                console.log('Mapped events:', visibleEvents);
                setEvents(visibleEvents);
            }
        } catch (error) {
            console.error('Failed to fetch data', error);
            toast.error('Failed to fetch events data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [currentUser]);

    const handleAssignMembers = async () => {
        if (!selectedTask) return;

        try {
            const response = await api.tasks.assign({
                task_id: selectedTask.id,
                user_ids: selectedMembers
            });

            if (response.success) {
                setIsAssignDialogOpen(false);
                setSelectedMembers([]);
                fetchData();
            } else {
                console.error('Failed to assign members:', response.message);
            }
        } catch (error) {
            console.error('Failed to assign members', error);
            toast.error('Failed to assign members');
        }
    };

    const handleFinishAssigning = async (event: any) => {
        const deptTasks = event.tasks.filter((t: any) => isTaskForMyDept(t));
        const taskIds = deptTasks.map((t: any) => t.id);

        if (taskIds.length === 0) return;

        try {
            const response = await api.tasks.bulkUpdateStatus({
                task_ids: taskIds,
                status: 'assigned'
            });

            if (response.success) {
                fetchData();
                // Optional: Show success message
            } else {
                console.error('Failed to finish assigning:', response.message);
            }
        } catch (error) {
            console.error('Failed to finish assigning', error);
            toast.error('Failed to finish assigning tasks');
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'text-green-600 border-green-200 bg-green-50';
            case 'completed': return 'text-blue-600 border-blue-200 bg-blue-50';
            case 'upcoming': return 'text-orange-600 border-orange-200 bg-orange-50';
            case 'pending': return 'text-yellow-600 border-yellow-200 bg-yellow-50';
            case 'pending': return 'text-yellow-600 border-yellow-200 bg-yellow-50';
            default: return 'text-muted-foreground border-border bg-muted/50';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
    };

    const isTaskForMyDept = (task: Task) => {
        // Check if this task is assigned to the current user's department by ID
        console.log('Checking task:', task.title);
        console.log('Task department ID:', task.departmentId);
        console.log('My department ID:', userDepartmentId);
        console.log('Match:', task.departmentId === userDepartmentId);

        if (!userDepartmentId) return false; // No department ID, can't assign
        return task.departmentId === userDepartmentId;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Department Events</h1>
                    <p className="text-muted-foreground mt-2">View events and assign members to tasks</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading} className="w-full md:w-auto">
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            <div className="space-y-4">
                {events.length > 0 ? (
                    events.map((event) => {
                        const isExpanded = expandedEvents.has(event.id);
                        return (
                            <Card key={event.id} className="border-0 shadow-sm">
                                <CardHeader className="pb-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <CardTitle className="text-lg">{event.name}</CardTitle>
                                                <Badge variant="outline" className={getStatusColor(event.status)}>
                                                    {event.status === 'pending' ? 'Pending Approval' : event.status}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
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
                                                    <span>{event.tasks.length} tasks</span>
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Button variant="ghost" size="sm" onClick={() => toggleEventExpansion(event.id)}>
                                                {isExpanded ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                                                {isExpanded ? 'Collapse' : 'Expand'}
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                {isExpanded && (
                                    <CardContent>
                                        <div className="space-y-4">
                                            <h4 className="font-medium">Tasks</h4>
                                            <div className="space-y-2">
                                                {event.tasks.map(task => (
                                                    <div key={task.id} className="border rounded-lg p-4">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h5 className="font-semibold text-foreground">{task.title}</h5>
                                                            <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted/80">
                                                                {task.assignedDepartment}
                                                            </Badge>
                                                        </div>

                                                        <p className="text-sm text-muted-foreground mb-4">{task.description}</p>

                                                        <div className="space-y-2">
                                                            <span className="text-xs text-muted-foreground font-medium">Assigned to:</span>
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                {task.assignedMembers.length > 0 ? (
                                                                    <>
                                                                        {task.assignedMembers.map(member => (
                                                                            <div key={member.id} className="flex items-center space-x-2 bg-muted/50 border border-border rounded-full pl-1 pr-3 py-1">
                                                                                <Avatar className="h-6 w-6">
                                                                                    <AvatarFallback className="text-[10px] bg-muted/80 text-muted-foreground">
                                                                                        {member.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                                                                                    </AvatarFallback>
                                                                                </Avatar>
                                                                                <span className="text-xs font-medium text-foreground">{member.name}</span>
                                                                            </div>
                                                                        ))}
                                                                        {isTaskForMyDept(task) && task.status === 'pending' && (
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-6 w-6 rounded-full hover:bg-muted"
                                                                                onClick={() => {
                                                                                    setSelectedTask(task);
                                                                                    setSelectedMembers(task.assignedMembers.map(m => m.id));
                                                                                    setIsAssignDialogOpen(true);
                                                                                }}
                                                                            >
                                                                                <UserPlus className="h-3 w-3 text-muted-foreground" />
                                                                            </Button>
                                                                        )}
                                                                    </>
                                                                ) : (
                                                                    isTaskForMyDept(task) ? (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={() => {
                                                                                setSelectedTask(task);
                                                                                setSelectedMembers([]);
                                                                                setIsAssignDialogOpen(true);
                                                                            }}
                                                                            disabled={task.status !== 'pending'}
                                                                            className="h-8"
                                                                        >
                                                                            <UserPlus className="h-3 w-3 mr-1" /> Assign
                                                                        </Button>
                                                                    ) : (
                                                                        <span className="text-sm text-muted-foreground italic">Unassigned</span>
                                                                    )
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {event.tasks.length === 0 && (
                                                    <p className="text-sm text-muted-foreground text-center py-2">No tasks added yet.</p>
                                                )}
                                                {event.tasks.some(t => isTaskForMyDept(t)) && (
                                                    <div className="flex justify-end mt-4">
                                                        <Button
                                                            onClick={() => handleFinishAssigning(event)}
                                                            disabled={event.tasks.filter(t => isTaskForMyDept(t)).every(t => t.status !== 'pending')}
                                                            className="bg-gradient-to-br from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white border-0"
                                                        >
                                                            Finish Assigning
                                                        </Button>
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
                    <Card className="border-0 shadow-sm">
                        <CardContent className="flex items-center justify-center p-12">
                            <div className="text-center space-y-2">
                                <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
                                <p className="text-muted-foreground font-medium">No events found</p>
                                <p className="text-sm text-muted-foreground">
                                    Team leaders will create events with tasks here
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div >

            <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Members to Task</DialogTitle>
                        <DialogDescription>
                            Select members from your department to assign to <strong>{selectedTask?.title}</strong>.
                            Uncheck to remove assignment.
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                        <div className="space-y-4">
                            {deptMembers.map(member => (
                                <div key={member.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`member-${member.id}`}
                                        checked={selectedMembers.includes(member.id)}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                setSelectedMembers([...selectedMembers, member.id]);
                                            } else {
                                                setSelectedMembers(selectedMembers.filter(id => id !== member.id));
                                            }
                                        }}
                                    />
                                    <Label htmlFor={`member-${member.id}`} className="flex items-center space-x-2 cursor-pointer w-full">
                                        <Avatar className="h-6 w-6">
                                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span>{member.name}</span>
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    <DialogFooter>
                        <Button onClick={handleAssignMembers} className="bg-gradient-to-br from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white border-0">
                            {selectedMembers.length === 0 ? 'Unassign All' : `Assign Selected (${selectedMembers.length})`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
