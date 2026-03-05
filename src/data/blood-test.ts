/**
 * Blood test summary. Update with your latest results.
 * Cholesterol in mg/dL (US). Optimal: Total < 200, LDL < 100, HDL ≥ 60, Trig < 150.
 * AU uses mmol/L.
 */

export const BLOOD_TEST_REPORT_PDF = "/health/blood-test-report.pdf";

/** Cholesterol (total, LDL, HDL): mg/dL → mmol/L */
export function mgDlToMmolCholesterol(mgDl: number): number {
  return mgDl / 38.67;
}

/** Triglycerides: mg/dL → mmol/L */
export function mgDlToMmolTriglycerides(mgDl: number): number {
  return mgDl / 88.57;
}

export function formatCholesterolDual(mgDl: number): { us: string; au: string } {
  return {
    us: `${Math.round(mgDl)} mg/dL`,
    au: `${mgDlToMmolCholesterol(mgDl).toFixed(2)} mmol/L`,
  };
}

export function formatTriglyceridesDual(mgDl: number): { us: string; au: string } {
  return {
    us: `${Math.round(mgDl)} mg/dL`,
    au: `${mgDlToMmolTriglycerides(mgDl).toFixed(2)} mmol/L`,
  };
}

export type BloodTestStatus = "optimal" | "moderate" | "above";

export interface BloodTestStat {
  label: string;
  value: number;
  unit: string;
  status: BloodTestStatus;
  optimalRange: string;
  /** For LDL/Trig: lower is better. For HDL: higher is better. */
  lowerIsBetter: boolean;
}

/**
 * From report 07/01/2026 (Imedical 315603). Values from PDF in mmol/L, stored here in mg/dL.
 * PDF: Total 6.5, LDL 4.60, HDL 1.26, Trig 1.4 mmol/L.
 */
export const CHOLESTEROL_TOTAL: BloodTestStat = {
  label: "Total cholesterol",
  value: 251, // 6.5 mmol/L
  unit: "mg/dL",
  status: "above",
  optimalRange: "< 200",
  lowerIsBetter: true,
};

export const BLOOD_TEST_STATS: BloodTestStat[] = [
  {
    label: "LDL",
    value: 178, // 4.60 mmol/L
    unit: "mg/dL",
    status: "above",
    optimalRange: "< 100",
    lowerIsBetter: true,
  },
  {
    label: "HDL",
    value: 49, // 1.26 mmol/L
    unit: "mg/dL",
    status: "moderate",
    optimalRange: "≥ 60",
    lowerIsBetter: false,
  },
  {
    label: "Triglycerides",
    value: 124, // 1.4 mmol/L
    unit: "mg/dL",
    status: "optimal",
    optimalRange: "< 150",
    lowerIsBetter: true,
  },
];
