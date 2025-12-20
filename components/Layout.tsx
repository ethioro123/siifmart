import React from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import NetworkStatusIndicator from './NetworkStatusIndicator';


import { GhostModeBanner } from './GhostModeBanner';

export default function Layout({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-cyber-black text-gray-300 font-sans overflow-hidden transition-colors duration-300">
      <NetworkStatusIndicator />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <GhostModeBanner />
        <TopBar />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 scroll-smooth">
          <div className="w-full space-y-6">
            {children}
          </div>
        </main>
      </div>
      {/* AI Navigation Assistant - Intelligent navigation for all users */}

      {/* AI Proactive Suggestions - Intelligent alerts for super admins */}

    </div>
  );
}