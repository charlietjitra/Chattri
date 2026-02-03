'use client'

import { useState, useEffect } from 'react'
import { adminApi } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Settings, 
  Save,
  RefreshCw,
  Shield,
  Globe,
  Users,
  Bell,
  Database
} from 'lucide-react'

interface PlatformSettings {
  platform: {
    name: string
    version: string
    maintenance: boolean
  }
  features: {
    registrationEnabled: boolean
    reviewsEnabled: boolean
    notificationsEnabled: boolean
  }
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const data = await adminApi.getSettings()
      setSettings(data.settings)
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!settings) return

    try {
      setSaving(true)
      await adminApi.updateSettings(settings)
      setLastSaved(new Date().toLocaleTimeString())
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const updatePlatformSetting = (key: string, value: any) => {
    setSettings(prev => prev ? {
      ...prev,
      platform: {
        ...prev.platform,
        [key]: value
      }
    } : null)
  }

  const updateFeatureSetting = (key: string, value: boolean) => {
    setSettings(prev => prev ? {
      ...prev,
      features: {
        ...prev.features,
        [key]: value
      }
    } : null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="text-center py-8">
        <Settings className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Settings not available</h3>
        <p className="mt-1 text-sm text-gray-500">Unable to load platform settings.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Platform Settings</h1>
          <p className="text-gray-600 mt-2">Configure platform behavior and features</p>
        </div>
        <div className="flex items-center space-x-3">
          {lastSaved && (
            <span className="text-sm text-gray-500">
              Last saved: {lastSaved}
            </span>
          )}
          <Button
            onClick={loadSettings}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleSaveSettings}
            disabled={saving}
          >
            <Save className={`w-4 h-4 mr-2 ${saving ? 'animate-spin' : ''}`} />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Platform Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="w-5 h-5" />
            <span>Platform Information</span>
          </CardTitle>
          <CardDescription>
            Basic platform configuration and metadata
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="platformName">Platform Name</Label>
            <Input
              id="platformName"
              value={settings.platform.name}
              onChange={(e) => updatePlatformSetting('name', e.target.value)}
              placeholder="Enter platform name"
            />
          </div>
          
          <div>
            <Label htmlFor="platformVersion">Version</Label>
            <Input
              id="platformVersion"
              value={settings.platform.version}
              onChange={(e) => updatePlatformSetting('version', e.target.value)}
              placeholder="Enter version"
            />
          </div>

          <div>
            <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
            <Select 
              value={settings.platform.maintenance ? "enabled" : "disabled"} 
              onValueChange={(value) => updatePlatformSetting('maintenance', value === "enabled")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="disabled">Disabled</SelectItem>
                <SelectItem value="enabled">Enabled</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500 mt-1">
              When enabled, only admins can access the platform
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Feature Toggles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Feature Controls</span>
          </CardTitle>
          <CardDescription>
            Enable or disable platform features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium text-gray-900">User Registration</div>
                <div className="text-sm text-gray-500">
                  Allow new users to register accounts
                </div>
              </div>
            </div>
            <Select 
              value={settings.features.registrationEnabled ? "enabled" : "disabled"} 
              onValueChange={(value) => updateFeatureSetting('registrationEnabled', value === "enabled")}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="enabled">Enabled</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <Settings className="w-5 h-5 text-purple-600" />
              <div>
                <div className="font-medium text-gray-900">Reviews System</div>
                <div className="text-sm text-gray-500">
                  Allow students to leave reviews for tutors
                </div>
              </div>
            </div>
            <Select 
              value={settings.features.reviewsEnabled ? "enabled" : "disabled"} 
              onValueChange={(value) => updateFeatureSetting('reviewsEnabled', value === "enabled")}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="enabled">Enabled</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <Bell className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-medium text-gray-900">Notifications</div>
                <div className="text-sm text-gray-500">
                  Send email and in-app notifications to users
                </div>
              </div>
            </div>
            <Select 
              value={settings.features.notificationsEnabled ? "enabled" : "disabled"} 
              onValueChange={(value) => updateFeatureSetting('notificationsEnabled', value === "enabled")}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="enabled">Enabled</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="w-5 h-5" />
            <span>System Information</span>
          </CardTitle>
          <CardDescription>
            Read-only system information and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-900">Environment</div>
              <div className="text-sm text-gray-600">Production</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-900">Database Status</div>
              <div className="text-sm text-green-600">Connected</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-900">Last Backup</div>
              <div className="text-sm text-gray-600">2 hours ago</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Actions */}
      <div className="flex justify-end">
        <Button
          onClick={handleSaveSettings}
          disabled={saving}
          size="lg"
        >
          <Save className={`w-4 h-4 mr-2 ${saving ? 'animate-spin' : ''}`} />
          {saving ? 'Saving Changes...' : 'Save All Changes'}
        </Button>
      </div>
    </div>
  )
}