/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import { Student } from '../src/types';

export function mergeSecondaryData(
  buffer: Buffer,
  students: Student[]
): { students: Student[]; message: string } {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  if (rawData.length === 0) {
    throw new Error("File spreadsheet kosong atau tidak valid.");
  }

  // Format 1: HSIA Format (cols contain NAMA, H, S, I, A)
  // Let's search if any row contains the HSIA header columns
  let hsiaHeaderRowIdx = -1;
  let colsMapping: Record<string, number> = {};

  for (let i = 0; i < Math.min(15, rawData.length); i++) {
    const row = (rawData[i] || []).map(x => String(x || '').trim().toUpperCase());
    const hasNama = row.includes('NAMA');
    const hasH = row.includes('H');
    const hasS = row.includes('S');
    const hasI = row.includes('I');
    const hasA = row.includes('A');

    if (hasNama && hasH && hasS && hasI && hasA) {
      hsiaHeaderRowIdx = i;
      colsMapping = {
        Nama: row.indexOf('NAMA'),
        Hadir: row.indexOf('H'),
        Sakit: row.indexOf('S'),
        Izin: row.indexOf('I'),
        Alpa: row.indexOf('A')
      };
      break;
    }
  }

  if (hsiaHeaderRowIdx !== -1) {
    // Merge HSIA
    const dataRows = rawData.slice(hsiaHeaderRowIdx + 1);
    const updatedStudents = students.map(student => {
      const nameUpper = student.Nama.toUpperCase();
      const match = dataRows.find(row => {
        const rowName = String(row[colsMapping.Nama] || '').trim().toUpperCase();
        return rowName === nameUpper;
      });

      if (match) {
        const h = parseFloat(match[colsMapping.Hadir]) || 0;
        const s = parseFloat(match[colsMapping.Sakit]) || 0;
        const i = parseFloat(match[colsMapping.Izin]) || 0;
        const a = parseFloat(match[colsMapping.Alpa]) || 0;
        const totalHari = h + s + i + a;
        const persentaseHadir = totalHari > 0 ? Math.round((h / totalHari) * 100 * 100) / 100 : 100;
        const skorDisiplin = Math.max(0, Math.round((persentaseHadir - a * 2) * 100) / 100);

        return {
          ...student,
          Sakit: s,
          Izin: i,
          Alpa: a,
          PersentaseHadir: persentaseHadir,
          SkorDisiplin: skorDisiplin
        };
      }
      return student;
    });

    return {
      students: updatedStudents,
      message: "Data Rekap Kehadiran HSIA Berhasil Sinkron!"
    };
  }

  // Check if BK sheet
  // Format 2: BK format (contains "CATATAN BK" in the first 10 rows)
  let isBK = false;
  for (let i = 0; i < Math.min(10, rawData.length); i++) {
    const rowStr = (rawData[i] || []).map(x => String(x || '')).join(' ').toUpperCase();
    if (rowStr.includes('CATATAN BK') || rowStr.includes('BIMBINGAN KONSELING')) {
      isBK = true;
      break;
    }
  }

  if (isBK) {
    // Parse beginning at row 8 (index 7 or first row containing data)
    // Row 8 labels: 1: "No", 2: "Nama Siswa", 3: "NIS", 4: "Jml Pelanggaran", 11: "Catatan BK"
    const dataRows = rawData.slice(8); // row 9 onwards
    const updatedStudents = students.map(student => {
      // Find row where NIS matches (or name matches if NIS is empty)
      const match = dataRows.find(row => {
        const rowNis = String(row[2] || '').replace(/\.0$/, '').trim();
        const rowNama = String(row[1] || '').trim().toUpperCase();
        return (rowNis && rowNis === student.NIS) || (rowNama && rowNama === student.Nama.toUpperCase());
      });

      if (match) {
        const JmlPelanggaran = parseInt(match[3]) || 0;
        const catatanBK = String(match[10] || '').trim();
        return {
          ...student,
          JmlPelanggaran,
          CatatanBK: catatanBK !== '' ? catatanBK : '-'
        };
      }
      return student;
    });

    return {
      students: updatedStudents,
      message: "Sinkronisasi Berhasil: File Dokumen BK Sukses Dimuat."
    };
  }

  // Format 3: Standard Attendance & Extra-curricular template
  // Col mapping: 2: NIS, 3: Sakit, 4: Izin, 5: Alpa, 6: Ekskul_Pramuka, 7: Ekskul_Kesenian, 8: Ekskul_Olahraga
  // Skip first 8 rows (index 8 is where data starts)
  const dataRows = rawData.slice(8);
  const updatedStudents = students.map(student => {
    const match = dataRows.find(row => {
      const rowNis = String(row[2] || '').replace(/\.0$/, '').trim();
      const rowNama = String(row[1] || '').trim().toUpperCase();
      return (rowNis && rowNis === student.NIS) || (rowNama && rowNama === student.Nama.toUpperCase());
    });

    if (match) {
      const s = parseFloat(match[3]) || 0;
      const i = parseFloat(match[4]) || 0;
      const a = parseFloat(match[5]) || 0;
      
      const pramuka = String(match[6] || '').trim();
      const kesenian = String(match[7] || '').trim();
      const olahraga = String(match[8] || '').trim();

      const skorDisiplin = Math.max(0, 100 - (s * 1 + i * 1 + a * 4));

      return {
        ...student,
        Sakit: s,
        Izin: i,
        Alpa: a,
        Ekskul_Pramuka: pramuka,
        Ekskul_Kesenian: kesenian,
        Ekskul_Olahraga: olahraga,
        SkorDisiplin: skorDisiplin
      };
    }
    return student;
  });

  return {
    students: updatedStudents,
    message: "Sinkronisasi Berhasil: File Template Absensi Berurutan Sukses Dimuat."
  };
}
