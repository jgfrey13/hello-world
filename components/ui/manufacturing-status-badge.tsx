import { Badge } from "@/components/ui/badge";
import {
  classificationLabel,
  CLASSIFICATION_TONES,
  type ManufacturingClassification,
  type ClassificationTone,
} from "@/lib/verification/classification";

const toneToVariant: Record<
  ClassificationTone,
  "default" | "secondary" | "outline" | "muted"
> = {
  primary: "default",
  secondary: "secondary",
  outline: "outline",
  muted: "muted",
};

/**
 * Renders the human-readable manufacturing status for a stored enum value.
 * Never display the raw enum; never upgrade the visual weight of an
 * unverified claim.
 */
export function ManufacturingStatusBadge({
  classification,
  className,
}: {
  classification: ManufacturingClassification;
  className?: string;
}) {
  return (
    <Badge
      variant={toneToVariant[CLASSIFICATION_TONES[classification]]}
      className={className}
    >
      {classificationLabel(classification)}
    </Badge>
  );
}
