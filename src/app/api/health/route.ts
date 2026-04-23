import { NextResponse } from "next/server";
import { getDefaultGenerationMode, getLlmProviderInfo, isLlmConfigured } from "@/lib/generation-service";
import { isDatabaseEnabled } from "@/lib/server-store";

export function GET() {
  const configured = isDatabaseEnabled();
  const defaultGenerationMode = getDefaultGenerationMode();
  const llmConfigured = isLlmConfigured();
  const llmProvider = getLlmProviderInfo();

  return NextResponse.json({
    ok: configured,
    generationMode: defaultGenerationMode,
    defaultGenerationMode,
    llmConfigured,
    aiProvider: llmProvider.provider,
    llmModel: llmProvider.model,
    persistence: configured ? "supabase" : "supabase-not-configured",
    error: configured
      ? null
      : "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable persistence."
  });
}
