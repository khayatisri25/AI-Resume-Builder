import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Plus, FileText, Calendar, ChevronRight, BarChart2, Trash2, Eye, Search, AlertCircle, FileEdit } from 'lucide-react';

export default function Dashboard() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getResume(); // Calls GET /resume
      setResumes(data || []);
    } catch (err) {
      console.error('Fetch resumes error:', err);
      setError('Could not connect to the server. Make sure the FastAPI backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete the resume "${title}"?`)) {
      try {
        await api.deleteResume(id);
        // Refresh local list
        setResumes(resumes.filter((r) => r.id !== id));
      } catch (err) {
        console.error('Delete error:', err);
        alert('Failed to delete resume. Please try again.');
      }
    }
  };

  const filteredResumes = resumes.filter((resume) => {
    const titleMatch = resume.title.toLowerCase().includes(searchTerm.toLowerCase());
    const roleMatch = resume.raw_data?.target_role?.toLowerCase().includes(searchTerm.toLowerCase());
    return titleMatch || roleMatch;
  });

  const getScoreColorClass = (score) => {
    if (!score) return 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
    if (score >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/40';
    if (score >= 60) return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/40';
    return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800/40';
  };

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-outfit text-3xl font-extrabold tracking-tight">Your Resumes</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Build, optimize, and manage your ATS-friendly resume versions.
          </p>
        </div>
        <Link
          to="/builder"
          className="bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-500 hover:to-emerald-400 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-teal-500/10 flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5"
          id="dashboard-new-resume-btn"
        >
          <Plus className="h-5 w-5" /> Create New
        </Link>
      </div>

      {/* Error Boundary */}
      {error && (
        <div className="bg-rose-50 border border-rose-200/50 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400 p-4 rounded-xl flex items-start gap-3 mb-8">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold">Connection Error</h3>
            <p className="text-sm mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Search and stats bar */}
      <div className="mb-6 flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl gap-3">
        <Search className="h-5 w-5 text-slate-400 flex-shrink-0 ml-1" />
        <input
          type="text"
          placeholder="Search by title or job role..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-0 outline-none w-full text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm"
          id="dashboard-search-input"
        />
      </div>

      {/* Content list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
          <span className="text-sm text-slate-500 mt-4">Loading saved profiles...</span>
        </div>
      ) : filteredResumes.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl p-8 max-w-xl mx-auto shadow-sm">
          <FileText className="h-16 w-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <h3 className="font-outfit text-xl font-bold mb-2">No resumes found</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-md mx-auto">
            {searchTerm 
              ? `No results match "${searchTerm}". Try a different term or clear the filter.` 
              : "You haven't created any resumes yet. Use the multi-agent AI builder to create one now."}
          </p>
          <Link
            to="/builder"
            className="inline-flex items-center gap-2 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/30 dark:hover:bg-teal-950/50 text-teal-700 dark:text-teal-400 font-semibold px-5 py-2.5 rounded-xl transition-colors duration-200"
          >
            <Plus className="h-4.5 w-4.5" /> Start First Resume
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResumes.map((resume) => {
            const personal = resume.raw_data?.personal_info || {};
            const role = resume.raw_data?.target_role || 'General Profile';
            const template = resume.template_name || 'modern';
            
            return (
              <div 
                key={resume.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden"
              >
                {/* Visual card header */}
                <div className="mb-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-outfit font-bold text-lg text-slate-800 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                        {resume.title}
                      </h3>
                      <p className="text-slate-500 text-xs mt-0.5">{role}</p>
                    </div>
                    {/* Score badge */}
                    <div className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getScoreColorClass(resume.ats_score)}`}>
                      {resume.ats_score ? `ATS: ${Math.round(resume.ats_score)}%` : 'No score'}
                    </div>
                  </div>

                  <div className="space-y-2 mt-4 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Updated {formatDate(resume.updated_at)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5" />
                      <span className="capitalize">Layout: {template}</span>
                    </div>
                  </div>
                </div>

                {/* Operations footer */}
                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 flex items-center justify-between gap-2 mt-auto">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => navigate(`/builder?id=${resume.id}`)}
                      className="p-2 text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      title="Edit Resume"
                    >
                      <FileEdit className="h-4.5 w-4.5" />
                    </button>
                    <button
                      onClick={() => navigate(`/preview/${resume.id}`)}
                      className="p-2 text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      title="Download Center"
                    >
                      <Eye className="h-4.5 w-4.5" />
                    </button>
                    {resume.ats_score && (
                      <button
                        onClick={() => navigate(`/report/${resume.id}`)}
                        className="p-2 text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        title="ATS Report"
                      >
                        <BarChart2 className="h-4.5 w-4.5" />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(resume.id, resume.title)}
                    className="p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors"
                    title="Delete Resume"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
