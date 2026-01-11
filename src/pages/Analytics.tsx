import { Layout } from "@/components/layout/Layout";
import { Header } from "@/components/layout/Header";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";

export default function Analytics() {
  return (
    <Layout showHeader={false}>
      <Header title="Raporlar" />
      <div className="p-6">
        <AnalyticsDashboard />
      </div>
    </Layout>
  );
}
