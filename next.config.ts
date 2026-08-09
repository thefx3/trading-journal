import type { NextConfig } from "next";

function getSupabaseImagePattern(): NonNullable<
  NonNullable<NextConfig["images"]>["remotePatterns"]
>[number] | null {
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!projectUrl) return null;

  try {
    const url = new URL(projectUrl);

    return {
      protocol: url.protocol.replace(":", "") as "http" | "https",
      hostname: url.hostname,
      port: url.port,
      pathname: "/storage/v1/object/sign/trade-charts/**",
    };
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must be a valid URL.");
  }
}

const supabaseImagePattern = getSupabaseImagePattern();

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: supabaseImagePattern ? [supabaseImagePattern] : [],
  },
};

export default nextConfig;
