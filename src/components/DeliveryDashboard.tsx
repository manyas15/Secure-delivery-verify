import { useState, useEffect } from 'react';
import { Shield, Package, QrCode, Users, AlertCircle, CheckCircle, CheckCircle2, Clock, Download, Share2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useOrders, Order } from '@/hooks/useOrders';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import QRCode from 'qrcode';

const DeliveryDashboard = () => {
  const { profile } = useAuth();
  const { orders, loading, generateQR, refetch } = useOrders(profile?.user_id, profile?.role);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [generatingQR, setGeneratingQR] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<{ [orderId: string]: boolean }>({});
  const [loadingVerification, setLoadingVerification] = useState<{ [orderId: string]: boolean }>({});
  const [markingDelivered, setMarkingDelivered] = useState<string | null>(null);
  const [refreshingVerification, setRefreshingVerification] = useState<string | null>(null);
  const [refreshingOrders, setRefreshingOrders] = useState(false);
  const { toast } = useToast();

  const generateQRCode = async (order: Order) => {
    try {
      setGeneratingQR(order.id);

      // Check if user is authenticated and is an agent
      if (!profile?.user_id) {
        toast({
          title: 'Authentication Error',
          description: 'Please log in to generate QR codes',
          variant: 'destructive',
        });
        return;
      }

      if (profile.role !== 'agent') {
        toast({
          title: 'Access Denied',
          description: 'Only delivery agents can generate QR codes',
          variant: 'destructive',
        });
        return;
      }

      const result = await generateQR(order.id);

      if (!result?.qrData) {
        throw new Error('Invalid QR data received');
      }

      const qrUrl = await QRCode.toDataURL(result.qrData);
      setQrDataUrl(qrUrl);
      await handleOrderSelect(order);

      toast({
        title: 'QR Code Generated',
        description: 'Show this QR code to the customer for verification',
      });
    } catch (error: any) {
      toast({
        title: 'QR Generation Failed',
        description: error.message || 'Failed to generate QR code. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setGeneratingQR(null);
    }
  };

  const downloadQRCode = () => {
    if (qrDataUrl && selectedOrder) {
      const link = document.createElement('a');
      link.download = `QR_${selectedOrder.order_number}_${new Date().toISOString().split('T')[0]}.png`;
      link.href = qrDataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'QR Code Downloaded',
        description: 'QR code has been saved to your downloads folder',
      });
    }
  };

  const shareQRCode = async () => {
    if (!qrDataUrl || !selectedOrder) return;

    try {
      // Convert data URL to blob
      const response = await fetch(qrDataUrl);
      const blob = await response.blob();
      const file = new File([blob], `QR_${selectedOrder.order_number}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Secure Delivery QR - ${selectedOrder.order_number}`,
          text: `QR code for secure delivery verification of order ${selectedOrder.order_number}`,
          files: [file]
        });

        toast({
          title: 'QR Code Shared',
          description: 'QR code has been shared successfully',
        });
      } else {
        // Fallback to copying data URL to clipboard
        await navigator.clipboard.writeText(qrDataUrl);
        toast({
          title: 'QR Code Copied',
          description: 'QR code image has been copied to clipboard',
        });
      }
    } catch (error) {
      toast({
        title: 'Share Failed',
        description: 'Unable to share QR code. Try downloading instead.',
        variant: 'destructive',
      });
    }
  };

  const markDeliveryCompleted = async (order: Order) => {
    try {
      setMarkingDelivered(order.id);
      
      console.log('🔍 MARK DELIVERED DEBUG - Starting verification check for order:', order.id);
      
      // CRITICAL: Double-check verification status right before marking as delivered
      const isVerified = await checkOrderVerification(order.id);
      
      console.log('🔍 MARK DELIVERED DEBUG - Verification result:', isVerified);
      console.log('🔍 MARK DELIVERED DEBUG - Current verification status from state:', verificationStatus[order.id]);

      if (!isVerified) {
        console.log('❌ MARK DELIVERED DEBUG - Verification failed, blocking delivery completion');
        toast({
          title: 'Verification Required',
          description: 'Customer must scan QR code and verify with OTP before you can mark delivery as completed.',
          variant: 'destructive',
        });
        return;
      }

      console.log('✅ MARK DELIVERED DEBUG - Verification passed, proceeding with delivery completion');

      // If verified, update order status to verified (fully completed)
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'verified', // Final status after customer verification + agent confirmation
          delivered_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (error) {
        throw error;
      }

      // Immediately update the selected order status for instant UI feedback
      if (selectedOrder) {
        setSelectedOrder({
          ...selectedOrder,
          status: 'verified',
          delivered_at: new Date().toISOString()
        });
      }
      
      toast({
        title: 'Delivery Completed Successfully',
        description: 'Order has been verified by customer and marked as completed by agent.',
      });

      // Close the modal and refresh verification status
      setSelectedOrder(null);
      setQrDataUrl(''); // Clear QR code data
      
      // Immediately refresh the orders to show updated status in UI
      setRefreshingOrders(true);
      await refetch();
      setRefreshingOrders(false);
      
      // Show success message for status update
      toast({
        title: 'Status Updated',
        description: 'Order status has been updated in the delivery queue.',
        variant: 'default',
      });
      
      // Refresh verification status for all orders to update the UI
      if (orders.length > 0) {
        const statusPromises = orders.map(async (o) => {
          const isVerified = await checkOrderVerification(o.id);
          return { orderId: o.id, verified: isVerified };
        });

        const results = await Promise.all(statusPromises);
        const statusMap = results.reduce((acc, { orderId, verified }) => {
          acc[orderId] = verified;
          return acc;
        }, {} as { [orderId: string]: boolean });

        setVerificationStatus(statusMap);
      }
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update delivery status',
        variant: 'destructive',
      });
    } finally {
      setMarkingDelivered(null);
    }
  };

  // Check if order has been verified by customer (OTP verification completed)
  const checkOrderVerification = async (orderId: string): Promise<boolean> => {
    try {
      console.log('🔍 VERIFICATION CHECK - Checking order:', orderId);
      
      // Get ALL OTP verification records for THIS SPECIFIC order, ordered by creation time DESC
      const { data: allRecordsForOrder, error: allRecordsError } = await supabase
        .from('otp_verifications')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false }); // Get latest first

      console.log('🔍 VERIFICATION CHECK - Query result:', { allRecordsForOrder, allRecordsError });

      if (allRecordsError) {
        console.log('❌ VERIFICATION CHECK - Database error:', allRecordsError);
        return false;
      }

      // If no OTP records exist for this order, it's not verified
      if (!allRecordsForOrder || allRecordsForOrder.length === 0) {
        console.log('❌ VERIFICATION CHECK - No OTP records found for order:', orderId);
        return false;
      }

      // Get the LATEST OTP record (first one due to DESC order)
      const latestRecord = allRecordsForOrder[0];
      console.log('🔍 VERIFICATION CHECK - Latest OTP record:', latestRecord);

      // Check if the LATEST record is verified
      const isVerifiedValue = latestRecord.is_verified;

      // Handle both boolean true and string 'true'
      const isVerified = isVerifiedValue === true || String(isVerifiedValue) === 'true';

      console.log('✅ VERIFICATION CHECK - Final result for order', orderId, ':', isVerified);
      return isVerified;
    } catch (error) {
      console.log('❌ VERIFICATION CHECK - Exception:', error);
      return false;
    }
  };


  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'in-transit':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Package className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      verified: 'bg-success text-success-foreground',
      'in-transit': 'bg-warning text-warning-foreground',
      pending: 'bg-muted text-muted-foreground',
      delivered: 'bg-primary text-primary-foreground'
    };

    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {status.replace('-', ' ').toUpperCase()}
      </Badge>
    );
  };

  // Check verification status when order is selected
  const handleOrderSelect = async (order: Order) => {
    setSelectedOrder(order);
    setLoadingVerification(prev => ({ ...prev, [order.id]: true }));

    // Check if this order has been verified
    const isVerified = await checkOrderVerification(order.id);

    setVerificationStatus(prev => {
      const newStatus = {
        ...prev,
        [order.id]: isVerified
      };
      return newStatus;
    });

    setLoadingVerification(prev => ({ ...prev, [order.id]: false }));
  };

  // Periodically refresh verification status for selected order
  useEffect(() => {
    if (!selectedOrder) return;

    const refreshVerification = async () => {
      setRefreshingVerification(selectedOrder.id);
      
      const isVerified = await checkOrderVerification(selectedOrder.id);

      setVerificationStatus(prev => {
        const newStatus = {
          ...prev,
          [selectedOrder.id]: isVerified
        };
        return newStatus;
      });
      
      setRefreshingVerification(null);
    };

    // Check immediately
    refreshVerification();

    // Set up interval to check every 10 seconds
    const interval = setInterval(refreshVerification, 10000);

    return () => clearInterval(interval);
  }, [selectedOrder]);

  // Load verification status for all orders
  useEffect(() => {
    const loadVerificationStatus = async () => {
      const statusPromises = orders.map(async (order) => {
        const isVerified = await checkOrderVerification(order.id);
        return { orderId: order.id, verified: isVerified };
      });

      const results = await Promise.all(statusPromises);
      const statusMap = results.reduce((acc, { orderId, verified }) => {
        acc[orderId] = verified;
        return acc;
      }, {} as { [orderId: string]: boolean });

      setVerificationStatus(statusMap);
    };

    if (orders.length > 0) {
      loadVerificationStatus();
    }
  }, [orders]);

  return (
    <div className="min-h-screen pt-32 bg-gradient-subtle p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary text-primary-foreground shadow-glow">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Secure Delivery Agent</h1>
              <p className="text-muted-foreground">Manage deliveries with QR verification</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Agent ID</p>
              <p className="font-semibold">{profile?.agent_id || 'Not Assigned'}</p>
            </div>
            <div className="p-2 rounded-lg bg-accent-light">
              <Users className="h-5 w-5 text-accent" />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="shadow-soft hover:shadow-medium transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  {loading ? (
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    <p className="text-2xl font-bold">{orders.length}</p>
                  )}
                </div>
                <Package className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Transit</p>
                  {loading ? (
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    <p className="text-2xl font-bold text-warning">
                      {orders.filter(o => o.status === 'in_transit').length}
                    </p>
                  )}
                </div>
                <Clock className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Verified</p>
                  {loading ? (
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    <p className="text-2xl font-bold text-success">
                      {orders.filter(o => o.status === 'verified').length}
                    </p>
                  )}
                </div>
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  {loading ? (
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    <p className="text-2xl font-bold text-accent">
                      {orders.length > 0 ? Math.round((orders.filter(o => o.status === 'verified').length / orders.length) * 100) : 0}%
                    </p>
                  )}
                </div>
                <Shield className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders List */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Delivery Queue
              {refreshingOrders && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Updating...
                </div>
              )}
            </CardTitle>
            <CardDescription>
              Generate secure QR codes for customer verification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                No orders assigned to you yet.
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-all duration-200"
                  onClick={() => handleOrderSelect(order)} // Handle order selection
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(order.status)}
                    <div>
                      <h3 className="font-semibold">{order.order_number}</h3>
                      <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{order.delivery_address}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {Array.isArray(order.items) ? order.items.map(item => item.name || item).join(', ') : 'Items loading...'}
                      </p>
                      {order.delivered_at && (
                        <p className="text-xs text-success">
                          Delivered at {new Date(order.delivered_at).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(order.status)}
                      
                      {/* Loading verification status */}
                      {loadingVerification[order.id] && (
                        <Badge className="bg-blue-100 text-blue-800 text-xs">
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600 mr-1"></div>
                          Checking...
                        </Badge>
                      )}
                      
                      {/* Verification Status Badge */}
                      {!loadingVerification[order.id] && verificationStatus[order.id] && (
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Customer Verified
                        </Badge>
                      )}
                    </div>

                    {order.status === 'in_transit' && (
                      <Button
                        variant="secure"
                        size="sm"
                        onClick={() => generateQRCode(order)}
                        disabled={generatingQR === order.id || loadingVerification[order.id]}
                        className="ml-auto"
                      >
                        {generatingQR === order.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Generating...
                          </>
                        ) : (
                          <>
                            <QrCode className="h-4 w-4 mr-2" />
                            Generate QR
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              )))
            }
          </CardContent>
        </Card>

        {/* QR Code Modal */}
        {selectedOrder && selectedOrder.status !== 'verified' && (
          <Card className="shadow-strong animate-scale-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Secure QR Code - {selectedOrder.id}
              </CardTitle>
              <CardDescription>
                Show this QR code to the customer for verification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                <div className="p-8 bg-background border-2 border-dashed border-primary rounded-lg relative group">
                  {qrDataUrl ? (
                    <>
                      <img src={qrDataUrl} alt="QR Code" className="w-48 h-48" id="qr-code-image" />
                      {/* Download and Share buttons overlay */}
                      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={downloadQRCode}
                          className="p-2 h-8 w-8"
                          title="Download QR Code"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={shareQRCode}
                          className="p-2 h-8 w-8"
                          title="Share QR Code"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="w-48 h-48 bg-gradient-primary rounded-lg flex items-center justify-center text-primary-foreground text-lg font-bold shadow-glow">
                      QR CODE
                      <br />
                      {selectedOrder.order_number}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-accent-light rounded-lg">
                <h4 className="font-semibold text-accent mb-2">Security Features:</h4>
                <ul className="text-sm text-accent space-y-1">
                  <li>• Order-specific encryption</li>
                  <li>• Time-limited validity (5 minutes)</li>
                  <li>• GPS location verification</li>
                  <li>• Customer-controlled OTP generation</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setSelectedOrder(null)}
                  className="flex-1"
                >
                  Close
                </Button>
                {qrDataUrl && (
                  <>
                    <Button
                      variant="outline"
                      onClick={downloadQRCode}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      onClick={shareQRCode}
                      className="flex items-center gap-2"
                    >
                      <Share2 className="h-4 w-4" />
                      Share
                    </Button>
                  </>
                )}
                {/* Delivery Completion Button with Verification Check */}
                {selectedOrder && (
                  <>
                    <Button
                      variant={verificationStatus[selectedOrder.id] ? "success" : "outline"}
                      className="flex-1"
                      onClick={() => markDeliveryCompleted(selectedOrder)}
                      disabled={!verificationStatus[selectedOrder.id] || markingDelivered === selectedOrder.id || loadingVerification[selectedOrder.id]}
                    >
                      {markingDelivered === selectedOrder.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                          Completing Delivery...
                        </>
                      ) : verificationStatus[selectedOrder.id] ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark as Delivered
                        </>
                      ) : loadingVerification[selectedOrder.id] ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                          Checking Verification...
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Awaiting Customer Verification
                        </>
                      )}
                    </Button>
                  </>
                )}

                {/* Show verification status */}
                {selectedOrder && !verificationStatus[selectedOrder.id] && !loadingVerification[selectedOrder.id] && (
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Customer must scan QR code and verify with OTP before delivery can be marked as completed.
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOrderSelect(selectedOrder)}
                      disabled={refreshingVerification === selectedOrder.id}
                      className="text-xs"
                    >
                      {refreshingVerification === selectedOrder.id ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-current mr-1"></div>
                          Refreshing...
                        </>
                      ) : (
                        'Refresh Verification Status'
                      )}
                    </Button>
                  </div>
                )}

                {/* Show loading status during verification check */}
                {selectedOrder && loadingVerification[selectedOrder.id] && (
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      Checking customer verification status...
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DeliveryDashboard;