import React from 'react';
import StatsCard from '@/components/dashboard/StatsCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CreditCard, DollarSign, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { ResponsiveContainer, AreaChart as RechartsAreaChart, Area, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { appConfig } from '@/config/app-config';

const Dashboard = () => {
  const dashboardConfig = appConfig.dashboard;
  
  // Sample data for charts
  const areaChartData = [
    { name: 'Jan', value: 400 },
    { name: 'Feb', value: 300 },
    { name: 'Mar', value: 600 },
    { name: 'Apr', value: 800 },
    { name: 'May', value: 500 },
    { name: 'Jun', value: 900 },
    { name: 'Jul', value: 1100 },
  ];

  const barChartData = [
    { name: 'Product A', value: 400 },
    { name: 'Product B', value: 600 },
    { name: 'Product C', value: 500 },
    { name: 'Product D', value: 700 },
    { name: 'Product E', value: 400 },
  ];

  return (
    <div className="space-y-6 py-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-1">{dashboardConfig.title}</h1>
        <p className="text-muted-foreground">{dashboardConfig.welcomeMessage}</p>
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Customers"
          value="3,849"
          icon={<Users className="h-5 w-5" />}
          description="Since last month"
          change={12}
          variant="default"
        />
        
        <StatsCard
          title="Total Revenue"
          value="$45,385"
          icon={<DollarSign className="h-5 w-5" />}
          description="Since last month"
          change={8}
          variant="success"
        />
        
        <StatsCard
          title="Active Subscriptions"
          value="1,257"
          icon={<CreditCard className="h-5 w-5" />}
          description="Since last month"
          change={-3}
          variant="warning"
        />
        
        <StatsCard
          title="Bounce Rate"
          value="24.8%"
          icon={<Activity className="h-5 w-5" />}
          description="Since last month"
          change={-8}
          variant="danger"
        />
      </div>
      
      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Revenue Overview
              <TrendingUp className="h-5 w-5 text-green-500" />
            </CardTitle>
            <CardDescription>Monthly revenue for the current year</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsAreaChart
                  data={areaChartData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                </RechartsAreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Top Products
              <TrendingDown className="h-5 w-5 text-red-500" />
            </CardTitle>
            <CardDescription>Best performing products by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={barChartData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                  <Bar dataKey="value" fill="#3b82f6" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent activity section */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest actions and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((_, i) => (
              <div key={i} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium">New user registered</h4>
                    <span className="text-xs text-muted-foreground">{30 - i * 5}m ago</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    User_{1000 + i} has created a new account
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
