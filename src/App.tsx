/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Upload, Sparkles, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import BottomNav from './components/BottomNav';
import StudentProfileTab from './components/StudentProfileTab';
import ComparisonTab from './components/ComparisonTab';
import SubjectEvaluationTab from './components/SubjectEvaluationTab';
import ClusteringTab from './components/ClusteringTab';
import SyncDataTab from './components/SyncDataTab';
import DatabaseTab from './components/DatabaseTab';
import { sampleStudents, sampleSubjects } from './data/sampleStudents';
import { Student } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('profile');
  const [students, setStudents] = useState<Student[]>(sampleStudents);
  const [subjects, setSubjects] = useState<string[]>(sampleSubjects);
  const [className, setClassName] = useState<string>('Kelas 8-A');
  const [isAbsensiSynced, setIsAbsensiSynced] = useState<boolean>(true); // default sample is pre-synced
  
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Handle Main Leger e-Rapor Upload
  const handleMainLegerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const base64 = await convertFileToBase64(file);
      
      const response = await fetch('/api/upload-leger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData: base64,
          fileName: file.name
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal memproses file Leger.');
      }

      // Populate parsed data
      setStudents(data.students);
      setSubjects(data.subjects);
      setClassName(data.className);
      setIsAbsensiSynced(false); // Reset secondary sync since new Leger was uploaded
      setSuccessMsg(`Database kelas "${data.className}" berhasil dimuat! Sila lengkapi rekap kehadiran di tab "Sinkron".`);
      setActiveTab('profile'); // Switch to profile view
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal mengunggah Leger. Pastikan file e-Rapor valid.');
    } finally {
      setIsUploading(false);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased pb-24 md:pb-8">
      
      {/* Dynamic Top App Header Banner */}
      <header className="bg-white border-b border-slate-200/60 sticky top-0 z-40 backdrop-blur-md bg-white/90">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-600 rounded-xl text-white font-bold flex items-center justify-center">
                <Sparkles size={18} />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Pro-Edu Analytics
              </h1>
            </div>
            <p className="text-xs font-medium text-slate-500">
              Sistem Analisis Profiling Rapor & Kecerdasan Karir Siswa
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-3.5 py-1.5 text-center shrink-0">
              <span className="block text-[10px] font-bold text-indigo-500 uppercase tracking-wide">Database Aktif</span>
              <span className="text-sm font-semibold text-indigo-900">{className}</span>
            </div>

            {/* Quick Upload action button */}
            <label className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full font-semibold text-xs cursor-pointer shadow-lg shadow-indigo-100 transition-all select-none active:scale-95 w-full sm:w-auto">
              {isUploading ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Upload size={14} />
              )}
              <span>{isUploading ? 'Memuat...' : 'Unggah Leger'}</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv,.ods"
                className="hidden"
                onChange={handleMainLegerUpload}
                disabled={isUploading}
              />
            </label>
          </div>
        </div>
      </header>

      {/* Main Body View */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        
        {/* Error / Success Banner Alerts */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-800">
            <AlertCircle className="shrink-0 text-rose-600 mt-0.5" size={18} />
            <div>
              <p className="text-xs font-bold leading-normal">{errorMsg}</p>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3 text-emerald-800">
            <CheckCircle2 className="shrink-0 text-emerald-600 mt-0.5" size={18} />
            <div>
              <p className="text-xs font-bold leading-normal">{successMsg}</p>
            </div>
          </div>
        )}

        {/* Dynamic Inner Tab Router */}
        <div className="transition-all duration-300">
          {activeTab === 'profile' && (
            <StudentProfileTab 
              students={students} 
              subjects={subjects} 
              className={className}
              isAbsensiSynced={isAbsensiSynced}
            />
          )}

          {activeTab === 'compare' && (
            <ComparisonTab 
              students={students} 
              subjects={subjects}
              isAbsensiSynced={isAbsensiSynced}
            />
          )}

          {activeTab === 'eval' && (
            <SubjectEvaluationTab 
              students={students} 
              subjects={subjects}
            />
          )}

          {activeTab === 'cluster' && (
            <ClusteringTab 
              students={students}
            />
          )}

          {activeTab === 'sync' && (
            <SyncDataTab 
              students={students}
              className={className}
              onSecondaryDataSynced={(updated) => {
                setStudents(updated);
                setIsAbsensiSynced(true);
              }}
            />
          )}

          {activeTab === 'database' && (
            <DatabaseTab 
              students={students} 
              subjects={subjects}
              className={className}
              isAbsensiSynced={isAbsensiSynced}
            />
          )}
        </div>

      </main>

      {/* Bottom Sticky Tab Navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

    </div>
  );
}
