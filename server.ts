/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { parseLeger } from "./server/parser";
import { mergeSecondaryData } from "./server/secondary";
import { generateAbsensiTemplate, generateBKTemplate } from "./server/templates";

const app = express();
const PORT = 3000;

// Increase request size limits for base64 file payloads
app.use(express.json({ limit: "20mb" }));

// Lazy-loaded Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not defined in the environment.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return aiClient;
}

// API Routes

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Upload Leger (Spreadsheet parsing)
app.post("/api/upload-leger", (req, res) => {
  try {
    const { fileData, fileName } = req.body;
    if (!fileData) {
      return res.status(400).json({ error: "fileData is required (base64 string)." });
    }

    const buffer = Buffer.from(fileData, "base64");
    const result = parseLeger(buffer);
    res.json(result);
  } catch (error: any) {
    console.error("Error parsing Leger:", error);
    res.status(500).json({ error: error.message || "Failed to parse Leger spreadsheet." });
  }
});

// Upload Secondary Data (Merge attendance / BK records)
app.post("/api/upload-secondary", (req, res) => {
  try {
    const { fileData, fileName, students } = req.body;
    if (!fileData) {
      return res.status(400).json({ error: "fileData is required (base64 string)." });
    }
    if (!students || !Array.isArray(students)) {
      return res.status(400).json({ error: "students array is required." });
    }

    const buffer = Buffer.from(fileData, "base64");
    const result = mergeSecondaryData(buffer, students);
    res.json(result);
  } catch (error: any) {
    console.error("Error merging secondary data:", error);
    res.status(500).json({ error: error.message || "Failed to merge secondary data." });
  }
});

// Download Templates
app.post("/api/download-template", (req, res) => {
  try {
    const { type, studentNames, className } = req.body;
    if (!type || !studentNames || !Array.isArray(studentNames)) {
      return res.status(400).json({ error: "type ('absensi' | 'bk') and studentNames array are required." });
    }

    const clsName = className || "Kelas Umum";
    let buffer: Buffer;
    let filename = "";

    if (type === "absensi") {
      buffer = generateAbsensiTemplate(studentNames, clsName);
      filename = `Template_Absensi_Ekskul_${clsName.replace(/\s+/g, "_")}.xlsx`;
    } else if (type === "bk") {
      buffer = generateBKTemplate(studentNames, clsName);
      filename = `Template_Catatan_BK_${clsName.replace(/\s+/g, "_")}.xlsx`;
    } else {
      return res.status(400).json({ error: "Invalid template type." });
    }

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.send(buffer);
  } catch (error: any) {
    console.error("Error generating template:", error);
    res.status(500).json({ error: error.message || "Failed to generate spreadsheet template." });
  }
});

// Gemini-Powered Analytics Insights
app.post("/api/generate-insights", async (req, res) => {
  try {
    const { type, payload } = req.body;
    
    // Check if API Key exists, if not use fallback rule-based generation
    const hasApiKey = !!process.env.GEMINI_API_KEY;

    if (!hasApiKey) {
      console.warn("GEMINI_API_KEY is not defined. Using high-quality Indonesian fallback insights.");
      const fallback = getFallbackInsights(type, payload);
      return res.json({ text: fallback, fallback: true });
    }

    const ai = getAiClient();
    let prompt = "";

    if (type === "student-profile") {
      prompt = `Anda adalah konselor pendidikan dan wali kelas berpengalaman. Buatlah laporan resume analitis kualitatif formal, penuh empati, dan membangun untuk siswa berikut ini dalam Bahasa Indonesia:
      
      Nama: ${payload.Nama}
      Rata-rata: ${payload.RataRata}
      Total Skor: ${payload.TotalNilai}
      Tren Belajar: ${payload.TrenBelajar} poin (perkembangan nilai dari Semester 1 ke Semester 3)
      Peringkat: ${payload.Peringkat} dari ${payload.TotalSiswa} siswa.
      Status: ${payload.Badge}
      
      Mata Pelajaran (Nilai): ${JSON.stringify(payload.grades)}
      Kekuatan Belajar: ${JSON.stringify(payload.strengths)}
      Area Fokus Perbaikan: ${JSON.stringify(payload.weaknesses)}
      Rekomendasi Penjurusan SMA/SMK: ${JSON.stringify(payload.careers)}
      
      Presensi & Perilaku:
      Sakit: ${payload.Sakit ?? 0} hari, Izin: ${payload.Izin ?? 0} hari, Alpa: ${payload.Alpa ?? 0} hari.
      Ekskul Pramuka: ${payload.Ekskul_Pramuka || "-"}, Ekskul Kesenian: ${payload.Ekskul_Kesenian || "-"}, Ekskul Olahraga: ${payload.Ekskul_Olahraga || "-"}
      Catatan BK: ${payload.CatatanBK || "Tidak ada catatan pelanggaran disiplin."}
      
      Format respon Anda harus rapi, menggunakan poin-poin Markdown, dan berisi 3 bagian utama:
      1. **Analisis Profil Kognitif**: Evaluasi kekuatan dan kelemahan akademik siswa secara tajam.
      2. **Aspek Disiplin & Pengembangan Diri**: Analisis kehadiran, partisipasi ekskul, dan perilaku.
      3. **Rekomendasi Strategis & Bimbingan**: Berikan saran belajar yang konkret, disesuaikan dengan nilai rata-rata dan area kelemahan, serta kesesuaian jalur karir penjurusan yang optimal.
      
      Jaga bahasa tetap profesional, berwibawa, namun memotivasi siswa dan orang tua.`;
    } else if (type === "head-to-head") {
      prompt = `Anda adalah pakar bimbingan konseling dan analisis data sekolah. Lakukan analisis perbandingan (head-to-head) kualitatif yang mendalam antara dua siswa berikut dalam Bahasa Indonesia:
      
      Siswa 1: ${payload.student1.Nama} (Rata-rata: ${payload.student1.RataRata}, Peringkat: #${payload.student1.Peringkat}, Tren: ${payload.student1.TrenBelajar})
      Siswa 2: ${payload.student2.Nama} (Rata-rata: ${payload.student2.RataRata}, Peringkat: #${payload.student2.Peringkat}, Tren: ${payload.student2.TrenBelajar})
      
      Sinergi Penjurusan Karir:
      Siswa 1 cenderung ke: ${payload.student1.Career}
      Siswa 2 cenderung ke: ${payload.student2.Career}
      
      Mata pelajaran dominan Siswa 1: ${JSON.stringify(payload.student1.strengths)}
      Mata pelajaran dominan Siswa 2: ${JSON.stringify(payload.student2.strengths)}
      
      Kehadiran & Disiplin:
      Siswa 1 (Sakit: ${payload.student1.Sakit ?? 0}, Izin: ${payload.student1.Izin ?? 0}, Alpa: ${payload.student1.Alpa ?? 0}, Catatan BK: ${payload.student1.CatatanBK || "-"})
      Siswa 2 (Sakit: ${payload.student2.Sakit ?? 0}, Izin: ${payload.student2.Izin ?? 0}, Alpa: ${payload.student2.Alpa ?? 0}, Catatan BK: ${payload.student2.CatatanBK || "-"})
      
      Buatlah laporan komparatif berstruktur Markdown berisi:
      1. **Peta Komparasi Rumpun Bakat**: Bandingkan spesialisasi kedua siswa, di mana mereka saling melengkapi atau bersaing.
      2. **Potensi Sinergi Belajar (Study Buddy)**: Apakah mereka cocok dipasangkan sebagai tutor sebaya? Sebutkan alasannya berdasarkan kekuatan subjek masing-masing.
      3. **Proyeksi Trajektori & Rekomendasi Pendampingan**: Bandingkan tren kecepatan belajar mereka dan bagaimana bimbingan konseling harus menyikapi perbedaan ini secara objektif.`;
    } else {
      return res.status(400).json({ error: "Invalid insight type." });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini AI API error:", error);
    // Graceful fallback on error so client never gets a blank screen
    const fallback = getFallbackInsights(req.body.type, req.body.payload);
    res.json({ text: fallback, error: error.message, fallback: true });
  }
});

// High-quality Indonesian Rule-Based Fallback Generator
function getFallbackInsights(type: string, payload: any): string {
  if (type === "student-profile") {
    const topStrength = payload.strengths?.[0] ? `${payload.strengths[0].name} (${payload.strengths[0].val})` : "bidang akademik utama";
    const bottomWeakness = payload.weaknesses?.[0] ? `${payload.weaknesses[0].name} (${payload.weaknesses[0].val})` : "pelajaran tertentu";
    const recommendedCareer = payload.careers?.[0]?.trackName || "program lanjutan";

    let advice = "";
    if (payload.RataRata >= 85) {
      advice = `Pertahankan prestasi akademik yang luar biasa ini! Disarankan untuk mengikuti bimbingan kompetensi sains/bahasa lanjutan dan aktif sebagai tutor sebaya bagi rekan-rekan kelas untuk memperkuat pemahaman konsep.`;
    } else if (payload.RataRata >= 75) {
      advice = `Progres belajar tergolong stabil dan baik. Sisihkan waktu ekstra sekitar 30 menit setiap hari untuk mendalami pelajaran ${bottomWeakness} dan berdiskusi kelompok guna meningkatkan pemahaman materi yang masih menantang.`;
    } else {
      advice = `Saatnya meningkatkan fokus dan disiplin belajar. Sangat disarankan untuk mengikuti program pendampingan remedial intensif untuk mata pelajaran ${bottomWeakness} serta berkonsultasi dengan guru mata pelajaran terkait.`;
    }

    let disiplinText = "";
    if (payload.Alpa > 0) {
      disiplinText = `Kehadiran siswa perlu diperhatikan karena mencatatkan ${payload.Alpa} hari absen tanpa keterangan (Alpa). Disiplin harian sangat krusial bagi konsistensi belajar akademik.`;
    } else if ((payload.Sakit || 0) + (payload.Izin || 0) > 5) {
      disiplinText = `Kehadiran tercatat cukup berkurang karena alasan kesehatan/izin (${(payload.Sakit || 0) + (payload.Izin || 0)} hari). Diperlukan koordinasi rutin untuk memastikan ketertinggalan materi pelajaran dapat segera terkejar.`;
    } else {
      disiplinText = `Tingkat kedisiplinan dan kehadiran siswa sangat prima (100% atau mendekati sempurna), mendukung penuh stabilitas kegiatan belajar mengajar harian.`;
    }

    return `### 💡 Laporan Profiling Cerdas - Pro-Edu Analytics (Fallback)

1. **Analisis Profil Kognitif**
   - Siswa **${payload.Nama}** menunjukkan kapabilitas akademik yang solid dengan nilai rata-rata keseluruhan **${payload.RataRata}** (Peringkat **${payload.Peringkat}** dari **${payload.TotalSiswa}** siswa).
   - Kekuatan utama terletak pada mata pelajaran **${topStrength}**, mencerminkan daya tangkap kognitif yang tinggi di rumpun tersebut.
   - Area yang membutuhkan perhatian khusus adalah mata pelajaran **${bottomWeakness}** yang menjadi tantangan utama pada semester ini.

2. **Aspek Disiplin & Pengembangan Diri**
   - ${disiplinText}
   - Partisipasi ekstrakurikuler: Pramuka [${payload.Ekskul_Pramuka || "-"}], Seni [${payload.Ekskul_Kesenian || "-"}], Olahraga [${payload.Ekskul_Olahraga || "-"}]. Partisipasi non-akademik ini menyeimbangkan ketahanan mental siswa.
   - Catatan BK: ${payload.CatatanBK && payload.CatatanBK !== "-" ? payload.CatatanBK : "Siswa memiliki rekam perilaku bersih, adaptif, dan patuh terhadap tata tertib sekolah."}

3. **Rekomendasi Strategis & Bimbingan**
   - **Rencana Belajar Mandiri**: ${advice}
   - **Trajektori Karir**: Jalur pendidikan yang paling disarankan adalah **${recommendedCareer}**, yang selaras dengan kecerdasan hibrida dan profil nilai tertinggi siswa.`;
  } else if (type === "head-to-head") {
    const s1Name = payload.student1.Nama;
    const s2Name = payload.student2.Nama;
    const s1Career = payload.student1.Career;
    const s2Career = payload.student2.Career;

    const leader = payload.student1.RataRata > payload.student2.RataRata ? s1Name : s2Name;
    const follower = payload.student1.RataRata > payload.student2.RataRata ? s2Name : s1Name;
    const margin = Math.abs(payload.student1.RataRata - payload.student2.RataRata).toFixed(2);

    return `### ⚖️ Laporan Perbandingan Head-to-Head - Pro-Edu Analytics (Fallback)

1. **Peta Komparasi Rumpun Bakat**
   - **${leader}** memiliki keunggulan kuantitatif makro secara akademis dengan selisih rata-rata **+${margin} poin** di atas **${follower}**.
   - Spesialisasi bakat mereka menunjukkan konfigurasi yang menarik. **${s1Name}** unggul di mata pelajaran **${payload.student1.strengths.slice(0, 2).join(", ") || "umum"}**, sementara **${s2Name}** menonjol di mata pelajaran **${payload.student2.strengths.slice(0, 2).join(", ") || "umum"}**.

2. **Potensi Sinergi Belajar (Study Buddy)**
   - Kedua siswa ini sangat cocok dijadikan **tutor sebaya (partner belajar)** karena memiliki profil kekuatan yang komplementer (saling melengkapi).
   - Misalnya, **${s1Name}** dapat membimbing rekan sejawatnya dalam subjek keahliannya, dan sebaliknya **${s2Name}** dapat membantu meningkatkan daya serap di rumpun keahliannya sendiri. Ini menciptakan sinergi kolaborasi sosial yang sehat.

3. **Proyeksi Trajektori & Rekomendasi Pendampingan**
   - **Perkembangan Tren**: Tren belajar mencatat **${payload.student1.TrenBelajar}** (untuk ${s1Name}) versus **${payload.student2.TrenBelajar}** (untuk ${s2Name}). Siswa dengan tren positif diproyeksikan berakselerasi lebih cepat pada caturwulan berikutnya.
   - **Saran BK**: Bimbingan karir harus dibedakan secara struktural. **${s1Name}** diarahkan menuju program studi **${s1Career}**, sedangkan **${s2Name}** diarahkan menuju **${s2Career}** agar potensi minat bakat masing-masing tergali seutuhnya.`;
  }
  return "Analisis data selesai diproses.";
}

// Vite and Static File Serving integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server started successfully. Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
