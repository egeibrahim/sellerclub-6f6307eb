import { Layout } from "@/components/layout/Layout";
import { ProductGrid } from "@/components/inventory/ProductGrid";

export default function Inventory() {
  return (
    <Layout showHeader={true}>
      <div className="h-[calc(100vh-80px)]">
        <ProductGrid />
      </div>
    </Layout>
  );
}
