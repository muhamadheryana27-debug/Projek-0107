/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Student } from '../types';

export const sampleSubjects = ['MTK', 'IPA', 'IPS', 'B.IND', 'B.ING', 'INF', 'SENI', 'PJOK', 'PAI', 'PPKn'];

export const sampleStudents: Student[] = [
  {
    Nama: "Budi Santoso",
    NIS: "220101",
    NISN: "0081234561",
    Badge: "🌟 High Achiever",
    TotalNilai: 885,
    RataRata: 88.5,
    TrenBelajar: 4.2,
    grades: {
      'MTK': 92, 'IPA': 90, 'IPS': 84, 'B.IND': 88, 'B.ING': 92, 
      'INF': 95, 'SENI': 80, 'PJOK': 82, 'PAI': 94, 'PPKn': 88
    },
    trends: {
      'MTK': 5, 'IPA': 3, 'IPS': 2, 'B.IND': 1, 'B.ING': 4, 
      'INF': 6, 'SENI': 0, 'PJOK': 2, 'PAI': 1, 'PPKn': 2
    },
    Sakit: 1,
    Izin: 0,
    Alpa: 0,
    PersentaseHadir: 99.1,
    SkorDisiplin: 99.1,
    Ekskul_Pramuka: "A",
    Ekskul_Kesenian: "B",
    Ekskul_Olahraga: "B",
    CatatanBK: "-"
  },
  {
    Nama: "Siti Aminah",
    NIS: "220102",
    NISN: "0081234562",
    Badge: "🌟 High Achiever",
    TotalNilai: 864,
    RataRata: 86.4,
    TrenBelajar: 2.8,
    grades: {
      'MTK': 84, 'IPA': 86, 'IPS': 92, 'B.IND': 94, 'B.ING': 90, 
      'INF': 82, 'SENI': 88, 'PJOK': 78, 'PAI': 90, 'PPKn': 80
    },
    trends: {
      'MTK': 1, 'IPA': 2, 'IPS': 3, 'B.IND': 4, 'B.ING': 2, 
      'INF': 0, 'SENI': 2, 'PJOK': 1, 'PAI': 2, 'PPKn': 1
    },
    Sakit: 0,
    Izin: 1,
    Alpa: 0,
    PersentaseHadir: 99.1,
    SkorDisiplin: 99.1,
    Ekskul_Pramuka: "A",
    Ekskul_Kesenian: "A",
    Ekskul_Olahraga: "-",
    CatatanBK: "-"
  },
  {
    Nama: "Ahmad Fauzi",
    NIS: "220103",
    NISN: "0081234563",
    Badge: "✅ Stabil",
    TotalNilai: 792,
    RataRata: 79.2,
    TrenBelajar: 1.5,
    grades: {
      'MTK': 78, 'IPA': 80, 'IPS': 76, 'B.IND': 82, 'B.ING': 78, 
      'INF': 85, 'SENI': 74, 'PJOK': 88, 'PAI': 76, 'PPKn': 75
    },
    trends: {
      'MTK': 2, 'IPA': 1, 'IPS': -1, 'B.IND': 2, 'B.ING': 3, 
      'INF': 2, 'SENI': -2, 'PJOK': 4, 'PAI': 1, 'PPKn': 0
    },
    Sakit: 2,
    Izin: 2,
    Alpa: 0,
    PersentaseHadir: 96.6,
    SkorDisiplin: 96.6,
    Ekskul_Pramuka: "B",
    Ekskul_Kesenian: "-",
    Ekskul_Olahraga: "A",
    CatatanBK: "-"
  },
  {
    Nama: "Rini Lestari",
    NIS: "220104",
    NISN: "0081234564",
    Badge: "✅ Stabil",
    TotalNilai: 765,
    RataRata: 76.5,
    TrenBelajar: -1.2,
    grades: {
      'MTK': 72, 'IPA': 74, 'IPS': 80, 'B.IND': 84, 'B.ING': 82, 
      'INF': 70, 'SENI': 85, 'PJOK': 72, 'PAI': 76, 'PPKn': 70
    },
    trends: {
      'MTK': -3, 'IPA': -2, 'IPS': 1, 'B.IND': 2, 'B.ING': 1, 
      'INF': -4, 'SENI': 3, 'PJOK': -2, 'PAI': -2, 'PPKn': -3
    },
    Sakit: 1,
    Izin: 1,
    Alpa: 1,
    PersentaseHadir: 97.5,
    SkorDisiplin: 95.5,
    Ekskul_Pramuka: "B",
    Ekskul_Kesenian: "B",
    Ekskul_Olahraga: "-",
    CatatanBK: "Terlambat memasuki kelas sebanyak 2 kali."
  },
  {
    Nama: "Gede Sukarta",
    NIS: "220105",
    NISN: "0081234565",
    Badge: "🆘 Fokus Perbaikan",
    TotalNilai: 704,
    RataRata: 70.4,
    TrenBelajar: -3.5,
    grades: {
      'MTK': 65, 'IPA': 68, 'IPS': 72, 'B.IND': 75, 'B.ING': 70, 
      'INF': 64, 'SENI': 72, 'PJOK': 76, 'PAI': 74, 'PPKn': 68
    },
    trends: {
      'MTK': -5, 'IPA': -4, 'IPS': -2, 'B.IND': -1, 'B.ING': -3, 
      'INF': -6, 'SENI': 1, 'PJOK': -1, 'PAI': -2, 'PPKn': -4
    },
    Sakit: 3,
    Izin: 0,
    Alpa: 3,
    PersentaseHadir: 95.0,
    SkorDisiplin: 89.0,
    Ekskul_Pramuka: "C",
    Ekskul_Kesenian: "-",
    Ekskul_Olahraga: "B",
    CatatanBK: "Membawa handphone ke dalam kelas saat jam ujian berlangsung."
  }
];
