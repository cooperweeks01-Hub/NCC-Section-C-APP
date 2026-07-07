import { describe, expect, it } from "vitest";
import type { ClassifyAnswers } from "./classification.ts";
import { classifyFromAnswers } from "./classification.ts";

/**
 * "Not sure" questionnaire logic (NCC Part A6, indicative). Proves the use→class
 * map, the dominant/ancillary rule, the fire-wall-separated branch, and the
 * undetermined paths that must fall back to a manual pick.
 */
function answers(overrides: Partial<ClassifyAnswers> = {}): ClassifyAnswers {
  return {
    primaryUse: "storage",
    secondaryUse: null,
    separatedByFireWall: null,
    dominantUse: null,
    ...overrides,
  };
}

describe("classifyFromAnswers — single in-scope use", () => {
  it("maps each in-scope use to its Part A6 class", () => {
    expect(classifyFromAnswers(answers({ primaryUse: "storage" })).buildingClass).toBe("7b");
    expect(classifyFromAnswers(answers({ primaryUse: "office" })).buildingClass).toBe("5");
    expect(classifyFromAnswers(answers({ primaryUse: "carpark" })).buildingClass).toBe("7a");
    expect(classifyFromAnswers(answers({ primaryUse: "manufacturing" })).buildingClass).toBe("8");
    expect(classifyFromAnswers(answers({ primaryUse: "processing" })).buildingClass).toBe("8");

    const r = classifyFromAnswers(answers({ primaryUse: "manufacturing" }));
    expect(r.inScope).toBe(true);
    expect(r.separateCompartments).toBe(false);
    expect(r.rationale).toMatch(/Class 8/);
  });
});

describe("classifyFromAnswers — out-of-scope use", () => {
  it("names Class 6 for a shop but marks it out of scope", () => {
    const r = classifyFromAnswers(answers({ primaryUse: "shop" }));
    expect(r.buildingClass).toBe("6");
    expect(r.inScope).toBe(false);
    expect(r.rationale).toMatch(/out of|outside/i);
  });

  it("returns no class for a known-but-unrepresentable out-of-scope use (Class 9)", () => {
    const r = classifyFromAnswers(answers({ primaryUse: "health" }));
    expect(r.buildingClass).toBeNull();
    expect(r.inScope).toBe(false);
    expect(r.rationale).toMatch(/Class 9/);
  });
});

describe("classifyFromAnswers — mixed uses, not fire-separated (dominant/ancillary)", () => {
  it("infers on-site manufacturing dominates the storage that serves it ⇒ Class 8", () => {
    const r = classifyFromAnswers(
      answers({ primaryUse: "storage", secondaryUse: "manufacturing", separatedByFireWall: false }),
    );
    expect(r.buildingClass).toBe("8");
    expect(r.inScope).toBe(true);
    expect(r.separateCompartments).toBe(false);
    expect(r.rationale).toMatch(/ancillary/i);
  });

  it("uses an explicit dominant-use answer when given", () => {
    const r = classifyFromAnswers(
      answers({ primaryUse: "storage", secondaryUse: "office", separatedByFireWall: false, dominantUse: "secondary" }),
    );
    expect(r.buildingClass).toBe("5");
  });

  it("asks which use is dominant when it can't be inferred", () => {
    const r = classifyFromAnswers(
      answers({ primaryUse: "office", secondaryUse: "shop", separatedByFireWall: false }),
    );
    expect(r.buildingClass).toBeNull();
    expect(r.rationale).toMatch(/dominant/i);
  });
});

describe("classifyFromAnswers — mixed uses, fire-separated", () => {
  it("flags separate compartments and reports the dominant/primary class", () => {
    const r = classifyFromAnswers(
      answers({ primaryUse: "storage", secondaryUse: "office", separatedByFireWall: true }),
    );
    expect(r.buildingClass).toBe("7b");
    expect(r.separateCompartments).toBe(true);
    expect(r.rationale).toMatch(/separate compartment/i);
  });
});

describe("classifyFromAnswers — undetermined paths need a manual pick", () => {
  it("returns no class when a second use is present but fire separation is unanswered", () => {
    const r = classifyFromAnswers(
      answers({ primaryUse: "storage", secondaryUse: "office", separatedByFireWall: null }),
    );
    expect(r.buildingClass).toBeNull();
    expect(r.rationale).toMatch(/fire-rated wall/i);
  });

  it("returns no class for an unlisted use", () => {
    const r = classifyFromAnswers(answers({ primaryUse: "other" }));
    expect(r.buildingClass).toBeNull();
    expect(r.inScope).toBe(false);
  });
});
