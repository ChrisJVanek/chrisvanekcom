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

/** Report date (ISO) for display. Latest: 05/03/2026, Imedical 348744. */
export const BLOOD_TEST_DATE = "2026-03-05";

/**
 * From report 05/03/2026 (Imedical 348744). Values from PDF in mmol/L, stored here in mg/dL.
 * PDF: Total 6.7, LDL 5.07, HDL 1.18, Trig 1.0 mmol/L.
 */
export const CHOLESTEROL_TOTAL: BloodTestStat = {
  label: "Total cholesterol",
  value: 259, // 6.7 mmol/L
  unit: "mg/dL",
  status: "above",
  optimalRange: "< 200",
  lowerIsBetter: true,
};

export const BLOOD_TEST_STATS: BloodTestStat[] = [
  {
    label: "LDL",
    value: 196, // 5.07 mmol/L
    unit: "mg/dL",
    status: "above",
    optimalRange: "< 100",
    lowerIsBetter: true,
  },
  {
    label: "HDL",
    value: 46, // 1.18 mmol/L
    unit: "mg/dL",
    status: "moderate",
    optimalRange: "≥ 60",
    lowerIsBetter: false,
  },
  {
    label: "Triglycerides",
    value: 89, // 1.0 mmol/L
    unit: "mg/dL",
    status: "optimal",
    optimalRange: "< 150",
    lowerIsBetter: true,
  },
];
