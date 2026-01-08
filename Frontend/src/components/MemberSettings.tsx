import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { User, Mail, Lock, Trash2, AlertTriangle, UserCog } from 'lucide-react';
import { api } from '../services/api';

interface MemberSettingsProps {
    currentUser: {
        departmentId?: number;
        teamId: number;
        id: number;
        name: string;
        username: string;
        email: string;
        role: 'admin' | 'team-leader' | 'dept-head' | 'member';
        teamName: string;
        avatar?: string;
    };
    onLogout: () => void;
    onProfileUpdate: (updatedUser: Partial<{ name: string; username: string; email: string; }>) => void;
}

export function MemberSettings({ currentUser, onLogout, onProfileUpdate }: MemberSettingsProps) {
    const [profileData, setProfileData] = useState({
        name: currentUser.name,
        username: currentUser.username,
        email: currentUser.email,
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    const [successorName, setSuccessorName] = useState('');
    const [successors, setSuccessors] = useState<any[]>([]);

    React.useEffect(() => {
        const fetchSuccessors = async () => {
            if (currentUser.role === 'team-leader' || currentUser.role === 'dept-head') {
                try {
                    // Fetch users based on role context
                    // For Team Leaders: team members
                    // For Dept Heads: dept members
                    const response = await api.users.get();
                    if (response.success && Array.isArray(response.data)) {
                        let potential = response.data.filter((u: any) => u.id !== currentUser.id);

                        if (currentUser.role === 'team-leader') {
                            potential = potential.filter((u: any) => u.team_id === currentUser.teamId);
                        } else if (currentUser.role === 'dept-head') {
                            potential = potential.filter((u: any) => u.department_id === currentUser.departmentId);
                        }

                        setSuccessors(potential);
                    }
                } catch (error) {
                    console.error('Failed to fetch successors', error);
                }
            }
        };

        fetchSuccessors();
    }, [currentUser]);

    const handleUpdateProfile = async () => {
        try {
            const response = await api.users.update(currentUser.id, {
                name: profileData.name,
                username: profileData.username,
                email: profileData.email,
            });

            if (response.success) {
                onProfileUpdate(profileData);
                setIsSuccessDialogOpen(true);
                setTimeout(() => setIsSuccessDialogOpen(false), 2000);
            } else {
                alert(response.message || 'Failed to update profile.');
            }
        } catch (error) {
            alert('An error occurred while updating profile.');
        }
    };

    const handleChangePassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert('New passwords do not match!');
            return;
        }
        if (passwordData.newPassword.length < 6) {
            alert('Password must be at least 6 characters long!');
            return;
        }

        try {
            const response = await api.users.update(currentUser.id, {
                password: passwordData.newPassword
            });

            if (response.success) {
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setIsSuccessDialogOpen(true);
                setTimeout(() => setIsSuccessDialogOpen(false), 2000);
            } else {
                alert(response.message || 'Failed to update password.');
            }
        } catch (error) {
            alert('An error occurred while changing password.');
        }
    };

    const handleDeleteAccount = async () => {
        // Validation for team leader/dept head
        if (currentUser.role === 'team-leader' || currentUser.role === 'dept-head') {
            if (!successorName) {
                alert('You must assign a successor before deleting your account.');
                return;
            }

            const successor = successors.find(s => s.name === successorName);
            if (!successor) return;

            // Add basic check to prevent Dept Head -> Team Leader if not desired, though business logic usually allows
            if (currentUser.role === 'team-leader' && successor.role === 'dept-head') {
                alert('The selected successor is a Department Head. Please select a regular member or handle demotion first.');
                return;
            }

            // Promote Successor
            try {
                const updateRes = await api.users.update(successor.id, {
                    role: currentUser.role,
                    // If team leader, ensure team_id is set (should be already)
                    // If dept head, ensure department_id is set
                });
                if (!updateRes.success) {
                    alert('Failed to promote successor. Account deletion aborted.');
                    return;
                }
            } catch (e) {
                alert('Error promoting successor.');
                return;
            }
        }

        // Validate confirmation text
        if (deleteConfirmation !== 'DELETE') {
            alert('Please type DELETE to confirm account deletion.');
            return;
        }

        try {
            const response = await api.users.delete(currentUser.id);
            if (response.success) {
                alert(`Account deleted successfully. ${successorName ? `${successorName} has been assigned as your successor.` : ''}`);
                setIsDeleteDialogOpen(false);
                onLogout();
            } else {
                alert(response.message || 'Failed to delete account.');
            }
        } catch (error) {
            alert('An error occurred while deleting account.');
        }
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(word => word.charAt(0).toUpperCase()).join('').slice(0, 2);
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'team-leader':
                return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'dept-head':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'admin':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            default:
                return 'bg-green-100 text-green-700 border-green-200';
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your account settings and preferences
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Profile Overview Card */}
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <User className="h-5 w-5 text-brand-600" />
                            <span>Profile</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col items-center space-y-4">
                            <Avatar className="h-24 w-24">
                                <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                                <AvatarFallback className="bg-gradient-to-br from-brand-500 to-purple-600 text-white text-2xl">
                                    {getInitials(currentUser.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="text-center">
                                <h3 className="font-semibold text-foreground">{currentUser.name}</h3>
                                <p className="text-sm text-muted-foreground">{currentUser.teamName}</p>
                                <div className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(currentUser.role)}`}>
                                    {currentUser.role.replace('-', ' ').toUpperCase()}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Profile Information */}
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <UserCog className="h-5 w-5 text-brand-600" />
                            <span>Profile Information</span>
                        </CardTitle>
                        <CardDescription>
                            Update your personal information
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    value={profileData.name}
                                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Enter your full name"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    value={profileData.username}
                                    onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                                    placeholder="Enter your username"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={profileData.email}
                                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="Enter your email"
                                />
                            </div>
                        </div>
                        <Button onClick={handleUpdateProfile} className="w-full bg-gradient-to-br from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white border-0">
                            Save Changes
                        </Button>
                    </CardContent>
                </Card>

                {/* Change Password */}
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Lock className="h-5 w-5 text-brand-600" />
                            <span>Change Password</span>
                        </CardTitle>
                        <CardDescription>
                            Update your password to keep your account secure
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="current-password">Current Password</Label>
                                <Input
                                    id="current-password"
                                    type="password"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                    placeholder="Enter current password"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input
                                    id="new-password"
                                    type="password"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                                    placeholder="Enter new password"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="confirm-password">Confirm New Password</Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                    placeholder="Confirm new password"
                                />
                            </div>
                            <Button onClick={handleChangePassword} variant="outline">
                                Update Password
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Danger Zone */}
            {currentUser.role !== 'admin' && (
                <Card className="border-red-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            <span>Danger Zone</span>
                        </CardTitle>
                        <CardDescription>
                            Irreversible actions that affect your account
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-900/30 rounded-lg bg-red-50 dark:bg-red-900/10">
                            <div>
                                <h4 className="font-medium text-red-900 dark:text-red-200">Delete Account</h4>
                                <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                                    Permanently delete your account and all associated data
                                </p>
                            </div>
                            <Button
                                variant="destructive"
                                onClick={() => setIsDeleteDialogOpen(true)}
                                className="flex items-center space-x-2"
                            >
                                <Trash2 className="h-4 w-4" />
                                <span>Delete Account</span>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Delete Account Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center space-x-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            <span>Delete Account</span>
                        </DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete your account and remove all your data.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {(currentUser.role === 'team-leader' || currentUser.role === 'dept-head') && (
                            <div className="space-y-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                <div className="flex items-start space-x-2">
                                    <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium text-orange-900">
                                            {currentUser.role === 'team-leader' ? 'Team Leader' : 'Department Head'} Role Assignment Required
                                        </h4>
                                        <p className="text-sm text-orange-700 mt-1">
                                            {currentUser.role === 'team-leader'
                                                ? 'You must assign a new Team Leader before deleting your account. Note: If you select a Department Head, they must be demoted to a regular member first.'
                                                : 'You must assign a new Department Head for your department before deleting your account.'}
                                        </p>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="successor">Select Successor</Label>
                                    <Select value={successorName} onValueChange={setSuccessorName}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choose a successor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {successors.map(successor => (
                                                <SelectItem key={successor.id} value={successor.name}>
                                                    {successor.name} - {successor.role.replace('-', ' ')} ({successor.department_name || successor.team_name || 'No Dept'})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="delete-confirmation">
                                Type <span className="font-mono font-bold">DELETE</span> to confirm
                            </Label>
                            <Input
                                id="delete-confirmation"
                                value={deleteConfirmation}
                                onChange={(e) => setDeleteConfirmation(e.target.value)}
                                placeholder="Type DELETE"
                                className="font-mono"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setIsDeleteDialogOpen(false);
                            setDeleteConfirmation('');
                            setSuccessorName('');
                        }}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteAccount}
                            disabled={deleteConfirmation !== 'DELETE'}
                        >
                            Delete My Account
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Success Dialog */}
            <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
                <DialogContent className="max-w-[350px] rounded-xl flex flex-col items-center text-center">
                    <div className="rounded-full bg-green-100 p-3 mb-2">
                        <UserCog className="h-6 w-6 text-green-600" />
                    </div>
                    <DialogHeader className="text-center sm:text-center">
                        <DialogTitle className="text-green-600 text-xl">Success!</DialogTitle>
                        <DialogDescription className="text-center pt-2">
                            Your changes have been saved successfully.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="sm:justify-center w-full mt-4">
                        <Button onClick={() => setIsSuccessDialogOpen(false)} className="w-full bg-green-600 hover:bg-green-700">
                            OK
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
