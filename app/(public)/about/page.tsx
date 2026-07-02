import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "About",
  description:
    "MadeHere helps consumers find American-made products and review the evidence behind manufacturing claims.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <PageHeader
        title="About MadeHere"
        description="A research tool for people who want to know where their products are actually made."
      />
      <div className="text-muted-foreground mt-8 space-y-4">
        <p>
          “Made in USA” gets claimed far more often than it gets supported.
          MadeHere exists to close that gap: we catalog American-made consumer
          brands and products, classify manufacturing claims honestly at the
          product level, and show you the evidence — sources, dates, and review
          status — behind every status we publish.
        </p>
        <p>
          We are an independent editorial platform, not a certification body,
          and not political advocacy. Supporting domestic manufacturing is a
          practical consumer choice; our job is to make it an informed one.
        </p>
        <p>
          MadeHere earns revenue from affiliate commissions and paid brand
          subscriptions. Both are firewalled from editorial decisions: paid
          placement is always labeled, and payment can never change a
          manufacturing classification, suppress a correction, or buy a
          recommendation. Read{" "}
          <Link
            href="/methodology"
            className="text-foreground underline underline-offset-4"
          >
            our methodology
          </Link>{" "}
          for the full standard.
        </p>
      </div>
    </div>
  );
}
