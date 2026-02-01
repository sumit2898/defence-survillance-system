import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";

export function Layout({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top decorative bar */}
        <div className="h-1 bg-gradient-to-r from-red-900 via-transparent to-transparent opacity-20" />
        
        <div className={cn("flex-1 overflow-auto p-4 md:p-8 scroll-smooth", className)}>
          {children}
        </div>
      </main>
    </div>
  );
}
