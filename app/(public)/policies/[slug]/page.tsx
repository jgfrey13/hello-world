import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PageHeader } from "@/components/ui/page-header";
import { getPolicy, policies } from "@/lib/policies";

export function generateStaticParams() {
  return policies.map((policy) => ({ slug: policy.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const policy = getPolicy(slug);
  if (!policy) return {};
  return { title: policy.title, description: policy.summary };
}

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const policy = getPolicy(slug);
  if (!policy) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Policies", href: "/policies" },
          { label: policy.title },
        ]}
        className="mb-6"
      />
      <PageHeader title={policy.title} description={policy.summary} />
      <p className="text-muted-foreground mt-4 rounded-md border border-dashed px-4 py-2.5 text-sm">
        Template draft — this document requires qualified legal review before
        launch.
      </p>
      <div className="mt-8 space-y-8">
        {policy.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-serif text-xl font-bold">{section.heading}</h2>
            <p className="text-muted-foreground mt-2">{section.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
