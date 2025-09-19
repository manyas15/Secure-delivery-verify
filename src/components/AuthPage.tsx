
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Shield, Package, Loader2, Truck, User, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AuthPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'agent' | 'customer'>('customer');
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: 'Authentication Failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Welcome Back',
        description: 'You have been signed in successfully.',
      });
    }

    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signUp(email, password, fullName, role);

    if (error) {
      toast({
        title: 'Registration Failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Account Created Successfully',
        description: 'Please check your email to verify your account before signing in.',
      });
    }

    setIsLoading(false);
  };

  const roleOptions = [
    {
      value: 'customer',
      label: 'Customer',
      description: 'Receive and verify deliveries',
      icon: User,
    },
    {
      value: 'agent',
      label: 'Delivery Agent',
      description: 'Handle and deliver packages',
      icon: Truck,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-6">
      <div className="max-w-lg w-full space-y-8">
        {/* Premium Header */}
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full"></div>
              <div className="relative p-6 rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
                <Shield className="h-12 w-12" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              SecureDrop
            </h1>
            <p className="text-lg text-muted-foreground">
              Enterprise-grade delivery verification platform
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Crown className="h-4 w-4 text-accent" />
              <span>Trusted by leading logistics companies</span>
            </div>
          </div>
        </div>

        {/* Premium Auth Card */}
        <Card className="shadow-strong border-0 bg-background/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-8">
            <CardTitle className="flex items-center justify-center gap-3 text-2xl">
              <Package className="h-6 w-6 text-primary" />
              Access Your Account
            </CardTitle>
            <CardDescription className="text-base">
              Secure authentication for delivery professionals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-12 bg-muted/50">
                <TabsTrigger value="signin" className="text-base font-medium">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="text-base font-medium">
                  Create Account
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="mt-8">
                <form onSubmit={handleSignIn} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-base font-medium">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your professional email"
                      className="h-12 text-base"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-base font-medium">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your secure password"
                      className="h-12 text-base"
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-semibold" 
                    disabled={isLoading}
                    variant="premium"
                  >
                    {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    Access Dashboard
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="mt-8">
                <form onSubmit={handleSignUp} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullname" className="text-base font-medium">
                      Full Name
                    </Label>
                    <Input
                      id="fullname"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="h-12 text-base"
                      required
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Account Type</Label>
                    <RadioGroup 
                      value={role} 
                      onValueChange={(value: 'agent' | 'customer') => setRole(value)}
                      className="space-y-3"
                    >
                      {roleOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <div key={option.value} className="flex items-center space-x-3">
                            <RadioGroupItem value={option.value} id={option.value} />
                            <Label 
                              htmlFor={option.value} 
                              className="flex items-center gap-3 cursor-pointer flex-1 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                            >
                              <Icon className="h-5 w-5 text-primary" />
                              <div>
                                <div className="font-medium">{option.label}</div>
                                <div className="text-sm text-muted-foreground">
                                  {option.description}
                                </div>
                              </div>
                            </Label>
                          </div>
                        );
                      })}
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-base font-medium">
                      Email Address
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your professional email"
                      className="h-12 text-base"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-base font-medium">
                      Password
                    </Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a secure password"
                      className="h-12 text-base"
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-semibold" 
                    disabled={isLoading}
                    variant="premium"
                  >
                    {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    Create Professional Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            <div className="pt-6 border-t border-border/50">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Bank-level security • End-to-end encryption</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
