import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Building,
  Users,
  Search,
  TrendingUp,
  User,
  RefreshCw,
  Plus,
  Filter,
  Trash2
} from 'lucide-react';
import { api } from '../services/api';

interface TeamLeaderDepartmentsProps {
  currentUser: any;
}

export function TeamLeaderDepartments({ currentUser }: TeamLeaderDepartmentsProps) {
  const [departments, setDepartments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newDepartment, setNewDepartment] = useState({
    name: '',
    dept_head_id: ''
  });

  // Details Dialog State
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<any>(null);
  const [editingDeptName, setEditingDeptName] = useState('');

  const [filter, setFilter] = useState('all');

  const fetchData = async () => {
    if (!currentUser?.teamId) return;

    setIsLoading(true);
    try {
      const [deptsRes, usersRes] = await Promise.all([
        api.departments.get({ team_id: currentUser.teamId }),
        api.users.get({ team_id: currentUser.teamId })
      ]);

      if (deptsRes.success && Array.isArray(deptsRes.data)) {
        setDepartments(deptsRes.data);
      }

      if (usersRes.success && Array.isArray(usersRes.data)) {
        setUsers(usersRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch departments', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const filteredDepartments = useMemo(() => {
    let result = departments.filter(dept => {
      const matchesSearch = dept.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter =
        filter === 'all' || filter === 'a-z' || filter === 'z-a' ? true :
          filter === 'with-head' ? (dept.dept_head_id && dept.dept_head_id !== 'none') :
            filter === 'no-head' ? (!dept.dept_head_id || dept.dept_head_id === 'none') : true;

      return matchesSearch && matchesFilter;
    });

    if (filter === 'a-z') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (filter === 'z-a') {
      result.sort((a, b) => b.name.localeCompare(a.name));
    } else if (filter === 'all') {
      // Sort by ID descending (New to Old)
      result.sort((a, b) => b.id - a.id);
    }

    return result;
  }, [departments, searchQuery, filter]);

  const getDepartmentMemberCount = (deptId: number) => {
    return users.filter(u => u.department_id === deptId).length;
  };

  const getStats = () => {
    const totalMembers = users.length;
    const avgMembersPerDept = departments.length > 0 ? Math.round(totalMembers / departments.length) : 0;

    return {
      totalDepartments: departments.length,
      activeDepartments: departments.length,
      totalMembers,
      avgMembersPerDept
    };
  };

  const stats = getStats();

  const handleAddDepartment = async () => {
    if (!newDepartment.name.trim()) {
      alert('Please enter a department name');
      return;
    }

    try {
      const deptData: any = {
        name: newDepartment.name.trim(),
        team_id: currentUser.teamId
      };

      if (newDepartment.dept_head_id && newDepartment.dept_head_id !== '' && newDepartment.dept_head_id !== 'none') {
        const parsedId = parseInt(newDepartment.dept_head_id);
        if (!isNaN(parsedId) && parsedId > 0) {
          deptData.dept_head_id = parsedId;
        }
      }

      const response = await api.departments.create(deptData);

      if (response.success) {
        setNewDepartment({ name: '', dept_head_id: '' });
        setIsAddDialogOpen(false);
        fetchData();
      } else {
        alert(response.message || 'Failed to create department');
      }
    } catch (error) {
      console.error('Error creating department:', error);
      alert('Failed to create department');
    }
  };

  const handleDeleteDepartment = async (deptId: number, deptName: string) => {
    if (!window.confirm(`Are you sure you want to delete the department "${deptName}"? This will remove all associated tasks and unlink members.`)) {
      return;
    }

    try {
      const response = await api.departments.delete(deptId);
      if (response.success) {
        fetchData(); // Refresh list
      } else {
        alert(response.message || 'Failed to delete department');
      }
    } catch (error) {
      console.error('Error deleting department:', error);
      alert('Failed to delete department');
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map(word => word.charAt(0).toUpperCase()).join('').slice(0, 2);
  };

  const handleOpenDetails = (dept: any) => {
    setSelectedDepartment(dept);
    setEditingDeptName(dept.name);
    setIsDetailsDialogOpen(true);
  };

  const handleUpdateDepartment = async () => {
    if (!selectedDepartment || !editingDeptName.trim()) return;

    try {
      const response = await api.departments.update(selectedDepartment.id, {
        name: editingDeptName.trim()
      });

      if (response.success) {
        setIsDetailsDialogOpen(false);
        fetchData();
      } else {
        alert(response.message || 'Failed to update department');
      }
    } catch (error) {
      console.error('Error updating department:', error);
      alert('Failed to update department');
    }
  };

  const getDepartmentMembers = (deptId: number) => {
    return users.filter(u => u.department_id === deptId);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Departments</h1>
          <p className="text-muted-foreground mt-2">
            Manage your team's departments and department heads
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[160px]">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder="Filter" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="with-head">With Head</SelectItem>
              <SelectItem value="no-head">Without Head</SelectItem>
              <SelectItem value="a-z">Name (A-Z)</SelectItem>
              <SelectItem value="z-a">Name (Z-A)</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2 bg-gradient-to-br from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white border-0">
                <Plus className="h-4 w-4" />
                <span>Add Department</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Department</DialogTitle>
                <DialogDescription>
                  Create a new department and optionally assign a department head
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Department Name</Label>
                  <Input
                    value={newDepartment.name}
                    onChange={(e) => setNewDepartment(prev => ({ ...prev, name: e.target.value }))}
                    className="col-span-3"
                    placeholder="Enter department name"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Department Head</Label>
                  <Select
                    value={newDepartment.dept_head_id}
                    onValueChange={(value) => setNewDepartment(prev => ({ ...prev, dept_head_id: value }))}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select department head (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {users
                        .filter((u: any) => u.role === 'member')
                        .map((user: any) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddDepartment} className="bg-gradient-to-br from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white border-0">
                  Create Department
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Departments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-foreground">{stats.totalDepartments}</div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>{stats.activeDepartments} active</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-foreground">{stats.totalMembers}</div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
              <Users className="h-3 w-3" />
              <span>across all departments</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Members/Dept</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-foreground">{stats.avgMembersPerDept}</div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
              <User className="h-3 w-3" />
              <span>per department</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Departments List */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Department Management</CardTitle>
              <CardDescription>
                View departments and their heads
              </CardDescription>
            </div>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search departments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDepartments.length > 0 ? filteredDepartments.map((department) => (
              <Card key={department.id} className="border border-gray-200 hover:shadow-md transition-shadow relative group">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{department.name}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
                          active
                        </Badge>
                        <Badge variant="outline" className="text-blue-600 dark:text-brand-600 border-blue-200 dark:border-brand-600 bg-blue-50 dark:bg-brand-600/20">
                          {getDepartmentMemberCount(department.id)} members
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-red-600 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDepartment(department.id, department.name);
                      }}
                      title="Delete Department"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gradient-to-br from-brand-500 to-brand-600 text-white text-xs">
                          {getInitials(department.dept_head_name || 'No Head')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {department.dept_head_name || 'No Head Assigned'}
                        </p>
                        <p className="text-xs text-muted-foreground">Department Head</p>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => handleOpenDetails(department)}
                  >
                    Details
                  </Button>
                </CardContent>
              </Card>
            )) : (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                <Building className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>No departments found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Department Details</DialogTitle>
            <DialogDescription>
              View and edit department details
            </DialogDescription>
          </DialogHeader>

          {selectedDepartment && (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-dept-name">Department Name</Label>
                <div className="flex space-x-2">
                  <Input
                    id="edit-dept-name"
                    value={editingDeptName}
                    onChange={(e) => setEditingDeptName(e.target.value)}
                  />
                  <Button onClick={handleUpdateDepartment}>Save Name</Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Department Members ({getDepartmentMembers(selectedDepartment.id).length})</Label>
                <div className="border rounded-md max-h-[300px] overflow-y-auto">
                  {getDepartmentMembers(selectedDepartment.id).length > 0 ? (
                    <div className="divide-y">
                      {getDepartmentMembers(selectedDepartment.id).map((member: any) => (
                        <div key={member.id} className="flex items-center justify-between p-3 hover:bg-muted/50">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-gradient-to-br from-brand-500 to-brand-600 text-white text-xs">
                                {getInitials(member.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium text-foreground">{member.name}</p>
                              <p className="text-xs text-muted-foreground">{member.email}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className={
                            member.role === 'dept-head'
                              ? 'text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
                              : 'text-green-600 dark:text-green-400 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                          }>
                            {member.role === 'dept-head' ? 'Head' : 'Member'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      No members in this department
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
