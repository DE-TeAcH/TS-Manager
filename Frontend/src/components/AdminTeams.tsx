// AdminTeams.tsx
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import {
  Users,
  Building,
  Calendar,
  Mail,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  User,
  Briefcase,
  MapPin,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { toast } from 'sonner';

interface TeamMember {
  id: number;
  name: string;
  role: 'leader' | 'dept-head' | 'member';
  department: string;
  email: string;
  joinDate: string;
}

interface Team {
  id: number;
  name: string;
  leader: string;
  email: string;
  totalMembers: number;
  joinDate: string;
  events: number;
  category: string;
  description: string;
  members: TeamMember[];
}

type SortField = 'name' | 'leader' | 'totalMembers' | 'joinDate' | 'events' | 'category';
type SortDirection = 'asc' | 'desc';

export function AdminTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTeams = async () => {
    setIsLoading(true);
    try {
      const response = await api.teams.get();
      if (response.success && Array.isArray(response.data)) {
        const mappedTeams = (response.data as any[]).map((t: any) => ({
          id: t.id,
          name: t.name,
          leader: t.leader_name || 'No Leader',
          email: t.leader_email || 'N/A',
          totalMembers: parseInt(t.total_members) || 0,
          joinDate: t.join_date || t.created_at || '',
          events: parseInt(t.total_events) || 0,
          category: t.category || 'General',
          description: t.description,
          members: []
        }));
        setTeams(mappedTeams);
      }
    } catch (error) {
      console.error('Failed to fetch teams', error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchTeams();
  }, []);

  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  const [expandedTeams, setExpandedTeams] = useState<number[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // NEW: include bac fields for leader when creating a team
  const [newTeam, setNewTeam] = useState({
    name: '',
    leader: '',
    email: '',
    username: '',
    password: '',
    category: '',
    description: '',
    creationDate: '', // Format: YYYY-MM-DD
    bacMatricule: '',
    bacYear: ''
  });

  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

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
  }, [teams, sortField, sortDirection]);

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

  const handleSelectTeam = (teamId: number) => {
    setSelectedTeams(prev =>
      prev.includes(teamId)
        ? prev.filter((id: number) => id !== teamId)
        : [...prev, teamId]
    );
  };

  const handleSelectAll = () => {
    setSelectedTeams(
      selectedTeams.length === teams.length ? [] : teams.map((team: Team) => team.id)
    );
  };

  const toggleTeamExpansion = async (teamId: number) => {
    // Check if team is already expanded
    const isExpanded = expandedTeams.includes(teamId);

    if (isExpanded) {
      // Collapse - just remove from expanded list
      setExpandedTeams(prev => prev.filter((id: number) => id !== teamId));
    } else {
      // Expand - fetch members if not already loaded
      const team = teams.find(t => t.id === teamId);

      if (team && team.members.length === 0) {
        try {
          // Fetch members for this specific team
          const response = await api.users.get({ team_id: teamId });

          if (response.success && Array.isArray(response.data)) {
            // Update the team's members
            setTeams(prev => prev.map(t =>
              t.id === teamId
                ? {
                  ...t,
                  members: (response.data as any[]).map((m: any) => ({
                    id: m.id,
                    name: m.name,
                    role: m.role,
                    department: m.department_name || 'N/A',
                    email: m.email,
                    joinDate: m.join_date || ''
                  }))
                }
                : t
            ));
          }
        } catch (error) {
          console.error('Failed to fetch team members', error);
        }
      }

      // Add to expanded list
      setExpandedTeams(prev => [...prev, teamId]);
    }
  };

  const handleDeleteSelected = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedTeams.length} teams? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await api.teams.delete(selectedTeams);
      if (response.success) {
        setTeams((prev: any[]) => prev.filter((team: Team) => !selectedTeams.includes(team.id)));
        setSelectedTeams([]);
        setExpandedTeams(prev => prev.filter((id: number) => !selectedTeams.includes(id)));
      } else {
        toast.error(response.message || 'Failed to delete teams');
      }
    } catch (error) {
      console.error('Error deleting teams:', error);
      toast.error('Failed to delete teams');
    }
  };

  const handleDeleteTeam = async (teamId: number) => {
    if (confirm('Are you sure you want to delete this team? This will delete all associated members, departments, and events.')) {
      try {
        const response = await api.teams.delete(teamId);
        if (response.success) {
          setTeams(prev => prev.filter((team: Team) => team.id !== teamId));
          setSelectedTeams(prev => prev.filter((id: number) => id !== teamId));
          setExpandedTeams(prev => prev.filter((id: number) => id !== teamId));
          toast.success('Team deleted successfully');
        } else {
          toast.error(response.message || 'Failed to delete team');
        }
      } catch (error) {
        console.error('Error deleting team:', error);
        toast.error('Failed to delete team');
      }
    }
  };

  // UPDATED: handleAddTeam includes bac validation + fields
  const handleAddTeam = async () => {
    if (!newTeam.name || !newTeam.leader || !newTeam.email || !newTeam.username || !newTeam.password) {
      toast.error('Please fill the required fields.');
      return;
    }

    // validate matricule if provided
    const matricule = newTeam.bacMatricule?.trim();
    if (matricule && !/^\d{8}$/.test(matricule)) {
      toast.error('Bac matricule must be exactly 8 digits.');
      return;
    }

    // validate year if provided (reasonable range)
    const yearStr = newTeam.bacYear?.trim();
    if (yearStr) {
      if (!/^\d{4}$/.test(yearStr)) {
        toast.error('Bac year must be a 4-digit year (e.g. 2018).');
        return;
      }
      const yearNum = Number(yearStr);
      const currentYear = new Date().getFullYear();
      if (yearNum < 1900 || yearNum > currentYear + 1) {
        toast.error(`Bac year must be between 1900 and ${currentYear + 1}.`);
        return;
      }
    }

    try {
      const payload: any = {
        name: newTeam.name,
        leader_name: newTeam.leader,
        leader_email: newTeam.email,
        leader_username: newTeam.username,
        leader_password: newTeam.password,
        leader_bac_matricule: newTeam.bacMatricule,
        leader_bac_year: newTeam.bacYear,
        category: newTeam.category,
        description: newTeam.description,
        creation_date: newTeam.creationDate || undefined
      };

      const response = await api.teams.create(payload);

      if (response.success) {
        fetchTeams(); // Refresh list
        setNewTeam({
          name: '',
          leader: '',
          email: '',
          username: '',
          password: '',
          category: '',
          description: '',
          creationDate: '',
          bacMatricule: '',
          bacYear: ''
        });
        setIsAddDialogOpen(false);
        toast.success('Team created successfully');
      } else {
        toast.error(response.message || 'Failed to create team');
      }
    } catch (error) {
      toast.error('An error occurred while creating the team');
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word.charAt(0).toUpperCase()).join('').slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'leader':
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
          <h1 className="text-2xl font-semibold text-foreground">Teams Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage all registered teams, members, and their activities
          </p>
        </div>
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <Button variant="outline" size="sm" onClick={fetchTeams} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          {selectedTeams.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
              className="flex items-center space-x-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Selected ({selectedTeams.length})</span>
            </Button>
          )}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2 bg-gradient-to-br from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white border-0">
                <Plus className="h-4 w-4" />
                <span>Add New Team</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Team</DialogTitle>
                <DialogDescription>
                  Create a new team and assign a team leader with login credentials
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="team-name" className="text-right">Team Name</Label>
                  <Input
                    id="team-name"
                    value={newTeam.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTeam(prev => ({ ...prev, name: e.target.value }))}
                    className="col-span-3"
                    placeholder="Enter team name"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="leader-name" className="text-right">Leader Name</Label>
                  <Input
                    id="leader-name"
                    value={newTeam.leader}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTeam(prev => ({ ...prev, leader: e.target.value }))}
                    className="col-span-3"
                    placeholder="Enter leader name"
                  />
                </div>
                {/* NEW: Bac Infos*/}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="leader-bac-year" className="text-right">Leader Bac Year</Label>
                  <Input
                    id="leader-bac-year"
                    value={newTeam.bacYear}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTeam(prev => ({ ...prev, bacYear: e.target.value }))}
                    className="col-span-3"
                    placeholder="e.g. 2020"
                    maxLength={4}
                    inputMode="numeric"
                    pattern="\d{4}"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="leader-bac-matricule" className="text-right">Leader Bac Matricule</Label>
                  <Input
                    id="leader-bac-matricule"
                    value={newTeam.bacMatricule}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTeam(prev => ({ ...prev, bacMatricule: e.target.value }))}
                    className="col-span-3"
                    placeholder="8 digits"
                    maxLength={8}
                    inputMode="numeric"
                    pattern="\d{8}"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="leader-email" className="text-right">Leader Email</Label>
                  <Input
                    id="leader-email"
                    type="email"
                    value={newTeam.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTeam(prev => ({ ...prev, email: e.target.value }))}
                    className="col-span-3"
                    placeholder="Enter leader email"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="username" className="text-right">Username</Label>
                  <Input
                    id="username"
                    value={newTeam.username}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTeam(prev => ({ ...prev, username: e.target.value }))}
                    className="col-span-3"
                    placeholder="Enter username for leader"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password" className="text-right">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newTeam.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTeam(prev => ({ ...prev, password: e.target.value }))}
                    className="col-span-3"
                    placeholder="Enter password for leader"
                  />
                </div>


                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">Category</Label>
                  <Select value={newTeam.category} onValueChange={(value: string) => setNewTeam(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Computer-Science">Computer Science</SelectItem>
                      <SelectItem value="Material-Science">Material Science</SelectItem>
                      <SelectItem value="Mathematics">Mathematics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">Description</Label>
                  <Textarea
                    id="description"
                    value={newTeam.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewTeam(prev => ({ ...prev, description: e.target.value }))}
                    className="col-span-3"
                    placeholder="Enter team description"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="creationDate" className="text-right">Creation Date</Label>
                  <Input
                    id="creationDate"
                    type="date"
                    value={newTeam.creationDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTeam(prev => ({ ...prev, creationDate: e.target.value }))}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddTeam} className="bg-gradient-to-br from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white border-0">
                  Create Team
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
                <Building className="h-5 w-5 text-brand-600" />
                <span className="text-lg font-semibold">All Teams ({teams.length})</span>
              </CardTitle>
              <CardDescription className="mt-2 text-sm text-muted-foreground">
                Click on a team row to view members and manage team details
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2 w-full md:w-auto">
              <Label htmlFor="sort-teams" className="text-sm text-muted-foreground">Sort by:</Label>
              <Select value={`${sortField}-${sortDirection}`} onValueChange={(value: string) => {
                const [field, direction] = value.split('-') as [SortField, SortDirection];
                setSortField(field);
                setSortDirection(direction);
              }}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Name A-Z</SelectItem>
                  <SelectItem value="name-desc">Name Z-A</SelectItem>
                  <SelectItem value="leader-asc">Leader A-Z</SelectItem>
                  <SelectItem value="leader-desc">Leader Z-A</SelectItem>
                  <SelectItem value="totalMembers-desc">Most members</SelectItem>
                  <SelectItem value="totalMembers-asc">Fewest members</SelectItem>
                  <SelectItem value="joinDate-desc">Newest</SelectItem>
                  <SelectItem value="joinDate-asc">Oldest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedTeams.length === teams.length && teams.length > 0}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all teams"
                  />
                </TableHead>
                <TableHead className="w-6" />
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Team</span>
                    {getSortIcon('name')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('leader')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Leader</span>
                    {getSortIcon('leader')}
                  </div>
                </TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Total Members</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('joinDate')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Join Date</span>
                    {getSortIcon('joinDate')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('events')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Events</span>
                    {getSortIcon('events')}
                  </div>
                </TableHead>
                <TableHead className="w-12">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTeams.length > 0 ? sortedTeams.map((team) => (
                <React.Fragment key={team.id}>
                  <TableRow
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => toggleTeamExpansion(team.id)}
                  >
                    <TableCell onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedTeams.includes(team.id)}
                        onCheckedChange={() => handleSelectTeam(team.id)}
                        aria-label={`Select ${team.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      {expandedTeams.includes(team.id) ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                            {getInitials(team.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{team.name}</p>
                          <p className="text-sm text-muted-foreground">{team.category}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{team.leader}</TableCell>
                    <TableCell>{team.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
                        {team.totalMembers}
                      </Badge>
                    </TableCell>
                    <TableCell>{team.joinDate}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                        {team.events}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTeam(team.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>

                  {expandedTeams.includes(team.id) && (
                    <TableRow>
                      <TableCell colSpan={9} className="bg-muted/30 p-0">
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <h4 className="font-medium text-foreground">Team Members ({team.members.length})</h4>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteTeam(team.id)}
                              className="flex items-center space-x-2"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>Delete Team</span>
                            </Button>
                          </div>

                          {team.members.length > 0 ? (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Role</TableHead>
                                  <TableHead>Department</TableHead>
                                  <TableHead>Email</TableHead>
                                  <TableHead>Join Date</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {team.members.map((member) => (
                                  <TableRow key={member.id} className="bg-card">
                                    <TableCell>
                                      <div className="flex items-center space-x-3">
                                        <Avatar className="h-8 w-8">
                                          <AvatarFallback className="bg-gradient-to-br from-brand-500 to-purple-600 text-white text-xs">
                                            {getInitials(member.name)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium text-foreground">{member.name}</span>
                                      </div>
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
                                    <TableCell>{member.joinDate}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                              <p>No members in this team yet</p>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              )) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No teams found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
