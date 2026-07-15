import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { ArrowLeft, CheckCircle2, AlertCircle, HelpCircle, TrendingUp, Key, Edit, Eye } from 'lucide-react';

export default function AtsReportPage() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [resumeTitle, setResumeTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load resume details first to get the title
      const resumeData = await api.getResume(id);
      setResumeTitle(resumeData.title);

      // Load report data
      const reportData = await api.getResumeReport(id);
      setReport(reportData);
    } catch (err) {
      console.error(err);
      setError('Could not retrieve the ATS analysis report.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-500 stroke-emerald-500 dark:text-emerald-400';
    if (score >= 60) return 'text-amber-500 stroke-amber-500 dark:text-amber-400';
    return 'text-rose-500 stroke-rose-500 dark:text-rose-400';
  };

  const getScoreBadge = (score) => {
    if (score >= 80) return 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30';
    if (score >= 60) return 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/30';
    return 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/30';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] flex-grow">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
        <span className="text-sm text-slate-500 mt-4">Running ATS parser audit...</span>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <h3 className="font-outfit text-xl font-bold mb-2">Report Not Found</h3>
        <p className="text-slate-500 mb-6">{error || "No ATS report has been compiled for this resume yet."}</p>
        <div className="flex justify-center gap-4">
          <Link to={`/builder?id=${id}`} className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-xl text-sm font-semibold">
            Run AI Optimization
          </Link>
          <Link to="/dashboard" className="border px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Circular progress math
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (report.score / 100) * circumference;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-8 border-b dark:border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <Link
            to={`/preview/${id}`}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-outfit text-2xl font-extrabold tracking-tight">ATS Audit Report</h1>
            <p className="text-slate-500 text-xs mt-0.5">Resume: {resumeTitle}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            to={`/builder?id=${id}`}
            className="flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <Edit className="h-4 w-4" /> Refine Code
          </Link>
          <Link
            to={`/preview/${id}`}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 dark:bg-teal-600 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 dark:hover:bg-teal-500"
          >
            <Eye className="h-4 w-4" /> Download Center
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* LEFT PANEL: Circular Score Card (col-span-4) */}
        <div className="md:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-sm">
          <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider mb-4">Overall Match Rate</span>
          
          {/* Radial ring */}
          <div className="relative h-36 w-36 mb-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              <circle
                className="text-slate-100 dark:text-slate-800"
                strokeWidth="8"
                stroke="currentColor"
                fill="transparent"
                r={radius}
                cx="60"
                cy="60"
              />
              <circle
                className={`transition-all duration-500 ease-out ${getScoreColor(report.score)}`}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                r={radius}
                cx="60"
                cy="60"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-outfit text-3xl font-black">{Math.round(report.score)}%</span>
            </div>
          </div>

          <div className={`border px-3 py-1 rounded-full text-xs font-bold ${getScoreBadge(report.score)}`}>
            {report.score >= 80 ? 'ATS Compatible' : report.score >= 60 ? 'Needs Optimization' : 'High Risk Rejection'}
          </div>

          <p className="text-slate-500 text-xs mt-6 leading-relaxed">
            Standard automated tracking systems typically reject submissions with scores below 75%. Optimize details to hit the target.
          </p>
        </div>

        {/* RIGHT PANEL: Suggestions and Keywords (col-span-8) */}
        <div className="md:col-span-8 space-y-6">
          
          {/* Overall feedback card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
            <h3 className="font-outfit font-bold text-base flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-teal-600" /> Executive Audit Summary
            </h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              {report.overall_feedback}
            </p>
          </div>

          {/* Missing Keywords Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
            <h3 className="font-outfit font-bold text-base flex items-center gap-2 mb-3">
              <Key className="h-5 w-5 text-teal-600" /> Missing Job Keywords
            </h3>
            <p className="text-slate-500 text-xs mb-4">
              Add these technical keywords, methodologies, or standard tool terms directly into your skills or experience bullet descriptions.
            </p>
            <div className="flex flex-wrap gap-2">
              {report.missing_keywords.length === 0 ? (
                <span className="text-xs text-slate-500">None detected. Your resume matches typical terms.</span>
              ) : (
                report.missing_keywords.map((kw, idx) => (
                  <span
                    key={idx}
                    className="bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider"
                  >
                    {kw}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Actionable Suggestions */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
            <h3 className="font-outfit font-bold text-base flex items-center gap-2 mb-4">
              <CheckCircle2 className="h-5 w-5 text-teal-600" /> Critical Improvement Checklist
            </h3>
            <div className="space-y-3">
              {report.suggestions.map((suggestion, idx) => (
                <div key={idx} className="flex items-start gap-3 text-sm">
                  {suggestion.toLowerCase().includes('duplicate') || suggestion.toLowerCase().includes('missing') ? (
                    <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-teal-600 dark:text-teal-500 flex-shrink-0 mt-0.5" />
                  )}
                  <span className="text-slate-600 dark:text-slate-300 leading-normal">{suggestion}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
