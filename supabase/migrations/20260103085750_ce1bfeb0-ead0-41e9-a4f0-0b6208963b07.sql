-- Enable pg_net extension for HTTP requests from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create low_stock_alerts table
CREATE TABLE IF NOT EXISTS public.low_stock_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  master_listing_id uuid REFERENCES public.master_listings(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.master_listing_variants(id) ON DELETE SET NULL,
  product_title text NOT NULL,
  variant_name text,
  current_stock integer NOT NULL DEFAULT 0,
  threshold integer NOT NULL DEFAULT 10,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on low_stock_alerts
ALTER TABLE public.low_stock_alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies for low_stock_alerts
CREATE POLICY "Users can view own low stock alerts"
  ON public.low_stock_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own low stock alerts"
  ON public.low_stock_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own low stock alerts"
  ON public.low_stock_alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own low stock alerts"
  ON public.low_stock_alerts FOR DELETE
  USING (auth.uid() = user_id);

-- Add low_stock_threshold column to master_listings if not exists
ALTER TABLE public.master_listings 
  ADD COLUMN IF NOT EXISTS low_stock_threshold integer NOT NULL DEFAULT 10;

-- Add tracking_number column to orders if not exists
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS tracking_number text,
  ADD COLUMN IF NOT EXISTS tracking_company text,
  ADD COLUMN IF NOT EXISTS status_synced_at timestamptz;

-- Function to check low stock and create alerts
CREATE OR REPLACE FUNCTION public.check_and_create_low_stock_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_threshold integer;
  v_title text;
  v_existing_alert uuid;
BEGIN
  -- Get threshold from master listing
  SELECT low_stock_threshold, title INTO v_threshold, v_title
  FROM public.master_listings
  WHERE id = NEW.master_listing_id;

  -- Check if stock is below threshold
  IF NEW.stock <= v_threshold THEN
    -- Check if alert already exists for this variant (unread)
    SELECT id INTO v_existing_alert
    FROM public.low_stock_alerts
    WHERE variant_id = NEW.id AND is_read = false;

    -- Create alert if doesn't exist
    IF v_existing_alert IS NULL THEN
      INSERT INTO public.low_stock_alerts (
        user_id, master_listing_id, variant_id, product_title, variant_name, current_stock, threshold
      )
      VALUES (
        NEW.user_id, NEW.master_listing_id, NEW.id, v_title, NEW.name, NEW.stock, v_threshold
      );
    ELSE
      -- Update existing alert with new stock level
      UPDATE public.low_stock_alerts
      SET current_stock = NEW.stock, created_at = now()
      WHERE id = v_existing_alert;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger for low stock check on variant update
DROP TRIGGER IF EXISTS check_low_stock_on_variant_update ON public.master_listing_variants;
CREATE TRIGGER check_low_stock_on_variant_update
  AFTER UPDATE OF stock ON public.master_listing_variants
  FOR EACH ROW
  WHEN (NEW.stock < OLD.stock)
  EXECUTE FUNCTION public.check_and_create_low_stock_alert();

-- Trigger for low stock check on variant insert
DROP TRIGGER IF EXISTS check_low_stock_on_variant_insert ON public.master_listing_variants;
CREATE TRIGGER check_low_stock_on_variant_insert
  AFTER INSERT ON public.master_listing_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.check_and_create_low_stock_alert();

-- Function to update sales analytics when order is inserted/updated
CREATE OR REPLACE FUNCTION public.update_sales_analytics_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_date date;
  v_items_count integer;
BEGIN
  v_date := DATE(NEW.order_date);
  
  -- Count items in the order
  v_items_count := jsonb_array_length(NEW.items);

  -- Upsert sales analytics
  INSERT INTO public.sales_analytics (
    user_id, marketplace, date, orders_count, total_revenue, total_items_sold, average_order_value
  )
  VALUES (
    NEW.user_id, NEW.marketplace, v_date, 1, NEW.total_amount, v_items_count, NEW.total_amount
  )
  ON CONFLICT (user_id, marketplace, date) 
  DO UPDATE SET
    orders_count = sales_analytics.orders_count + 1,
    total_revenue = sales_analytics.total_revenue + EXCLUDED.total_revenue,
    total_items_sold = sales_analytics.total_items_sold + EXCLUDED.total_items_sold,
    average_order_value = (sales_analytics.total_revenue + EXCLUDED.total_revenue) / (sales_analytics.orders_count + 1),
    updated_at = now();

  RETURN NEW;
END;
$$;

-- Add unique constraint for upsert (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sales_analytics_user_marketplace_date_key'
  ) THEN
    ALTER TABLE public.sales_analytics 
      ADD CONSTRAINT sales_analytics_user_marketplace_date_key UNIQUE (user_id, marketplace, date);
  END IF;
END $$;

-- Trigger for sales analytics update on new order
DROP TRIGGER IF EXISTS update_sales_analytics_on_order_insert ON public.orders;
CREATE TRIGGER update_sales_analytics_on_order_insert
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_sales_analytics_on_order();