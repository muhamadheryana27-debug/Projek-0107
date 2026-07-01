/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Student {
  Nama: string;
  NIS: string;
  NISN: string;
  Badge: "🌟 High Achiever" | "🆘 Fokus Perbaikan" | "✅ Stabil";
  TotalNilai: number;
  RataRata: number;
  TrenBelajar: number;
  
  // Dynamic grades
  grades: Record<string, number>;
  
  // Dynamic semester trends
  trends: Record<string, number>;

  // Secondary Data - Attendance
  Sakit?: number;
  Izin?: number;
  Alpa?: number;
  SkorDisiplin?: number;
  PersentaseHadir?: number;

  // Secondary Data - Extracurriculars
  Ekskul_Pramuka?: string;
  Ekskul_Kesenian?: string;
  Ekskul_Olahraga?: string;

  // Secondary Data - BK Notes
  CatatanBK?: string;
  JmlPelanggaran?: number;

  // AI/Clustering properties
  Cluster_ID?: number;
  KelompokAI?: string;
}

export interface CareerTrackPrediction {
  trackName: string;
  score: number;
  description: string;
}

export interface SubjectStats {
  subject: string;
  average: number;
}
