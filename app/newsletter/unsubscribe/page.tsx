import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { buttonVariants } from "@/components/ui/button";
import { unsubscribeByToken } from "@/app/newsletter/actions";

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

/**
 * One-click unsubscribe endpoint for email links. The HMAC token proves the
 * request came from an email we sent to this address; invalid tokens do
 * nothing (and reveal nothing about whether the address is subscribed).
 */
export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; token?: string }>;
}) {
  const { email, token } = await searchParams;
  const ok = email && token ? await unsubscribeByToken(email, token) : false;

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
      {ok ? (
        <PageHeader
          title="You're unsubscribed"
          description="You won't receive further newsletters at this address. Changed your mind? Sign up again anytime from the site footer."
          className="mx-auto"
        />
      ) : (
        <PageHeader
          title="Unsubscribe link invalid"
          description="This link is incomplete or expired. Use the unsubscribe link from the bottom of any newsletter, or contact us and we'll remove you manually."
          className="mx-auto"
        />
      )}
      <div className="mt-8">
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Back to MadeHere
        </Link>
      </div>
    </div>
  );
}
