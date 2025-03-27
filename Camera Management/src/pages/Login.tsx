import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { appConfig } from '@/config/app-config';
import { useLoginMutation } from '@/hooks/useAuthMutation';

const Login = () => {
  const { isAuthenticated, clearError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });
  const authConfig = appConfig.auth.login;
  
  const loginMutation = useLoginMutation();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const validateForm = () => {
    let valid = true;
    const newErrors = { email: '', password: '' };

    if (!email) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
      valid = false;
    }

    if (!password) {
      newErrors.password = 'Password is required';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        await loginMutation.mutateAsync({ email, password });
        // Navigation will be handled by the useEffect when isAuthenticated changes
      } catch (error) {
        // Error is handled by the mutation
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">{authConfig.title}</h1>
          <p className="text-muted-foreground mt-2">{authConfig.subtitle}</p>
        </div>
        
        <Card className="border-border bg-card/50 backdrop-blur-sm animate-fade-in">
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loginMutation.isPending}
                  />
                </div>
                {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={`pl-10 ${errors.password ? 'border-destructive' : ''}`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loginMutation.isPending}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loginMutation.isPending}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.password && <p className="text-destructive text-sm">{errors.password}</p>}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="remember" 
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    disabled={loginMutation.isPending}
                  />
                  <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                    Remember me
                  </Label>
                </div>
                
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              
              {loginMutation.error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                  {loginMutation.error.message}
                </div>
              )}
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? 'Logging in...' : 'Sign in'}
              </Button>
              
              <p className="text-sm text-center text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;
