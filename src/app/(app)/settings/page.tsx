/**
 * Settings Page
 * User settings and preferences page
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface Settings {
  displayName: string;
  email: string;
  bio: string;
  notifications: boolean;
  emailDigest: boolean;
  publicProfile: boolean;
}

interface SettingsStatus {
  type: 'success' | 'error' | null;
  message: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<SettingsStatus>({ type: null, message: '' });
  const [settings, setSettings] = useState<Settings>({
    displayName: '',
    email: '',
    bio: '',
    notifications: true,
    emailDigest: false,
    publicProfile: true,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
    setStatus({ type: null, message: '' });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setSettings((prev) => ({ ...prev, [name]: checked }));
    setStatus({ type: null, message: '' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/settings', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(settings),
      // });

      // if (!response.ok) throw new Error('Failed to save settings');

      setStatus({ type: 'success', message: 'Settings saved successfully!' });
      setTimeout(() => setStatus({ type: null, message: '' }), 3000);
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to save settings',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = () => {
    setStatus({ type: 'success', message: 'Password reset email sent!' });
    setTimeout(() => setStatus({ type: null, message: '' }), 3000);
  };

  return (
    <main className="min-h-screen bg-background py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        {/* Status Messages */}
        {status.type && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
              status.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {status.type === 'success' ? (
              <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            )}
            <p>{status.message}</p>
          </div>
        )}

        {/* Profile Settings */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Profile Settings</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                name="displayName"
                type="text"
                value={settings.displayName}
                onChange={handleInputChange}
                placeholder="Your display name"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={settings.email}
                onChange={handleInputChange}
                placeholder="your.email@example.com"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                name="bio"
                value={settings.bio}
                onChange={handleInputChange}
                placeholder="Tell us about yourself"
                className="mt-2 w-full px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">Max 500 characters</p>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="publicProfile"
                  checked={settings.publicProfile}
                  onChange={handleCheckboxChange}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm">Make my profile public</span>
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                Allow others to find and visit your profile
              </p>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Saving...' : 'Save Profile Settings'}
            </Button>
          </form>
        </Card>

        {/* Notification Settings */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Notifications</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="notifications"
                checked={settings.notifications}
                onChange={handleCheckboxChange}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm">Enable push notifications</span>
            </label>
            <p className="text-xs text-muted-foreground">
              Get notified when you receive tips or messages
            </p>

            <label className="flex items-center gap-2 cursor-pointer mt-4">
              <input
                type="checkbox"
                name="emailDigest"
                checked={settings.emailDigest}
                onChange={handleCheckboxChange}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm">Weekly email digest</span>
            </label>
            <p className="text-xs text-muted-foreground">
              Receive a weekly summary of your tips and earnings
            </p>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSettings((prev) => ({
                  ...prev,
                  notifications: true,
                  emailDigest: false,
                }));
                setStatus({ type: 'success', message: 'Notification settings updated!' });
              }}
              className="w-full mt-4"
            >
              Save Notification Settings
            </Button>
          </div>
        </Card>

        {/* Security Settings */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Security</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Manage your password and account security
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={handleResetPassword}
                className="w-full"
              >
                Reset Password
              </Button>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground mb-4">
                Add an extra layer of security to your account
              </p>
              <Button type="button" variant="outline" disabled className="w-full">
                Coming Soon
              </Button>
            </div>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="p-6 border-red-200 bg-red-50">
          <h2 className="text-xl font-semibold mb-4 text-red-900">Danger Zone</h2>
          <div className="space-y-4">
            <p className="text-sm text-red-800">
              These actions cannot be undone. Please proceed with caution.
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-100"
              disabled
            >
              Delete Account
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
