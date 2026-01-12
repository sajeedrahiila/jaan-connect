import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useSupabaseAuth } from '@/hooks/useAuth-local';
import { useToast } from '@/hooks/use-toast';
import { Loader2, DollarSign, Percent, Truck } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function SettingsPage() {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [taxRate, setTaxRate] = useState('0.08');
  const [defaultShipping, setDefaultShipping] = useState('10.00');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('100.00');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('session_token');
      const res = await fetch(`${API_URL}/api/admin/settings/financial`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });
      
      if (res.ok) {
        const result = await res.json();
        result.data.forEach((setting: any) => {
          if (setting.key === 'tax_rate') setTaxRate(setting.value);
          if (setting.key === 'default_shipping_fee') setDefaultShipping(setting.value);
          if (setting.key === 'free_shipping_threshold') setFreeShippingThreshold(setting.value);
        });
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: string) => {
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch(`${API_URL}/api/admin/settings/${key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ value }),
      });
      
      if (!res.ok) throw new Error('Failed to update setting');
      return true;
    } catch (error) {
      console.error('Failed to update setting:', error);
      return false;
    }
  };

  const handleSaveFinancialSettings = async () => {
    setSaving(true);
    try {
      const results = await Promise.all([
        updateSetting('tax_rate', taxRate),
        updateSetting('default_shipping_fee', defaultShipping),
        updateSetting('free_shipping_threshold', freeShippingThreshold),
      ]);
      
      if (results.every(r => r)) {
        toast({
          title: 'Settings saved',
          description: 'Financial settings have been updated successfully',
        });
      } else {
        throw new Error('Some settings failed to update');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage system settings and preferences</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Financial Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financial Settings
              </CardTitle>
              <CardDescription>
                Configure tax rates and shipping fees for orders and invoices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="tax_rate" className="flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  Tax Rate
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="tax_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    className="max-w-xs"
                  />
                  <span className="text-sm text-muted-foreground">
                    ({(parseFloat(taxRate) * 100).toFixed(2)}%)
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Default sales tax rate applied to orders and invoices (e.g., 0.08 for 8%)
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="default_shipping" className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Default Shipping Fee
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">$</span>
                  <Input
                    id="default_shipping"
                    type="number"
                    step="0.01"
                    min="0"
                    value={defaultShipping}
                    onChange={(e) => setDefaultShipping(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Standard shipping fee charged on orders (can be waived by admin)
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="free_shipping_threshold">Free Shipping Threshold</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">$</span>
                  <Input
                    id="free_shipping_threshold"
                    type="number"
                    step="0.01"
                    min="0"
                    value={freeShippingThreshold}
                    onChange={(e) => setFreeShippingThreshold(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Orders above this amount qualify for free shipping
                </p>
              </div>

              <div className="pt-4">
                <Button onClick={handleSaveFinancialSettings} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Financial Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Profile Settings */}
          <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={user?.email || ''}
              disabled
              className="bg-muted"
            />
            <p className="text-sm text-muted-foreground">
              Your email address is managed through authentication
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Configure how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive email alerts for important events
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>New Order Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when a new order is placed
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Low Stock Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when products are running low
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Manage your security settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline">Change Password</Button>
          <p className="text-sm text-muted-foreground">
            You will receive an email with instructions to reset your password
          </p>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive">Delete Account</Button>
          <p className="text-sm text-muted-foreground mt-2">
            This action cannot be undone. All your data will be permanently deleted.
          </p>
        </CardContent>
      </Card>
        </>
      )}
    </div>
  );
}
