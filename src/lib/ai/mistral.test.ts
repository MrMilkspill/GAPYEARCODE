import {
  aiProfileAnalysisSchema,
  extractMistralMessageText,
} from "@/lib/ai/mistral";

describe("mistral helpers", () => {
  it("extracts plain string content", () => {
    expect(extractMistralMessageText('{"ok":true}')).toBe('{"ok":true}');
  });

  it("extracts text chunks from array content", () => {
    expect(
      extractMistralMessageText([
        { type: "text", text: '{"headline":"A"}' },
        { type: "citation", text: "ignored" },
      ]),
    ).toBe('{"headline":"A"}');
  });

  it("validates the AI analysis payload shape", () => {
    expect(() =>
      aiProfileAnalysisSchema.parse({
        headline: "Solid but not yet ready",
        verdict: "The backend model agrees that more runway is likely needed.",
        supportingRationale: "Academics are workable, but service is light.",
        strongestSignals: ["GPA is competitive", "Clinical volunteering is decent"],
        limitingFactors: ["Service remains thin", "Application readiness is incomplete"],
        priorityActions: [
          "Add more non-clinical service",
          "Tighten school list strategy",
          "Finish application materials",
        ],
        cautionNote:
          "This AI analysis is supplemental and does not replace the transparent score.",
      }),
    ).not.toThrow();
  });
});
