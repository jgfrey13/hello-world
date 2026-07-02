import { LoadingState } from "@/components/ui/states";

export default function PublicLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <LoadingState />
    </div>
  );
}
