import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Users, Calendar, TrendingUp, CheckCircle, Clock, RefreshCw, Building } from 'lucide-react';
import { api } from '../services/api';

interface MemberDashboardProps {
    currentUser: any;
}

export function MemberDashboard({ currentUser }: MemberDashboardProps) {
    const [stats, setStats] = useState({
        assignedTasks: 0,
        completedTasks: 0,
        upcomingEvents: 0
    });
    const [tasks, setTasks] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchDashboardData = async () => {
        if (!currentUser?.id || !currentUser?.teamId) return;

        setIsLoading(true);
        try {
            const [tasksRes, eventsRes] = await Promise.all([
                api.tasks.get(undefined, currentUser.id),
                api.events.get(currentUser.teamId)
            ]) as any[];


            if (tasksRes.success && Array.isArray(tasksRes.data)) {
                const completed = tasksRes.data.filter((t: any) => t.status === 'completed').length;
                setStats(prev => ({
                    ...prev,
                    assignedTasks: tasksRes.data.length,
                    completedTasks: completed
                }));
                setTasks(tasksRes.data.slice(0, 5).map((t: any) => ({
                    id: t.id,
                    title: t.title,
                    status: t.status,
                    eventTitle: t.event_title || 'No event',
                    description: t.description || ''
                })));
            }

            if (eventsRes.success && Array.isArray(eventsRes.data)) {
                setStats(prev => ({ ...prev, upcomingEvents: eventsRes.data.length }));
                setEvents(eventsRes.data.slice(0, 3).map((e: any) => ({
                    id: e.id,
                    title: e.title,
                    date: e.date,
                    endDate: e.end_date,
                    team: e.team_name || 'Unknown'
                })));
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
            title: 'Assigned Tasks',
            value: stats.assignedTasks.toString(),
            change: 'Your tasks',
            icon: Clock,
            color: 'text-blue-600 dark:text-blue-200',
            bgColor: 'bg-blue-50 dark:bg-blue-700/20',
        },
        {
            title: 'Upcoming Events',
            value: stats.upcomingEvents.toString(),
            change: 'Team events',
            icon: Calendar,
            color: 'text-purple-600 dark:text-purple-200',
            bgColor: 'bg-purple-50 dark:bg-purple-700/20',
        },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'text-green-600 border-green-200 bg-green-50 dark:bg-green-700/20 dark:text-green-200 dark:border-green-600';
            case 'in_progress':
                return 'text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-700/20 dark:text-blue-200 dark:border-blue-600';
            case 'pending':
                return 'text-orange-600 border-orange-200 bg-orange-50 dark:bg-orange-700/20 dark:text-orange-200 dark:border-orange-600';
            default:
                return 'text-muted-foreground border-border bg-muted/50';
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">My Dashboard</h1>
                    <p className="text-muted-foreground mt-2">
                        Overview of your tasks and upcoming events
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchDashboardData} disabled={isLoading}>
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            {/* Team & Department Info Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-0 shadow-md bg-gradient-to-br from-blue-600 to-blue-700 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
                    <CardContent className="pt-6 relative z-10">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                <Users className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-blue-100 font-medium">Your Team</p>
                                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100 text-white">
                                    {currentUser?.teamName || 'Unknown Team'}
                                </h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-md bg-gradient-to-br from-purple-600 to-purple-700 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
                    <CardContent className="pt-6 relative z-10">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                <Building className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-purple-100 font-medium">Your Department</p>
                                <h3 className="text-xl font-bold text-white">
                                    {currentUser?.departmentName || 'Unknown Department'}
                                </h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                {/* My Tasks */}
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center space-x-2 text-lg">
                            <Clock className="h-5 w-5 text-blue-500" />
                            <span>My Tasks</span>
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Tasks assigned to you
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {tasks.length > 0 ? tasks.map((task) => (
                            <div key={task.id} className="p-4 bg-muted/50 rounded-xl">
                                <div className="flex items-start justify-between mb-2">
                                    <h4 className="font-medium text-foreground">{task.title}</h4>
                                    <Badge variant="outline" className={getStatusColor(task.status)}>
                                        {task.status.replace('_', ' ')}
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{task.eventTitle}</p>
                            </div>
                        )) : (
                            <p className="text-center text-muted-foreground py-8">No tasks assigned</p>
                        )}
                    </CardContent>
                </Card>

                {/* Upcoming Events */}
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center space-x-2 text-lg">
                            <Calendar className="h-5 w-5 text-purple-500" />
                            <span>Upcoming Events</span>
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Team events you can participate in
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {events.length > 0 ? events.map((event) => (
                            <div key={event.id} className="p-4 bg-muted/50 rounded-xl">
                                <h4 className="font-medium text-foreground mb-2">{event.title}</h4>
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <span>{event.team}</span>
                                    <span>
                                        {formatDate(event.date)}
                                        {event.endDate && event.endDate !== event.date && ` - ${formatDate(event.endDate)}`}
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
