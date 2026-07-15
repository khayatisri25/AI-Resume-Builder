import axios from 'axios';

// Fallback to localhost if window location is not available (e.g. static rendering tests)
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject local storage settings on requests
client.interceptors.request.use((config) => {
  const geminiKey = localStorage.getItem('gemini_api_key');
  const openaiKey = localStorage.getItem('openai_api_key');
  const provider = localStorage.getItem('llm_provider');

  if (geminiKey) {
    config.headers['X-Gemini-Key'] = geminiKey;
  }
  if (openaiKey) {
    config.headers['X-OpenAI-Key'] = openaiKey;
  }
  if (provider) {
    config.headers['X-LLM-Provider'] = provider;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

export const api = {
  /**
   * Health Check
   */
  getHealth: async () => {
    const res = await client.get('/');
    return res.data;
  },

  /**
   * Saves a raw resume
   */
  createResume: async (title, templateName, rawData) => {
    const res = await client.post('/resume/create', {
      title,
      template_name: templateName,
      raw_data: rawData,
    });
    return res.data;
  },

  /**
   * Runs the complete multi-agent AI pipeline (Optimize & Score)
   */
  generateResume: async (title, templateName, rawData) => {
    const res = await client.post('/resume/generate', {
      title,
      template_name: templateName,
      raw_data: rawData,
    });
    return res.data;
  },

  /**
   * Enhances a specific text section
   */
  improveSection: async (sectionName, content, targetRole) => {
    const res = await client.post('/resume/improve', {
      section_name: sectionName,
      content,
      target_role: targetRole,
    });
    return res.data;
  },

  /**
   * Evaluates ATS metrics
   */
  analyzeResume: async (rawData) => {
    const res = await client.post('/resume/analyze', rawData);
    return res.data;
  },

  /**
   * Retrieves a resume by ID
   */
  getResume: async (id) => {
    const res = await client.get(id ? `/resume/${id}` : '/resume');
    return res.data;
  },

  /**
   * Retrieves the detailed ATS feedback report by resume ID
   */
  getResumeReport: async (id) => {
    const res = await client.get(`/resume/${id}/report`);
    return res.data;
  },

  /**
   * Deletes a resume
   */
  deleteResume: async (id) => {
    const res = await client.delete(`/resume/${id}`);
    return res.data;
  },

  /**
   * PDF Document Downloader
   */
  downloadPdf: async (resumeData, fileName = 'Resume.pdf') => {
    const response = await client.post('/resume/download/pdf', resumeData, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Word Document Downloader
   */
  downloadDocx: async (resumeData, fileName = 'Resume.docx') => {
    const response = await client.post('/resume/download/docx', resumeData, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
