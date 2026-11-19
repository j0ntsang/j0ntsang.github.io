import { Link } from "react-aria-components";
import { PageHeader } from "@/components/PlannedSources";

export function NotFoundPage() {
  return (
    <>
      <PageHeader title="Page not found" summary="There's nothing at this address." />
      <Link href="/" className="text-accent underline-offset-2 hover:underline">
        Back to today
      </Link>
    </>
  );
}
