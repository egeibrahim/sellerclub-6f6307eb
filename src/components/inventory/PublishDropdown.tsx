import { useState } from "react";
import { ChevronDown, Send, FileText, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

interface PublishDropdownProps {
  listingIds: string[];
  shopConnectionId: string | null;
  platform: string;
  onSuccess?: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export const PublishDropdown = ({
  listingIds,
  shopConnectionId,
  platform,
  onSuccess,
  variant = 'default',
  size = 'default',
  className,
}: PublishDropdownProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date>();
  const [scheduleTime, setScheduleTime] = useState('12:00');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handlePublish = async (status: 'active' | 'draft') => {
    if (listingIds.length === 0) return;

    setIsLoading(true);
    try {
      // Update listing status
      const { error: updateError } = await supabase
        .from('marketplace_listings')
        .update({ 
          status,
          sync_status: status === 'active' ? 'pending' : 'draft',
          updated_at: new Date().toISOString(),
        })
        .in('id', listingIds);

      if (updateError) throw updateError;

      // If publishing, trigger sync
      if (status === 'active' && shopConnectionId) {
        const syncFunctionMap: Record<string, string> = {
          etsy: 'marketplace-sync',
          trendyol: 'trendyol-sync',
          hepsiburada: 'hepsiburada-sync',
          amazon: 'amazon-sync',
          shopify: 'marketplace-sync',
          ikas: 'ikas-sync',
          n11: 'n11-sync',
          ciceksepeti: 'ciceksepeti-sync',
        };

        const functionName = syncFunctionMap[platform.toLowerCase()] || 'marketplace-sync';

        await supabase.functions.invoke(functionName, {
          body: {
            action: 'push',
            connectionId: shopConnectionId,
            listingIds,
          },
        });
      }

      queryClient.invalidateQueries({ queryKey: ['marketplace-listings'] });
      queryClient.invalidateQueries({ queryKey: ['listing-counts'] });

      toast({
        title: status === 'active' ? "Published!" : "Saved as Draft",
        description: `${listingIds.length} listing(s) ${status === 'active' ? 'published' : 'saved as draft'}.`,
      });

      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update listings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSchedule = async () => {
    if (!scheduleDate || listingIds.length === 0) return;

    setIsLoading(true);
    try {
      const scheduledDateTime = new Date(scheduleDate);
      const [hours, minutes] = scheduleTime.split(':').map(Number);
      scheduledDateTime.setHours(hours, minutes, 0, 0);

      // Update listings with scheduled status
      const { error } = await supabase
        .from('marketplace_listings')
        .update({ 
          status: 'staging',
          sync_status: 'scheduled',
          updated_at: new Date().toISOString(),
        })
        .in('id', listingIds);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['marketplace-listings'] });
      queryClient.invalidateQueries({ queryKey: ['listing-counts'] });

      toast({
        title: "Scheduled!",
        description: `${listingIds.length} listing(s) scheduled for ${format(scheduledDateTime, 'PPP p')}.`,
      });

      setShowScheduleDialog(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to schedule listings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={variant} 
            size={size}
            disabled={isLoading || listingIds.length === 0}
            className={cn("gap-1", className)}
          >
            <Send className="h-4 w-4" />
            Publish
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handlePublish('active')}>
            <Send className="h-4 w-4 mr-2" />
            Publish Now
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handlePublish('draft')}>
            <FileText className="h-4 w-4 mr-2" />
            Save as Draft
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowScheduleDialog(true)}>
            <Clock className="h-4 w-4 mr-2" />
            Schedule...
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Schedule Publish</DialogTitle>
            <DialogDescription>
              Choose when to publish {listingIds.length} listing(s)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Calendar
              mode="single"
              selected={scheduleDate}
              onSelect={setScheduleDate}
              disabled={(date) => date < new Date()}
              className="rounded-md border"
            />

            <div className="space-y-2">
              <Label htmlFor="schedule-time">Time</Label>
              <Input
                id="schedule-time"
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSchedule}
                disabled={!scheduleDate || isLoading}
              >
                {isLoading ? "Scheduling..." : "Schedule"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
