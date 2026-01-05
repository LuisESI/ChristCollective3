import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Package, Truck, CheckCircle2, Clock, XCircle, Eye, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { buildApiUrl } from '@/lib/api-config';
import { queryClient } from '@/lib/queryClient';

interface ShopOrder {
  id: number;
  userId: number | null;
  stripePaymentIntentId: string;
  stripePriceId: string;
  productName: string;
  quantity: number;
  unitAmount: number;
  totalAmount: number;
  currency: string;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  customerEmail: string;
  customerPhone: string | null;
  customerName: string;
  shippingName: string;
  shippingAddress: string;
  shippingAddress2: string | null;
  shippingCity: string;
  shippingState: string;
  shippingZipCode: string;
  shippingCountry: string;
  trackingNumber: string | null;
  trackingCarrier: string | null;
  adminNotes: string | null;
  createdAt: string;
  shippedAt: string | null;
  deliveredAt: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500',
  paid: 'bg-blue-500',
  processing: 'bg-purple-500',
  shipped: 'bg-cyan-500',
  delivered: 'bg-green-500',
  cancelled: 'bg-red-500',
  refunded: 'bg-gray-500',
};

const STATUS_ICONS: Record<string, any> = {
  pending: Clock,
  paid: CheckCircle2,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle2,
  cancelled: XCircle,
  refunded: RefreshCw,
};

export default function AdminOrdersPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<ShopOrder | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editStatus, setEditStatus] = useState('');
  const [editTracking, setEditTracking] = useState('');
  const [editCarrier, setEditCarrier] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const { data: orders = [], isLoading, refetch } = useQuery<ShopOrder[]>({
    queryKey: ['/api/admin/shop-orders'],
    queryFn: async () => {
      const response = await fetch(buildApiUrl('/api/admin/shop-orders'), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
    enabled: !!user?.isAdmin,
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, data }: { orderId: number; data: any }) => {
      const response = await fetch(buildApiUrl(`/api/admin/shop-orders/${orderId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update order');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/shop-orders'] });
      toast({ title: 'Order updated successfully' });
      setIsDetailOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const openOrderDetail = (order: ShopOrder) => {
    setSelectedOrder(order);
    setEditStatus(order.status);
    setEditTracking(order.trackingNumber || '');
    setEditCarrier(order.trackingCarrier || '');
    setEditNotes(order.adminNotes || '');
    setIsDetailOpen(true);
  };

  const handleUpdateOrder = () => {
    if (!selectedOrder) return;
    updateOrderMutation.mutate({
      orderId: selectedOrder.id,
      data: {
        status: editStatus,
        trackingNumber: editTracking || null,
        trackingCarrier: editCarrier || null,
        adminNotes: editNotes || null,
      },
    });
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <p className="text-white">Admin access required</p>
            <Button
              onClick={() => navigate('/')}
              className="mt-4 bg-[#D4AF37] hover:bg-[#C4A030] text-black"
            >
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-8">
      <Helmet>
        <title>Order Management | Christ Collective Admin</title>
      </Helmet>

      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin')}
            className="text-gray-400 hover:text-white mb-4"
            data-testid="button-back-admin"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#D4AF37]">Order Management</h1>
              <p className="text-gray-400 mt-1">Manage shop orders, track shipments, and update order status</p>
            </div>
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="border-gray-700 text-white hover:bg-gray-800"
              data-testid="button-refresh-orders"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-[#D4AF37]" />
              Orders ({orders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full bg-gray-800" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No orders yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800">
                      <TableHead className="text-gray-400">Order #</TableHead>
                      <TableHead className="text-gray-400">Date</TableHead>
                      <TableHead className="text-gray-400">Customer</TableHead>
                      <TableHead className="text-gray-400">Product</TableHead>
                      <TableHead className="text-gray-400">Total</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                      <TableHead className="text-gray-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => {
                      const StatusIcon = STATUS_ICONS[order.status] || Package;
                      return (
                        <TableRow key={order.id} className="border-gray-800">
                          <TableCell className="text-white font-medium">
                            #{order.id}
                          </TableCell>
                          <TableCell className="text-gray-400 text-sm">
                            {formatDate(order.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="text-white">{order.customerName}</div>
                            <div className="text-gray-500 text-sm">{order.customerEmail}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-white">{order.productName}</div>
                            <div className="text-gray-500 text-sm">Qty: {order.quantity}</div>
                          </TableCell>
                          <TableCell className="text-[#D4AF37] font-medium">
                            {formatPrice(order.totalAmount, order.currency)}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${STATUS_COLORS[order.status]} text-white`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openOrderDetail(order)}
                              className="border-gray-700 text-white hover:bg-gray-800"
                              data-testid={`button-view-order-${order.id}`}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#D4AF37]">
              Order #{selectedOrder?.id}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-gray-400 text-sm mb-1">Customer</h4>
                  <p className="text-white">{selectedOrder.customerName}</p>
                  <p className="text-gray-400 text-sm">{selectedOrder.customerEmail}</p>
                  {selectedOrder.customerPhone && (
                    <p className="text-gray-400 text-sm">{selectedOrder.customerPhone}</p>
                  )}
                </div>
                <div>
                  <h4 className="text-gray-400 text-sm mb-1">Shipping Address</h4>
                  <p className="text-white">{selectedOrder.shippingName}</p>
                  <p className="text-gray-400 text-sm">{selectedOrder.shippingAddress}</p>
                  {selectedOrder.shippingAddress2 && (
                    <p className="text-gray-400 text-sm">{selectedOrder.shippingAddress2}</p>
                  )}
                  <p className="text-gray-400 text-sm">
                    {selectedOrder.shippingCity}, {selectedOrder.shippingState} {selectedOrder.shippingZipCode}
                  </p>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <h4 className="text-gray-400 text-sm mb-2">Order Details</h4>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-white">{selectedOrder.productName}</p>
                    <p className="text-gray-400 text-sm">Quantity: {selectedOrder.quantity}</p>
                  </div>
                  <p className="text-[#D4AF37] font-bold text-lg">
                    {formatPrice(selectedOrder.totalAmount, selectedOrder.currency)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">Status</label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white" data-testid="select-order-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">Carrier</label>
                  <Select value={editCarrier} onValueChange={setEditCarrier}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white" data-testid="select-carrier">
                      <SelectValue placeholder="Select carrier" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="usps">USPS</SelectItem>
                      <SelectItem value="ups">UPS</SelectItem>
                      <SelectItem value="fedex">FedEx</SelectItem>
                      <SelectItem value="dhl">DHL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block">Tracking Number</label>
                <Input
                  value={editTracking}
                  onChange={(e) => setEditTracking(e.target.value)}
                  placeholder="Enter tracking number"
                  className="bg-gray-800 border-gray-700 text-white"
                  data-testid="input-tracking-number"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block">Admin Notes</label>
                <Textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Internal notes about this order..."
                  className="bg-gray-800 border-gray-700 text-white min-h-[80px]"
                  data-testid="textarea-admin-notes"
                />
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Created:</span>
                  <p className="text-white">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                <div>
                  <span className="text-gray-400">Shipped:</span>
                  <p className="text-white">{formatDate(selectedOrder.shippedAt)}</p>
                </div>
                <div>
                  <span className="text-gray-400">Delivered:</span>
                  <p className="text-white">{formatDate(selectedOrder.deliveredAt)}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDetailOpen(false)}
              className="border-gray-700 text-white hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateOrder}
              disabled={updateOrderMutation.isPending}
              className="bg-[#D4AF37] hover:bg-[#C4A030] text-black"
              data-testid="button-save-order"
            >
              {updateOrderMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
