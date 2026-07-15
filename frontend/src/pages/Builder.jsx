import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { api } from '../services/api';
import { 
  Sparkles, Save, ArrowRight, ArrowLeft, Plus, Trash2, 
  User, BookOpen, Briefcase, FileCode, CheckSquare, 
  Award, Globe, HelpCircle, FileText 
} from 'lucide-react';
import ResumePreview from '../components/ResumePreview';

const TABS = [
  { id: 'personal', label: 'Personal Info', icon: User },
  { id: 'objective', label: 'Objective & Role', icon: HelpCircle },
  { id: 'education', label: 'Education', icon: BookOpen },
  { id: 'experience', label: 'Work Experience', icon: Briefcase },
  { id: 'projects', label: 'Projects', icon: FileCode },
  { id: 'skills', label: 'Skills & Tech', icon: CheckSquare },
  { id: 'others', label: 'Others', icon: Award }
];

export default function Builder() {
  const [searchParams] = useSearchParams();
  const resumeId = searchParams.get('id');
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [aiStep, setAiStep] = useState(''); // Tracking which AI Agent is running
  const [title, setTitle] = useState('My Resume');

  // React Hook Form initialization
  const { register, control, handleSubmit, reset, watch, setValue, getValues } = useForm({
    defaultValues: {
      personal_info: {
        full_name: '',
        professional_title: '',
        email: '',
        phone: '',
        address: '',
        linkedin: '',
        github: '',
        portfolio: ''
      },
      objective: '',
      education: [],
      skills: [],
      projects: [],
      internships: [],
      work_experience: [],
      certifications: [],
      achievements: [],
      languages: [],
      interests: [],
      target_role: '',
      preferred_template: 'modern'
    }
  });

  // Dynamic Array Handlers using React Hook Form's useFieldArray
  const { fields: eduFields, append: appendEdu, remove: removeEdu } = useFieldArray({ control, name: 'education' });
  const { fields: expFields, append: appendExp, remove: removeExp } = useFieldArray({ control, name: 'work_experience' });
  const { fields: projectFields, append: appendProject, remove: removeProject } = useFieldArray({ control, name: 'projects' });
  const { fields: certFields, append: appendCert, remove: removeCert } = useFieldArray({ control, name: 'certifications' });
  const { fields: achFields, append: appendAch, remove: removeAch } = useFieldArray({ control, name: 'achievements' });
  const { fields: langFields, append: appendLang, remove: removeLang } = useFieldArray({ control, name: 'languages' });

  // Skills and Interests tag inputs local state
  const [skillInput, setSkillInput] = useState('');
  const [interestInput, setInterestInput] = useState('');

  const watchedSkills = watch('skills') || [];
  const watchedInterests = watch('interests') || [];
  const watchedTemplate = watch('preferred_template') || 'modern';
  const watchedData = watch(); // Watch all for live preview

  useEffect(() => {
    if (resumeId) {
      loadResume(resumeId);
    }
  }, [resumeId]);

  const loadResume = async (id) => {
    try {
      setLoading(true);
      const data = await api.getResume(id);
      setTitle(data.title || 'My Resume');
      // Reset form with loaded data
      reset(data.raw_data);
      // If enhanced exists, we could prompt to load it instead or merge
      if (data.enhanced_data) {
        if (confirm("We found an AI enhanced version of this resume. Would you like to load the optimized content?")) {
          reset(data.enhanced_data);
        }
      }
    } catch (err) {
      console.error(err);
      alert('Failed to load resume draft.');
    } finally {
      setLoading(false);
    }
  };

  // Tag inputs helper actions
  const handleAddSkill = (e) => {
    e.preventDefault();
    if (skillInput.trim() && !watchedSkills.includes(skillInput.trim())) {
      setValue('skills', [...watchedSkills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (index) => {
    const updated = [...watchedSkills];
    updated.splice(index, 1);
    setValue('skills', updated);
  };

  const handleAddInterest = (e) => {
    e.preventDefault();
    if (interestInput.trim() && !watchedInterests.includes(interestInput.trim())) {
      setValue('interests', [...watchedInterests, interestInput.trim()]);
      setInterestInput('');
    }
  };

  const handleRemoveInterest = (index) => {
    const updated = [...watchedInterests];
    updated.splice(index, 1);
    setValue('interests', updated);
  };

  // Section-level AI Improvement call
  const improveSection = async (sectionName, fieldName) => {
    const currentVal = getValues(fieldName);
    const targetRole = getValues('target_role');
    
    if (!currentVal || !currentVal.trim()) {
      alert(`Please input some content in the ${sectionName} field before requesting AI improvement.`);
      return;
    }
    if (!targetRole || !targetRole.trim()) {
      alert("Please specify a 'Target Job Role' on the Objective tab first so the AI can align the text properly.");
      return;
    }

    try {
      setLoading(true);
      setAiStep('Enhancement Agent rewriting section...');
      const response = await api.improveSection(sectionName, currentVal, targetRole);
      setValue(fieldName, response.improved_content);
    } catch (err) {
      console.error(err);
      alert('Failed to improve section. Check that the backend server is reachable.');
    } finally {
      setLoading(false);
      setAiStep('');
    }
  };

  // Save Draft (Raw/unoptimized)
  const saveDraft = async () => {
    const data = getValues();
    try {
      setLoading(true);
      setAiStep('Saving Draft to Database...');
      if (resumeId) {
        // Edit/update endpoint would be helpful, but we can reuse generate or create.
        // For simplicity, we create a new entry or update. Our backend create adds a new record.
        // We'll create it and navigate.
        const res = await api.createResume(title, watchedTemplate, data);
        navigate(`/preview/${res.id}`);
      } else {
        const res = await api.createResume(title, watchedTemplate, data);
        navigate(`/preview/${res.id}`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save draft.');
    } finally {
      setLoading(false);
      setAiStep('');
    }
  };

  // Sequential AI Multi-agent Pipeline Trigger (Optimize & Score)
  const handleAiOptimize = async () => {
    const data = getValues();
    const targetRole = data.target_role;
    
    if (!data.personal_info?.full_name?.trim()) {
      alert("Validation Agent requires at least your Full Name to proceed.");
      return;
    }
    if (!targetRole || !targetRole.trim()) {
      alert("Specify a Target Job Role to help the Enhancement and Scoring Agents align keywords.");
      return;
    }

    try {
      setLoading(true);
      
      // Simulate/Show agent stages to give a premium feel matching the workflow
      setAiStep('1. Validation Agent: Checking details, formatting email/phone structures...');
      await new Promise(r => setTimeout(r, 1000));
      
      setAiStep('2. Enhancement Agent: Expanding summary and injecting metrics-driven active verbs...');
      await new Promise(r => setTimeout(r, 1200));
      
      setAiStep('3. ATS Analysis Agent: Auditing candidate skills against tech stacks and calculating scoring matrix...');
      await new Promise(r => setTimeout(r, 1200));

      setAiStep('4. Formatting Agent: Packaging output into verified JSON schema...');
      
      const result = await api.generateResume(title, watchedTemplate, data); // Calls POST /resume/generate
      
      alert(`AI Optimization Completed! ATS score calculated: ${Math.round(result.ats_report.score)}%`);
      navigate(`/preview/${result.resume_id}`);
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || 'Pipeline failure. Ensure your inputs are complete.';
      alert(`Optimization Failed:\n${detail}`);
    } finally {
      setLoading(false);
      setAiStep('');
    }
  };

  const nextTab = () => {
    const currentIndex = TABS.findIndex(t => t.id === activeTab);
    if (currentIndex < TABS.length - 1) {
      setActiveTab(TABS[currentIndex + 1].id);
    }
  };

  const prevTab = () => {
    const currentIndex = TABS.findIndex(t => t.id === activeTab);
    if (currentIndex > 0) {
      setActiveTab(TABS[currentIndex - 1].id);
    }
  };

  return (
    <div className="flex-grow flex flex-col md:flex-row w-full bg-slate-50 dark:bg-slate-950 overflow-hidden h-[calc(100vh-4rem)]">
      
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-teal-500 mb-6"></div>
          <p className="text-xl font-bold font-outfit">Running AI ResuAgent Workflow</p>
          <p className="text-sm text-slate-400 mt-2 animate-pulse">{aiStep || 'Please wait...'}</p>
        </div>
      )}

      {/* LEFT: Builder Panel */}
      <div className="w-full md:w-[55%] flex flex-col h-full border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        
        {/* Builder Title Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-teal-600" />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="font-outfit font-bold text-lg bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-teal-500 outline-none px-1 text-slate-800 dark:text-slate-100"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={saveDraft}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
            >
              <Save className="h-3.5 w-3.5" /> Save Draft
            </button>
            <button
              onClick={handleAiOptimize}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-500 hover:to-emerald-400 text-white rounded-lg shadow-md shadow-teal-500/10 transition-all"
            >
              <Sparkles className="h-3.5 w-3.5" /> Optimize with AI
            </button>
          </div>
        </div>

        {/* Workspace body (Tabs Sidebar & Scroll Form) */}
        <div className="flex flex-grow overflow-hidden">
          
          {/* Tabs Sidebar */}
          <div className="w-20 sm:w-48 bg-slate-50 dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-800 flex flex-col p-2 gap-1 overflow-y-auto">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col sm:flex-row items-center gap-2 p-2.5 sm:px-3 sm:py-2.5 rounded-xl text-center sm:text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className="h-4.5 w-4.5 flex-shrink-0" />
                  <span className="hidden sm:inline text-xs">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Scrolling Form */}
          <div className="flex-grow p-6 overflow-y-auto h-full">
            <form onSubmit={(e) => e.preventDefault()} className="space-y-6 max-w-xl">
              
              {/* 1. PERSONAL INFORMATION */}
              {activeTab === 'personal' && (
                <div className="space-y-4">
                  <h2 className="font-outfit text-xl font-bold border-b pb-2 dark:border-slate-800">Personal Information</h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">FULL NAME *</label>
                      <input
                        type="text"
                        {...register('personal_info.full_name')}
                        placeholder="e.g. Sarah Jenkins"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">PROFESSIONAL TITLE *</label>
                      <input
                        type="text"
                        {...register('personal_info.professional_title')}
                        placeholder="e.g. Lead Backend Developer"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">EMAIL ADDRESS *</label>
                      <input
                        type="email"
                        {...register('personal_info.email')}
                        placeholder="e.g. sarah.jenkins@gmail.com"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">PHONE NUMBER *</label>
                      <input
                        type="text"
                        {...register('personal_info.phone')}
                        placeholder="e.g. +1 (555) 019-2834"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">ADDRESS</label>
                    <input
                      type="text"
                      {...register('personal_info.address')}
                      placeholder="e.g. Boston, MA"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">LINKEDIN URL</label>
                      <input
                        type="text"
                        {...register('personal_info.linkedin')}
                        placeholder="linkedin.com/in/sarah"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">GITHUB URL</label>
                      <input
                        type="text"
                        {...register('personal_info.github')}
                        placeholder="github.com/sarahj"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">PORTFOLIO URL</label>
                      <input
                        type="text"
                        {...register('personal_info.portfolio')}
                        placeholder="sarahjenkins.dev"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 2. OBJECTIVE & TARGET ROLE */}
              {activeTab === 'objective' && (
                <div className="space-y-4">
                  <h2 className="font-outfit text-xl font-bold border-b pb-2 dark:border-slate-800">Objective & Target Role</h2>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">TARGET JOB ROLE *</label>
                    <input
                      type="text"
                      {...register('target_role')}
                      placeholder="e.g. Senior Frontend Architect"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-teal-500 font-bold"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <label className="block text-xs font-semibold text-slate-500">CAREER OBJECTIVE</label>
                      <button
                        type="button"
                        onClick={() => improveSection('objective', 'objective')}
                        className="text-xs text-teal-600 dark:text-teal-400 font-semibold hover:underline flex items-center gap-1"
                      >
                        <Sparkles className="h-3 w-3" /> Improve with AI
                      </button>
                    </div>
                    <textarea
                      rows={5}
                      {...register('objective')}
                      placeholder="Write a brief career summary or objective..."
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-teal-500 leading-relaxed"
                    />
                  </div>

                  {/* Template Picker */}
                  <div className="pt-4 border-t dark:border-slate-800">
                    <label className="block text-xs font-semibold text-slate-500 mb-2">PREFERRED RESUME TEMPLATE</label>
                    <select
                      {...register('preferred_template')}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-teal-500 font-medium"
                    >
                      <option value="modern">Modern (Teal highlights, clean alignment)</option>
                      <option value="classic">Classic (Times-Roman centered layout)</option>
                      <option value="minimal">Minimal (High-density spacing)</option>
                      <option value="professional">Professional (Navy theme, corporate structure)</option>
                      <option value="harvard">Harvard (Traditional layout, black rules)</option>
                      <option value="two column">Two Column (Left panel sidebar structure)</option>
                      <option value="one column">One Column (Clean standard flow)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* 3. EDUCATION */}
              {activeTab === 'education' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2 dark:border-slate-800">
                    <h2 className="font-outfit text-xl font-bold">Education</h2>
                    <button
                      type="button"
                      onClick={() => appendEdu({ degree: '', college: '', university: '', cgpa: '', start_year: '', end_year: '' })}
                      className="text-xs bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/20 dark:hover:bg-teal-950/40 text-teal-700 dark:text-teal-400 font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add School
                    </button>
                  </div>

                  {eduFields.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-6">No education history added yet.</p>
                  ) : (
                    <div className="space-y-6">
                      {eduFields.map((field, index) => (
                        <div key={field.id} className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 rounded-xl relative space-y-3">
                          <button
                            type="button"
                            onClick={() => removeEdu(index)}
                            className="absolute top-4 right-4 text-rose-500 hover:text-rose-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">DEGREE / CERTIFICATE *</label>
                            <input
                              type="text"
                              {...register(`education.${index}.degree`)}
                              placeholder="e.g. B.S. in Computer Science"
                              className="w-[90%] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm outline-none"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1">COLLEGE / SCHOOL</label>
                              <input
                                type="text"
                                {...register(`education.${index}.college`)}
                                placeholder="College of Engineering"
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1">UNIVERSITY</label>
                              <input
                                type="text"
                                {...register(`education.${index}.university`)}
                                placeholder="State University"
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm outline-none"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1">START YEAR</label>
                              <input
                                type="text"
                                {...register(`education.${index}.start_year`)}
                                placeholder="2018"
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1">END YEAR (OR EXPECTED)</label>
                              <input
                                type="text"
                                {...register(`education.${index}.end_year`)}
                                placeholder="2022"
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1">CGPA / GPA</label>
                              <input
                                type="text"
                                {...register(`education.${index}.cgpa`)}
                                placeholder="3.8/4.0"
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 4. WORK EXPERIENCE */}
              {activeTab === 'experience' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2 dark:border-slate-800">
                    <h2 className="font-outfit text-xl font-bold">Work Experience</h2>
                    <button
                      type="button"
                      onClick={() => appendExp({ company: '', role: '', description: '', start_date: '', end_date: '' })}
                      className="text-xs bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/20 dark:hover:bg-teal-950/40 text-teal-700 dark:text-teal-400 font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Role
                    </button>
                  </div>

                  {expFields.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-6">No work experience added yet.</p>
                  ) : (
                    <div className="space-y-6">
                      {expFields.map((field, index) => (
                        <div key={field.id} className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 rounded-xl relative space-y-3">
                          <button
                            type="button"
                            onClick={() => removeExp(index)}
                            className="absolute top-4 right-4 text-rose-500 hover:text-rose-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1">COMPANY *</label>
                              <input
                                type="text"
                                {...register(`work_experience.${index}.company`)}
                                placeholder="Google Inc."
                                className="w-[85%] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1">ROLE / TITLE *</label>
                              <input
                                type="text"
                                {...register(`work_experience.${index}.role`)}
                                placeholder="Software Developer"
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm outline-none"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1">START DATE</label>
                              <input
                                type="text"
                                {...register(`work_experience.${index}.start_date`)}
                                placeholder="June 2022"
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1">END DATE</label>
                              <input
                                type="text"
                                {...register(`work_experience.${index}.end_date`)}
                                placeholder="Present"
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <label className="block text-xs font-semibold text-slate-500">ROLE DESCRIPTION</label>
                              <button
                                type="button"
                                onClick={() => improveSection('experience', `work_experience.${index}.description`)}
                                className="text-xs text-teal-600 dark:text-teal-400 font-semibold hover:underline flex items-center gap-1"
                              >
                                <Sparkles className="h-3 w-3" /> Improve Bullet Points
                              </button>
                            </div>
                            <textarea
                              rows={4}
                              {...register(`work_experience.${index}.description`)}
                              placeholder="Write standard details or bullet points (starts with -)..."
                              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm outline-none font-mono text-xs"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 5. PROJECTS */}
              {activeTab === 'projects' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2 dark:border-slate-800">
                    <h2 className="font-outfit text-xl font-bold">Key Projects</h2>
                    <button
                      type="button"
                      onClick={() => appendProject({ project_name: '', description: '', technologies: '', github_link: '', live_link: '' })}
                      className="text-xs bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/20 dark:hover:bg-teal-950/40 text-teal-700 dark:text-teal-400 font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Project
                    </button>
                  </div>

                  {projectFields.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-6">No projects added yet.</p>
                  ) : (
                    <div className="space-y-6">
                      {projectFields.map((field, index) => (
                        <div key={field.id} className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 rounded-xl relative space-y-3">
                          <button
                            type="button"
                            onClick={() => removeProject(index)}
                            className="absolute top-4 right-4 text-rose-500 hover:text-rose-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1">PROJECT NAME *</label>
                              <input
                                type="text"
                                {...register(`projects.${index}.project_name`)}
                                placeholder="E-Commerce API"
                                className="w-[85%] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1">TECHNOLOGIES USED</label>
                              <input
                                type="text"
                                {...register(`projects.${index}.technologies`)}
                                placeholder="React, Node.js, SQLite"
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm outline-none"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1">GITHUB REPO URL</label>
                              <input
                                type="text"
                                {...register(`projects.${index}.github_link`)}
                                placeholder="github.com/profile/repo"
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1">LIVE LINK</label>
                              <input
                                type="text"
                                {...register(`projects.${index}.live_link`)}
                                placeholder="projectdemo.com"
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <label className="block text-xs font-semibold text-slate-500">PROJECT DESCRIPTION</label>
                              <button
                                type="button"
                                onClick={() => improveSection('projects', `projects.${index}.description`)}
                                className="text-xs text-teal-600 dark:text-teal-400 font-semibold hover:underline flex items-center gap-1"
                              >
                                <Sparkles className="h-3 w-3" /> Improve description
                              </button>
                            </div>
                            <textarea
                              rows={3}
                              {...register(`projects.${index}.description`)}
                              placeholder="Describe project details, scale, and database design..."
                              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm outline-none font-mono text-xs"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 6. SKILLS & TECH */}
              {activeTab === 'skills' && (
                <div className="space-y-4">
                  <h2 className="font-outfit text-xl font-bold border-b pb-2 dark:border-slate-800">Skills & Keywords</h2>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">ADD TECH OR SOFT SKILL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        placeholder="e.g. React, PostgreSQL, Docker"
                        className="flex-grow bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm outline-none"
                      />
                      <button
                        onClick={handleAddSkill}
                        className="bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-700 dark:hover:bg-slate-600 px-4 rounded-lg text-sm font-semibold"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Skills tags list */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {watchedSkills.length === 0 ? (
                      <p className="text-xs text-slate-500">No skills added yet. Click Add or separate with commas.</p>
                    ) : (
                      watchedSkills.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 text-xs font-medium bg-teal-50 dark:bg-teal-950/20 text-teal-800 dark:text-teal-300 border border-teal-200/50 dark:border-teal-900/40 px-2.5 py-1 rounded-full"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(index)}
                            className="text-teal-600 dark:text-teal-400 hover:text-rose-500 transition-colors ml-0.5 font-bold"
                          >
                            &times;
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* 7. OTHERS (CERTIFICATIONS, LANGUAGES, ACHIEVEMENTS, INTERESTS) */}
              {activeTab === 'others' && (
                <div className="space-y-6">
                  {/* Certifications Repeatable */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b pb-2 dark:border-slate-800">
                      <h3 className="font-outfit font-bold text-lg">Certifications</h3>
                      <button
                        type="button"
                        onClick={() => appendCert({ name: '', issuer: '', year: '' })}
                        className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-1 rounded-lg"
                      >
                        + Add
                      </button>
                    </div>
                    {certFields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-3 gap-2 items-center bg-slate-50 dark:bg-slate-800/20 p-2.5 rounded-lg relative">
                        <input
                          type="text"
                          {...register(`certifications.${index}.name`)}
                          placeholder="AWS Practitioner"
                          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs outline-none"
                        />
                        <input
                          type="text"
                          {...register(`certifications.${index}.issuer`)}
                          placeholder="Amazon"
                          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs outline-none"
                        />
                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            {...register(`certifications.${index}.year`)}
                            placeholder="2023"
                            className="w-16 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => removeCert(index)}
                            className="text-rose-500 hover:text-rose-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Languages Repeatable */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b pb-2 dark:border-slate-800">
                      <h3 className="font-outfit font-bold text-lg">Languages</h3>
                      <button
                        type="button"
                        onClick={() => appendLang({ language: '', proficiency: '' })}
                        className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-1 rounded-lg"
                      >
                        + Add
                      </button>
                    </div>
                    {langFields.map((field, index) => (
                      <div key={field.id} className="flex gap-3 items-center bg-slate-50 dark:bg-slate-800/20 p-2.5 rounded-lg">
                        <input
                          type="text"
                          {...register(`languages.${index}.language`)}
                          placeholder="e.g. Spanish"
                          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs outline-none"
                        />
                        <input
                          type="text"
                          {...register(`languages.${index}.proficiency`)}
                          placeholder="Fluent, Native"
                          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => removeLang(index)}
                          className="text-rose-500 hover:text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Achievements */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b pb-2 dark:border-slate-800">
                      <h3 className="font-outfit font-bold text-lg">Achievements</h3>
                      <button
                        type="button"
                        onClick={() => appendAch({ title: '', description: '' })}
                        className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-1 rounded-lg"
                      >
                        + Add
                      </button>
                    </div>
                    {achFields.map((field, index) => (
                      <div key={field.id} className="space-y-2 bg-slate-50 dark:bg-slate-800/20 p-3 rounded-lg relative">
                        <button
                          type="button"
                          onClick={() => removeAch(index)}
                          className="absolute top-2 right-2 text-rose-500 hover:text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <input
                          type="text"
                          {...register(`achievements.${index}.title`)}
                          placeholder="Achievement Title"
                          className="w-[85%] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs outline-none"
                        />
                        <input
                          type="text"
                          {...register(`achievements.${index}.description`)}
                          placeholder="Description of scaling metrics / details"
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs outline-none"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Interests */}
                  <div className="space-y-3">
                    <h3 className="font-outfit font-bold text-lg border-b pb-2 dark:border-slate-800">Interests</h3>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={interestInput}
                        onChange={(e) => setInterestInput(e.target.value)}
                        placeholder="e.g. Chess, Running, Painting"
                        className="flex-grow bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm outline-none"
                      />
                      <button
                        onClick={handleAddInterest}
                        className="bg-slate-800 text-white dark:bg-slate-700 px-4 rounded-lg text-sm"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {watchedInterests.map((interest, index) => (
                        <span key={index} className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                          {interest}
                          <button type="button" onClick={() => handleRemoveInterest(index)} className="font-bold text-slate-400 hover:text-rose-500">&times;</button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Wizard navigation indicators */}
              <div className="flex justify-between items-center pt-8 border-t dark:border-slate-800/80 mt-10">
                <button
                  type="button"
                  onClick={prevTab}
                  className="flex items-center gap-1 px-4 py-2 border rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-semibold disabled:opacity-30 disabled:pointer-events-none"
                  disabled={activeTab === TABS[0].id}
                >
                  <ArrowLeft className="h-4 w-4" /> Previous
                </button>
                <button
                  type="button"
                  onClick={nextTab}
                  className="flex items-center gap-1 px-4 py-2 border bg-slate-900 text-white dark:bg-slate-800 hover:bg-slate-800 rounded-xl text-sm font-semibold disabled:opacity-30 disabled:pointer-events-none"
                  disabled={activeTab === TABS[TABS.length - 1].id}
                >
                  Next <ArrowRight className="h-4 w-4" />
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>

      {/* RIGHT: Live Interactive Preview Panel */}
      <div className="hidden md:block md:w-[45%] h-full bg-slate-100 dark:bg-slate-900/30 overflow-y-auto p-6">
        <div className="sticky top-0 bg-slate-100 dark:bg-slate-950/20 backdrop-blur-sm py-2 mb-4 border-b dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs uppercase font-extrabold text-slate-500 tracking-wider">Live Interactive Preview</span>
          <span className="text-xs text-slate-400 capitalize">Theme: {watchedTemplate}</span>
        </div>
        
        {/* Render Preview Component */}
        <div className="shadow-2xl shadow-slate-900/10 rounded-xl overflow-hidden bg-white">
          <ResumePreview data={watchedData} template={watchedTemplate} />
        </div>
      </div>

    </div>
  );
}
