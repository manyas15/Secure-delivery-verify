import { useState, useRef } from 'react';
import { QrCode, Shield, CheckCircle2, AlertTriangle, Smartphone, Lock, Camera, Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useOrders } from '@/hooks/useOrders';
import { useToast } from '@/hooks/use-toast';
import QrScanner from 'qr-scanner';

const CustomerVerification = () => {
  const [scanStep, setScanStep] = useState<'scan' | 'verify' | 'complete'>('scan');
  const [otpCode, setOtpCode] = useState('');
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [generatingOtp, setGeneratingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { profile } = useAuth();
  const { generateOTP, verifyOTP, fetchOrderWithAgent } = useOrders(profile?.user_id, profile?.role);
  const { toast } = useToast();

  const startScanning = async () => {
    setIsScanning(true);
    try {
      if (videoRef.current) {
        const qrScanner = new QrScanner(
          videoRef.current,
          (result) => {
            handleQRResult(result.data);
            qrScanner.stop();
            setIsScanning(false);
          },
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
          }
        );
        await qrScanner.start();
      }
    } catch (error) {
      setIsScanning(false);
      toast({
        title: 'Camera Error',
        description: 'Unable to access camera. Please try uploading an image instead.',
        variant: 'destructive',
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        setUploadingImage(true);
        const result = await QrScanner.scanImage(file);
        handleQRResult(result);
      } catch (error) {
        toast({
          title: 'Scan Failed',
          description: 'No QR code found in the image.',
          variant: 'destructive',
        });
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const handleQRResult = async (qrData: string) => {
    try {
      setLoadingOrder(true);
      setGeneratingOtp(true);
      const result = await generateOTP(qrData);
      
      // Fetch detailed order information with agent details
      if (result.orderDetails?.orderId) {
        const detailedOrder = await fetchOrderWithAgent(result.orderDetails.orderId);
        if (detailedOrder) {
          setOrderDetails({
            ...result.orderDetails,
            ...detailedOrder
          });
        } else {
          setOrderDetails(result.orderDetails);
        }
      } else {
        setOrderDetails(result.orderDetails);
      }
      
      setGeneratedOtp(result.otpCode);
      setScanStep('verify');
      
      toast({
        title: 'QR Code Scanned Successfully',
        description: result.smsNotification || 'Your OTP has been generated.',
      });
    } catch (error: any) {
      toast({
        title: 'Invalid QR Code',
        description: error.message || 'Failed to process QR code',
        variant: 'destructive',
      });
    } finally {
      setLoadingOrder(false);
      setGeneratingOtp(false);
    }
  };

  const handleVerifyDelivery = async () => {
    try {
      setVerifyingOtp(true);
      await verifyOTP(orderDetails?.orderId, otpCode);
      setScanStep('complete');
      
      toast({
        title: 'Delivery Verified!',
        description: 'Your order has been successfully verified.',
      });
    } catch (error: any) {
      toast({
        title: 'Verification Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 bg-gradient-subtle p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-primary text-primary-foreground shadow-glow">
              <Shield className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">Customer Verification</h1>
          <p className="text-muted-foreground">Scan QR code and verify your delivery</p>
        </div>



        {scanStep === 'scan' && (
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Scan QR Code
              </CardTitle>
              <CardDescription>
                Scan the QR code shown by your delivery agent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-8 border-2 border-dashed border-primary rounded-lg text-center space-y-4">
                {isScanning ? (
                  <div className="space-y-4">
                    <video
                      ref={videoRef}
                      className="w-full max-w-sm mx-auto rounded-lg"
                      style={{ aspectRatio: '1' }}
                    />
                    <Button onClick={() => setIsScanning(false)} variant="outline">
                      Cancel Scanning
                    </Button>
                  </div>
                ) : loadingOrder || generatingOtp ? (
                  <div className="space-y-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto"></div>
                    <div className="space-y-2">
                      <p className="text-lg font-semibold text-primary">
                        {generatingOtp ? 'Generating OTP...' : 'Processing QR Code...'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {generatingOtp ? 'Sending SMS verification code' : 'Validating QR code data'}
                      </p>
                    </div>
                  </div>
                ) : uploadingImage ? (
                  <div className="space-y-4">
                    <div className="animate-pulse">
                      <Upload className="h-16 w-16 text-primary mx-auto" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-lg font-semibold text-primary">Scanning Image...</p>
                      <p className="text-sm text-muted-foreground">Analyzing uploaded image for QR code</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <QrCode className="h-16 w-16 text-primary mx-auto" />
                    <div className="flex gap-3">
                      <Button 
                        onClick={startScanning} 
                        className="flex-1" 
                        variant="secure"
                        disabled={loadingOrder || generatingOtp || uploadingImage}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Open Camera
                      </Button>
                      <Button 
                        onClick={() => fileInputRef.current?.click()} 
                        className="flex-1" 
                        variant="outline"
                        disabled={loadingOrder || generatingOtp || uploadingImage}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Image
                      </Button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {scanStep === 'verify' && (
          <div className="space-y-6">
            {/* Enhanced Order Details Card */}
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Order Details
                </CardTitle>
                <CardDescription>
                  Verify the order information and agent details below
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingOrder ? (
                  // Loading skeleton for order details
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg border-b pb-2">Order Information</h3>
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="space-y-2">
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3"></div>
                          <div className="h-4 bg-gray-300 rounded animate-pulse w-2/3"></div>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg border-b pb-2">Agent Information</h3>
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="space-y-2">
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3"></div>
                          <div className="h-4 bg-gray-300 rounded animate-pulse w-2/3"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : orderDetails && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Order Information */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg border-b pb-2">Order Information</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Order Number</p>
                          <p className="font-medium">{orderDetails.order_number || orderDetails.orderNumber}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Customer Name</p>
                          <p className="font-medium">{orderDetails.customer_name || orderDetails.customerName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Phone Number</p>
                          <p className="font-medium">{orderDetails.customer_phone || orderDetails.customerPhone}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Delivery Address</p>
                          <p className="font-medium text-sm">{orderDetails.delivery_address || orderDetails.deliveryAddress}</p>
                        </div>
                        {orderDetails.total_amount && (
                          <div>
                            <p className="text-sm text-muted-foreground">Total Amount</p>
                            <p className="font-medium text-lg text-green-600">₹{orderDetails.total_amount}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Agent Information */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg border-b pb-2">Delivery Agent Details</h3>
                      <div className="space-y-3">
                        {orderDetails.agent_full_name && (
                          <div>
                            <p className="text-sm text-muted-foreground">Agent Name</p>
                            <p className="font-medium">{orderDetails.agent_full_name}</p>
                          </div>
                        )}
                        {orderDetails.agent_code && (
                          <div>
                            <p className="text-sm text-muted-foreground">Agent ID</p>
                            <p className="font-medium">{orderDetails.agent_code}</p>
                          </div>
                        )}
                        {orderDetails.agent_phone && (
                          <div>
                            <p className="text-sm text-muted-foreground">Contact Number</p>
                            <p className="font-medium">{orderDetails.agent_phone}</p>
                          </div>
                        )}
                        {orderDetails.vehicle_number && (
                          <div>
                            <p className="text-sm text-muted-foreground">Vehicle Number</p>
                            <p className="font-medium">{orderDetails.vehicle_number}</p>
                          </div>
                        )}
                        {orderDetails.vehicle_type && (
                          <div>
                            <p className="text-sm text-muted-foreground">Vehicle Type</p>
                            <p className="font-medium">{orderDetails.vehicle_type}</p>
                          </div>
                        )}
                        {orderDetails.license_number && (
                          <div>
                            <p className="text-sm text-muted-foreground">License Number</p>
                            <p className="font-medium">{orderDetails.license_number}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Order Items */}
                {!loadingOrder && orderDetails?.items && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="font-semibold text-lg mb-4">Order Items</h3>
                    <div className="space-y-2">
                      {(Array.isArray(orderDetails.items) ? orderDetails.items : JSON.parse(orderDetails.items || '[]')).map((item: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                          </div>
                          <p className="font-medium">₹{item.price}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* OTP Verification Card */}
            {!loadingOrder && (
              <Card className="shadow-medium">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    OTP Verification
                  </CardTitle>
                  <CardDescription>
                    {generatingOtp ? 'Generating your verification code...' : 'Enter the verification code to confirm delivery'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {generatingOtp ? (
                    <div className="p-8 text-center space-y-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mx-auto"></div>
                      <div className="space-y-2">
                        <p className="text-lg font-semibold text-primary">Generating OTP...</p>
                        <p className="text-sm text-muted-foreground">Sending SMS verification code to your phone</p>
                      </div>
                    </div>
                  ) : generatedOtp && (
                  <div className="p-4 bg-success-light rounded-lg text-center">
                    <div className="text-3xl font-bold text-success mb-2">
                      {generatedOtp === 'SENT_VIA_SMS' ? '📱 SMS SENT' : generatedOtp}
                    </div>
                    <p className="text-sm text-success">
                      {generatedOtp === 'SENT_VIA_SMS' ? 
                        'OTP sent to your mobile number' : 
                        'Your secure OTP'}
                    </p>
                    <p className="text-xs text-success-dark mt-2">
                      📱 Check your mobile phone for the verification code
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Input
                    placeholder="Enter OTP to verify"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="text-center text-lg"
                    disabled={verifyingOtp}
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Enter the 6-digit code shown above or received via SMS
                  </p>
                  <Button 
                    onClick={handleVerifyDelivery} 
                    className="w-full" 
                    variant="success"
                    disabled={verifyingOtp || !otpCode.trim()}
                  >
                    {verifyingOtp ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Verifying OTP...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Verify Delivery
                      </>
                    )}
                  </Button>
                  
                  {verifyingOtp && (
                    <div className="text-center text-sm text-muted-foreground mt-2">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-primary"></div>
                        Contacting verification server...
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            )}
          </div>
        )}

        {scanStep === 'complete' && (
          <Card className="shadow-strong text-center">
            <CardContent className="p-8 space-y-4">
              <CheckCircle2 className="h-16 w-16 text-success mx-auto" />
              <h2 className="text-2xl font-bold text-success">Delivery Verified!</h2>
              <p className="text-muted-foreground">Your order has been successfully delivered</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CustomerVerification;