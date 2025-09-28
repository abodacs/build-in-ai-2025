import { ReactNode } from 'react';
import { Header } from './header/Header';
import { Sidebar } from './sidebar/Sidebar';
import { WarningBanner } from './header/WarningBanner';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Centered container with max width */}
      <div className="max-w-7xl mx-auto bg-white">
        {/* Header */}
        <Header />

        {/* Warning Banner */}
        <WarningBanner />

        {/* Two-column layout */}
        <div className="flex">
          {/* Sidebar */}
          <aside className="w-80 bg-white">
            <Sidebar />
          </aside>

          {/* Main content area */}
          <main className="flex-1 bg-white">{children}</main>
        </div>
      </div>
    </div>
  );
}
