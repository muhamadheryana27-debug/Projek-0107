/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { BrainCircuit, Info, Sparkles } from 'lucide-react';
import { Student } from '../types';
import { runKMeans, KMeansPoint, KMeansCluster } from '../utils/kmeans';
import { 
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

interface ClusteringTabProps {
  students: Student[];
}

export default function ClusteringTab({ students }: ClusteringTabProps) {
  // Process points for KMeans
  const kmeansPoints = useMemo<KMeansPoint[]>(() => {
    return students.map(s => ({
      x: s.RataRata,
      y: s.TrenBelajar,
      student: s
    }));
  }, [students]);

  // Run KMeans
  const clusters = useMemo<KMeansCluster[]>(() => {
    if (kmeansPoints.length === 0) return [];
    try {
      return runKMeans(kmeansPoints, 3);
    } catch (e) {
      console.error("Clustering error:", e);
      return [];
    }
  }, [kmeansPoints]);

  // Formatted scatter data for Recharts
  const scatterGroups = useMemo(() => {
    return clusters.map(cluster => ({
      name: cluster.name,
      color: cluster.color,
      data: cluster.points.map(p => ({
        x: p.x,
        y: p.y,
        name: p.student.Nama,
        z: Math.round(p.student.TotalNilai)
      }))
    }));
  }, [clusters]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-1 pb-24">
      {/* Intro Explanation Banner */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-[24px] p-6 shadow-sm relative overflow-hidden">
        <div className="relative flex gap-4 items-start">
          <div className="bg-white/10 p-3 rounded-full text-indigo-300 backdrop-blur-sm shrink-0">
            <BrainCircuit size={28} />
          </div>
          <div>
            <h4 className="font-bold text-lg flex items-center gap-2">
              <span>Sistem Pemetaan Siswa Cerdas (K-Means Clustering)</span>
              <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border border-indigo-500/20">Machine Learning</span>
            </h4>
            <p className="text-slate-300 text-sm mt-1.5 leading-relaxed">
              Algoritma memisahkan seluruh siswa ke dalam 3 kelompok utama secara objektif berlandaskan pada <strong>Rata-Rata Akademik</strong> dan <strong>Tren Kecepatan Belajar</strong>. 
              Sistem ini memfasilitasi program bantuan guru terarah: pengayaan intensif bagi kelompok akselerasi atau jadwal remedial massal bagi kelompok fokus bimbingan.
            </p>
          </div>
        </div>
      </div>

      {/* Scatter Chart */}
      {scatterGroups.length > 0 && (
        <div className="bg-white border border-slate-150 rounded-[24px] p-6 shadow-sm">
          <h4 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-1.5">
            <Sparkles size={16} className="text-indigo-600" />
            <span>Peta Sebaran Potensi Siswa Berbasis AI</span>
          </h4>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name="Rata-rata" 
                  unit="" 
                  domain={[60, 100]} 
                  stroke="#64748b" 
                  fontSize={11}
                  label={{ value: 'Rata-Rata Akademik', position: 'bottom', offset: 0, fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                />
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  name="Tren Belajar" 
                  unit=" pts" 
                  stroke="#64748b" 
                  fontSize={11}
                  label={{ value: 'Tren Kecepatan', angle: -90, position: 'insideLeft', offset: 10, fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                />
                <ZAxis type="number" dataKey="z" range={[60, 200]} name="Total Nilai" />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }} 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-800 text-xs space-y-1 shadow-xl">
                          <p className="font-bold">{data.name}</p>
                          <p className="text-slate-300">Rata-rata: <strong className="text-white">{data.x}</strong></p>
                          <p className="text-slate-300">Tren: <strong className={`font-extrabold ${data.y >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{data.y >= 0 ? `+${data.y}` : data.y}</strong></p>
                          <p className="text-slate-300">Total Skor: <strong className="text-white">{data.z}</strong></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                {scatterGroups.map((group) => (
                  <Scatter 
                    key={group.name} 
                    name={group.name} 
                    data={group.data} 
                    fill={group.color} 
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Group Lists */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {clusters.map((cluster) => {
          const isTop = cluster.name.includes("Atas") || cluster.name.includes("Akselerasi");
          const isBottom = cluster.name.includes("Bawah") || cluster.name.includes("Bimbingan");
          
          return (
            <div 
              key={cluster.name} 
              className={`rounded-2xl border p-5 shadow-sm space-y-4 ${
                isTop 
                  ? 'bg-emerald-50/40 border-emerald-100' 
                  : isBottom 
                  ? 'bg-rose-50/40 border-rose-100' 
                  : 'bg-indigo-50/40 border-indigo-100'
              }`}
            >
              <h5 className={`font-bold text-sm flex items-center gap-1.5 ${
                isTop ? 'text-emerald-800' : isBottom ? 'text-rose-800' : 'text-indigo-800'
              }`}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cluster.color }}></span>
                <span>{cluster.name}</span>
              </h5>

              <div className="divide-y divide-slate-100/60 max-h-64 overflow-y-auto pr-1">
                {cluster.points.map((p) => (
                  <div key={p.student.Nama} className="py-2 flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-700">{p.student.Nama}</span>
                    <span className="text-slate-500 font-mono">Avg: {p.student.RataRata}</span>
                  </div>
                ))}
                {cluster.points.length === 0 && (
                  <p className="text-xs text-slate-400 italic text-center py-4">Kelompok kosong.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
