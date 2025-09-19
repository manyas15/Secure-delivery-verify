
import { useState } from 'react';
import { Shield, Truck, Scan, BarChart3, Menu, X, LogOut, User, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface NavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

const Navigation = ({ currentView, onViewChange }: NavigationProps) => {
  const { profile, signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Signed Out',
        description: 'You have been signed out successfully.',
      });
    }
  };
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    {
      id: 'home',
      label: 'Dashboard',
      icon: Shield,
      description: 'System overview',
      roles: ['admin', 'agent', 'customer']
    },
    {
      id: 'agent',
      label: 'Delivery Hub',
      icon: Truck,
      description: 'QR code generation',
      roles: ['admin', 'agent']
    },
    {
      id: 'customer',
      label: 'Verification',
      icon: Scan,
      description: 'Delivery verification',
      roles: ['admin', 'customer']
    },
    {
      id: 'admin',
      label: 'Analytics',
      icon: BarChart3,
      description: 'Enterprise dashboard',
      roles: ['admin']
    }
  ].filter(item => item.roles.includes(profile?.role || 'customer'));

  const handleNavClick = (viewId: string) => {
    onViewChange(viewId);
    setIsMenuOpen(false);
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { label: 'Admin', variant: 'default' as const, icon: Crown },
      agent: { label: 'Agent', variant: 'secondary' as const, icon: Truck },
      customer: { label: 'Customer', variant: 'outline' as const, icon: User }
    };
    
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.customer;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-6 left-6 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="shadow-strong bg-background/95 backdrop-blur-sm border-border/50 h-12 w-12"
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex fixed top-6 left-1/2 transform -translate-x-1/2 z-40">
        <Card className="p-3 shadow-strong bg-background/95 backdrop-blur-sm border-border/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-gradient-primary rounded-lg">
              <Shield className="h-5 w-5 text-primary-foreground" />
              <span className="font-semibold text-primary-foreground">SecureDrop</span>
            </div>
            
            <div className="h-6 w-px bg-border/50"></div>
            
            <div className="flex gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? 'premium' : 'ghost'}
                    size="sm"
                    onClick={() => handleNavClick(item.id)}
                    className={`relative group transition-all duration-300 h-10 px-4 ${
                      isActive ? 'shadow-glow' : 'hover:shadow-soft'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                    
                    {/* Premium Tooltip */}
                    <div className="absolute top-full mt-3 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none">
                      <div className="bg-foreground text-background text-sm px-3 py-2 rounded-lg whitespace-nowrap shadow-strong">
                        {item.description}
                        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-foreground rotate-45"></div>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
            
            <div className="h-6 w-px bg-border/50"></div>
            
            <div className="flex items-center gap-3">
              {getRoleBadge(profile?.role || 'customer')}
              <Button
                onClick={handleSignOut}
                variant="ghost"
                size="sm"
                className="h-10"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </nav>

      {/* Premium Mobile Navigation Overlay */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-sm">
          <div className="flex items-center justify-center min-h-screen p-6">
            <Card className="w-full max-w-sm p-8 shadow-strong bg-background/95 backdrop-blur-sm">
              <div className="space-y-6">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                      <div className="relative p-4 rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                        <Shield className="h-8 w-8" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">SecureDrop</h2>
                    <p className="text-muted-foreground">Welcome, {profile?.full_name}</p>
                    <div className="mt-3 flex justify-center">
                      {getRoleBadge(profile?.role || 'customer')}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;
                    
                    return (
                      <Button
                        key={item.id}
                        variant={isActive ? 'premium' : 'outline'}
                        size="lg"
                        onClick={() => handleNavClick(item.id)}
                        className="w-full justify-start h-14 text-left"
                      >
                        <Icon className="h-6 w-6 mr-4" />
                        <div className="flex-1">
                          <div className="font-semibold text-base">{item.label}</div>
                          <div className="text-sm text-muted-foreground">{item.description}</div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
                
                <div className="pt-4 border-t border-border/50">
                  <Button
                    onClick={handleSignOut}
                    variant="outline"
                    size="lg"
                    className="w-full"
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </>
  );
};

export default Navigation;
