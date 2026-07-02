import type { Metadata } from "next";
import { Check } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Plans for Brands",
  description:
    "Basic, Verified, and Featured brand plans. Payment never influences manufacturing classifications or editorial decisions.",
};

interface Plan {
  name: string;
  price: string;
  cadence?: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}

const plans: Plan[] = [
  {
    name: "Basic",
    price: "Free",
    description: "A presence in the directory with the essentials.",
    features: [
      "Brand listing",
      "Core brand information",
      "Limited number of products",
      "Website link",
      "Profile-claim access",
      "Correction access",
    ],
  },
  {
    name: "Verified",
    price: "$999",
    cadence: "/year",
    description:
      "An expanded, evidence-reviewed profile with analytics and promotions.",
    features: [
      "Expanded brand profile",
      "Additional products",
      "Evidence-review workflow",
      "Profile analytics",
      "Promotions and discount codes",
      "Annual information review",
      "Verified designation only when evidence supports it",
    ],
    highlighted: true,
  },
  {
    name: "Featured",
    price: "$3,999",
    cadence: "/year",
    description: "Maximum visibility across the platform and newsletter.",
    features: [
      "Everything in Verified",
      "Featured category placement",
      "Eligible homepage placement",
      "Newsletter promotion opportunities",
      "Social-media promotion",
      "Product-launch promotion",
      "Enhanced analytics",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <PageHeader
        title="Plans for brands"
        description="Reach consumers actively searching for American-made products. Prices shown are introductory placeholders while we finalize launch."
      />

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={plan.highlighted ? "border-primary border-2" : undefined}
          >
            <CardHeader>
              {plan.highlighted && (
                <div>
                  <Badge>Most popular</Badge>
                </div>
              )}
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <p>
                <span className="font-serif text-3xl font-bold">
                  {plan.price}
                </span>
                {plan.cadence && (
                  <span className="text-muted-foreground text-sm">
                    {plan.cadence}
                  </span>
                )}
              </p>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2 text-sm">
                    <Check
                      aria-hidden="true"
                      className="text-primary mt-0.5 size-4 shrink-0"
                    />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-secondary mt-10 rounded-lg border p-6">
        <h2 className="font-serif text-lg font-bold">
          The line we never cross
        </h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Payment does not influence manufacturing classifications, verification
          decisions, editorial conclusions, or product recommendations. The
          Verified plan’s designation is granted only when evidence supports it,
          and an accurate correction is never suppressed for any subscriber.
        </p>
        <p className="text-muted-foreground mt-2 text-sm">
          Subscriptions open when our billing phase launches. Interested brands
          can start today by{" "}
          <a href="/submit" className="underline underline-offset-4">
            submitting a brand
          </a>
          .
        </p>
      </div>
    </div>
  );
}
