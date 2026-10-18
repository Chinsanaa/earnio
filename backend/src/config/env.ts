export interface EnvConfig {
  port: number;
  frontendUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  nodeEnv: string;
  trustProxyHops: number;
}

export function loadEnvConfig(): EnvConfig {
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY?.trim() || process.env.SUPABASE_KEY?.trim();

  if (!supabaseUrl) {
    throw new Error('Missing required environment variable: SUPABASE_URL');
  }
  if (!supabaseAnonKey) {
    throw new Error('Missing required environment variable: SUPABASE_ANON_KEY');
  }

  return {
    port: Number(process.env.PORT) || 3001,
    frontendUrl: (process.env.FRONTEND_URL?.trim() || 'http://localhost:3000').replace(/\/$/, ''),
    supabaseUrl,
    supabaseAnonKey,
    nodeEnv: process.env.NODE_ENV?.trim() || 'development',
    trustProxyHops: parseTrustProxyHops(process.env.TRUST_PROXY_HOPS),
  };
}

function parseTrustProxyHops(value: string | undefined): number {
  const hops = Number(value);
  return Number.isInteger(hops) && hops >= 0 && hops <= 5 ? hops : 1;
}
