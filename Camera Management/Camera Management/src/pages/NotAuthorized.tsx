
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

const NotAuthorized = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-destructive/10 p-4 rounded-full">
            <ShieldAlert className="h-16 w-16 text-destructive" />
          </div>
        </div>
        
        <h1 className="text-4xl font-bold mb-4">Access Denied</h1>
        
        <p className="text-muted-foreground mb-8">
          Sorry, you don't have permission to access this page. 
          Please contact your administrator if you believe this is an error.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
          
          <Button variant="outline" asChild>
            <Link to="/login">Switch Account</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotAuthorized;
