/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import { Student } from '../src/types';

export function parseLeger(buffer: Buffer): { students: Student[]; subjects: string[]; className: string } {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  // Find class name
  let className = "Kelas Umum";
  for (let i = 0; i < Math.min(15, rawData.length); i++) {
    const rowStr = (rawData[i] || []).map(c => String(c || '')).join(' ').toUpperCase();
    if (rowStr.includes('KELAS') && rowStr.includes(':')) {
      const idx = rowStr.indexOf(':');
      const ext = rowStr.substring(idx + 1).replace(/NAN/gi, '').replace(/,/g, '').trim();
      if (ext) {
        className = ext;
        break;
      }
    }
  }

  // Find header row (row containing "NAMA")
  let headerIdx = -1;
  for (let i = 0; i < Math.min(30, rawData.length); i++) {
    const row = rawData[i] || [];
    if (row.some(cell => String(cell || '').toUpperCase().includes('NAMA'))) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) {
    headerIdx = 0;
  }

  // Find semester row (usually 1 or 2 rows below header containing SMT 1, SMT 3, RERATA, etc.)
  let smtRowIdx = -1;
  for (let i = headerIdx; i < Math.min(headerIdx + 15, rawData.length); i++) {
    const row = rawData[i] || [];
    const rowStr = row.map(x => String(x || '').toLowerCase());
    if (rowStr.some(x => x.includes('smt') || x.includes('sem') || x.includes('rerata') || x.includes('rata'))) {
      smtRowIdx = i;
      break;
    }
  }

  // If no semester row found, default to headerIdx + 1
  if (smtRowIdx === -1) {
    smtRowIdx = headerIdx + 1;
  }

  // Detect index columns
  const headerRow = rawData[headerIdx] || [];
  let colNama = 1;
  let colNis = 3;
  let colNisn = 2;
  headerRow.forEach((val, idx) => {
    const valUpper = String(val || '').toUpperCase();
    if (valUpper.includes('NAMA')) colNama = idx;
    else if (valUpper.includes('NISN')) colNisn = idx;
    else if (valUpper.includes('NIS') && !valUpper.includes('NISN')) colNis = idx;
  });

  const dataStart = smtRowIdx + 1;
  const rawStudents = rawData.slice(dataStart);
  const students: Student[] = [];
  const subjectsSet = new Set<string>();

  // Detect subject names and column offsets
  const subjectsRow = rawData[smtRowIdx - 1] || [];
  const smtLabels = (rawData[smtRowIdx] || []).map(x => String(x || '').toLowerCase().trim());

  interface SubjectConfig {
    name: string;
    rerataCol?: number;
    smt1Col?: number;
    smt3Col?: number;
    allCols: number[];
  }
  const subjectConfigs: Record<string, SubjectConfig> = {};
  let currentSubj: string | null = null;

  for (let c = colNis + 1; c < Math.max(...rawData.map(r => r.length)); c++) {
    const subVal = String(subjectsRow[c] || '').trim();
    if (subVal && !['nan', 'none', 'unnamed', ''].includes(subVal.toLowerCase())) {
      const subLower = subVal.toLowerCase();
      if (subLower.includes('agama') || subLower.includes('pai')) currentSubj = 'PAI';
      else if (subLower.includes('pancasila') && !subLower.includes('profil')) currentSubj = 'PPKn';
      else if (subLower.includes('bahasa indonesia')) currentSubj = 'B.IND';
      else if (subLower.includes('bahasa inggris')) currentSubj = 'B.ING';
      else if (subLower.includes('matematika')) currentSubj = 'MTK';
      else if (subLower.includes('alam') || subLower.includes('ipa')) currentSubj = 'IPA';
      else if (subLower.includes('sosial') || subLower.includes('ips')) currentSubj = 'IPS';
      else if (subLower.includes('jasmani') || subLower.includes('olahraga')) currentSubj = 'PJOK';
      else if (subLower.includes('seni') || subLower.includes('budaya')) currentSubj = 'SENI';
      else if (subLower.includes('informatika')) currentSubj = 'INF';
      else if (subLower.includes('sunda') || subLower.includes('daerah')) currentSubj = 'B.SUN';
      else if (subLower.includes('project') || subLower.includes('p5') || subLower.includes('profil')) currentSubj = null;
      else currentSubj = subVal.substring(0, 12);

      if (currentSubj) {
        if (!subjectConfigs[currentSubj]) {
          subjectConfigs[currentSubj] = { name: currentSubj, allCols: [] };
        }
      }
    }

    if (currentSubj && subjectConfigs[currentSubj]) {
      const lbl = smtLabels[c] || '';
      subjectConfigs[currentSubj].allCols.push(c);
      if (lbl.includes('smt') || lbl.includes('sem')) {
        if (lbl.includes('1')) subjectConfigs[currentSubj].smt1Col = c;
        if (lbl.includes('3')) subjectConfigs[currentSubj].smt3Col = c;
      } else if (lbl.includes('rerata') || lbl.includes('rata')) {
        subjectConfigs[currentSubj].rerataCol = c;
      }
    }
  }

  // Loop students
  rawStudents.forEach(row => {
    const nama = String(row[colNama] || '').trim();
    if (!nama || nama.toUpperCase().match(/NAMA SISWA|TOTAL|AVERAGE|RELA|NAN/)) return;

    const nis = String(row[colNis] || '').replace(/\.0$/, '').trim();
    const nisn = String(row[colNisn] || '').replace(/\.0$/, '').trim().padStart(10, '0');

    const grades: Record<string, number> = {};
    const trends: Record<string, number> = {};
    let totalScore = 0;
    let gradedCount = 0;
    let smt1Sum = 0;
    let smt3Sum = 0;
    let smt1Count = 0;
    let smt3Count = 0;

    Object.keys(subjectConfigs).forEach(m => {
      const conf = subjectConfigs[m];
      let val = 0;
      if (conf.rerataCol !== undefined && row[conf.rerataCol] !== undefined) {
        val = parseFloat(row[conf.rerataCol]) || 0;
      } else if (conf.allCols.length > 0) {
        let sum = 0;
        let cnt = 0;
        conf.allCols.forEach(c => {
          if (row[c] !== undefined) {
            sum += parseFloat(row[c]) || 0;
            cnt++;
          }
        });
        val = cnt > 0 ? sum / cnt : 0;
      }
      val = Math.round(val * 100) / 100;
      if (val > 0) {
        grades[m] = val;
        totalScore += val;
        gradedCount++;
        subjectsSet.add(m);
      }

      // Trends
      let smt1Val = 0;
      let smt3Val = 0;
      if (conf.smt1Col !== undefined && row[conf.smt1Col] !== undefined) {
        smt1Val = parseFloat(row[conf.smt1Col]) || 0;
        smt1Sum += smt1Val;
        smt1Count++;
      }
      if (conf.smt3Col !== undefined && row[conf.smt3Col] !== undefined) {
        smt3Val = parseFloat(row[conf.smt3Col]) || 0;
        smt3Sum += smt3Val;
        smt3Count++;
      }
      trends[m] = Math.round((smt3Val - smt1Val) * 100) / 100;
    });

    const averageScore = gradedCount > 0 ? Math.round((totalScore / gradedCount) * 100) / 100 : 0;
    const s1Avg = smt1Count > 0 ? smt1Sum / smt1Count : 0;
    const s3Avg = smt3Count > 0 ? smt3Sum / smt3Count : 0;
    const overallTrend = Math.round((s3Avg - s1Avg) * 100) / 100;

    let badge: "🌟 High Achiever" | "🆘 Fokus Perbaikan" | "✅ Stabil" = "✅ Stabil";
    if (averageScore >= 85) badge = "🌟 High Achiever";
    else if (averageScore < 75) badge = "🆘 Fokus Perbaikan";

    students.push({
      Nama: nama,
      NIS: nis,
      NISN: nisn,
      Badge: badge,
      TotalNilai: totalScore,
      RataRata: averageScore,
      TrenBelajar: overallTrend,
      grades,
      trends
    });
  });

  return {
    students: students.sort((a, b) => b.TotalNilai - a.TotalNilai),
    subjects: Array.from(subjectsSet),
    className
  };
}
