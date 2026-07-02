import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe";
import { confirmUnsubscribeAction } from "@/app/newsletter/actions";

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

/**
 * Unsubscribe endpoint for email links. The HMAC token proves the request
 * came from an email we sent to this address and expires after 30 days.
 * The GET only shows a confirmation — the state change happens on POST, so
 * mail scanners that prefetch links can never unsubscribe anyone.
 */
export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; token?: string; done?: string }>;
}) {
  const { email, token, done } = await searchParams;
  const validLink = !!email && !!token && verifyUnsubscribeToken(email, token);

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
      {done === "1" ? (
        <PageHeader
          title="You're unsubscribed"
          description="You won't receive further newsletters at this address. Changed your mind? Sign up again anytime from the site footer."
          className="mx-auto"
        />
      ) : validLink ? (
        <>
          <PageHeader
            title="Unsubscribe from the newsletter?"
            description={`Confirm to stop receiving newsletters at ${email.trim().toLowerCase()}.`}
            className="mx-auto"
          />
          <form action={confirmUnsubscribeAction} className="mt-8">
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="token" value={token} />
            <Button type="submit">Unsubscribe me</Button>
          </form>
        </>
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
