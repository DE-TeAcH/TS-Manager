import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Input } from './ui/input';
import { Users, Search, RefreshCw, User } from 'lucide-react';
import { api } from '../services/api';

interface DeptHeadMembersProps {
    currentUser: any;
}

export function DeptHeadMembers({ currentUser }: DeptHeadMembersProps) {
    const [members, setMembers] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const fetchMembers = async () => {
        if (!currentUser?.departmentId) return;

        setIsLoading(true);
        try {
            const response = await api.users.get({ department_id: currentUser.departmentId });

            if (response.success && Array.isArray(response.data)) {
                setMembers(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch members', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, [currentUser]);

    const filteredMembers = members.filter(member =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getInitials = (name: string) => {
        return name.split(' ').map(word => word.charAt(0).toUpperCase()).join('').slice(0, 2);
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'dept-head':
                return 'text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
            case 'member':
                return 'text-green-600 border-green-200 bg-green-50 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
            default:
                return 'text-muted-foreground border-border bg-muted/50';
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Department Members</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage members in your department
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchMembers} disabled={isLoading}>
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Members</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-semibold text-foreground">{members.length}</div>
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
                            <Users className="h-3 w-3" />
                            <span>in department</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Regular Members</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-semibold text-foreground">
                            {members.filter(m => m.role === 'member').length}
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
                            <User className="h-3 w-3" />
                            <span>active members</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Department Heads</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-semibold text-foreground">
                            {members.filter(m => m.role === 'dept-head').length}
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
                            <User className="h-3 w-3" />
                            <span>heads</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Members List */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                    <CardTitle>Members</CardTitle>
                    <CardDescription>
                        View all members in your department
                    </CardDescription>
                    <div className="relative mt-4">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="Search members..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {filteredMembers.length > 0 ? filteredMembers.map((member) => (
                            <div key={member.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors">
                                <div className="flex items-center space-x-4">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={member.avatar || ''} alt={member.name} />
                                        <AvatarFallback className="bg-gradient-to-br from-brand-500 to-purple-600 text-white text-xs">
                                            {getInitials(member.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium text-foreground">{member.name}</p>
                                        <p className="text-sm text-muted-foreground">{member.email}</p>
                                    </div>
                                </div>
                                <Badge variant="outline" className={getRoleColor(member.role)}>
                                    {member.role.replace('-', ' ')}
                                </Badge>
                            </div>
                        )) : (
                            <p className="text-center text-muted-foreground py-8">No members found</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
