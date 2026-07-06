import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import App from "./App.tsx";

/**
 * WS-8 smoke test: the whole app tree renders without throwing, which exercises
 * `useProject` → `assessProject` (the full engine) on the default input and the
 * step/panel components. Catches runtime wiring errors headlessly (effects don't
 * run under renderToString, which is fine — this is a render-safety check).
 */
describe("App shell", () => {
  it("renders the workflow, disclaimer, and clause panel without throwing", () => {
    const html = renderToString(<App />);
    expect(html).toContain("NCC Section C");
    expect(html).toContain("Running results"); // the persistent clause panel
    expect(html).toContain("indicative"); // the always-on disclaimer
    expect(html).toContain("Classify"); // the workflow stepper
  });
});
