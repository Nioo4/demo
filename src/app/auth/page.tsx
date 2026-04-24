import { AuthForm } from "@/components/AuthForm";

type AuthPageProps = {
  searchParams: Promise<{
    next?: string;
  }>;
};

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const { next } = await searchParams;
  return (
    <main className="page-stack">
      <AuthForm nextPath={next && next.startsWith("/") ? next : "/builder"} />
    </main>
  );
}
