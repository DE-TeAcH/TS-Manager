import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Calendar, Search, RefreshCw, Users, ChevronDown, ChevronUp, MapPin, ListTodo, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { api } from '../services/api';

interface MemberEventsProps {
    currentUser: any;
}

export function MemberEvents({ currentUser }: MemberEventsProps) {
    const [myEvents, setMyEvents] = useState<any[]>([]);
    const [allEvents, setAllEvents] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [expandedEvents, setExpandedEvents] = useState<Set<number>>(new Set());
    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
    const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);

    const fetchEvents = async () => {
        if (!currentUser?.teamId || !currentUser?.id) return;

        setIsLoading(true);
        try {
            // Fetch events and ALL tasks for the team that are assigned/in-progress/completed
            const [eventsRes, tasksRes] = await Promise.all([
                api.events.get(currentUser.teamId),
                api.tasks.get(undefined, undefined, currentUser.teamId) // Fetch all team tasks
            ]);

            if (eventsRes.success && Array.isArray(eventsRes.data)) {
                // Show all events immediately (no 24h delay)
                const allEvents = eventsRes.data;

                if (tasksRes.success && Array.isArray(tasksRes.data)) {
                    // Filter tasks that are visible (assigned, in_progress, completed)
                    const visibleTasks = tasksRes.data.filter((t: any) =>
                        ['assigned', 'in_progress', 'completed'].includes(t.status)
                    );

                    // Map tasks to events
                    let eventsWithTasks = allEvents.map((e: any) => ({
                        ...e,
                        tasks: visibleTasks.filter((t: any) => t.event_id === e.id)
                    }));

                    // Filter out past events
                    eventsWithTasks = eventsWithTasks.filter((e: any) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const endDate = new Date(e.end_date || e.date);
                        endDate.setHours(0, 0, 0, 0);
                        return endDate >= today;
                    });

                    setAllEvents(eventsWithTasks);

                    // Get events where user has tasks (convert IDs to strings for comparison)
                    const myEventIds = new Set(visibleTasks
                        .filter((t: any) => t.assigned_members?.some((m: any) => String(m.id) === String(currentUser.id)))
                        .map((t: any) => t.event_id)
                    );
                    const assigned = eventsWithTasks.filter((e: any) => myEventIds.has(e.id));
                    setMyEvents(assigned);
                } else {
                    setAllEvents(allEvents);
                    setMyEvents([]);
                }
            }
        } catch (error) {
            console.error('Failed to fetch events', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, [currentUser]);

    const filteredMyEvents = myEvents.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredAllEvents = allEvents.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        return 'text-green-600 border-green-200 bg-green-50';
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

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Events</h1>
                    <p className="text-muted-foreground mt-2">
                        View events you're assigned to and all team events
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchEvents} disabled={isLoading}>
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* My Assigned Events */}
            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Calendar className="h-5 w-5 text-purple-500" />
                        <span>My Assigned Events</span>
                    </CardTitle>
                    <CardDescription>
                        Events where you have assigned tasks
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {filteredMyEvents.length > 0 ? filteredMyEvents.map((event) => {
                            const isExpanded = expandedEvents.has(event.id);
                            return (
                                <div key={event.id} className="p-4 bg-card rounded-xl border hover:shadow-md transition-all">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <h4 className="font-semibold text-foreground text-lg">{event.title}</h4>
                                                <Badge variant="outline" className={getStatusColor('active')}>
                                                    active
                                                </Badge>
                                            </div>
                                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                                <span className="flex items-center space-x-1">
                                                    <Calendar className="h-4 w-4" />
                                                    <span>
                                                        {formatDate(event.date)}
                                                        {event.end_date && event.end_date !== event.date && ` - ${formatDate(event.end_date)}`}
                                                    </span>
                                                </span>
                                                <span className="flex items-center space-x-1">
                                                    <MapPin className="h-4 w-4" />
                                                    <span>{event.location || 'Online/TBD'}</span>
                                                </span>
                                                <span className="flex items-center space-x-1">
                                                    <ListTodo className="h-4 w-4" />
                                                    <span>{event.tasks ? event.tasks.length : 0} tasks</span>
                                                </span>
                                            </div>

                                            {/* Show assigned tasks for this user */}
                                            {!isExpanded && event.tasks && event.tasks.length > 0 && (() => {
                                                const userTasks = event.tasks.filter((t: any) =>
                                                    t.assigned_members?.some((m: any) => String(m.id) === String(currentUser.id))
                                                );
                                                return userTasks.length > 0 ? (
                                                    <div className="mt-3">
                                                        <p className="text-xs text-muted-foreground mb-1">Your tasks:</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {userTasks.map((t: any) => (
                                                                <Badge key={t.id} variant="secondary" className="text-xs">
                                                                    {t.title}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : null;
                                            })()}
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Button variant="ghost" size="sm" onClick={() => toggleEventExpansion(event.id)}>
                                                {isExpanded ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                                                {isExpanded ? 'Collapse' : 'Expand'}
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => { setSelectedEvent(event); setIsViewDetailsOpen(true); }}>
                                                <Eye className="h-4 w-4 mr-1" /> Details
                                            </Button>
                                        </div>
                                    </div>
                                    {/* Display Tasks */}
                                    {isExpanded && event.tasks && event.tasks.length > 0 && (
                                        <div className="space-y-2 mt-3 border-t pt-3">
                                            <h5 className="text-xs font-semibold text-muted-foreground uppercase">Tasks</h5>
                                            {event.tasks.map((task: any) => (
                                                <div key={task.id} className="bg-card p-3 rounded-lg border">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="font-medium text-sm">{task.title}</span>
                                                        <Badge variant="secondary" className="text-xs">{task.status}</Badge>
                                                    </div>
                                                    {task.description && (
                                                        <p className="text-xs text-muted-foreground mb-2">{task.description}</p>
                                                    )}
                                                    {task.assigned_members && task.assigned_members.length > 0 && (
                                                        <div className="mt-2">
                                                            <span className="text-xs text-muted-foreground block mb-1">Assigned to:</span>
                                                            <div className="flex flex-wrap gap-2">
                                                                {task.assigned_members.map((m: any) => (
                                                                    <div key={m.id} className={`flex items-center gap-1.5 rounded-full px-2 py-1 ${String(m.id) === String(currentUser.id) ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-muted/50'}`}>
                                                                        <Avatar className="h-5 w-5">
                                                                            <AvatarFallback className="text-xs">{m.name.charAt(0)}</AvatarFallback>
                                                                        </Avatar>
                                                                        <span className={`text-xs font-medium ${String(m.id) === String(currentUser.id) ? 'text-blue-600' : ''}`}>{m.name}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {/* Start and End Times - shown when expanded */}
                                    {isExpanded && (event.start_time || event.end_time) && (
                                        <div className="mt-3 pt-3 border-t flex items-center gap-4 text-sm text-muted-foreground">
                                            {event.start_time && (
                                                <span className="flex items-center gap-1">
                                                    <span className="font-medium">Start:</span>
                                                    <span>{event.start_time}</span>
                                                </span>
                                            )}
                                            {event.end_time && (
                                                <span className="flex items-center gap-1">
                                                    <span className="font-medium">End:</span>
                                                    <span>{event.end_time}</span>
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        }) : (
                            <p className="text-center text-muted-foreground py-8">No assigned events</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* All Events */}
            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Users className="h-5 w-5 text-blue-500" />
                        <span>All Team Events</span>
                    </CardTitle>
                    <CardDescription>
                        All events from your team
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {filteredAllEvents.length > 0 ? filteredAllEvents.map((event) => {
                            const isExpanded = expandedEvents.has(event.id);
                            return (
                                <div key={event.id} className="p-4 bg-card rounded-xl border hover:shadow-md transition-all">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <h4 className="font-semibold text-foreground text-lg">{event.title}</h4>
                                                <Badge variant="outline" className={getStatusColor('active')}>
                                                    active
                                                </Badge>
                                            </div>
                                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                                <span className="flex items-center space-x-1">
                                                    <Calendar className="h-4 w-4" />
                                                    <span>
                                                        {formatDate(event.date)}
                                                        {event.end_date && event.end_date !== event.date && ` - ${formatDate(event.end_date)}`}
                                                    </span>
                                                </span>
                                                <span className="flex items-center space-x-1">
                                                    <MapPin className="h-4 w-4" />
                                                    <span>{event.location || 'Online/TBD'}</span>
                                                </span>
                                                <span className="flex items-center space-x-1">
                                                    <ListTodo className="h-4 w-4" />
                                                    <span>{event.tasks ? event.tasks.length : 0} tasks</span>
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Button variant="ghost" size="sm" onClick={() => toggleEventExpansion(event.id)}>
                                                {isExpanded ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                                                {isExpanded ? 'Collapse' : 'Expand'}
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => { setSelectedEvent(event); setIsViewDetailsOpen(true); }}>
                                                <Eye className="h-4 w-4 mr-1" /> Details
                                            </Button>
                                        </div>
                                    </div>
                                    {/* Display Tasks */}
                                    {isExpanded && event.tasks && event.tasks.length > 0 && (
                                        <div className="space-y-2 mt-3 border-t pt-3">
                                            <h5 className="text-xs font-semibold text-muted-foreground uppercase">Tasks</h5>
                                            {event.tasks.map((task: any) => (
                                                <div key={task.id} className="bg-card p-3 rounded-lg border">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="font-medium text-sm">{task.title}</span>
                                                        <Badge variant="secondary" className="text-xs">{task.status}</Badge>
                                                    </div>
                                                    {task.description && (
                                                        <p className="text-xs text-muted-foreground mb-2">{task.description}</p>
                                                    )}
                                                    {task.assigned_members && task.assigned_members.length > 0 && (
                                                        <div className="mt-2">
                                                            <span className="text-xs text-muted-foreground block mb-1">Assigned to:</span>
                                                            <div className="flex flex-wrap gap-2">
                                                                {task.assigned_members.map((m: any) => (
                                                                    <div key={m.id} className={`flex items-center gap-1.5 rounded-full px-2 py-1 ${String(m.id) === String(currentUser.id) ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-muted/50'}`}>
                                                                        <Avatar className="h-5 w-5">
                                                                            <AvatarFallback className="text-xs">{m.name.charAt(0)}</AvatarFallback>
                                                                        </Avatar>
                                                                        <span className={`text-xs font-medium ${String(m.id) === String(currentUser.id) ? 'text-blue-600' : ''}`}>{m.name}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {/* Start and End Times - shown when expanded */}
                                    {isExpanded && (event.start_time || event.end_time) && (
                                        <div className="mt-3 pt-3 border-t flex items-center gap-4 text-sm text-muted-foreground">
                                            {event.start_time && (
                                                <span className="flex items-center gap-1">
                                                    <span className="font-medium">Start:</span>
                                                    <span>{event.start_time}</span>
                                                </span>
                                            )}
                                            {event.end_time && (
                                                <span className="flex items-center gap-1">
                                                    <span className="font-medium">End:</span>
                                                    <span>{event.end_time}</span>
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        }) : (
                            <p className="text-center text-muted-foreground py-8">No events found</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* View Details Dialog */}
            <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Event Details</DialogTitle>
                    </DialogHeader>
                    {selectedEvent && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <h3 className="font-semibold text-lg">{selectedEvent.title}</h3>
                                <Badge variant="outline" className={getStatusColor('active')}>
                                    active
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
                                                {formatDate(selectedEvent.date)}
                                                {selectedEvent.end_date && selectedEvent.end_date !== selectedEvent.date && ` - ${formatDate(selectedEvent.end_date)}`}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground text-xs">Location</Label>
                                        <div className="flex items-center mt-1 text-sm">
                                            <MapPin className="h-4 w-4 mr-2" />
                                            {selectedEvent.location || "Online/TBD"}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-muted-foreground text-xs">Total Tasks</Label>
                                    <div className="flex items-center mt-1 text-sm">
                                        <ListTodo className="h-4 w-4 mr-2" />
                                        {selectedEvent.tasks ? selectedEvent.tasks.length : 0} tasks
                                    </div>
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
