import { Layout } from "@/components/layout/Layout";
import { Header } from "@/components/layout/Header";
import { PricingRulesList } from "@/components/pricing/PricingRulesList";

export default function Pricing() {
  return (
    <Layout>
      <Header title="Fiyat Yönetimi" />
      <div className="p-6">
        <PricingRulesList />
      </div>
    </Layout>
  );
}
