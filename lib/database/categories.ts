import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CategoryListItem } from "@/lib/database/shapes";

export async function getActiveCategories(): Promise<CategoryListItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, name, description")
    .eq("is_active", true)
    .order("display_order")
    .order("name");
  if (error) throw new Error(`getActiveCategories failed: ${error.message}`);
  return data ?? [];
}

export interface CategoryDetail extends CategoryListItem {
  imagePath: string | null;
  related: CategoryListItem[];
}

export async function getCategoryBySlug(
  slug: string,
): Promise<CategoryDetail | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, name, description, image_path, parent_category_id")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw new Error(`getCategoryBySlug failed: ${error.message}`);
  if (!data) return null;

  const { data: related } = await supabase
    .from("categories")
    .select("id, slug, name, description")
    .eq("is_active", true)
    .neq("id", data.id)
    .order("display_order")
    .limit(4);

  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    description: data.description,
    imagePath: data.image_path,
    related: related ?? [],
  };
}
