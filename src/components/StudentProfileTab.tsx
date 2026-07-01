/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Award, TrendingUp, Sparkles, BookOpen, Clock, 
  Compass, FileText, Printer, ChevronDown, CheckCircle, AlertCircle 
} from 'lucide-react';
import { Student } from '../types';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

interface StudentProfileTabProps {
  students: Student[];
  subjects: string[];
  className: string;
  isAbsensiSynced: boolean;
}

export default function StudentProfileTab({ students, subjects, className, isAbsensiSynced }: StudentProfileTabProps) {
  const [selectedStudentName, setSelectedStudentName] = useState<string>(students[0]?.Nama || '');
  const [subMenu, setSubMenu] = useState<string>('resume');
  const [selectedTrendSubject, setSelectedTrendSubject] = useState<string>(subjects[0] || '');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [aiInsight, setAiInsight] = useState<string>('');

  // Find active student
  const student = useMemo(() => {
    return students.find(s => s.Nama === selectedStudentName) || students[0];
  }, [students, selectedStudentName]);

  const studentIndex = useMemo(() => {
    if (!student) return 1;
    return students.findIndex(s => s.Nama === student.Nama) + 1;
  }, [students, student]);

  // Compute Career Track Recommendations
  const careerTracks = useMemo(() => {
    if (!student) return [];
    
    // Extracurricular score bonuses
    const getEkskulBonus = (predikat?: string) => {
      const p = String(predikat || '').trim().toUpperCase();
      if (p === 'A') return 5;
      if (p === 'B') return 2;
      return 0;
    };

    const bonusPramuka = getEkskulBonus(student.Ekskul_Pramuka);
    const bonusSeni = getEkskulBonus(student.Ekskul_Kesenian);
    const bonusOlahraga = getEkskulBonus(student.Ekskul_Olahraga);

    const mtk = student.grades['MTK'] || 0;
    const ipa = student.grades['IPA'] || 0;
    const ips = student.grades['IPS'] || 0;
    const bind = student.grades['B.IND'] || 0;
    const bing = student.grades['B.ING'] || 0;
    const inf = student.grades['INF'] || 0;
    const seni = student.grades['SENI'] || 0;

    const scores = [
      {
        trackName: "SMA: MIPA / Sains",
        score: ((mtk + ipa) / 2) + (bonusPramuka * 0.5),
        description: "Fokus pada penguasaan eksakta, penalaran ilmiah, kuantitatif, dan metodologi riset."
      },
      {
        trackName: "SMA: Soshum / IPS",
        score: ((ips + bind) / 2) + (bonusPramuka * 0.5),
        description: "Unggul dalam ilmu sosial, komunikasi humaniora, literasi kritis, dan analisis kemasyarakatan."
      },
      {
        trackName: "SMA: Ilmu Bahasa & Budaya",
        score: ((bind + bing) / 2) + (bonusSeni * 0.3),
        description: "Optimal dalam pengembangan kompetensi linguistik, sastra, komunikasi global, dan kebudayaan."
      },
      {
        trackName: "SMK: Rekayasa Teknologi & IT",
        score: ((inf + mtk + bing) / 3) + (bonusOlahraga * 0.2),
        description: "Menyiapkan keahlian pemrograman, jaringan, elektronika digital, dan algoritma lanjutan."
      },
      {
        trackName: "SMK: Seni, Kreatif & Multimedia",
        score: ((seni + inf) / 2) + bonusSeni,
        description: "Didesain untuk industri kreatif, desain komunikasi visual, produksi multimedia, dan kesenian praktis."
      }
    ];

    return scores.sort((a, b) => b.score - a.score);
  }, [student]);

  // Compute strengths & focus areas
  const subjectRanking = useMemo(() => {
    if (!student) return [];
    return Object.entries(student.grades)
      .map(([subject, val]) => ({ subject, val: Number(val) || 0 }))
      .sort((a, b) => b.val - a.val);
  }, [student]);

  const strengths = useMemo(() => subjectRanking.slice(0, 3), [subjectRanking]);
  const weaknesses = useMemo(() => [...subjectRanking].reverse().slice(0, 3), [subjectRanking]);

  // Handle Dynamic AI Counselling Insights
  const fetchAiInsight = async () => {
    if (!student) return;
    setIsLoadingInsight(true);
    setAiInsight('');
    try {
      const response = await fetch('/api/generate-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'student-profile',
          payload: {
            Nama: student.Nama,
            RataRata: student.RataRata,
            TotalNilai: student.TotalNilai,
            TrenBelajar: student.TrenBelajar,
            Peringkat: studentIndex,
            TotalSiswa: students.length,
            Badge: student.Badge,
            grades: student.grades,
            strengths: strengths.map(s => ({ name: s.subject, val: s.val })),
            weaknesses: weaknesses.map(w => ({ name: w.subject, val: w.val })),
            careers: careerTracks.map(c => ({ trackName: c.trackName, score: Math.round(c.score) })),
            Sakit: student.Sakit,
            Izin: student.Izin,
            Alpa: student.Alpa,
            Ekskul_Pramuka: student.Ekskul_Pramuka,
            Ekskul_Kesenian: student.Ekskul_Kesenian,
            Ekskul_Olahraga: student.Ekskul_Olahraga,
            CatatanBK: student.CatatanBK
          }
        })
      });
      const data = await response.json();
      setAiInsight(data.text);
    } catch (e) {
      console.error(e);
      setAiInsight("Gagal menghubungi asisten kecerdasan AI. Silakan coba beberapa saat lagi.");
    } finally {
      setIsLoadingInsight(false);
    }
  };

  // Recharts Radar Data
  const radarData = useMemo(() => {
    if (!student) return [];
    return subjects.map(subj => ({
      subject: subj,
      Nilai: student.grades[subj] || 0
    }));
  }, [student, subjects]);

  // Attendance Pie Data
  const attendanceData = useMemo(() => {
    if (!student) return [];
    const s = student.Sakit || 0;
    const i = student.Izin || 0;
    const a = student.Alpa || 0;
    const h = Math.max(0, 120 - (s + i + a));
    return [
      { name: 'Hadir', value: h, color: '#10b981' },
      { name: 'Sakit', value: s, color: '#f59e0b' },
      { name: 'Izin', value: i, color: '#3b82f6' },
      { name: 'Alpa', value: a, color: '#ef4444' }
    ];
  }, [student]);

  if (!student) return null;

  // Print function
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-1 pb-24">
      {/* Search Header Selector */}
      <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative">
          <label className="text-[11px] font-bold tracking-wider text-slate-400 uppercase block mb-1">Cari Profil Siswa</label>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full md:w-80 bg-slate-50 border border-slate-200 hover:border-indigo-400 px-4 py-2.5 rounded-2xl text-left font-semibold text-slate-700 flex items-center justify-between focus:outline-none transition-all duration-200 cursor-pointer"
            >
              <span>{selectedStudentName}</span>
              <ChevronDown className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} size={18} />
            </button>
            
            {isDropdownOpen && (
              <div className="absolute left-0 mt-2 w-full md:w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 max-h-60 overflow-y-auto">
                {students.map((st) => (
                  <button
                    key={st.Nama}
                    onClick={() => {
                      setSelectedStudentName(st.Nama);
                      setIsDropdownOpen(false);
                      setAiInsight(''); // reset insight
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 text-slate-700 font-medium transition-colors border-b border-slate-100 last:border-0 flex justify-between"
                  >
                    <span>{st.Nama}</span>
                    <span className="text-slate-400 font-mono text-xs">Avg: {st.RataRata}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 px-4 py-2.5 rounded-full font-semibold text-sm transition-all cursor-pointer"
          >
            <Printer size={16} />
            <span>Cetak Rapor Profil</span>
          </button>
          
          <button 
            onClick={fetchAiInsight}
            disabled={isLoadingInsight}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full font-semibold text-sm shadow-lg shadow-indigo-100 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Sparkles size={16} />
            <span>{isLoadingInsight ? 'Menganalisis...' : 'Kecerdasan AI'}</span>
          </button>
        </div>
      </div>

      {/* Main Student Header Card */}
      <div id="student-report-print-area" className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-[24px] p-6 md:p-8 shadow-xl relative overflow-hidden">
        {/* Abstract background blobs */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm">
              <Award size={14} className="text-amber-400" />
              <span>Peringkat #{studentIndex} dari {students.length} Siswa</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">{student.Nama}</h1>
            <p className="text-slate-300 text-sm md:text-base font-medium">
              NISN: <span className="font-mono text-white mr-4">{student.NISN}</span> 
              NIS: <span className="font-mono text-white">{student.NIS}</span>
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 min-w-[200px] text-center backdrop-blur-md">
            <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-1">Status Kualifikasi</p>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
              student.Badge.includes('High') 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : student.Badge.includes('Fokus')
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
            }`}>
              {student.Badge}
            </span>
            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/10 text-center">
              <div>
                <span className="block text-[10px] text-slate-400 font-medium">Average</span>
                <span className="text-lg font-bold text-white">{student.RataRata}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 font-medium">Total</span>
                <span className="text-lg font-bold text-white">{Math.round(student.TotalNilai)}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 font-medium">Trend</span>
                <span className={`text-sm font-bold ${student.TrenBelajar >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {student.TrenBelajar >= 0 ? `+${student.TrenBelajar}` : student.TrenBelajar}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-tab segmented selector (custom radio button horizontally style) */}
      <div className="flex flex-wrap gap-2 justify-center bg-slate-100 p-1 rounded-2xl">
        {[
          { id: 'resume', label: '📝 Resume & PDF', icon: FileText },
          { id: 'akademik', label: '📊 Akademik', icon: BookOpen },
          { id: 'disiplin', label: '⏰ Kedisiplinan', icon: Clock },
          { id: 'ekskul', label: '🏕️ Ekskul & Bakat', icon: Compass },
          { id: 'bk', label: '🛡️ Catatan BK', icon: AlertCircle }
        ].map((item) => {
          const Icon = item.icon;
          const isActive = subMenu === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSubMenu(item.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                isActive 
                  ? 'bg-white text-indigo-700 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon size={14} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Tab Body content with staggering entrance animations */}
      <AnimatePresence mode="wait">
        <motion.div
          key={subMenu}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25 }}
          className="bg-white border border-slate-150 rounded-[24px] p-6 shadow-sm min-h-[350px]"
        >
          {/* Sub Tab: RESUME & GURU NOTES */}
          {subMenu === 'resume' && (
            <div className="space-y-6">
              {/* AI Insight Container */}
              {aiInsight && (
                <div className="bg-gradient-to-br from-indigo-50/50 to-slate-50 border border-indigo-100/40 p-6 rounded-[24px] relative overflow-hidden shadow-sm">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-indigo-300">
                    <Sparkles size={120} />
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
                      <Sparkles size={16} />
                    </div>
                    <h4 className="font-bold text-indigo-950 text-base">Asisten Konselor Pro-Edu AI</h4>
                  </div>
                  <div className="prose prose-indigo max-w-none text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                    {aiInsight}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Resume Kognitif</h4>
                  <p className="text-2xl font-extrabold text-slate-800">{student.RataRata}</p>
                  <p className="text-xs text-slate-500 mt-2">Nilai rata-rata umum seluruh kompetensi dasar muatan pelajaran.</p>
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Akumulasi Poin</h4>
                  <p className="text-2xl font-extrabold text-slate-800">{Math.round(student.TotalNilai)}</p>
                  <p className="text-xs text-slate-500 mt-2">Beban komparasi total nilai keseluruhan ledger kelas.</p>
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tren Kecepatan Belajar</h4>
                  <div className="flex items-center gap-2">
                    <p className={`text-2xl font-extrabold ${student.TrenBelajar >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {student.TrenBelajar >= 0 ? `+${student.TrenBelajar}` : student.TrenBelajar}
                    </p>
                    <TrendingUp size={20} className={student.TrenBelajar >= 0 ? 'text-emerald-500' : 'text-rose-500'} />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Kecepatan daya tangkap perkembangan nilai (Semester 1 vs 3).</p>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h4 className="font-bold text-slate-800 text-lg mb-3">Catatan Pembinaan Wali Kelas</h4>
                <div className="flex gap-4 items-start">
                  <div className={`p-3 rounded-full ${
                    student.RataRata >= 85 ? 'bg-emerald-50 text-emerald-600' : student.RataRata >= 75 ? 'bg-indigo-50 text-indigo-700' : 'bg-rose-50 text-rose-600'
                  }`}>
                    <Award size={24} />
                  </div>
                  <div>
                    {student.RataRata >= 85 ? (
                      <p className="text-slate-700 text-sm leading-relaxed">
                        <strong className="text-emerald-700 font-bold">✨ Pertahankan prestasimu yang luar biasa!</strong> Nilai akademik yang prima menunjukkan kesiapan belajar mandiri yang sangat baik. Direkomendasikan untuk mengikuti program pengayaan, literasi sains tingkat tinggi, serta didorong menjadi mentor sebaya bagi teman-teman kelasnya.
                      </p>
                    ) : student.RataRata >= 75 ? (
                      <p className="text-slate-700 text-sm leading-relaxed">
                        <strong className="text-indigo-700 font-bold">📈 Perkembangan stabil.</strong> Progres belajarmu secara makro sudah stabil dan berada di atas standar kompetensi. Dianjurkan untuk meningkatkan konsistensi belajar, terutama pada rumpun mata pelajaran yang masih berada di bawah nilai rata-rata pribadimu.
                      </p>
                    ) : (
                      <p className="text-slate-700 text-sm leading-relaxed">
                        <strong className="text-rose-700 font-bold">⚠️ Perlu bimbingan dan fokus perbaikan.</strong> Saatnya bangkit! Diperlukan pendampingan remedial intensif pada beberapa subjek. Disarankan bagi wali kelas dan orang tua untuk menyusun jadwal belajar tambahan yang terarah di rumah serta memantau distraksi di luar jam sekolah.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sub Tab: AKADEMIK & TREN DETIL */}
          {subMenu === 'akademik' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold text-slate-800 text-base mb-4">🎯 Radar Peta Kompetensi Akademik</h4>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        <Radar name={student.Nama} dataKey="Nilai" stroke="#4f46e5" fill="#6366f1" fillOpacity={0.4} />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 text-base">🛤️ Proyeksi Penjurusan Lanjutan (AI Hybrid)</h4>
                  <div className="space-y-2.5">
                    {careerTracks.slice(0, 3).map((track, i) => (
                      <div key={track.trackName} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center gap-3">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-indigo-600">Peringkat #{i+1}</span>
                            <span className="font-bold text-slate-800 text-sm">{track.trackName}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{track.description}</p>
                        </div>
                        <div className="text-right min-w-[70px]">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase">Skor AI</span>
                          <span className="text-base font-extrabold text-slate-800">{Math.round(track.score)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Subject Strengths & Areas of improvement */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100/50">
                  <h5 className="font-bold text-emerald-900 text-sm mb-3">🌟 Kekuatan Utama Belajar</h5>
                  <div className="space-y-2">
                    {strengths.map((s, idx) => (
                      <div key={s.subject} className="flex justify-between items-center text-sm font-medium text-emerald-800">
                        <span>{idx+1}. {s.subject}</span>
                        <span className="font-bold">{s.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-rose-50/50 p-5 rounded-2xl border border-rose-100/50">
                  <h5 className="font-bold text-rose-900 text-sm mb-3">📉 Area Fokus Perbaikan</h5>
                  <div className="space-y-2">
                    {weaknesses.map((w, idx) => (
                      <div key={w.subject} className="flex justify-between items-center text-sm font-medium text-rose-800">
                        <span>{idx+1}. {w.subject}</span>
                        <span className="font-bold">{w.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Trend Tracker Dropdown Chart */}
              <div className="pt-6 border-t border-slate-100 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <h4 className="font-bold text-slate-800 text-base">📈 Visualisasi Perkembangan Nilai Siswa</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Pilih Mata Pelajaran:</span>
                    <select
                      value={selectedTrendSubject}
                      onChange={(e) => setSelectedTrendSubject(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500"
                    >
                      {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {selectedTrendSubject && (
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Mata Pelajaran</span>
                      <span className="text-lg font-extrabold text-slate-800 block mb-3">{selectedTrendSubject}</span>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Nilai Akhir:</span>
                          <span className="font-bold text-slate-800">{student.grades[selectedTrendSubject] || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Perkembangan Smt 1 ke 3:</span>
                          <span className={`font-bold ${
                            (student.trends[selectedTrendSubject] || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {(student.trends[selectedTrendSubject] || 0) >= 0 ? `+${student.trends[selectedTrendSubject] || 0}` : student.trends[selectedTrendSubject]}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2 h-44 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={[
                          { name: 'Semester 1', Selisih: 0 },
                          { name: 'Semester 3', Selisih: student.trends[selectedTrendSubject] || 0 }
                        ]}>
                          <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                          <YAxis stroke="#64748b" fontSize={11} />
                          <Tooltip />
                          <Line type="monotone" dataKey="Selisih" stroke={(student.trends[selectedTrendSubject] || 0) >= 0 ? '#10b981' : '#ef4444'} strokeWidth={3} activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sub Tab: DISIPLIN PRESENSI */}
          {subMenu === 'disiplin' && (
            <div className="space-y-6">
              <h4 className="font-bold text-slate-800 text-base">⏰ Kehadiran & Rekapitulasi Presensi Semester</h4>
              {isAbsensiSynced ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="h-60 w-full flex justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={attendanceData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {attendanceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                        <span className="block text-xs font-bold text-amber-600 mb-1">🤒 Sakit</span>
                        <span className="text-xl font-extrabold text-slate-800">{student.Sakit ?? 0}</span>
                        <span className="block text-[10px] text-slate-400 mt-1">Hari</span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                        <span className="block text-xs font-bold text-indigo-600 mb-1">📨 Izin</span>
                        <span className="text-xl font-extrabold text-slate-800">{student.Izin ?? 0}</span>
                        <span className="block text-[10px] text-slate-400 mt-1">Hari</span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                        <span className="block text-xs font-bold text-rose-600 mb-1">❌ Alpa</span>
                        <span className="text-xl font-extrabold text-slate-800">{student.Alpa ?? 0}</span>
                        <span className="block text-[10px] text-slate-400 mt-1">Hari</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-sm font-bold text-slate-700">Skor Integritas Kedisiplinan</span>
                        <p className="text-xs text-slate-500 mt-0.5">Penilaian kedisiplinan kumulatif harian hibrida.</p>
                      </div>
                      <span className="text-2xl font-extrabold text-indigo-600">{student.SkorDisiplin ?? 100}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-3xl">
                  <Clock className="mx-auto text-slate-300 mb-2" size={48} />
                  <p className="text-slate-500 font-medium text-sm">Data kehadiran presensi belum dimuat / di-sinkronkan.</p>
                  <p className="text-slate-400 text-xs mt-1">Gunakan tab <strong>'Sinkron'</strong> untuk memuat rekap absensi.</p>
                </div>
              )}
            </div>
          )}

          {/* Sub Tab: EKSKUL */}
          {subMenu === 'ekskul' && (
            <div className="space-y-6">
              <h4 className="font-bold text-slate-800 text-base">🏅 Ekstrakurikuler & Capaian Bakat Non-Akademik</h4>
              {isAbsensiSynced ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Ekskul Pramuka (Wajib)</span>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-700">Predikat Nilai</span>
                      <span className="bg-indigo-50 text-indigo-700 font-extrabold text-xl px-4 py-1.5 rounded-xl border border-indigo-100">
                        {student.Ekskul_Pramuka || '-'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Kesenian & Budaya</span>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-700">Predikat Nilai</span>
                      <span className="bg-indigo-50 text-indigo-700 font-extrabold text-xl px-4 py-1.5 rounded-xl border border-indigo-100">
                        {student.Ekskul_Kesenian || '-'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Minat Olahraga & Kebugaran</span>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-700">Predikat Nilai</span>
                      <span className="bg-emerald-50 text-emerald-600 font-extrabold text-xl px-4 py-1.5 rounded-xl border border-emerald-100">
                        {student.Ekskul_Olahraga || '-'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-3xl">
                  <Compass className="mx-auto text-slate-300 mb-2" size={48} />
                  <p className="text-slate-500 font-medium text-sm">Data rekapitulasi nilai ekstrakurikuler belum dimuat.</p>
                  <p className="text-slate-400 text-xs mt-1">Harap sync data sekunder terlebih dahulu.</p>
                </div>
              )}
            </div>
          )}

          {/* Sub Tab: BK RECORDS */}
          {subMenu === 'bk' && (
            <div className="space-y-6">
              <h4 className="font-bold text-slate-800 text-base">🛡️ Log Kasus & Dossier Bimbingan Konseling (BK)</h4>
              {student.CatatanBK && student.CatatanBK !== '-' ? (
                <div className="bg-rose-50 border border-rose-100 p-5 rounded-2xl flex gap-3 items-start">
                  <AlertCircle className="text-rose-600 shrink-0 mt-0.5" size={20} />
                  <div>
                    <h5 className="font-bold text-rose-900 text-sm">Ditemukan Catatan Khusus Perilaku:</h5>
                    <p className="text-xs font-bold text-rose-500 mt-0.5">Jumlah Pelanggaran: {student.JmlPelanggaran || 0}</p>
                    <p className="text-slate-700 text-sm mt-2 font-medium italic">"{student.CatatanBK}"</p>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl flex gap-3 items-start">
                  <CheckCircle className="text-emerald-600 shrink-0 mt-0.5" size={20} />
                  <div>
                    <h5 className="font-bold text-emerald-900 text-sm">Siswa Bersih & Adaptif</h5>
                    <p className="text-slate-700 text-sm mt-1 font-medium">
                      Siswa memiliki rekam kelakuan harian yang sangat baik, patuh terhadap tata tertib, serta tidak mencatatkan kasus konseling atau pelanggaran kedisiplinan dari bimbingan konseling.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
