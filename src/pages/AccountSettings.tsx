import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AccountSettings() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [theme, setTheme] = useState("light");
  const [syncWithOS, setSyncWithOS] = useState(false);
  const [saving, setSaving] = useState(false);

  const userInitials = user?.email?.slice(0, 2).toUpperCase() || "SC";

  const handleSave = async () => {
    setSaving(true);
    try {
      // Here you would save to profiles table
      toast.success("Değişiklikler kaydedildi");
    } catch (error) {
      toast.error("Bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <aside className="w-56 border-r border-gray-200 p-4">
        <h2 className="text-sm font-medium text-gray-900 mb-4">Account settings</h2>
        <nav className="space-y-1">
          <Link
            to="/settings"
            className={`block px-3 py-2 text-sm rounded-md transition-colors ${
              location.pathname === "/settings"
                ? "bg-gray-100 text-gray-900 font-medium"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Account settings
          </Link>
          <Link
            to="/settings/billing"
            className={`block px-3 py-2 text-sm rounded-md transition-colors ${
              location.pathname === "/settings/billing"
                ? "bg-gray-100 text-gray-900 font-medium"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Billing
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M3 9H21" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <h1 className="text-xl font-semibold text-gray-900">Account settings</h1>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </Button>
          </div>

          {/* Appearance */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Appearance</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="syncOS"
                  checked={syncWithOS}
                  onCheckedChange={(checked) => setSyncWithOS(checked as boolean)}
                />
                <div>
                  <Label htmlFor="syncOS" className="text-sm font-medium text-gray-900">
                    Sync with OS settings
                  </Label>
                  <p className="text-sm text-gray-500">
                    Automatically switch between light and dark themes when your system does.
                  </p>
                </div>
              </div>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light mode</SelectItem>
                  <SelectItem value="dark">Dark mode</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </section>

          {/* Contact Information */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact information</h2>
            <div className="space-y-6">
              {/* Avatar */}
              <div className="relative inline-block">
                <Avatar className="w-20 h-20 text-2xl">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-green-500 text-white">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <button className="absolute bottom-0 right-0 w-6 h-6 bg-white border border-gray-300 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter last name"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Email */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Email</h2>
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-gray-500">Current Email</Label>
                <p className="text-sm text-gray-900 mt-1">{user?.email}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newEmail">New Email</Label>
                <Input
                  id="newEmail"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Enter new email"
                  className="max-w-md"
                />
              </div>
            </div>
          </section>

          {/* Password */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Password</h2>
            <Button variant="outline" size="sm">
              Change password
            </Button>
          </section>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleSave}
              disabled={saving}
              className="bg-primary hover:bg-primary/90"
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
