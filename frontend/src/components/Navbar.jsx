import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, LayoutDashboard, Settings, PlusCircle } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="sticky top-0 z-50 glass-effect border-b border-slate-200/50 dark:border-slate-800/50 w-full transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-gradient-to-tr from-teal-500 to-emerald-400 p-2 rounded-xl text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform duration-200">
                <FileText className="h-5 w-5" />
              </div>
              <span className="font-outfit font-bold text-xl tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Resu<span className="text-teal-500">AI</span>
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/dashboard"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/dashboard')
                  ? 'bg-teal-50 text-teal-600 dark:bg-teal-950/30 dark:text-teal-400'
                  : 'text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400'
              }`}
              id="nav-dashboard-link"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              to="/builder"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/builder')
                  ? 'bg-teal-50 text-teal-600 dark:bg-teal-950/30 dark:text-teal-400'
                  : 'text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400'
              }`}
              id="nav-builder-link"
            >
              <PlusCircle className="h-4 w-4" />
              Build Resume
            </Link>
            <Link
              to="/settings"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/settings')
                  ? 'bg-teal-50 text-teal-600 dark:bg-teal-950/30 dark:text-teal-400'
                  : 'text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400'
              }`}
              id="nav-settings-link"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </div>

          {/* Actions panel */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              to="/builder"
              className="bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-500 hover:to-emerald-400 text-white shadow-lg shadow-teal-500/10 font-medium px-4 py-2 rounded-xl text-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
              id="nav-cta-btn"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
