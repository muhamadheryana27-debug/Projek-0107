/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { BookOpen, AlertTriangle, Star, ShieldAlert } from 'lucide-react';
import { Student } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';

interface SubjectEvaluationTabProps {
  students: Student[];
  subjects: string[];
}

export default function SubjectEvaluationTab({ students, subjects }: SubjectEvaluationTabProps) {
  const [selectedSubject, setSelectedSubject] = useState<string>(subjects[0] || '');

  // Calculate Average for each subject
  const subjectAverages = useMemo(() => {
    return subjects.map(subj => {
      let sum = 0;
      let count = 0;
      students.forEach(s => {
        const val = s.grades[subj];
        if (val !== undefined && val > 0) {
          sum += val;
          count++;
        }
      });
      return {
        subject: subj,
        average: count > 0 ? Math.round((sum / count) * 100) / 100 : 0
      };
    }).sort((a, b) => a.average - b.average); // lowest to highest (to see difficulties first)
  }, [students, subjects]);

  // Find top achievers in selected subject
  const topAchieversInSelectedSubject = useMemo(() => {
    if (!selectedSubject) return [];
    return [...students]
      .filter(s => s.grades[selectedSubject] !== undefined)
      .sort((a, b) => (b.grades[selectedSubject] || 0) - (a.grades[selectedSubject] || 0))
      .slice(0, 5);
  }, [students, selectedSubject]);

  // Find students needing focus in selected subject
  const focusStudentsInSelectedSubject = useMemo(() => {
    if (!selectedSubject) return [];
    return [...students]
      .filter(s => s.grades[selectedSubject] !== undefined && (s.grades[selectedSubject] || 0) < 75)
      .sort((a, b) => (a.grades[selectedSubject] || 0) - (b.grades[selectedSubject] || 0))
      .slice(0, 5);
  }, [students, selectedSubject]);

  const toughestSubject = useMemo(() => subjectAverages[0], [subjectAverages]);
  const easiestSubject = useMemo(() => [...subjectAverages].reverse()[0], [subjectAverages]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-1 pb-24">
      {/* Subject Statistics Banner Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {toughestSubject && (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 flex items-center gap-4">
            <div className="bg-rose-600 p-3 rounded-full text-white">
              <AlertTriangle size={24} />
            </div>
            <div>
              <span className="block text-[11px] font-bold text-rose-500 uppercase">Mata Pelajaran Paling Menantang</span>
              <span className="text-xl font-extrabold text-slate-800">{toughestSubject.subject}</span>
              <span className="block text-xs text-rose-700 mt-1">Rata-rata Kelas: <strong className="font-extrabold">{toughestSubject.average}</strong></span>
            </div>
          </div>
        )}

        {easiestSubject && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex items-center gap-4">
            <div className="bg-emerald-600 p-3 rounded-full text-white">
              <Star size={24} />
            </div>
            <div>
              <span className="block text-[11px] font-bold text-emerald-500 uppercase">Rata-rata Tertinggi Kelas</span>
              <span className="text-xl font-extrabold text-slate-800">{easiestSubject.subject}</span>
              <span className="block text-xs text-emerald-700 mt-1">Rata-rata Kelas: <strong className="font-extrabold">{easiestSubject.average}</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Bar Chart of Course Difficulty */}
      <div className="bg-white border border-slate-150 rounded-[24px] p-6 shadow-sm">
        <h4 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
          <BookOpen size={18} className="text-indigo-600" />
          <span>Rata-Rata Nilai Rapor Kelas per Mata Pelajaran</span>
        </h4>
        
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={subjectAverages} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
              <XAxis dataKey="subject" stroke="#64748b" fontSize={11} fontWeight={600} />
              <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
              <Tooltip cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="average" radius={[8, 8, 0, 0]}>
                {subjectAverages.map((entry, index) => {
                  // highlight tougher subjects in red, easy ones in green
                  let fill = '#6366f1';
                  if (entry.average < 75) fill = '#ef4444';
                  else if (entry.average >= 83) fill = '#10b981';
                  return <Cell key={`cell-${index}`} fill={fill} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Achievers and Need-to-Improve List */}
      <div className="bg-white border border-slate-150 rounded-[24px] p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h4 className="font-bold text-slate-800 text-base">🔍 Analisis Distribusi Kompetensi Siswa</h4>
            <p className="text-xs text-slate-500 mt-0.5">Pilih mata pelajaran untuk melihat daftar penerima pengayaan dan rekomendasi remedial.</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Mata Pelajaran:</span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500"
            >
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {selectedSubject && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Achievers (Pengayaan) */}
            <div className="space-y-3">
              <h5 className="font-bold text-emerald-800 text-sm flex items-center gap-1.5">
                <Star size={16} className="text-emerald-500" />
                <span>Top 5 Siswa Terunggul (Rekomendasi Pengayaan)</span>
              </h5>
              
              <div className="space-y-2">
                {topAchieversInSelectedSubject.map((st, idx) => (
                  <div key={`top-${st.Nama}`} className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl flex justify-between items-center text-sm">
                    <span className="font-semibold text-slate-700">{idx+1}. {st.Nama}</span>
                    <span className="bg-emerald-50 text-emerald-600 font-extrabold px-3 py-1 rounded-lg border border-emerald-100 font-mono">
                      {st.grades[selectedSubject]}
                    </span>
                  </div>
                ))}
                {topAchieversInSelectedSubject.length === 0 && (
                  <p className="text-xs text-slate-400 italic">Belum ada data nilai.</p>
                )}
              </div>
            </div>

            {/* Struggling (Remedial) */}
            <div className="space-y-3">
              <h5 className="font-bold text-rose-800 text-sm flex items-center gap-1.5">
                <ShieldAlert size={16} className="text-rose-500" />
                <span>Siswa dengan Nilai &lt; 75 (Rekomendasi Remedial)</span>
              </h5>
              
              <div className="space-y-2">
                {focusStudentsInSelectedSubject.map((st, idx) => (
                  <div key={`struggle-${st.Nama}`} className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl flex justify-between items-center text-sm">
                    <span className="font-semibold text-slate-700">{idx+1}. {st.Nama}</span>
                    <span className="bg-rose-50 text-rose-600 font-extrabold px-3 py-1 rounded-lg border border-rose-100 font-mono">
                      {st.grades[selectedSubject]}
                    </span>
                  </div>
                ))}
                {focusStudentsInSelectedSubject.length === 0 && (
                  <div className="bg-emerald-50/50 border border-dashed border-emerald-100 p-4 rounded-xl text-center">
                    <p className="text-xs text-emerald-700 font-semibold">Hebat! Seluruh siswa lulus ambang batas standar (&gt;= 75).</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
