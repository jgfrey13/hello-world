import { describe, expect, it } from "vitest";
import {
  CLASSIFICATION_LABELS,
  CLASSIFICATION_TONES,
  MANUFACTURING_CLASSIFICATIONS,
  classificationLabel,
} from "@/lib/verification/classification";

describe("manufacturing classification", () => {
  it("has a human-readable label for every enum value", () => {
    for (const value of MANUFACTURING_CLASSIFICATIONS) {
      const label = classificationLabel(value);
      expect(label).toBeTruthy();
      // Labels are display copy, never raw enum values.
      expect(label).not.toContain("_");
    }
  });

  it("has a visual tone for every enum value", () => {
    for (const value of MANUFACTURING_CLASSIFICATIONS) {
      expect(CLASSIFICATION_TONES[value]).toBeTruthy();
    }
  });

  it("reserves the strongest (primary) tone for evidence-verified status only", () => {
    const primaries = MANUFACTURING_CLASSIFICATIONS.filter(
      (value) => CLASSIFICATION_TONES[value] === "primary",
    );
    expect(primaries).toEqual(["verified_made_in_usa"]);
  });

  it("never labels weaker statuses as verified", () => {
    for (const value of MANUFACTURING_CLASSIFICATIONS) {
      if (value === "verified_made_in_usa") continue;
      expect(CLASSIFICATION_LABELS[value].startsWith("Verified")).toBe(false);
    }
  });
});
