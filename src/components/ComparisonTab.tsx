/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  GitCompare, ArrowRight, Sparkles, Scale, AlertTriangle, 
  TrendingUp, Compass, Clock, Award, Users 
} from 'lucide-react';
import { Student } from '../types';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend 
} from 'recharts';

interface ComparisonTabProps {
  students: Student[];
  subjects: string[];
  isAbsensiSynced: boolean;
}

export default function ComparisonTab({ students, subjects, isAbsensiSynced }: ComparisonTabProps) {
  const [s1Name, setS1Name] = useState<string>(students[0]?.Nama || '');
  const [s2Name, setS2Name] = useState<string>(students[1]?.Nama || students[0]?.Nama || '');
  const [isS1Dropdown, setIsS1Dropdown] = useState(false);
  const [isS2Dropdown, setIsS2Dropdown] = useState(false);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [aiInsight, setAiInsight] = useState<string>('');

  // Find students
  const s1 = useMemo(() => students.find(s => s.Nama === s1Name) || students[0], [students, s1Name]);
  const s2 = useMemo(() => students.find(s => s.Nama === s2Name) || students[1] || students[0], [students, s2Name]);

  const s1Rank = useMemo(() => students.findIndex(s => s.Nama === s.Nama) + 1, [students, s1]);
  const s2Rank = useMemo(() => students.findIndex(s => s.Nama === s2.Nama) + 1, [students, s2]);

  // Compute Career Track recommendation for comparison description
  const getTopCareer = (student: Student) => {
    const getEkskulBonus = (p?: string) => {
      const pr = String(p || '').toUpperCase().trim();
      return pr === 'A' ? 5 : pr === 'B' ? 2 : 0;
    };
    const bp = getEkskulBonus(student.Ekskul_Pramuka);
    const bs = getEkskulBonus(student.Ekskul_Kesenian);
    const bo = getEkskulBonus(student.Ekskul_Olahraga);
    const m = student.grades['MTK'] || 0;
    const ip = student.grades['IPA'] || 0;
    const ips = student.grades['IPS'] || 0;
    const bi = student.grades['B.IND'] || 0;
    const bg = student.grades['B.ING'] || 0;
    const inf = student.grades['INF'] || 0;
    const se = student.grades['SENI'] || 0;

    const tracks = [
      { name: "Sains / MIPA", score: ((m + ip) / 2) + (bp * 0.5) },
      { name: "Soshum / Sosial", score: ((ips + bi) / 2) + (bp * 0.5) },
      { name: "Bahasa & Budaya", score: ((bi + bg) / 2) + (bs * 0.3) },
      { name: "Teknologi & IT", score: ((inf + m + bg) / 3) + (bo * 0.2) },
      { name: "Seni Kreatif", score: ((se + inf) / 2) + bs }
    ];
    return tracks.sort((a, b) => b.score - a.score)[0].name;
  };

  // Comparative Table Rows
  const compareTableRows = useMemo(() => {
    if (!s1 || !s2) return [];
    return subjects.map(subj => {
      const val1 = s1.grades[subj] || 0;
      const val2 = s2.grades[subj] || 0;
      const diff = val2 - val1;
      let winner = "Seri";
      if (val1 > val2) winner = s1.Nama.split(' ')[0];
      else if (val2 > val1) winner = s2.Nama.split(' ')[0];

      return {
        subject: subj,
        val1,
        val2,
        diff,
        winner
      };
    });
  }, [s1, s2, subjects]);

  // Handle Dynamic AI Counselling Insights
  const fetchAiInsight = async () => {
    if (!s1 || !s2) return;
    setIsLoadingInsight(true);
    setAiInsight('');
    try {
      const response = await fetch('/api/generate-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'head-to-head',
          payload: {
            student1: {
              Nama: s1.Nama,
              RataRata: s1.RataRata,
              Peringkat: s1Rank,
              TrenBelajar: s1.TrenBelajar,
              Career: getTopCareer(s1),
              strengths: Object.keys(s1.grades).sort((a, b) => s1.grades[b] - s1.grades[a]).slice(0, 3),
              Sakit: s1.Sakit,
              Izin: s1.Izin,
              Alpa: s1.Alpa,
              CatatanBK: s1.CatatanBK
            },
            student2: {
              Nama: s2.Nama,
              RataRata: s2.RataRata,
              Peringkat: s2Rank,
              TrenBelajar: s2.TrenBelajar,
              Career: getTopCareer(s2),
              strengths: Object.keys(s2.grades).sort((a, b) => s2.grades[b] - s2.grades[a]).slice(0, 3),
              Sakit: s2.Sakit,
              Izin: s2.Izin,
              Alpa: s2.Alpa,
              CatatanBK: s2.CatatanBK
            }
          }
        })
      });
      const data = await response.json();
      setAiInsight(data.text);
    } catch (e) {
      console.error(e);
      setAiInsight("Gagal menghubungi asisten kecerdasan AI. Silakan coba kembali nanti.");
    } finally {
      setIsLoadingInsight(false);
    }
  };

  // Overlaid Recharts Radar Data
  const radarData = useMemo(() => {
    if (!s1 || !s2) return [];
    return subjects.map(subj => ({
      subject: subj,
      [s1.Nama]: s1.grades[subj] || 0,
      [s2.Nama]: s2.grades[subj] || 0
    }));
  }, [s1, s2, subjects]);

  if (!s1 || !s2) return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-1 pb-24">
      {/* Student Selectors */}
      <div className="bg-white border border-slate-150 rounded-[24px] p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
          <GitCompare size={18} className="text-indigo-600" />
          <span>Pilih Dua Siswa untuk Dibandingkan</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Student 1 Selector */}
          <div className="relative">
            <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block mb-1">Siswa 1 (S1)</label>
            <button
              onClick={() => {
                setIsS1Dropdown(!isS1Dropdown);
                setIsS2Dropdown(false);
              }}
              className="w-full bg-slate-50 border border-slate-200 hover:border-indigo-400 px-4 py-3 rounded-2xl text-left font-bold text-slate-700 flex items-center justify-between focus:outline-none transition-all cursor-pointer"
            >
              <span>{s1.Nama}</span>
              <ChevronDownIcon />
            </button>
            {isS1Dropdown && (
              <div className="absolute left-0 mt-1 w-full bg-white border border-slate-200 rounded-2xl shadow-xl z-50 max-h-52 overflow-y-auto">
                {students.map((st) => (
                  <button
                    key={`s1-${st.Nama}`}
                    onClick={() => {
                      setS1Name(st.Nama);
                      setIsS1Dropdown(false);
                      setAiInsight('');
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 text-slate-700 font-semibold border-b border-slate-100 last:border-0"
                  >
                    {st.Nama}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Student 2 Selector */}
          <div className="relative">
            <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block mb-1">Siswa 2 (S2)</label>
            <button
              onClick={() => {
                setIsS2Dropdown(!isS2Dropdown);
                setIsS1Dropdown(false);
              }}
              className="w-full bg-slate-50 border border-slate-200 hover:border-indigo-400 px-4 py-3 rounded-2xl text-left font-bold text-slate-700 flex items-center justify-between focus:outline-none transition-all cursor-pointer"
            >
              <span>{s2.Nama}</span>
              <ChevronDownIcon />
            </button>
            {isS2Dropdown && (
              <div className="absolute left-0 mt-1 w-full bg-white border border-slate-200 rounded-2xl shadow-xl z-50 max-h-52 overflow-y-auto">
                {students.map((st) => (
                  <button
                    key={`s2-${st.Nama}`}
                    onClick={() => {
                      setS2Name(st.Nama);
                      setIsS2Dropdown(false);
                      setAiInsight('');
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 text-slate-700 font-semibold border-b border-slate-100 last:border-0"
                  >
                    {st.Nama}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comparison Radar Overlaid Chart */}
      <div className="bg-white border border-slate-150 rounded-[24px] p-6 shadow-sm">
        <h4 className="font-bold text-slate-800 text-base mb-4 text-center">📊 Peta Kompetensi Overlaid Radar</h4>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              <Radar name={s1.Nama} dataKey={s1.Nama} stroke="#4f46e5" fill="#6366f1" fillOpacity={0.25} />
              <Radar name={s2.Nama} dataKey={s2.Nama} stroke="#d97706" fill="#f59e0b" fillOpacity={0.25} />
              <Tooltip />
              <Legend verticalAlign="top" height={36} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Side by side stats card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase">Peringkat Kelas</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-lg font-extrabold text-indigo-600">#{s1Rank}</span>
              <span className="text-xs text-slate-400">vs</span>
              <span className="text-lg font-extrabold text-amber-600">#{s2Rank}</span>
            </div>
          </div>
          <Award className="text-slate-300" size={24} />
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase">Rata-Rata Akademik</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-lg font-extrabold text-indigo-600">{s1.RataRata}</span>
              <span className="text-xs text-slate-400">vs</span>
              <span className="text-lg font-extrabold text-amber-600">{s2.RataRata}</span>
            </div>
          </div>
          <Scale className="text-slate-300" size={24} />
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase">Total Akumulasi</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-lg font-extrabold text-indigo-600">{Math.round(s1.TotalNilai)}</span>
              <span className="text-xs text-slate-400">vs</span>
              <span className="text-lg font-extrabold text-amber-600">{Math.round(s2.TotalNilai)}</span>
            </div>
          </div>
          <Users className="text-slate-300" size={24} />
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase">Akselerasi Tren</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-base font-extrabold ${s1.TrenBelajar >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {s1.TrenBelajar >= 0 ? `+${s1.TrenBelajar}` : s1.TrenBelajar}
              </span>
              <span className="text-xs text-slate-400">vs</span>
              <span className={`text-base font-extrabold ${s2.TrenBelajar >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {s2.TrenBelajar >= 0 ? `+${s2.TrenBelajar}` : s2.TrenBelajar}
              </span>
            </div>
          </div>
          <TrendingUp className="text-slate-300" size={24} />
        </div>
      </div>

      {/* Differential Table */}
      <div className="bg-white border border-slate-150 rounded-[24px] p-6 shadow-sm overflow-hidden">
        <h4 className="font-bold text-slate-800 text-base mb-4">📋 Tabel Rincian Keunggulan per Mata Pelajaran</h4>
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold text-xs uppercase tracking-wider text-center">
                <th className="py-3 px-4 text-left">Mata Pelajaran</th>
                <th className="py-3 px-4">{s1.Nama.split(' ')[0]} (S1)</th>
                <th className="py-3 px-4">{s2.Nama.split(' ')[0]} (S2)</th>
                <th className="py-3 px-4">Selisih (S2 - S1)</th>
                <th className="py-3 px-4">Keunggulan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-center font-semibold text-slate-700">
              {compareTableRows.map((row) => (
                <tr key={row.subject} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900 text-left">{row.subject}</td>
                  <td className="py-3 px-4 text-slate-600">{row.val1.toFixed(2)}</td>
                  <td className="py-3 px-4 text-slate-600">{row.val2.toFixed(2)}</td>
                  <td className={`py-3 px-4 font-mono font-bold ${
                    row.diff > 0 
                      ? 'bg-emerald-50 text-emerald-600' 
                      : row.diff < 0 
                      ? 'bg-rose-50 text-rose-600' 
                      : 'bg-slate-50 text-slate-500'
                  }`}>
                    {row.diff > 0 ? `+${row.diff.toFixed(2)}` : row.diff.toFixed(2)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                      row.winner === 'Seri'
                        ? 'bg-slate-100 text-slate-500'
                        : row.winner === s1.Nama.split(' ')[0]
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {row.winner}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Comparative Insights */}
      <div className="bg-white border border-slate-150 rounded-[24px] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-100">
          <div>
            <h4 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Sparkles size={18} className="text-indigo-600" />
              <span>Analisis Komparatif Proyeksi Karir (AI)</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">Analisis hibrida untuk mendeteksi kolaborasi study-buddy dan keselarasan jalur konseling.</p>
          </div>
          
          <button
            onClick={fetchAiInsight}
            disabled={isLoadingInsight}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full font-semibold text-xs shadow-lg shadow-indigo-100 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Sparkles size={16} />
            <span>{isLoadingInsight ? 'Memproses...' : 'Dapatkan AI Insights'}</span>
          </button>
        </div>

        {aiInsight ? (
          <div className="bg-gradient-to-br from-indigo-50/50 to-slate-50 border border-indigo-100/40 p-6 rounded-[24px] text-slate-700 text-sm leading-relaxed whitespace-pre-line prose prose-indigo max-w-none">
            {aiInsight}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 text-sm">
            Klik tombol <strong>"Dapatkan AI Insights"</strong> di atas untuk menghasilkan laporan komparatif prediktif sekolah lengkap dari Gemini.
          </div>
        )}
      </div>

      {/* Attendance & BK Side-By-Side */}
      {isAbsensiSynced && (
        <div className="bg-white border border-slate-150 rounded-[24px] p-6 shadow-sm space-y-4">
          <h4 className="font-bold text-slate-800 text-base">🛡️ Komparasi Kehaduran & Catatan Perilaku</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            <div className="space-y-3 pr-2">
              <h5 className="font-bold text-indigo-700 text-sm flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full"></span>
                <span>👤 {s1.Nama}</span>
              </h5>
              <p className="text-sm font-semibold text-slate-600">
                🤒 Sakit: <span className="text-slate-800">{s1.Sakit ?? 0} Hari</span> | 
                📨 Izin: <span className="text-slate-800">{s1.Izin ?? 0} Hari</span> | 
                ❌ Alpa: <span className="text-slate-800">{s1.Alpa ?? 0} Hari</span>
              </p>
              <div className="text-xs text-slate-500 space-y-1">
                <p>🏕️ Pramuka: <strong className="text-slate-700">{s1.Ekskul_Pramuka || '-'}</strong></p>
                <p>🎨 Kesenian: <strong className="text-slate-700">{s1.Ekskul_Kesenian || '-'}</strong></p>
                <p>⚽ Olahraga: <strong className="text-slate-700">{s1.Ekskul_Olahraga || '-'}</strong></p>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl text-xs text-slate-600 font-medium">
                Catatan BK: {s1.CatatanBK || "Aman. Bersih dari pelanggaran."}
              </div>
            </div>

            <div className="space-y-3 pt-4 md:pt-0 md:pl-6">
              <h5 className="font-bold text-amber-700 text-sm flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-amber-600 rounded-full"></span>
                <span>👤 {s2.Nama}</span>
              </h5>
              <p className="text-sm font-semibold text-slate-600">
                🤒 Sakit: <span className="text-slate-800">{s2.Sakit ?? 0} Hari</span> | 
                📨 Izin: <span className="text-slate-800">{s2.Izin ?? 0} Hari</span> | 
                ❌ Alpa: <span className="text-slate-800">{s2.Alpa ?? 0} Hari</span>
              </p>
              <div className="text-xs text-slate-500 space-y-1">
                <p>🏕️ Pramuka: <strong className="text-slate-700">{s2.Ekskul_Pramuka || '-'}</strong></p>
                <p>🎨 Kesenian: <strong className="text-slate-700">{s2.Ekskul_Kesenian || '-'}</strong></p>
                <p>⚽ Olahraga: <strong className="text-slate-700">{s2.Ekskul_Olahraga || '-'}</strong></p>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl text-xs text-slate-600 font-medium">
                Catatan BK: {s2.CatatanBK || "Aman. Bersih dari pelanggaran."}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helpers
function ChevronDownIcon() {
  return (
    <svg className="fill-current h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
    </svg>
  );
}
