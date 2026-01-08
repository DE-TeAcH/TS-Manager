import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Building, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

interface LoginPageProps {
  onLogin: (userRole: 'admin' | 'team-leader' | 'dept-head' | 'member', userData: any) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Mock user accounts removed

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await api.auth.login(username, password);

      if (response.success && response.data) {
        onLogin(response.data.role, {
          id: response.data.id,
          username: response.data.username,
          name: response.data.name,
          email: response.data.email,
          role: response.data.role,
          teamName: response.data.team_name || 'University Platform',
          teamId: response.data.team_id,
          departmentName: response.data.department_name,
          departmentId: response.data.department_id,
          avatar: response.data.avatar
        });
      } else {
        setError(response.message || 'Invalid username or password.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl mb-4">
            <Building className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl">TS Manager</h1>
          <p className="text-muted-foreground mt-1">By TE4CH</p>
        </div>

        <Card className="shadow-lg" style={{ padding: '24px' }}>
          <CardHeader className="text-center p-0 mb-6">
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl mb-4"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-muted-foreground text-center mb-3">Default Admin:</p>
              <div className="p-3 bg-muted rounded-lg text-center">
                <p>adminUni / AdminUni</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}