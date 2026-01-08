import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';
import {
  Users,
  User,
  Mail,
  Plus,
  Trash2,
  Building,
  Calendar,
  Search,
  Briefcase,
  ArrowUp,
  ArrowRightLeft,
  ArrowDown,
  MoreVertical,
  RefreshCw,
  ArrowUpDown
} from 'lucide-react';
import { api } from '../services/api';

type SortField = 'name' | 'username' | 'role' | 'department' | 'email' | 'joinDate';
type SortDirection = 'asc' | 'desc';

interface TeamMember {
  id: number;
  name: string;
  username: string;
  role: 'dept-head' | 'member';
  department: string;
  email: string;
  joinDate: string;
  avatar?: string;
}

interface TeamLeaderTeamProps {
  currentUser: any;
}

export function TeamLeaderTeam({ currentUser }: TeamLeaderTeamProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [departments, setDepartments] = useState<{ id: number, name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    if (!currentUser?.teamId) return;
    setIsLoading(true);
    try {
      const [usersResponse, deptsResponse] = await Promise.all([
        api.users.get({ team_id: currentUser.teamId }),
        api.departments.get({ team_id: currentUser.teamId })
      ]);

      if (usersResponse.success && Array.isArray(usersResponse.data)) {
        const mappedMembers = usersResponse.data.map((u: any) => ({
          id: u.id,
          name: u.name,
          username: u.username || '',
          role: u.role,
          department: u.department_name || 'Unassigned',
          email: u.email,
          joinDate: u.join_date || u.created_at || '',
          avatar: u.avatar
        }));
        setMembers(mappedMembers);
      }

      if (deptsResponse.success && Array.isArray(deptsResponse.data)) {
        setDepartments(deptsResponse.data.map((d: any) => ({ id: d.id, name: d.name })));
      }
    } catch (error) {
      console.error('Failed to fetch team data', error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, [currentUser]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
  const [isDemoteDialogOpen, setIsDemoteDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [transferToDepartment, setTransferToDepartment] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [newMember, setNewMember] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'member' as TeamMember['role'],
    department: '',
    joinDate: ''
  });

  // Custom role order: team-leader > dept-head > member
  const getRoleOrder = (role: string): number => {
    switch (role) {
      case 'team-leader': return 1;
      case 'dept-head': return 2;
      case 'member': return 3;
      default: return 4;
    }
  };

  const sortedAndFilteredMembers = useMemo(() => {
    const filtered = members.filter(member =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return [...filtered].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Use custom role ordering when sorting by role
      if (sortField === 'role') {
        const aOrder = getRoleOrder(a.role);
        const bOrder = getRoleOrder(b.role);
        if (sortDirection === 'asc') {
          return aOrder - bOrder;
        } else {
          return bOrder - aOrder;
        }
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [members, searchQuery, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="h-4 w-4 text-blue-600" />
      : <ArrowDown className="h-4 w-4 text-blue-600" />;
  };

  const handleAddMember = async () => {
    if (newMember.name && newMember.username && newMember.email && newMember.password && newMember.department) {
      try {
        const selectedDept = departments.find(d => d.name === newMember.department);
        if (!selectedDept) {
          alert('Please select a valid department');
          return;
        }

        const response = await api.users.create({
          name: newMember.name,
          username: newMember.username,
          password: newMember.password,
          email: newMember.email,
          role: newMember.role,
          team_id: currentUser.teamId,
          department_id: selectedDept.id,
          join_date: newMember.joinDate || undefined
        });

        if (response.success) {
          setNewMember({ name: '', username: '', email: '', password: '', role: 'member', department: '', joinDate: '' });
          setIsAddDialogOpen(false);
          fetchData();
        } else {
          alert(response.message || 'Failed to create member');
        }
      } catch (error: any) {
        console.error('Error creating member:', error);
        if (error.response && error.response.data && error.response.data.message) {
          alert(error.response.data.message);
        } else {
          alert('Failed to create member');
        }
      }
    } else {
      alert('Please fill in all required fields');
    }
  };

  const handleRemoveMember = async (id: number) => {
    if (confirm('Are you sure you want to remove this member?')) {
      try {
        const response = await api.users.delete(id);
        if (response.success) {
          fetchData();
        } else {
          alert(response.message || 'Failed to delete member');
        }
      } catch (error) {
        alert('Failed to delete member');
      }
    }
  };

  const handlePromoteToDeptHead = (member: TeamMember) => {
    setSelectedMember(member);
    setIsPromoteDialogOpen(true);
  };

  const handleDemoteToMember = (member: TeamMember) => {
    setSelectedMember(member);
    setIsDemoteDialogOpen(true);
  };

  const confirmPromote = async () => {
    if (!selectedMember) return;

    try {
      const existingDeptHead = members.find(
        m => m.department === selectedMember.department && m.role === 'dept-head' && m.id !== selectedMember.id
      );

      if (existingDeptHead) {
        await api.users.update(existingDeptHead.id, { role: 'member' });
      }

      const response = await api.users.update(selectedMember.id, { role: 'dept-head' });

      if (response.success) {
        const dept = departments.find(d => d.name === selectedMember.department);
        if (dept) {
          await api.departments.update(dept.id, { dept_head_id: selectedMember.id });
        }

        fetchData();
        setIsPromoteDialogOpen(false);
        setSelectedMember(null);
      } else {
        alert(response.message || 'Failed to promote member');
      }
    } catch (error) {
      console.error('Error promoting member:', error);
      alert('Failed to promote member');
    }
  };

  const confirmDemote = async () => {
    if (!selectedMember) return;

    try {
      const response = await api.users.update(selectedMember.id, { role: 'member' });

      if (response.success) {
        const dept = departments.find(d => d.name === selectedMember.department);
        if (dept) {
          await api.departments.update(dept.id, { dept_head_id: null });
        }

        fetchData();
        setIsDemoteDialogOpen(false);
        setSelectedMember(null);
      } else {
        alert(response.message || 'Failed to demote member');
      }
    } catch (error) {
      console.error('Error demoting member:', error);
      alert('Failed to demote member');
    }
  };

  const handleTransferDepartment = (member: TeamMember) => {
    setSelectedMember(member);
    setTransferToDepartment(member.department);
    setIsTransferDialogOpen(true);
  };

  const confirmTransfer = async () => {
    if (!selectedMember || !transferToDepartment) return;

    const selectedDept = departments.find(d => d.name === transferToDepartment);
    if (!selectedDept) {
      alert('Please select a valid department');
      return;
    }

    try {
      const response = await api.users.update(selectedMember.id, { department_id: selectedDept.id });
      if (response.success) {
        fetchData();
        setIsTransferDialogOpen(false);
        setSelectedMember(null);
      } else {
        alert(response.message || 'Failed to transfer member');
      }
    } catch (error) {
      console.error('Error transferring member:', error);
      alert('Failed to transfer member');
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word.charAt(0).toUpperCase()).join('').slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'team-leader':
        return 'text-purple-600 border-purple-200 bg-purple-50 dark:bg-purple-700/20 dark:text-purple-200 dark:border-purple-600';
      case 'dept-head':
        return 'text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-700/20 dark:text-blue-200 dark:border-blue-600';
      case 'member':
        return 'text-green-600 border-green-200 bg-green-50 dark:bg-green-700/20 dark:text-green-200 dark:border-green-600';
      default:
        return 'text-muted-foreground border-border bg-muted/50';
    }
  };

  const stats = [
    {
      label: 'Total Members',
      value: members.length,
      icon: Users,
      description: 'in team'
    },
    {
      label: 'Department Heads',
      value: members.filter(m => m.role === 'dept-head').length,
      icon: User,
      description: 'heads'
    },
    {
      label: 'Regular Members',
      value: members.filter(m => m.role === 'member').length,
      icon: User,
      description: 'members'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">My Team</h1>
          <p className="text-muted-foreground mt-2">
            Manage your team members and departments
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2 bg-gradient-to-br from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white border-0">
                <Plus className="h-4 w-4" />
                <span>Add Team Member</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Team Member</DialogTitle>
                <DialogDescription>
                  Add a new member to your team
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="member-name" className="text-right">Full Name</Label>
                  <Input
                    id="member-name"
                    value={newMember.name}
                    onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                    className="col-span-3"
                    placeholder="Enter full name"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="username" className="text-right">Username</Label>
                  <Input
                    id="username"
                    value={newMember.username}
                    onChange={(e) => setNewMember(prev => ({ ...prev, username: e.target.value }))}
                    className="col-span-3"
                    placeholder="Enter username"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newMember.email}
                    onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                    className="col-span-3"
                    placeholder="Enter email address"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password" className="text-right">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newMember.password}
                    onChange={(e) => setNewMember(prev => ({ ...prev, password: e.target.value }))}
                    className="col-span-3"
                    placeholder="Enter password"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="department" className="text-right">Department</Label>
                  <Select onValueChange={(value: string) => setNewMember(prev => ({ ...prev, department: value }))}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(dept => (
                        <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">Role</Label>
                  <Select
                    value={newMember.role}
                    onValueChange={(value: string) => setNewMember(prev => ({ ...prev, role: value as TeamMember['role'] }))}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dept-head">Department Head</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="joinDate" className="text-right">Join Date</Label>
                  <Input
                    id="joinDate"
                    type="date"
                    value={newMember.joinDate}
                    onChange={(e) => setNewMember(prev => ({ ...prev, joinDate: e.target.value }))}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddMember} className="bg-gradient-to-br from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white border-0">
                  Add Member
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-foreground">{stat.value}</div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
                <stat.icon className="h-3 w-3" />
                <span>{stat.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Members Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-brand-600" />
                <span>Team Members ({sortedAndFilteredMembers.length})</span>
              </CardTitle>
              <CardDescription>
                Manage your team members and their roles
              </CardDescription>
            </div>
          </div>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort('name')}>
                  <div className="flex items-center space-x-2">
                    <span>Name</span>
                    {getSortIcon('name')}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort('username')}>
                  <div className="flex items-center space-x-2">
                    <span>Username</span>
                    {getSortIcon('username')}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort('role')}>
                  <div className="flex items-center space-x-2">
                    <span>Role</span>
                    {getSortIcon('role')}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort('department')}>
                  <div className="flex items-center space-x-2">
                    <span>Department</span>
                    {getSortIcon('department')}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort('email')}>
                  <div className="flex items-center space-x-2">
                    <span>Email</span>
                    {getSortIcon('email')}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort('joinDate')}>
                  <div className="flex items-center space-x-2">
                    <span>Join Date</span>
                    {getSortIcon('joinDate')}
                  </div>
                </TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAndFilteredMembers.map((member) => (
                <TableRow key={member.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback className="bg-gradient-to-br from-brand-500 to-purple-600 text-white text-xs">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-foreground">{member.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded">{member.username}</code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getRoleColor(member.role)}>
                      {member.role.replace('-', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span>{member.department}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{member.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{member.joinDate}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {member.id === currentUser?.id ? (
                      <span className="text-gray-400 italic">—</span>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {member.role === 'member' ? (
                            <>
                              <DropdownMenuItem onClick={() => handlePromoteToDeptHead(member)}>
                                <ArrowUp className="mr-2 h-4 w-4 text-blue-600" />
                                <span>Promote to Dept Head</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleTransferDepartment(member)}>
                                <ArrowRightLeft className="mr-2 h-4 w-4 text-purple-600" />
                                <span>Transfer Department</span>
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <DropdownMenuItem onClick={() => handleDemoteToMember(member)}>
                              <ArrowDown className="mr-2 h-4 w-4 text-orange-600" />
                              <span>Demote to Member</span>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleRemoveMember(member.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Remove Member</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {sortedAndFilteredMembers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No team members found matching your search criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Promote Dialog */}
      <Dialog open={isPromoteDialogOpen} onOpenChange={setIsPromoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Promote to Department Head</DialogTitle>
            <DialogDescription>
              Are you sure you want to promote {selectedMember?.name} to Department Head of {selectedMember?.department}?
              This will demote the current Department Head of {selectedMember?.department} to a regular member.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPromoteDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmPromote} className="bg-gradient-to-br from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white border-0">Promote</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Demote Dialog */}
      <Dialog open={isDemoteDialogOpen} onOpenChange={setIsDemoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Demote to Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to demote {selectedMember?.name} from Department Head to a regular member?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDemoteDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmDemote} variant="destructive">Demote</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Department</DialogTitle>
            <DialogDescription>
              Transfer {selectedMember?.name} from {selectedMember?.department} to a new department.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="transfer-department" className="text-right">New Department</Label>
              <Select value={transferToDepartment} onValueChange={setTransferToDepartment}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select new department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTransferDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmTransfer} className="bg-gradient-to-br from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white border-0">Transfer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
}
