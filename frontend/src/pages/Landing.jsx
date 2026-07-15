import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, FileSpreadsheet, ShieldCheck, Download, CheckCircle, Zap } from 'lucide-react';

export default function Landing() {
  return (
    <div className="flex-grow flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-24 bg-gradient-to-b from-teal-50/40 via-transparent to-transparent dark:from-teal-950/10">
        <div className="absolute inset-0 -z-10 opacity-30 dark:opacity-20">
          <div className="absolute -top-40 left-1/3 w-[500px] h-[500px] bg-teal-400/20 rounded-full blur-3xl animate-pulse-subtle"></div>
          <div className="absolute top-10 right-1/4 w-[400px] h-[400px] bg-emerald-400/20 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-teal-200 bg-teal-50/50 text-teal-800 dark:border-teal-800/40 dark:bg-teal-950/20 dark:text-teal-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="h-3.5 w-3.5" /> Next-Gen Resume Optimization
          </div>

          <h1 className="font-outfit text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-8">
            Create an <span className="text-gradient">ATS-Optimized</span> Resume <br className="hidden sm:inline" />
            Powered by Multi-Agent AI
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10 leading-relaxed">
            Don't get blocked by ATS scanners. Our sequential AI agents validate, enhance, score, and format your profile to draft bullet points that highlight real business impact.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/builder"
              className="w-full sm:w-auto bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-500 hover:to-emerald-400 text-white font-semibold text-lg px-8 py-3.5 rounded-xl shadow-xl shadow-teal-500/10 transition-all duration-200 hover:-translate-y-0.5"
              id="hero-create-btn"
            >
              Build Your Resume Now
            </Link>
            <Link
              to="/dashboard"
              className="w-full sm:w-auto bg-white/80 hover:bg-white dark:bg-slate-900/80 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 font-semibold text-lg px-8 py-3.5 rounded-xl text-slate-700 dark:text-slate-300 transition-all duration-200 hover:-translate-y-0.5"
              id="hero-dashboard-btn"
            >
              View Saved Resumes
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 border-t border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-950/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-outfit text-3xl sm:text-4xl font-bold mb-4">
              Advanced AI Pipeline
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
              Our system runs a coordinated sequence of AI agents to optimize every detail.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 p-3 rounded-xl w-fit mb-5">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="font-outfit font-bold text-lg mb-2">1. Input Validation</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Validation agents scan your inputs for duplicate skills, invalid phone numbers, empty descriptions, or missing sections.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 p-3 rounded-xl w-fit mb-5">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="font-outfit font-bold text-lg mb-2">2. AI Enhancement</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Enhancement agents automatically rewrite career objectives, work experience bullet points, and project details.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="bg-cyan-50 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400 p-3 rounded-xl w-fit mb-5">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <h3 className="font-outfit font-bold text-lg mb-2">3. ATS Analysis</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                ATS agents match your resume structure against standard keywords to generate actionable suggestions and metrics.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 p-3 rounded-xl w-fit mb-5">
                <Download className="h-6 w-6" />
              </div>
              <h3 className="font-outfit font-bold text-lg mb-2">4. Quality Export</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Generate native, downloadable PDF files using ReportLab stylesheets or fully editable Word documents in standard layout formats.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section Placeholder */}
      <section className="py-20 border-t border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-outfit text-3xl sm:text-4xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Start building your resume for free, or unlock premium features.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-8">
            {/* Free Tier */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl relative flex flex-col justify-between">
              <div>
                <h3 className="font-outfit font-bold text-2xl mb-2">Basic Draft</h3>
                <p className="text-slate-500 text-sm mb-6">Perfect for testing the tool and exporting initial drafts.</p>
                <div className="text-4xl font-extrabold mb-6 font-outfit">$0</div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-2.5 text-sm">
                    <CheckCircle className="h-4.5 w-4.5 text-teal-500 flex-shrink-0" />
                    <span>Unlimited Resume creations</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-sm">
                    <CheckCircle className="h-4.5 w-4.5 text-teal-500 flex-shrink-0" />
                    <span>Standard PDF layout download</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-sm text-slate-400">
                    <CheckCircle className="h-4.5 w-4.5 text-slate-300 flex-shrink-0" />
                    <span>AI Optimization unavailable</span>
                  </li>
                </ul>
              </div>
              <Link
                to="/builder"
                className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-center font-medium py-3 rounded-xl transition-colors duration-200"
              >
                Get Started
              </Link>
            </div>

            {/* Pro Tier */}
            <div className="bg-white dark:bg-slate-900 border-2 border-teal-500 p-8 rounded-3xl relative flex flex-col justify-between shadow-xl shadow-teal-500/5">
              <div className="absolute -top-4 right-6 bg-teal-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Recommended
              </div>
              <div>
                <h3 className="font-outfit font-bold text-2xl mb-2">Premium Pro</h3>
                <p className="text-slate-500 text-sm mb-6">Unlock deep AI refinement and complete Word document options.</p>
                <div className="text-4xl font-extrabold mb-6 font-outfit">
                  $19 <span className="text-sm font-normal text-slate-500">/ month</span>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-2.5 text-sm">
                    <CheckCircle className="h-4.5 w-4.5 text-teal-500 flex-shrink-0" />
                    <span>Gemini AI Multi-agent Optimizations</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-sm">
                    <CheckCircle className="h-4.5 w-4.5 text-teal-500 flex-shrink-0" />
                    <span>Full ATS Scoring and Suggestions</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-sm">
                    <CheckCircle className="h-4.5 w-4.5 text-teal-500 flex-shrink-0" />
                    <span>All 7 High-Fidelity PDF & DOCX templates</span>
                  </li>
                </ul>
              </div>
              <Link
                to="/builder"
                className="w-full bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-500 hover:to-emerald-400 text-white text-center font-medium py-3 rounded-xl transition-colors duration-200"
              >
                Go Pro Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} ResuAI. Built for ATS compliance and professional placement.</p>
      </footer>
    </div>
  );
}
