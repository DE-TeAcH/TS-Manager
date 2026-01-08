// AdminUsers.tsx
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import {
  Users,
  User,
  Mail,
  Plus,
  Trash2,
  Building,
  Calendar,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  RefreshCw,
  Edit
} from 'lucide-react';
import { api } from '../services/api';

interface User {
  id: number;
  name: string;
  username: string;
  team: string;
  role: 'admin' | 'team-leader' | 'dept-head' | 'member';
  email: string;
  joinDate: string;
  teamId: number;
  departmentId: number;
  avatar?: string;
  // NEW: bac fields (optional)
  bacMatricule?: string; // expected 8 digits
  bacYear?: number;
}

type SortField = 'name' | 'username' | 'team' | 'role' | 'email' | 'joinDate';
type SortDirection = 'asc' | 'desc';

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [teamsList, setTeamsList] = useState<{ id: number, name: string }[]>([]);
  const [departmentsList, setDepartmentsList] = useState<{ id: number, name: string }[]>([]);
  const [editDepartmentsList, setEditDepartmentsList] = useState<{ id: number, name: string }[]>([]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [usersResponse, teamsResponse] = await Promise.all([
        api.users.get(),
        api.teams.get()
      ]);

      console.log('Users API Response:', usersResponse);
      if (usersResponse.success && Array.isArray(usersResponse.data)) {
        const mappedUsers = usersResponse.data.map((u: any) => ({
          id: u.id,
          name: u.name,
          username: u.username || '',
          team: u.team_name || 'Unassigned',
          role: u.role,
          email: u.email,
          joinDate: u.join_date || u.created_at || '',
          teamId: u.team_id || 0,
          departmentId: u.department_id || 0,
          avatar: u.avatar,
          // map bac fields from API if present
          bacMatricule: u.bac_matricule ?? undefined,
          bacYear: u.bac_year ? Number(u.bac_year) : undefined
        }));
        console.log('Mapped Users:', mappedUsers);
        setUsers(mappedUsers);
      }

      if (teamsResponse.success && Array.isArray(teamsResponse.data)) {
        setTeamsList(teamsResponse.data.map((t: any) => ({ id: t.id, name: t.name })));
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [searchQuery, setSearchQuery] = useState('');

  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    password: '',
    team: '',
    role: 'member' as User['role'],
    email: '',
    departmentId: 0,
    joinDate: '', // Format: YYYY-MM-DD
    bacMatricule: '',
    bacYear: ''
  });

  const [editUser, setEditUser] = useState({
    name: '',
    username: '',
    password: '', // Optional - only set if changing password
    team: '',
    teamId: 0,
    departmentId: 0,
    role: 'member' as User['role'],
    email: '',
    // NEW: fields to edit bac details
    bacMatricule: '',
    bacYear: '' // keep string for input; convert on submit
  });

  // Fetch departments for New User Dialog
  React.useEffect(() => {
    const fetchDepartments = async () => {
      const selectedTeam = teamsList.find(t => t.name === newUser.team);
      if (selectedTeam) {
        try {
          const response = await api.departments.get({ team_id: selectedTeam.id });
          if (response.success && Array.isArray(response.data)) {
            setDepartmentsList(response.data);
          } else {
            setDepartmentsList([]);
          }
        } catch (error) {
          console.error('Failed to fetch departments', error);
          setDepartmentsList([]);
        }
      } else {
        setDepartmentsList([]);
      }
    };

    if (newUser.team) {
      fetchDepartments();
    } else {
      setDepartmentsList([]);
    }
  }, [newUser.team, teamsList]);

  // Fetch departments for Edit User Dialog
  React.useEffect(() => {
    const fetchEditDepartments = async () => {
      if (editUser.teamId) {
        try {
          const response = await api.departments.get({ team_id: editUser.teamId });
          if (response.success && Array.isArray(response.data)) {
            setEditDepartmentsList(response.data);
          } else {
            setEditDepartmentsList([]);
          }
        } catch (error) {
          console.error('Failed to fetch edit departments', error);
          setEditDepartmentsList([]);
        }
      } else {
        setEditDepartmentsList([]);
      }
    };

    if (editUser.teamId) {
      fetchEditDepartments();
    } else {
      setEditDepartmentsList([]);
    }
  }, [editUser.teamId]);

  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.team.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  // Custom role order: admin > team-leader > dept-head > member
  const getRoleOrder = (role: string): number => {
    switch (role) {
      case 'admin': return 1;
      case 'team-leader': return 2;
      case 'dept-head': return 3;
      case 'member': return 4;
      default: return 5;
    }
  };

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

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

      // Handle string comparisons
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
  }, [filteredUsers, sortField, sortDirection]);

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

  const handleSelectUser = (userId: number) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter((id: number) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    setSelectedUsers(
      selectedUsers.length === sortedUsers.length ? [] : sortedUsers.map((user: User) => user.id)
    );
  };

  const handleDeleteSelected = async () => {
    if (confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)) {
      for (const userId of selectedUsers) {
        await api.users.delete(userId);
      }
      fetchData();
      setSelectedUsers([]);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await api.users.delete(userId);
        if (response.success) {
          fetchData();
          setSelectedUsers(prev => prev.filter((id: number) => id !== userId));
        } else {
          alert(response.message || 'Failed to delete user');
        }
      } catch (error) {
        alert('Failed to delete user');
      }
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditUser({
      name: user.name,
      username: user.username,
      password: '', // Don't pre-fill password
      team: user.team,
      teamId: user.teamId,
      departmentId: user.departmentId,
      role: user.role,
      email: user.email,
      bacMatricule: user.bacMatricule ?? '',
      bacYear: user.bacYear ? String(user.bacYear) : ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    // basic bac matricule validation: must be empty or exactly 8 digits
    const matricule = editUser.bacMatricule?.trim();
    if (matricule && !/^\d{8}$/.test(matricule)) {
      alert('Bac matricule must be exactly 8 digits.');
      return;
    }

    // bac year validation (optional): should be a reasonable 4-digit year if provided
    const yearStr = editUser.bacYear?.trim();
    if (yearStr && !/^\d{4}$/.test(yearStr)) {
      alert('Bac year must be a 4-digit year (e.g. 2018).');
      return;
    }

    try {
      const updateData: any = {
        name: editUser.name,
        email: editUser.email,
        role: editUser.role,
        team_id: editUser.teamId,
        department_id: (editUser.role === 'team-leader' || editUser.role === 'admin' || !editUser.departmentId) ? null : editUser.departmentId
      };

      // Only include password if it's been changed
      if (editUser.password && editUser.password.trim() !== '') {
        updateData.password = editUser.password;
      }

      // Include bac fields if present (allow clearing by sending null)
      if (matricule !== undefined) {
        updateData.bac_matricule = matricule === '' ? null : matricule;
      }
      if (yearStr !== undefined) {
        updateData.bac_year = yearStr === '' ? null : Number(yearStr);
      }

      const response = await api.users.update(selectedUser.id, updateData);

      if (response.success) {
        setIsEditDialogOpen(false);
        setSelectedUser(null);
        fetchData();
      } else {
        alert(response.message || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user');
    }
  };

  const handleAddUser = async () => {
    if (newUser.name && newUser.username && newUser.password && newUser.email && newUser.team) {
      try {
        const selectedTeam = teamsList.find(t => t.name === newUser.team);
        const response = await api.users.create({
          name: newUser.name,
          username: newUser.username,
          password: newUser.password,
          email: newUser.email,
          role: newUser.role,
          team_id: selectedTeam ? selectedTeam.id : undefined,
          department_id: newUser.departmentId || undefined,
          join_date: newUser.joinDate || undefined, // Include join date if provided
          bac_matricule: newUser.bacMatricule || undefined,
          bac_year: newUser.bacYear || undefined
        });

        if (response.success) {
          fetchData();
          fetchData();
          setNewUser({ name: '', username: '', password: '', team: '', role: 'member', email: '', departmentId: 0, joinDate: '', bacMatricule: '', bacYear: '' });
          setIsAddDialogOpen(false);
          setIsAddDialogOpen(false);
        } else {
          alert(response.message || 'Failed to create user');
        }
      } catch (error) {
        alert('Failed to create user');
      }
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word.charAt(0).toUpperCase()).join('').slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'text-yellow-600 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
      case 'team-leader':
        return 'text-purple-700 border-purple-300 bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800';
      case 'dept-head':
        return 'text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
      case 'member':
        return 'text-green-600 border-green-200 bg-green-50 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
      default:
        return 'text-gray-600 border-gray-200 bg-gray-50 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Users Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage all platform users, their roles, and team assignments
          </p>
        </div>
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          {selectedUsers.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
              className="flex items-center space-x-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Selected ({selectedUsers.length})</span>
            </Button>
          )}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2 bg-gradient-to-br from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white border-0">
                <Plus className="h-4 w-4" />
                <span>Add New User</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Create a new user account and assign them to a team
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* ... same Add dialog fields as before (no bac fields) ... */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="user-name" className="text-right">Full Name</Label>
                  <Input
                    id="user-name"
                    value={newUser.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                    className="col-span-3"
                    placeholder="Enter full name"
                  />
                </div>
                {/* BAC Fields for Add User */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="bacYear" className="text-right">Bac Year</Label>
                  <Input
                    id="bacYear"
                    value={newUser.bacYear}
                    onChange={(e) => setNewUser(prev => ({ ...prev, bacYear: e.target.value }))}
                    className="col-span-3"
                    placeholder="e.g. 2020"
                    maxLength={4}
                    inputMode="numeric"
                    pattern="\d{4}"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="bacMatricule" className="text-right">Bac Matricule</Label>
                  <Input
                    id="bacMatricule"
                    value={newUser.bacMatricule}
                    onChange={(e) => setNewUser(prev => ({ ...prev, bacMatricule: e.target.value }))}
                    className="col-span-3"
                    placeholder="8 digits"
                    maxLength={8}
                    inputMode="numeric"
                    pattern="\d{8}"
                  />
                </div>
                {/* username, password, email, team, department, joinDate fields unchanged */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="username" className="text-right">Username</Label>
                  <Input
                    id="username"
                    value={newUser.username}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                    className="col-span-3"
                    placeholder="Enter username"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password" className="text-right">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                    className="col-span-3"
                    placeholder="Enter password"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    className="col-span-3"
                    placeholder="Enter email address"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="team" className="text-right">Team</Label>
                  <Select onValueChange={(value) => setNewUser(prev => ({ ...prev, team: value }))}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamsList.map(team => (
                        <SelectItem key={team.id} value={team.name}>{team.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="department" className="text-right">Department</Label>
                  <Select onValueChange={(value) => setNewUser(prev => ({ ...prev, departmentId: parseInt(value) }))} disabled={!newUser.team || departmentsList.length === 0}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder={!newUser.team ? "Select a team first" : departmentsList.length === 0 ? "No departments found" : "Select department (Optional)"} />
                    </SelectTrigger>
                    <SelectContent>
                      {departmentsList.map(dept => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="joinDate" className="text-right">Join Date</Label>
                  <Input
                    id="joinDate"
                    type="date"
                    value={newUser.joinDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUser(prev => ({ ...prev, joinDate: e.target.value }))}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddUser} className="bg-gradient-to-br from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white border-0">
                  Create User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-brand-600" />
                <span className="text-lg font-semibold">All Users ({sortedUsers.length})</span>
              </CardTitle>
              <CardDescription className="mt-2 text-sm text-muted-foreground">
                Manage user accounts, roles, and team assignments
              </CardDescription>
            </div>
            <div className="flex items-center space-x-4 w-full md:w-auto">
              <div className="relative w-full md:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full md:w-64"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-2 mt-4">
            <Label htmlFor="sort-users" className="text-sm text-muted-foreground">Sort by:</Label>
            <Select value={`${sortField}-${sortDirection}`} onValueChange={(value: string) => {
              const [field, direction] = value.split('-') as [SortField, SortDirection];
              setSortField(field);
              setSortDirection(direction);
            }}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name A-Z</SelectItem>
                <SelectItem value="name-desc">Name Z-A</SelectItem>
                <SelectItem value="username-asc">Username A-Z</SelectItem>
                <SelectItem value="username-desc">Username Z-A</SelectItem>
                <SelectItem value="team-asc">Team A-Z</SelectItem>
                <SelectItem value="team-desc">Team Z-A</SelectItem>
                <SelectItem value="role-asc">Role (Leader → Member)</SelectItem>
                <SelectItem value="role-desc">Role (Member → Leader)</SelectItem>
                <SelectItem value="email-asc">Email A-Z</SelectItem>
                <SelectItem value="email-desc">Email Z-A</SelectItem>
                <SelectItem value="joinDate-desc">Newest</SelectItem>
                <SelectItem value="joinDate-asc">Oldest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedUsers.length === sortedUsers.length && sortedUsers.length > 0}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all users"
                  />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Name</span>
                    {getSortIcon('name')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('username')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Username</span>
                    {getSortIcon('username')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('team')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Team</span>
                    {getSortIcon('team')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('role')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Role</span>
                    {getSortIcon('role')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('email')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Email</span>
                    {getSortIcon('email')}
                  </div>
                </TableHead>

                {/* NEW: Bac column (only shown here on admin users page) */}
                <TableHead>Bac</TableHead>

                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('joinDate')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Join Date</span>
                    {getSortIcon('joinDate')}
                  </div>
                </TableHead>
                <TableHead className="w-12">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={() => handleSelectUser(user.id)}
                      aria-label={`Select ${user.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="bg-gradient-to-br from-brand-500 to-purple-600 text-white text-xs">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-foreground">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded">{user.username}</code>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span>{user.team}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getRoleColor(user.role)}>
                      {user.role.replace('-', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{user.email}</span>
                    </div>
                  </TableCell>

                  {/* NEW: show bac matricule + year (if present) */}
                  <TableCell>
                    {user.bacMatricule ? (
                      <div className="text-sm">
                        <div className="font-medium">{user.bacMatricule}</div>
                        {user.bacYear && <div className="text-xs text-muted-foreground">({user.bacYear})</div>}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground italic">—</div>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{user.joinDate}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {sortedUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                    No users found matching your search criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information. Leave password blank to keep current password.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">Name</Label>
              <Input
                id="edit-name"
                value={editUser.name}
                onChange={(e) => setEditUser(prev => ({ ...prev, name: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editUser.email}
                onChange={(e) => setEditUser(prev => ({ ...prev, email: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-password" className="text-right">New Password</Label>
              <Input
                id="edit-password"
                type="password"
                value={editUser.password}
                onChange={(e) => setEditUser(prev => ({ ...prev, password: e.target.value }))}
                className="col-span-3"
                placeholder="Leave blank to keep current"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-team" className="text-right">Team</Label>
              <Select
                value={editUser.teamId.toString()}
                onValueChange={(value) => {
                  const team = teamsList.find(t => t.id === parseInt(value));
                  setEditUser(prev => ({
                    ...prev,
                    teamId: parseInt(value),
                    team: team?.name || '',
                    departmentId: 0 // Reset department when team changes
                  }));
                }}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {teamsList.map(team => (
                    <SelectItem key={team.id} value={team.id.toString()}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-department" className="text-right">Department</Label>
              <Select
                value={editUser.departmentId ? editUser.departmentId.toString() : ""}
                onValueChange={(value) => setEditUser(prev => ({ ...prev, departmentId: parseInt(value) }))}
                disabled={!editUser.teamId || editDepartmentsList.length === 0 || editUser.role === 'team-leader' || editUser.role === 'admin'}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={
                    (editUser.role === 'team-leader' || editUser.role === 'admin')
                      ? "Not applicable for this role"
                      : !editUser.teamId
                        ? "Select a team first"
                        : editDepartmentsList.length === 0
                          ? "No departments found"
                          : "Select department"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {editDepartmentsList.map(dept => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* BAC Fields for Edit User */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-bacMatricule" className="text-right">Bac Matricule</Label>
              <Input
                id="edit-bacMatricule"
                value={editUser.bacMatricule}
                onChange={(e) => setEditUser(prev => ({ ...prev, bacMatricule: e.target.value }))}
                className="col-span-3"
                placeholder="8 digits (optional)"
                maxLength={8}
                inputMode="numeric"
                pattern="\d{8}"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-bacYear" className="text-right">Bac Year</Label>
              <Input
                id="edit-bacYear"
                value={editUser.bacYear}
                onChange={(e) => setEditUser(prev => ({ ...prev, bacYear: e.target.value }))}
                className="col-span-3"
                placeholder="e.g. 2020 (optional)"
                maxLength={4}
                inputMode="numeric"
                pattern="\d{4}"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser} className="bg-gradient-to-br from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white border-0">
              Update User
            </Button>
          </DialogFooter>
        </DialogContent >
      </Dialog >
    </div >
  );
}
