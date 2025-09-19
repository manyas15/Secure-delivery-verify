import { useState } from 'react';
import { BarChart3, Shield, Users, Package, TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface DeliveryRecord {
  id: string;
  orderId: string;
  agentId: string;
  agentName: string;
  customerName: string;
  status: 'completed' | 'failed' | 'pending';
  timestamp: string;
  verificationTime: string;
  location: string;
}

const AdminDashboard = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('today');
  
  const [deliveryRecords] = useState<DeliveryRecord[]>([
    {
      id: 'DEL-001',
      orderId: 'ORD-2024-001',
      agentId: 'AGT-001',
      agentName: 'John Smith',
      customerName: 'Sarah Johnson',
      status: 'completed',
      timestamp: '2:30 PM',
      verificationTime: '00:45',
      location: 'Downtown District'
    },
    {
      id: 'DEL-002',
      orderId: 'ORD-2024-002',
      agentId: 'AGT-002',
      agentName: 'Maria Garcia',
      customerName: 'Mike Chen',
      status: 'completed',
      timestamp: '1:15 PM',
      verificationTime: '01:12',
      location: 'Eastside Area'
    },
    {
      id: 'DEL-003',
      orderId: 'ORD-2024-003',
      agentId: 'AGT-001',
      agentName: 'John Smith',
      customerName: 'Emma Davis',
      status: 'failed',
      timestamp: '12:45 PM',
      verificationTime: '03:20',
      location: 'Westend Zone'
    }
  ]);

  const stats = {
    totalDeliveries: 156,
    successRate: 94.2,
    activeAgents: 12,
    avgVerificationTime: '1:23',
    securityIncidents: 2,
    customerSatisfaction: 98.5
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'bg-success text-success-foreground',
      failed: 'bg-destructive text-destructive-foreground',
      pending: 'bg-warning text-warning-foreground'
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-warning" />;
      default:
        return <Package className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary text-primary-foreground shadow-glow">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground">Secure delivery system overview & analytics</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {['today', 'week', 'month'].map((timeframe) => (
              <Button
                key={timeframe}
                variant={selectedTimeframe === timeframe ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTimeframe(timeframe)}
              >
                {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="shadow-soft hover:shadow-medium transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Package className="h-5 w-5 text-primary" />
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
              <p className="text-sm text-muted-foreground">Total Deliveries</p>
              <p className="text-xl font-bold">{stats.totalDeliveries}</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft hover:shadow-medium transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <p className="text-xl font-bold text-success">{stats.successRate}%</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft hover:shadow-medium transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-5 w-5 text-accent" />
                <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
              </div>
              <p className="text-sm text-muted-foreground">Active Agents</p>
              <p className="text-xl font-bold">{stats.activeAgents}</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft hover:shadow-medium transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Clock className="h-5 w-5 text-warning" />
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
              <p className="text-sm text-muted-foreground">Avg Verification</p>
              <p className="text-xl font-bold">{stats.avgVerificationTime}</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft hover:shadow-medium transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Shield className="h-5 w-5 text-destructive" />
                <AlertTriangle className="h-4 w-4 text-warning" />
              </div>
              <p className="text-sm text-muted-foreground">Security Incidents</p>
              <p className="text-xl font-bold text-destructive">{stats.securityIncidents}</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft hover:shadow-medium transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
              <p className="text-sm text-muted-foreground">Satisfaction</p>
              <p className="text-xl font-bold text-success">{stats.customerSatisfaction}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Delivery Trends
              </CardTitle>
              <CardDescription>
                Hourly delivery completion rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-end justify-between space-x-2">
                {[65, 89, 92, 78, 85, 94, 88, 76].map((height, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className="bg-gradient-primary rounded-t-sm w-full transition-all duration-500 hover:opacity-80"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-xs text-muted-foreground mt-2">
                      {9 + index}:00
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Overview
              </CardTitle>
              <CardDescription>
                System security metrics and alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium">OTP Security</span>
                </div>
                <Badge className="bg-success text-success-foreground">100% Secure</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium">QR Encryption</span>
                </div>
                <Badge className="bg-success text-success-foreground">Active</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-warning/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <span className="text-sm font-medium">Failed Attempts</span>
                </div>
                <Badge className="bg-warning text-warning-foreground">2 Today</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Deliveries */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Recent Delivery Activity
            </CardTitle>
            <CardDescription>
              Real-time delivery verification logs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deliveryRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(record.status)}
                    <div>
                      <h3 className="font-semibold">{record.orderId}</h3>
                      <p className="text-sm text-muted-foreground">
                        Agent: {record.agentName} • Customer: {record.customerName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {record.location} • Verification: {record.verificationTime}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{record.timestamp}</p>
                      <p className="text-xs text-muted-foreground">Today</p>
                    </div>
                    {getStatusBadge(record.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg">System Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">API Response Time</span>
                <span className="text-sm font-semibold text-success">145ms</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div className="bg-success h-2 rounded-full" style={{ width: '85%' }} />
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg">QR Code Generation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Success Rate</span>
                <span className="text-sm font-semibold text-success">99.8%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div className="bg-success h-2 rounded-full" style={{ width: '99.8%' }} />
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg">OTP Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Security Score</span>
                <span className="text-sm font-semibold text-success">A+</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div className="bg-success h-2 rounded-full" style={{ width: '100%' }} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;