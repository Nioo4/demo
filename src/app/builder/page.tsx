import { BuilderWorkspace } from "@/components/BuilderWorkspace";
import { getSamplePrompt } from "@/lib/mock-generator";

type BuilderPageProps = {
  searchParams: Promise<{
    projectId?: string;
  }>;
};

export default async function BuilderPage({ searchParams }: BuilderPageProps) {
  const { projectId } = await searchParams;
  return <BuilderWorkspace samplePrompt={getSamplePrompt()} initialProjectId={projectId ?? null} />;
}
