import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Users, Calendar, TrendingUp, CheckCircle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

interface DeptHeadDashboardProps {
    currentUser: any;
}

export function DeptHeadDashboard({ currentUser }: DeptHeadDashboardProps) {
    const [stats, setStats] = useState({
        totalMembers: 0,
        activeTasks: 0,
        completedTasks: 0
    });
    const [members, setMembers] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchDashboardData = async () => {
        if (!currentUser?.departmentId) return;

        setIsLoading(true);
        try {
            const [membersRes, tasksRes] = await Promise.all([
                api.users.get({ department_id: currentUser.departmentId }),
                api.tasks.get()
            ]) as any[];

            if (membersRes.success && Array.isArray(membersRes.data)) {
                setStats(prev => ({ ...prev, totalMembers: membersRes.data.length }));
                setMembers(membersRes.data.slice(0, 4).map((m: any) => ({
                    id: m.id,
                    name: m.name,
                    role: m.role,
                    email: m.email,
                    avatar: m.avatar
                })));
            }

            if (tasksRes.success && Array.isArray(tasksRes.data)) {
                const completed = tasksRes.data.filter((t: any) => t.status === 'completed').length;
                setStats(prev => ({
                    ...prev,
                    activeTasks: tasksRes.data.length - completed,
                    completedTasks: completed
                }));

                const unassignedTasks = tasksRes.data.filter((t: any) =>
                    (!t.assigned_members || t.assigned_members.length === 0) && t.status !== 'completed'
                );

                setTasks(unassignedTasks.slice(0, 5).map((t: any) => ({
                    id: t.id,
                    title: t.title,
                    assignedTo: 'Unassigned',
                    status: t.status,
                    dueDate: t.created_at
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
            title: 'Department Members',
            value: stats.totalMembers.toString(),
            change: 'Total members',
            icon: Users,
            color: 'text-blue-600',
            bgColor: 'bg-brand-0',
        },
        {
            title: 'Active Tasks',
            value: stats.activeTasks.toString(),
            change: 'In progress',
            icon: Calendar,
            color: 'text-orange-600',
            bgColor: 'bg-brand-0',
        },
    ];

    const getInitials = (name: string) => {
        return name.split(' ').map(word => word.charAt(0).toUpperCase()).join('').slice(0, 2);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'text-green-600 dark:text-green-400 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20';
            case 'in_progress':
                return 'text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20';
            case 'pending':
                return 'text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20';
            default:
                return 'text-muted-foreground border-border bg-muted/50';
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Department Dashboard</h1>
                    <p className="text-muted-foreground mt-2">
                        Overview of your department's performance and activities
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchDashboardData} disabled={isLoading} className="w-full md:w-auto">
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
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
                {/* Department Members */}
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center space-x-2 text-lg">
                            <Users className="h-5 w-5 text-blue-500" />
                            <span>Department Members</span>
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Members in your department
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {members.length > 0 ? members.map((member) => (
                            <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-muted/30 rounded-xl hover:bg-gray-100 dark:hover:bg-muted/50 transition-colors">
                                <div className="flex items-center space-x-4">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={member.avatar || ''} alt={member.name} />
                                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                                            {getInitials(member.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium text-foreground">{member.name}</p>
                                        <p className="text-sm text-muted-foreground">{member.email}</p>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <p className="text-center text-gray-500 py-8">No members found</p>
                        )}
                    </CardContent>
                </Card>

                {/* Unassigned Tasks */}
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center space-x-2 text-lg">
                            <Calendar className="h-5 w-5 text-purple-500" />
                            <span>Tasks Needing Assignment</span>
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Tasks that have not been assigned to any member
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {tasks.length > 0 ? tasks.map((task) => (
                            <div key={task.id} className="p-4 bg-gray-50 dark:bg-muted/30 rounded-xl hover:bg-gray-100 dark:hover:bg-muted/50 transition-colors">
                                <div className="flex items-start justify-between mb-2">
                                    <h4 className="font-medium text-foreground">{task.title}</h4>
                                    <Badge variant="outline" className={getStatusColor(task.status)}>
                                        {task.status.replace('_', ' ')}
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">Status: Waiting for assignment</p>
                            </div>
                        )) : (
                            <div className="text-center py-8">
                                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-3" />
                                <p className="text-foreground font-medium">All tasks assigned!</p>
                                <p className="text-sm text-muted-foreground mt-1">There are no tasks to assign members to.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
