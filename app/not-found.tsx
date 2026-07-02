import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
        404
      </p>
      <h1 className="mt-2 font-serif text-3xl font-bold">Page not found</h1>
      <p className="text-muted-foreground mt-3 max-w-md">
        The page you’re looking for doesn’t exist or may have moved.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/" className={buttonVariants()}>
          Go home
        </Link>
        <Link href="/brands" className={buttonVariants({ variant: "outline" })}>
          Browse brands
        </Link>
      </div>
    </div>
  );
}
