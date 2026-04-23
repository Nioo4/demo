import { ProjectDetails } from "@/components/ProjectDetails";

type ProjectDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProjectDetailsPage({ params }: ProjectDetailsPageProps) {
  const { id } = await params;
  return <ProjectDetails projectId={id} />;
}
