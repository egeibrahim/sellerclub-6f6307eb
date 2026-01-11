-- Fix category_mappings INSERT policy to require user ownership
DROP POLICY IF EXISTS "Users can insert category mappings" ON public.category_mappings;
CREATE POLICY "Users can insert own category mappings" 
  ON public.category_mappings 
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Fix attribute_mappings INSERT policy to require user ownership
DROP POLICY IF EXISTS "Users can insert attribute mappings" ON public.attribute_mappings;
CREATE POLICY "Users can insert own attribute mappings" 
  ON public.attribute_mappings 
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id);