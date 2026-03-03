/**
 * Blood test summary. Update with your latest results.
 * Cholesterol in mg/dL (US). Optimal: Total < 200, LDL < 100, HDL ≥ 60, Trig < 150.
 */

export const BLOOD_TEST_REPORT_PDF = "/health/blood-test-report.pdf";

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

/** Headline stat – get total cholesterol down to healthy level (< 200 mg/dL). */
export const CHOLESTEROL_TOTAL: BloodTestStat = {
  label: "Total cholesterol",
  value: 220,
  unit: "mg/dL",
  status: "above",
  optimalRange: "< 200",
  lowerIsBetter: true,
};

export const BLOOD_TEST_STATS: BloodTestStat[] = [
  {
    label: "LDL",
    value: 140,
    unit: "mg/dL",
    status: "above",
    optimalRange: "< 100",
    lowerIsBetter: true,
  },
  {
    label: "HDL",
    value: 48,
    unit: "mg/dL",
    status: "moderate",
    optimalRange: "≥ 60",
    lowerIsBetter: false,
  },
  {
    label: "Triglycerides",
    value: 165,
    unit: "mg/dL",
    status: "above",
    optimalRange: "< 150",
    lowerIsBetter: true,
  },
];
