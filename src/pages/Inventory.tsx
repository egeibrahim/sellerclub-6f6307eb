import { Layout } from "@/components/layout/Layout";
import { ProductGrid } from "@/components/inventory/ProductGrid";

export default function Inventory() {
  return (
    <Layout>
      <div className="h-[calc(100vh)]">
        <ProductGrid />
      </div>
    </Layout>
  );
}
