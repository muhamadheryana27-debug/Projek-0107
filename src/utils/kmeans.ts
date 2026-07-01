/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Student } from '../types';

export interface KMeansPoint {
  x: number;
  y: number;
  student: Student;
}

export interface KMeansCluster {
  id: number;
  name: string;
  color: string;
  center: { x: number; y: number };
  points: KMeansPoint[];
}

export function runKMeans(points: KMeansPoint[], k: number = 3): KMeansCluster[] {
  if (points.length === 0) return [];

  // Extract dimensions
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  // Initialize centroids spread across x
  const centroids = [
    { x: minX + (maxX - minX) * 0.15, y: minY + (maxY - minY) * 0.5 },
    { x: minX + (maxX - minX) * 0.5, y: minY + (maxY - minY) * 0.5 },
    { x: minX + (maxX - minX) * 0.85, y: minY + (maxY - minY) * 0.5 },
  ];

  const assignments = new Array(points.length).fill(-1);
  let changed = true;
  let iterations = 0;

  while (changed && iterations < 100) {
    changed = false;
    iterations++;

    // Assign points to nearest centroid
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      let minDist = Infinity;
      let closestIdx = 0;

      for (let j = 0; j < k; j++) {
        const c = centroids[j];
        const dist = Math.pow(p.x - c.x, 2) + Math.pow(p.y - c.y, 2);
        if (dist < minDist) {
          minDist = dist;
          closestIdx = j;
        }
      }

      if (assignments[i] !== closestIdx) {
        assignments[i] = closestIdx;
        changed = true;
      }
    }

    // Recompute centroids
    const sums = Array.from({ length: k }, () => ({ x: 0, y: 0, count: 0 }));
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const clusterIdx = assignments[i];
      sums[clusterIdx].x += p.x;
      sums[clusterIdx].y += p.y;
      sums[clusterIdx].count++;
    }

    for (let j = 0; j < k; j++) {
      if (sums[j].count > 0) {
        centroids[j] = {
          x: sums[j].x / sums[j].count,
          y: sums[j].y / sums[j].count,
        };
      }
    }
  }

  // Sort centroids based on average grade (x-axis)
  const sortedCentroidIndices = centroids
    .map((c, idx) => ({ idx, x: c.x }))
    .sort((a, b) => a.x - b.x)
    .map(item => item.idx);

  const clusterMeta = [
    { name: "🎯 Fokus Bimbingan (Bawah)", color: "#ef4444" },
    { name: "📈 Berkembang (Menengah)", color: "#3b82f6" },
    { name: "🌟 Akselerasi (Atas)", color: "#10b981" }
  ];

  const clusters: KMeansCluster[] = [
    { id: 0, name: "", color: "", center: centroids[0], points: [] },
    { id: 1, name: "", color: "", center: centroids[1], points: [] },
    { id: 2, name: "", color: "", center: centroids[2], points: [] },
  ];

  sortedCentroidIndices.forEach((centroidIdx, rankIdx) => {
    clusters[centroidIdx].name = clusterMeta[rankIdx].name;
    clusters[centroidIdx].color = clusterMeta[rankIdx].color;
  });

  points.forEach((p, i) => {
    const clusterIdx = assignments[i];
    clusters[clusterIdx].points.push(p);
  });

  return clusters;
}
