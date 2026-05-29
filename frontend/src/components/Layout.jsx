import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Fixed header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 shrink-0 z-10">
          {/* Burger button */}
          <button
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition mr-3"
            aria-label="Toggle menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Mobile logo — shown only when sidebar is hidden */}
          <span className="md:hidden text-lg font-bold text-teal-600">FairShare</span>

          {/* Spacer */}
          <div className="flex-1" />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>

      </div>
    </div>
  );
};

export default Layout;