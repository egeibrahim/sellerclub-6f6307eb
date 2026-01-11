import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { LogOut, Plus, Settings as SettingsIcon, Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useMarketplaceConnections } from "@/hooks/useMarketplaceConnections";
import { PlatformLogo } from "@/components/common/PlatformLogos";
import { toast } from "sonner";

// Mock data for demonstration
const mockPaymentHistory = [
  { date: "Dec 20, 2025", billedTo: "Mastercard ••••0787", status: "Paid", amount: "₺499.00" },
  { date: "Nov 20, 2025", billedTo: "Mastercard ••••0787", status: "Paid", amount: "₺499.00" },
  { date: "Oct 20, 2025", billedTo: "Mastercard ••••0787", status: "Paid", amount: "₺499.00" },
];

export default function Billing() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { connections } = useMarketplaceConnections();
  const [selectedShopTab, setSelectedShopTab] = useState<string | null>(null);

  const connectedShops = connections?.filter(c => c.is_active) || [];

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  // Stats
  const shopsConnected = connectedShops.length;
  const litePlans = connectedShops.filter(s => true).length; // Mock: all are lite
  const plusPlans = 0;
  const monthlyTotal = litePlans * 499;

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
        <div className="max-w-5xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M3 9H21" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <h1 className="text-xl font-semibold text-gray-900">Billing</h1>
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

          {/* Multi-shop discount banner */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Multi-shop discount</h3>
                <p className="text-sm text-gray-600">
                  Connect multiple shops to receive <span className="font-semibold">20% off</span> all shops
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add shop
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">Shops connected</p>
              <p className="text-3xl font-bold text-gray-900">{shopsConnected}</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">Seller Club Lite</p>
              <p className="text-3xl font-bold text-gray-900">{litePlans}</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">Seller Club Plus</p>
              <p className="text-3xl font-bold text-gray-900">{plusPlans}</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">Monthly total</p>
              <p className="text-3xl font-bold text-gray-900">₺{monthlyTotal.toFixed(2)}</p>
            </div>
          </div>

          {/* Shops Table */}
          <div className="border border-gray-200 rounded-lg mb-8">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-sm font-medium text-gray-500 p-4">Shop</th>
                  <th className="text-left text-sm font-medium text-gray-500 p-4">Listings</th>
                  <th className="text-left text-sm font-medium text-gray-500 p-4">Price</th>
                  <th className="text-left text-sm font-medium text-gray-500 p-4">Billing cycle</th>
                  <th className="text-left text-sm font-medium text-gray-500 p-4">Plan</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {connectedShops.length > 0 ? (
                  connectedShops.map((shop) => (
                    <tr key={shop.id} className="border-b border-gray-100 last:border-0">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <PlatformLogo platform={shop.marketplace} size={32} />
                          <span className="font-medium text-gray-900">{shop.store_name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-600">-</td>
                      <td className="p-4 text-gray-900">₺499.00</td>
                      <td className="p-4 text-gray-600">-</td>
                      <td className="p-4">
                        <Badge variant="outline" className="gap-1 text-primary border-primary">
                          <Sparkles className="h-3 w-3" />
                          Lite
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <SettingsIcon className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      No shops connected yet. Connect your first shop to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Payment Method */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment method</h2>
            <div className="border border-gray-200 rounded-lg p-4 inline-flex items-center gap-4">
              <div className="w-12 h-8 bg-gradient-to-r from-red-500 to-yellow-500 rounded flex items-center justify-center">
                <div className="flex">
                  <div className="w-4 h-4 bg-red-600 rounded-full opacity-80" />
                  <div className="w-4 h-4 bg-yellow-500 rounded-full -ml-2 opacity-80" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Mastercard ••••0787</p>
                <p className="text-xs text-gray-500">Exp. date 10/29</p>
              </div>
              <Button variant="outline" size="sm">
                Edit
              </Button>
            </div>
          </section>

          {/* Payment History */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment history</h2>
            
            {connectedShops.length > 0 && (
              <Tabs value={selectedShopTab || connectedShops[0]?.id} onValueChange={setSelectedShopTab} className="mb-4">
                <TabsList className="h-auto p-1 bg-transparent border-b border-gray-200 rounded-none w-full justify-start gap-2">
                  {connectedShops.map((shop) => (
                    <TabsTrigger
                      key={shop.id}
                      value={shop.id}
                      className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent px-4 py-2"
                    >
                      <PlatformLogo platform={shop.marketplace} size={20} />
                      {shop.store_name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}

            <div className="border border-gray-200 rounded-lg">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left text-sm font-medium text-gray-500 p-4">Billing date</th>
                    <th className="text-left text-sm font-medium text-gray-500 p-4">Billed to</th>
                    <th className="text-left text-sm font-medium text-gray-500 p-4">Status</th>
                    <th className="text-left text-sm font-medium text-gray-500 p-4">Amount</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {mockPaymentHistory.map((payment, index) => (
                    <tr key={index} className="border-b border-gray-100 last:border-0">
                      <td className="p-4 text-gray-900">{payment.date}</td>
                      <td className="p-4 text-gray-600">{payment.billedTo}</td>
                      <td className="p-4">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {payment.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-gray-900">{payment.amount}</td>
                      <td className="p-4">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Download className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
