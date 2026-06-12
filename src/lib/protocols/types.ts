export interface ProtocolStep {
  id: string;
  /** Shown to the user in the session progress rail. */
  title: string;
  /** What this step must accomplish before advancing. */
  goal: string;
  /** Technique constraints for the Guide agent — the methodology lives here, in code. */
  guidance: string;
}

export interface Protocol {
  id: string;
  name: string;
  tagline: string;
  /** The evidence-based tradition the protocol is drawn from. Shown in the UI. */
  evidenceBase: string;
  /** Opening message shown verbatim when the session starts (not generated). */
  opening: string;
  steps: ProtocolStep[];
}

export function getStep(protocol: Protocol, stepId: string): ProtocolStep {
  const step = protocol.steps.find((s) => s.id === stepId);
  return step ?? protocol.steps[0];
}

export function nextStep(
  protocol: Protocol,
  stepId: string
): ProtocolStep | null {
  const idx = protocol.steps.findIndex((s) => s.id === stepId);
  if (idx === -1 || idx === protocol.steps.length - 1) return null;
  return protocol.steps[idx + 1];
}

export function stepIndex(protocol: Protocol, stepId: string): number {
  const idx = protocol.steps.findIndex((s) => s.id === stepId);
  return idx === -1 ? 0 : idx;
}
