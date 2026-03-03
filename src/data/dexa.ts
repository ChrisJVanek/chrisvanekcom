/**
 * DEXA scan summary (MeasureUp report 2025-08-28).
 * Update when you have a new scan.
 */

export const DEXA_REPORT_PDF = "/health/dexa-report-2025-08-28.pdf";

export const DEXA_SCAN_DATE = "2025-08-28";

export type DexaStatus = "optimal" | "moderate" | "above";

export interface DexaStat {
  label: string;
  value: string | number;
  unit: string;
  status: DexaStatus;
  optimalRange: string;
}

export const DEXA_STATS: DexaStat[] = [
  {
    label: "Body fat",
    value: 27,
    unit: "%",
    status: "above",
    optimalRange: "8–20%",
  },
  {
    label: "BMI",
    value: 26,
    unit: "",
    status: "moderate",
    optimalRange: "18.5–25",
  },
  {
    label: "VAT risk",
    value: "Low",
    unit: "",
    status: "optimal",
    optimalRange: "Low risk",
  },
];
