import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ShopProvider } from "@/contexts/ShopContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ShopChangeDialog } from "@/components/layout/ShopChangeDialog";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Inventory from "./pages/Inventory";
import ListingNew from "./pages/ListingNew";
import UniversalListingNew from "./pages/UniversalListingNew";
import TrendyolListingNew from "./pages/TrendyolListingNew";
import HepsiburadaListingNew from "./pages/HepsiburadaListingNew";
import IkasListingNew from "./pages/IkasListingNew";
import VelaStyleListing from "./pages/VelaStyleListing";
import EtsyStyleMasterListing from "./pages/EtsyStyleMasterListing";
import AmazonListingNew from "./pages/AmazonListingNew";
import ProductEdit from "./pages/ProductEdit";
import Orders from "./pages/Orders";
import Analytics from "./pages/Analytics";
import Pricing from "./pages/Pricing";
import Connections from "./pages/Connections";
import Categories from "./pages/Categories";
import Settings from "./pages/Settings";
import Billing from "./pages/Billing";
import MasterListings from "./pages/MasterListings";
import BulkEdit from "./pages/BulkEdit";
import Studio from "./pages/Studio";
import Profiles from "./pages/Profiles";
import NotFound from "./pages/NotFound";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ShopProvider>
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ShopChangeDialog />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            {/* Redirect /listing to /inventory */}
            <Route path="/listing" element={<Navigate to="/inventory" replace />} />
            <Route path="/listings" element={<Navigate to="/inventory" replace />} />
            <Route
              path="/inventory"
              element={
                <ProtectedRoute>
                  <Inventory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory/new"
              element={
                <ProtectedRoute>
                  <UniversalListingNew />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory/new/:platform"
              element={
                <ProtectedRoute>
                  <UniversalListingNew />
                </ProtectedRoute>
              }
            />
            {/* Edit Routes */}
            <Route
              path="/listing/:id/edit"
              element={
                <ProtectedRoute>
                  <ProductEdit />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trendyol-listing/:id/edit"
              element={
                <ProtectedRoute>
                  <ProductEdit />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hepsiburada-listing/:id/edit"
              element={
                <ProtectedRoute>
                  <ProductEdit />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ikas-listing/:id/edit"
              element={
                <ProtectedRoute>
                  <ProductEdit />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vela-listing"
              element={
                <ProtectedRoute>
                  <VelaStyleListing />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vela-listing/:id"
              element={
                <ProtectedRoute>
                  <VelaStyleListing />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <Orders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pricing"
              element={
                <ProtectedRoute>
                  <Pricing />
                </ProtectedRoute>
              }
            />
            <Route
              path="/connections"
              element={
                <ProtectedRoute>
                  <Connections />
                </ProtectedRoute>
              }
            />
            <Route
              path="/categories"
              element={
                <ProtectedRoute>
                  <Categories />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/billing"
              element={
                <ProtectedRoute>
                  <Billing />
                </ProtectedRoute>
              }
            />
            <Route
              path="/master-listings"
              element={
                <ProtectedRoute>
                  <MasterListings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/master-listings/new"
              element={
                <ProtectedRoute>
                  <EtsyStyleMasterListing />
                </ProtectedRoute>
              }
            />
            <Route
              path="/master-listings/:id"
              element={
                <ProtectedRoute>
                  <EtsyStyleMasterListing />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory/bulk-edit"
              element={
                <ProtectedRoute>
                  <BulkEdit />
                </ProtectedRoute>
              }
            />
            <Route
              path="/studio"
              element={
                <ProtectedRoute>
                  <Studio />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profiles"
              element={
                <ProtectedRoute>
                  <Profiles />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </TooltipProvider>
      </ShopProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
