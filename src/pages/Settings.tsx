import { Layout } from "@/components/layout/Layout";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { Save } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();

  return (
    <Layout>
      <Header title="Settings" />

      <div className="p-6">
        <div className="max-w-2xl space-y-8">
          {/* Account */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Account</h2>
            <div className="border border-border bg-card p-4 space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email || ""} disabled className="bg-muted" />
              </div>
            </div>
          </section>

          {/* API Keys */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">API Configuration</h2>
            <div className="border border-border bg-card p-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                API keys are managed securely through environment variables. 
                Contact support to update your marketplace credentials.
              </p>
            </div>
          </section>

          {/* Save */}
          <div className="flex justify-end">
            <Button className="gap-2 bg-foreground text-background hover:bg-foreground/90">
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
