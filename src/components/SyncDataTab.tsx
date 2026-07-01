/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Download, Upload, RefreshCw, CheckCircle, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { Student } from '../types';

interface SyncDataTabProps {
  students: Student[];
  className: string;
  onSecondaryDataSynced: (updatedStudents: Student[]) => void;
}

export default function SyncDataTab({ students, className, onSecondaryDataSynced }: SyncDataTabProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  // Trigger download from backend
  const handleDownloadTemplate = async (type: 'absensi' | 'bk') => {
    setIsDownloading(type);
    try {
      const studentNames = students.map(s => s.Nama);
      const response = await fetch('/api/download-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          studentNames,
          className
        })
      });

      if (!response.ok) {
        throw new Error('Gagal menghasilkan file template.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = type === 'absensi' 
        ? `Template_Absensi_Ekskul_${className.replace(/\s+/g, '_')}.xlsx`
        : `Template_Catatan_BK_${className.replace(/\s+/g, '_')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Gagal mengunduh template spreadsheet.");
    } finally {
      setIsDownloading(null);
    }
  };

  // Convert uploaded spreadsheet to Base64 and post to backend
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus({ type: null, message: '' });

    try {
      const base64 = await convertFileToBase64(file);
      
      const response = await fetch('/api/upload-secondary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData: base64,
          fileName: file.name,
          students
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal memproses unggahan data sekunder.');
      }

      // Success
      onSecondaryDataSynced(data.students);
      setUploadStatus({
        type: 'success',
        message: data.message || "Sinkronisasi Berhasil!"
      });
    } catch (err: any) {
      console.error(err);
      setUploadStatus({
        type: 'error',
        message: err.message || "Gagal memproses file. Pastikan struktur kolom sesuai."
      });
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
        // Strip out metadata prefix (e.g., "data:image/png;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-1 pb-24">
      {/* Templates Row */}
      <div className="bg-white border border-slate-150 rounded-[24px] p-6 shadow-sm space-y-4">
        <div>
          <h4 className="font-bold text-slate-800 text-base flex items-center gap-1.5">
            <Download size={18} className="text-indigo-600" />
            <span>Unduh Template Dokumen BK & Absensi (Terbaru)</span>
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Gunakan template yang tersusun rapat dan berurutan untuk menghindari kesalahan salin-tempel (distorsi spasi/kolom).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Template 1 */}
          <div className="bg-slate-50/60 border border-slate-100 p-5 rounded-2xl flex flex-col justify-between gap-4">
            <div>
              <h5 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <FileSpreadsheet className="text-indigo-500" size={16} />
                <span>Template Absensi & Ekskul (Terbaru)</span>
              </h5>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Menampung Sakit, Izin, Alpa, serta predikat ekstrakurikuler Pramuka, Kesenian, dan Olahraga.
              </p>
            </div>
            
            <button
              onClick={() => handleDownloadTemplate('absensi')}
              disabled={isDownloading !== null}
              className="flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-100 text-indigo-700 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all w-full cursor-pointer"
            >
              <Download size={14} />
              <span>{isDownloading === 'absensi' ? 'Menyiapkan...' : 'Download Template Absensi'}</span>
            </button>
          </div>

          {/* Template 2 */}
          <div className="bg-slate-50/60 border border-slate-100 p-5 rounded-2xl flex flex-col justify-between gap-4">
            <div>
              <h5 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <FileSpreadsheet className="text-indigo-500" size={16} />
                <span>Template Catatan Pelanggaran BK</span>
              </h5>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Gunakan file ini untuk merekap rekam kasus kedisiplinan dan jumlah laporan pelanggaran dari tim BK.
              </p>
            </div>

            <button
              onClick={() => handleDownloadTemplate('bk')}
              disabled={isDownloading !== null}
              className="flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-100 text-indigo-700 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all w-full cursor-pointer"
            >
              <Download size={14} />
              <span>{isDownloading === 'bk' ? 'Menyiapkan...' : 'Download Template Catatan BK'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* File Upload Region */}
      <div className="bg-white border border-slate-150 rounded-[24px] p-6 shadow-sm space-y-4">
        <div>
          <h4 className="font-bold text-slate-800 text-base flex items-center gap-1.5">
            <Upload size={18} className="text-indigo-600" />
            <span>Upload Data Absensi / BK yang Sudah Diisi</span>
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Unggah file spreadsheet (.xlsx, .csv) absensi HSIA atau catatan BK untuk mengaktifkan fitur analisis perilaku siswa.
          </p>
        </div>

        {/* Drag and Drop Box */}
        <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-slate-200 border-dashed rounded-2xl cursor-pointer bg-[#F8FAFC] hover:bg-slate-50 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
            {isUploading ? (
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
            ) : (
              <Upload className="w-8 h-8 text-slate-400 mb-3" />
            )}
            <p className="mb-2 text-sm text-slate-600 font-semibold">
              {isUploading ? "Sedang memproses dokumen..." : "Klik untuk pilih file atau seret file ke sini"}
            </p>
            <p className="text-xs text-slate-400 font-medium">Mendukung format .xlsx, .xls, .csv, atau .ods</p>
          </div>
          <input
            type="file"
            accept=".xlsx,.xls,.csv,.ods"
            className="hidden"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
        </label>

        {/* Status Prompt */}
        {uploadStatus.type && (
          <div className={`p-4 rounded-xl flex items-start gap-3 border ${
            uploadStatus.type === 'success' 
              ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
              : 'bg-rose-50 border-rose-100 text-rose-800'
          }`}>
            {uploadStatus.type === 'success' ? (
              <CheckCircle className="shrink-0 text-emerald-600" size={18} />
            ) : (
              <AlertTriangle className="shrink-0 text-rose-600" size={18} />
            )}
            <p className="text-xs font-semibold leading-relaxed">{uploadStatus.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
