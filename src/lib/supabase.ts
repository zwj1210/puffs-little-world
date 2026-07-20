import { createClient } from "@supabase/supabase-js";

export const ADMIN_EMAIL = "864164927@qq.com";
export const supabase = createClient(
  "https://afnskjygpnqudyxzyasc.supabase.co",
  "sb_publishable_6hNSvsOtrVuFuzeTFb44wg_SC5MGHhp",
);

export const ASSET_BUCKET = "media-assets";
