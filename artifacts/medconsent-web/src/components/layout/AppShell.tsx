import React from "react";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background">
      {/* Desktop/Tablet Landscape Sidebar (Right side, RTL) */}
      <div className="hidden md:flex w-72 flex-col border-l border-border bg-card">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-[100dvh] w-full overflow-hidden relative pb-16 md:pb-0">
        <div className="flex-1 overflow-y-auto w-full p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile/Tablet Portrait Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card pb-safe">
        <BottomNav />
      </div>
    </div>
  );
}
