import { Shield, QrCode, Lock, CheckCircle, Truck, Scan, BarChart3, ArrowRight, Users, Package } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface HomePageProps {
  onViewChange: (view: string) => void;
}

const HomePage = ({ onViewChange }: HomePageProps) => {
  const features = [
    {
      icon: QrCode,
      title: 'QR-Based Security',
      description: 'Order-specific encrypted QR codes for secure delivery initiation',
      color: 'text-primary'
    },
    {
      icon: Lock,
      title: 'Customer-Controlled OTP',
      description: 'Customers generate and control their own verification codes',
      color: 'text-accent'
    },
    {
      icon: Shield,
      title: 'Zero Agent Access',
      description: 'Delivery agents never see or handle sensitive verification data',
      color: 'text-success'
    },
    {
      icon: CheckCircle,
      title: 'Real-time Verification',
      description: 'Instant backend validation with comprehensive audit trails',
      color: 'text-warning'
    }
  ];

  const stats = [
    { label: 'Security Rating', value: 'A+', icon: Shield },
    { label: 'Success Rate', value: '99.8%', icon: CheckCircle },
    { label: 'Active Users', value: '10K+', icon: Users },
    { label: 'Deliveries Secured', value: '1M+', icon: Package }
  ];

  const workflows = [
    {
      id: 'agent',
      title: 'Delivery Agent Portal',
      description: 'Generate secure QR codes for order deliveries',
      icon: Truck,
      color: 'bg-primary',
      features: ['Order Management', 'QR Generation', 'Delivery Tracking']
    },
    {
      id: 'customer',
      title: 'Customer Verification',
      description: 'Scan QR codes and verify deliveries securely',
      icon: Scan,
      color: 'bg-accent',
      features: ['QR Scanning', 'OTP Generation', 'Order Confirmation']
    },
    {
      id: 'admin',
      title: 'Admin Dashboard',
      description: 'Monitor system performance and security metrics',
      icon: BarChart3,
      color: 'bg-success',
      features: ['Analytics', 'Security Monitoring', 'System Health']
    }
  ];

  return (
    <div className="min-h-screen mt-28 bg-gradient-subtle">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-16">
          <div className="text-center space-y-8">
            <div className="flex justify-center">
              <div className="p-6 rounded-full bg-primary text-primary-foreground shadow-glow animate-pulse-glow">
                <Shield className="h-12 w-12" />
              </div>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold text-foreground">
                Secure Delivery
                <span className="bg-gradient-primary bg-clip-text text-transparent"> Verification</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Revolutionary QR-based delivery verification system that eliminates fraud, 
                protects sensitive orders, and puts customers in complete control of their delivery confirmation.
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                variant="premium" 
                size="xl"
                onClick={() => onViewChange('customer')}
                className="group"
              >
                <Scan className="h-5 w-5 mr-2" />
                Start Verification
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline" 
                size="xl"
                onClick={() => onViewChange('agent')}
              >
                <Truck className="h-5 w-5 mr-2" />
                Agent Portal
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="text-center shadow-soft hover:shadow-medium transition-all duration-200">
                <CardContent className="p-6">
                  <Icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Built for <span className="text-primary">Maximum Security</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our system addresses critical vulnerabilities in traditional delivery verification methods
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="shadow-soft hover:shadow-medium transition-all duration-200 group">
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors duration-200">
                      <Icon className={`h-6 w-6 ${feature.color} group-hover:scale-110 transition-transform duration-200`} />
                    </div>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Workflow Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Choose Your Role</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Access the portal designed for your specific role in the delivery ecosystem
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {workflows.map((workflow) => {
            const Icon = workflow.icon;
            return (
              <Card 
                key={workflow.id} 
                className="shadow-medium hover:shadow-strong transition-all duration-200 group cursor-pointer"
                onClick={() => onViewChange(workflow.id)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-3 rounded-lg ${workflow.color} text-white shadow-glow`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="group-hover:text-primary transition-colors">
                        {workflow.title}
                      </CardTitle>
                    </div>
                  </div>
                  <CardDescription className="text-base">
                    {workflow.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {workflow.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full mt-6 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200"
                  >
                    Access Portal
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Security Promise */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <Card className="shadow-strong bg-gradient-accent text-accent-foreground">
          <CardContent className="p-12 text-center">
            <div className="flex justify-center mb-6">
              <Shield className="h-16 w-16" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Our Security Promise</h2>
            <p className="text-xl opacity-90 max-w-3xl mx-auto leading-relaxed">
              Zero-knowledge verification ensures that sensitive delivery data never leaves customer control. 
              Built with enterprise-grade security for the modern e-commerce ecosystem.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <Badge className="bg-white/20 text-accent-foreground px-4 py-2">
                End-to-End Encryption
              </Badge>
              <Badge className="bg-white/20 text-accent-foreground px-4 py-2">
                GDPR Compliant
              </Badge>
              <Badge className="bg-white/20 text-accent-foreground px-4 py-2">
                ISO 27001 Standards
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HomePage;