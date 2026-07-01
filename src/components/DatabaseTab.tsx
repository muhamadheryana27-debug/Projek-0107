/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Search, Download, FileSpreadsheet, Award } from 'lucide-react';
import { Student } from '../types';
import * as XLSX from 'xlsx';

interface DatabaseTabProps {
  students: Student[];
  subjects: string[];
  className: string;
  isAbsensiSynced: boolean;
}

export default function DatabaseTab({ students, subjects, className, isAbsensiSynced }: DatabaseTabProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      s.Nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.NIS.includes(searchQuery) ||
      s.NISN.includes(searchQuery)
    );
  }, [students, searchQuery]);

  // Client-side Excel Exporter using SheetJS
  const handleExportExcel = () => {
    const exportData = filteredStudents.map((s, idx) => {
      const row: Record<string, any> = {
        "Peringkat": idx + 1,
        "Nama Siswa": s.Nama,
        "NISN": s.NISN,
        "NIS": s.NIS,
        "Rata-Rata": s.RataRata,
        "Total Skor": Math.round(s.TotalNilai),
        "Tren Belajar": s.TrenBelajar,
        "Kualifikasi": s.Badge
      };

      // Add subject grades
      subjects.forEach(subj => {
        row[subj] = s.grades[subj] || 0;
      });

      // Add secondary metrics if synced
      if (isAbsensiSynced) {
        row["Sakit"] = s.Sakit ?? 0;
        row["Izin"] = s.Izin ?? 0;
        row["Alpa"] = s.Alpa ?? 0;
        row["Persentase Hadir (%)"] = s.PersentaseHadir ?? 100;
        row["Skor Disiplin"] = s.SkorDisiplin ?? 100;
        row["Pramuka"] = s.Ekskul_Pramuka || "-";
        row["Kesenian"] = s.Ekskul_Kesenian || "-";
        row["Olahraga"] = s.Ekskul_Olahraga || "-";
        row["Catatan BK"] = s.CatatanBK || "-";
      }

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, className || "Kelas");
    
    XLSX.writeFile(workbook, `Database_Leger_${className.replace(/\s+/g, "_")}.xlsx`);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-1 pb-24">
      {/* Search and Action Bar */}
      <div className="bg-white border border-slate-150 rounded-[24px] p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="text-slate-400" size={18} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan nama, NIS, atau NISN..."
            className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 pl-10 pr-4 py-2.5 rounded-2xl text-sm font-semibold text-slate-700 outline-none transition-all"
          />
        </div>

        {/* Export Button */}
        <button
          onClick={handleExportExcel}
          className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-2xl font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <FileSpreadsheet size={16} />
          <span>Download Database (Excel)</span>
        </button>
      </div>

      {/* Main Database Table Container */}
      <div className="bg-white border border-slate-150 rounded-[24px] p-4 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold text-xs uppercase tracking-wider text-center">
                <th className="py-3 px-4 text-left">No</th>
                <th className="py-3 px-4 text-left">Nama Siswa</th>
                <th className="py-3 px-4">Kualifikasi</th>
                <th className="py-3 px-4">Rata-Rata</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Tren</th>
                
                {/* Dynamically render subject header columns */}
                {subjects.map(subj => (
                  <th key={`hdr-${subj}`} className="py-3 px-3">{subj}</th>
                ))}

                {isAbsensiSynced && (
                  <>
                    <th className="py-3 px-3">Alpa</th>
                    <th className="py-3 px-3">Disiplin</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-center font-semibold text-slate-700">
              {filteredStudents.map((s, idx) => (
                <tr key={s.Nama} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-500 text-left">#{idx + 1}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 text-left">{s.Nama}</td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                      s.Badge.includes('High') 
                        ? 'bg-emerald-50 text-emerald-700'
                        : s.Badge.includes('Fokus')
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-indigo-50 text-indigo-700'
                    }`}>
                      {s.Badge.replace('🌟 ', '').replace('🆘 ', '').replace('✅ ', '')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{s.RataRata.toFixed(2)}</td>
                  <td className="py-3.5 px-4 text-slate-500">{Math.round(s.TotalNilai)}</td>
                  <td className={`py-3.5 px-4 font-mono font-bold ${s.TrenBelajar >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {s.TrenBelajar >= 0 ? `+${s.TrenBelajar}` : s.TrenBelajar}
                  </td>

                  {/* Subject Grades */}
                  {subjects.map(subj => (
                    <td key={`grd-${s.Nama}-${subj}`} className="py-3.5 px-3 font-mono text-xs text-slate-600">
                      {s.grades[subj] !== undefined ? s.grades[subj].toFixed(1) : "-"}
                    </td>
                  ))}

                  {isAbsensiSynced && (
                    <>
                      <td className="py-3.5 px-3 font-mono text-rose-600">{s.Alpa ?? 0}</td>
                      <td className="py-3.5 px-3 font-mono text-indigo-600 font-bold">{s.SkorDisiplin ?? 100}</td>
                    </>
                  )}
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={7 + subjects.length + (isAbsensiSynced ? 2 : 0)} className="py-8 text-center text-slate-400 italic">
                    Siswa tidak ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
