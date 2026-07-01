/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User, Scale, BookOpen, BrainCircuit, RefreshCw, Database } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  classNameLabel?: string;
}

export default function BottomNav({ activeTab, setActiveTab, classNameLabel = "" }: BottomNavProps) {
  const navItems = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'compare', label: 'Komparasi', icon: Scale },
    { id: 'eval', label: 'Evaluasi', icon: BookOpen },
    { id: 'cluster', label: 'AI Klaster', icon: BrainCircuit },
    { id: 'sync', label: 'Sinkron', icon: RefreshCw },
    { id: 'database', label: 'Database', icon: Database },
  ];

  return (
    <>
      {/* Desktop / Tablet Header Nav bar (hidden on mobile) */}
      <div className="hidden md:flex justify-center bg-white/80 backdrop-blur-md border border-slate-200/60 p-1.5 rounded-full shadow-sm max-w-3xl mx-auto mb-8">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-105'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-150/80 shadow-[0_-8px_24px_rgba(15,23,42,0.06)] pb-safe-bottom">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="flex flex-col items-center justify-center flex-1 h-full py-1 text-center group transition-transform active:scale-95"
              >
                <div
                  className={`flex items-center justify-center p-2 rounded-2xl transition-all duration-300 ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span
                  className={`text-[10px] font-medium tracking-tight mt-0.5 transition-colors duration-300 ${
                    isActive ? 'text-indigo-700 font-semibold' : 'text-slate-400'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
