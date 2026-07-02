import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { policies } from "@/lib/policies";

export const metadata: Metadata = {
  title: "Policies",
  description: "MadeHere's disclosure, editorial, privacy, and legal policies.",
};

export default function PoliciesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <PageHeader
        title="Policies"
        description="The rules we hold ourselves to. These documents are working templates pending qualified legal review before launch."
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {policies.map((policy) => (
          <Card key={policy.slug}>
            <CardHeader>
              <CardTitle>
                <Link
                  href={`/policies/${policy.slug}`}
                  className="hover:underline focus-visible:underline"
                >
                  {policy.title}
                </Link>
              </CardTitle>
              <CardDescription>{policy.summary}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
