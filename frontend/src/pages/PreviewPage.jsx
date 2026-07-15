import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { ArrowLeft, Download, FileSpreadsheet, Edit3, Award, RefreshCw } from 'lucide-react';
import ResumePreview from '../components/ResumePreview';

export default function PreviewPage() {
  const { id } = useParams();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTemplate, setActiveTemplate] = useState('modern');

  useEffect(() => {
    fetchResume();
  }, [id]);

  const fetchResume = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getResume(id);
      setResume(data);
      if (data.template_name) {
        setActiveTemplate(data.template_name);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to retrieve the resume from the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!resume) return;
    try {
      setLoading(true);
      // Map to correct payload
      const payload = resume.enhanced_data || resume.raw_data;
      // Inject selected template configuration
      payload.preferred_template = activeTemplate;
      
      const fileName = `${resume.title.replace(/\s+/g, '_')}_Resume.pdf`;
      await api.downloadPdf(payload, fileName);
    } catch (err) {
      console.error(err);
      alert('Failed to generate PDF. Make sure ReportLab is installed on the backend server.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDocx = async () => {
    if (!resume) return;
    try {
      setLoading(true);
      const payload = resume.enhanced_data || resume.raw_data;
      payload.preferred_template = activeTemplate;
      
      const fileName = `${resume.title.replace(/\s+/g, '_')}_Resume.docx`;
      await api.downloadDocx(payload, fileName);
    } catch (err) {
      console.error(err);
      alert('Failed to generate DOCX. Make sure python-docx is installed on the backend.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !resume) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] flex-grow">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
        <span className="text-sm text-slate-500 mt-4">Rendering document workspace...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <h3 className="font-outfit text-xl font-bold mb-2">Error Loading Resume</h3>
        <p className="text-slate-500 mb-6">{error}</p>
        <Link to="/dashboard" className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-xl text-sm font-semibold">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const hasAtsScore = resume.ats_score !== null;
  const resumeData = resume.enhanced_data || resume.raw_data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
      
      {/* Navigation Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b dark:border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-outfit text-2xl font-extrabold tracking-tight">{resume.title}</h1>
            <p className="text-slate-500 text-xs mt-0.5">Template Preview and Download Center</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to={`/builder?id=${resume.id}`}
            className="flex items-center gap-1.5 px-4 py-2 border rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            <Edit3 className="h-4.5 w-4.5" /> Edit Content
          </Link>
          {hasAtsScore && (
            <Link
              to={`/report/${resume.id}`}
              className="flex items-center gap-1.5 px-4 py-2 border border-teal-200 bg-teal-50/50 text-teal-700 hover:bg-teal-50 dark:border-teal-900/40 dark:bg-teal-950/20 dark:text-teal-400 dark:hover:bg-teal-950/40 rounded-xl text-xs font-semibold"
            >
              <FileSpreadsheet className="h-4.5 w-4.5" /> View ATS Report ({Math.round(resume.ats_score)}%)
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT: Template Switcher & Downloads Panel (col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Template Selector Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
            <h3 className="font-outfit font-bold text-base mb-4">Switch Template Layout</h3>
            <div className="space-y-2">
              {[
                { id: 'modern', label: 'Modern Accent (Teal)' },
                { id: 'classic', label: 'Classic Traditional' },
                { id: 'minimal', label: 'High Density Minimal' },
                { id: 'professional', label: 'Corporate Professional' },
                { id: 'harvard', label: 'Academic Harvard' },
                { id: 'two column', label: 'Modern Two Column' },
                { id: 'one column', label: 'Standard One Column' }
              ].map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => setActiveTemplate(tpl.id)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm transition-colors border ${
                    activeTemplate === tpl.id
                      ? 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-800/40 font-semibold'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Export / Download Center */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-4">
            <h3 className="font-outfit font-bold text-base">Download Center</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Export your resume in standard formats. The PDF compile maintains pixel alignment and ATS keyword spacing.
            </p>

            <button
              onClick={handleDownloadPdf}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-semibold py-3 rounded-xl text-sm transition-all"
            >
              <Download className="h-4.5 w-4.5" /> Download ATS PDF
            </button>
            <button
              onClick={handleDownloadDocx}
              className="w-full flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold py-3 rounded-xl text-sm transition-all"
            >
              <Download className="h-4.5 w-4.5" /> Download Word (DOCX)
            </button>
          </div>

        </div>

        {/* RIGHT: Document Live Preview (col-span-8) */}
        <div className="lg:col-span-8 bg-slate-100 dark:bg-slate-950/30 p-6 rounded-2xl border dark:border-slate-900">
          <div className="bg-white rounded-xl shadow-lg border max-w-2xl mx-auto overflow-hidden">
            <ResumePreview data={resumeData} template={activeTemplate} />
          </div>
        </div>

      </div>

    </div>
  );
}
