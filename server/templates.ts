/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';

export function generateAbsensiTemplate(studentNames: string[], className: string): Buffer {
  const wsData: any[][] = [
    ["TEMPLATE DATA ABSENSI & EKSTRAKURIKULER - BERURUTAN MUDAH DIISI"],
    ["Nama Sekolah:", "Sekolah Menengah"],
    ["Kelas:", className],
    ["Semester:", ""],
    ["Tahun Pelajaran:", ""],
    [""],
    ["(Isi data mulai baris ke-8. Jangan merubah susunan tajuk di baris ke-8!)"],
    ["No", "Nama Siswa", "NIS", "Sakit", "Izin", "Alpa", "Pramuka", "Kesenian", "Olahraga"]
  ];

  studentNames.forEach((name, idx) => {
    wsData.push([
      idx + 1,
      name,
      "", // NIS placeholder
      0,  // Sakit
      0,  // Izin
      0,  // Alpa
      "-", // Pramuka
      "-", // Kesenian
      "-"  // Olahraga
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data Absensi Ekskul");
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

export function generateBKTemplate(studentNames: string[], className: string): Buffer {
  const wsData: any[][] = [
    ["TEMPLATE REKAPITULASI DOSSIER & CATATAN BIMBINGAN KONSELING (BK)"],
    ["Kelas:", className],
    ["(Isi data mulai baris ke-8. Kolom indeks penting agar sinkronisasi sesuai kata kunci)"],
    [], [], [], [], // padding rows to reach row 8 (0-indexed 7)
    ["No", "Nama Siswa", "NIS", "Jml Pelanggaran", "", "", "", "", "", "", "Catatan BK"]
  ];

  studentNames.forEach((name, idx) => {
    wsData.push([
      idx + 1,
      name,
      "", // NIS
      0,  // Jml Pelanggaran
      "", "", "", "", "", "", // empty columns for spacing
      "-" // Catatan BK
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Catatan BK");
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}
