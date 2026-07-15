import React from 'react';

export default function ResumePreview({ data, template }) {
  if (!data) return null;

  const personal = data.personal_info || {};
  const objective = data.objective || '';
  const education = data.education || [];
  const skills = data.skills || [];
  const projects = data.projects || [];
  const internships = data.internships || [];
  const experience = data.work_experience || [];
  const certifications = data.certifications || [];
  const achievements = data.achievements || [];
  const languages = data.languages || [];
  const interests = data.interests || [];

  // Determine global fonts & colors based on template
  let fontClass = 'font-sans';
  let primaryColor = 'text-teal-700 dark:text-teal-400 border-teal-600';
  let primaryBg = 'bg-teal-700 text-white';
  let dividerClass = 'border-teal-600/30';
  let headerClass = 'text-left';

  if (template === 'classic') {
    fontClass = 'font-serif';
    primaryColor = 'text-slate-800 dark:text-slate-200 border-slate-700';
    primaryBg = 'bg-slate-800 text-white';
    dividerClass = 'border-slate-700/50';
    headerClass = 'text-center';
  } else if (template === 'harvard') {
    fontClass = 'font-serif';
    primaryColor = 'text-black dark:text-white border-black';
    primaryBg = 'bg-black text-white';
    dividerClass = 'border-black';
    headerClass = 'text-center';
  } else if (template === 'professional') {
    fontClass = 'font-sans';
    primaryColor = 'text-blue-800 dark:text-blue-400 border-blue-800';
    primaryBg = 'bg-blue-800 text-white';
    dividerClass = 'border-blue-800/40';
    headerClass = 'text-left';
  } else if (template === 'minimal') {
    fontClass = 'font-sans text-xs';
    primaryColor = 'text-slate-900 dark:text-slate-100 border-slate-300';
    primaryBg = 'bg-slate-900 text-white';
    dividerClass = 'border-slate-200';
    headerClass = 'text-left';
  }

  const renderSectionHeader = (title) => (
    <div className="mt-4 mb-2">
      <h3 className={`text-xs font-extrabold uppercase tracking-wider ${primaryColor}`}>
        {title}
      </h3>
      <hr className={`border-t mt-1 ${dividerClass}`} />
    </div>
  );

  const formatDescription = (desc) => {
    if (!desc) return null;
    const lines = desc.split('\n');
    return (
      <ul className="list-disc pl-4 space-y-1 text-slate-700 dark:text-slate-300 text-xs mt-1">
        {lines.map((line, i) => {
          let cleanLine = line.trim();
          if (cleanLine.startsWith('- ') || cleanLine.startsWith('* ')) {
            cleanLine = cleanLine.substring(2);
          } else if (cleanLine.startsWith('-') || cleanLine.startsWith('*')) {
            cleanLine = cleanLine.substring(1);
          }
          if (!cleanLine) return null;
          return <li key={i} dangerouslySetInnerHTML={{ __html: cleanLine }} />;
        })}
      </ul>
    );
  };

  const renderContactInfo = () => {
    const parts = [];
    if (personal.phone) parts.push(personal.phone);
    if (personal.email) parts.push(personal.email);
    if (personal.address) parts.push(personal.address);
    if (personal.linkedin) parts.push('LinkedIn');
    if (personal.github) parts.push('GitHub');
    if (personal.portfolio) parts.push('Portfolio');

    if (template === 'classic' || template === 'harvard') {
      return (
        <div className="text-center text-[10px] text-slate-500 mt-1 space-x-2">
          {parts.join('  •  ')}
        </div>
      );
    }

    return (
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500 mt-2">
        {personal.phone && <span>Phone: {personal.phone}</span>}
        {personal.email && <span>Email: {personal.email}</span>}
        {personal.address && <span>Loc: {personal.address}</span>}
        {personal.linkedin && <span className="underline">LinkedIn</span>}
        {personal.github && <span className="underline">GitHub</span>}
        {personal.portfolio && <span className="underline">Portfolio</span>}
      </div>
    );
  };

  // Special rendering for Two Column template layout
  if (template === 'two column') {
    return (
      <div className={`p-6 bg-white dark:bg-slate-900 border text-slate-900 dark:text-slate-100 ${fontClass} min-h-[700px] shadow-sm flex flex-col`}>
        {/* Name & Title Header */}
        <div className="border-b pb-4 mb-4 border-slate-200 dark:border-slate-800">
          <h2 className="text-2xl font-black tracking-tight text-teal-800 dark:text-teal-400">
            {personal.full_name || 'Your Name'}
          </h2>
          {personal.professional_title && (
            <p className="text-sm font-semibold text-slate-500 mt-0.5">{personal.professional_title}</p>
          )}
        </div>

        {/* Columns Grid */}
        <div className="grid grid-cols-12 gap-6 flex-grow">
          {/* Narrow Left Column: Contacts, Skills, Languages, Interests */}
          <div className="col-span-4 border-r border-slate-100 dark:border-slate-800 pr-4 space-y-5">
            <div>
              <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-teal-800 dark:text-teal-400 mb-2">Contact</h4>
              <div className="space-y-2 text-[10px] text-slate-600 dark:text-slate-400 break-words">
                {personal.phone && <div><b>Phone:</b> {personal.phone}</div>}
                {personal.email && <div><b>Email:</b> {personal.email}</div>}
                {personal.address && <div><b>Loc:</b> {personal.address}</div>}
                {personal.linkedin && <div className="underline">LinkedIn</div>}
                {personal.github && <div className="underline">GitHub</div>}
                {personal.portfolio && <div className="underline">Portfolio</div>}
              </div>
            </div>

            {skills.length > 0 && (
              <div>
                <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-teal-800 dark:text-teal-400 mb-2">Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s, idx) => (
                    <span key={idx} className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[9px] text-slate-700 dark:text-slate-300">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {languages.length > 0 && (
              <div>
                <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-teal-800 dark:text-teal-400 mb-2">Languages</h4>
                <div className="space-y-1 text-[10px]">
                  {languages.map((l, idx) => (
                    <div key={idx}>
                      <b>{l.language}</b>: {l.proficiency}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Wide Right Column: Objective, Experience, Projects, Education */}
          <div className="col-span-8 space-y-5">
            {objective && (
              <div>
                <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-teal-800 dark:text-teal-400 mb-1">Profile</h4>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{objective}</p>
              </div>
            )}

            {experience.length > 0 && (
              <div>
                <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-teal-800 dark:text-teal-400 mb-2">Experience</h4>
                <div className="space-y-4">
                  {experience.map((exp, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                        <span>{exp.role}</span>
                        <span className="font-normal text-slate-500 text-[10px]">{exp.start_date} - {exp.end_date}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 italic">{exp.company}</div>
                      {formatDescription(exp.description)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {projects.length > 0 && (
              <div>
                <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-teal-800 dark:text-teal-400 mb-2">Projects</h4>
                <div className="space-y-3">
                  {projects.map((proj, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                        <span>{proj.project_name}</span>
                        {proj.github_link && <span className="text-[10px] text-blue-500 font-normal">GitHub</span>}
                      </div>
                      <div className="text-[9px] text-slate-400 font-semibold">{proj.technologies}</div>
                      {formatDescription(proj.description)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {education.length > 0 && (
              <div>
                <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-teal-800 dark:text-teal-400 mb-2">Education</h4>
                <div className="space-y-2">
                  {education.map((edu, idx) => (
                    <div key={idx} className="text-xs">
                      <div className="flex justify-between font-bold">
                        <span>{edu.degree}</span>
                        <span className="font-normal text-[10px] text-slate-500">{edu.start_year} - {edu.end_year}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">{edu.college || edu.university} {edu.cgpa && `| CGPA: ${edu.cgpa}`}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Standard One-Column Flow Layouts (Modern, Classic, Harvard, Professional, Minimal)
  return (
    <div className={`p-8 bg-white dark:bg-slate-900 border text-slate-900 dark:text-slate-100 ${fontClass} min-h-[700px] shadow-sm`}>
      {/* Header Panel */}
      <div className={`border-b pb-4 mb-4 ${dividerClass} ${headerClass}`}>
        <h2 className="text-2xl font-extrabold tracking-tight">
          {personal.full_name || 'Your Name'}
        </h2>
        {personal.professional_title && (
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">
            {personal.professional_title}
          </p>
        )}
        {renderContactInfo()}
      </div>

      {/* Objective */}
      {objective && (
        <div className="mb-4">
          {renderSectionHeader('Professional Summary')}
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            {objective}
          </p>
        </div>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <div className="mb-4">
          {renderSectionHeader('Work Experience')}
          <div className="space-y-3">
            {experience.map((exp, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between items-start text-xs font-bold text-slate-800 dark:text-slate-200">
                  <div>
                    <span>{exp.role}</span>
                    <span className="font-normal text-slate-500 dark:text-slate-400 ml-1">| {exp.company}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                    {exp.start_date} - {exp.end_date}
                  </span>
                </div>
                {formatDescription(exp.description)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Internships */}
      {internships.length > 0 && (
        <div className="mb-4">
          {renderSectionHeader('Internships')}
          <div className="space-y-3">
            {internships.map((intern, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between items-start text-xs font-bold text-slate-800 dark:text-slate-200">
                  <div>
                    <span>{intern.role}</span>
                    <span className="font-normal text-slate-500 dark:text-slate-400 ml-1">| {intern.company}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                    {intern.start_date} - {intern.end_date}
                  </span>
                </div>
                {formatDescription(intern.description)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <div className="mb-4">
          {renderSectionHeader('Key Projects')}
          <div className="space-y-3">
            {projects.map((proj, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between items-start text-xs font-bold text-slate-800 dark:text-slate-200">
                  <div>
                    <span>{proj.project_name}</span>
                    {proj.technologies && (
                      <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400 ml-2">
                        ({proj.technologies})
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 font-normal space-x-1.5">
                    {proj.github_link && <span className="underline">Repo</span>}
                    {proj.live_link && <span className="underline">Live</span>}
                  </div>
                </div>
                {formatDescription(proj.description)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {education.length > 0 && (
        <div className="mb-4">
          {renderSectionHeader('Education')}
          <div className="space-y-2">
            {education.map((edu, index) => {
              const inst = [edu.college, edu.university].filter(Boolean).join(', ');
              return (
                <div key={index} className="flex justify-between items-start text-xs text-slate-700 dark:text-slate-300">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{edu.degree}</span>
                    {inst && <span className="ml-1">| {inst}</span>}
                    {edu.cgpa && <span className="ml-1 text-slate-500">(CGPA: {edu.cgpa})</span>}
                  </div>
                  <span className="text-[10px] text-slate-500">{edu.start_year} - {edu.end_year}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div className="mb-4">
          {renderSectionHeader('Skills')}
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            {skills.join(', ')}
          </p>
        </div>
      )}

      {/* Certifications & Achievements */}
      {(certifications.length > 0 || achievements.length > 0) && (
        <div className="mb-4">
          {renderSectionHeader('Certifications & Achievements')}
          <ul className="list-disc pl-4 space-y-1 text-slate-700 dark:text-slate-300 text-xs">
            {certifications.map((c, idx) => (
              <li key={`cert-${idx}`}>
                <b>{c.name}</b> ({c.issuer}) - {c.year}
              </li>
            ))}
            {achievements.map((a, idx) => (
              <li key={`ach-${idx}`}>
                <b>{a.title}</b>: {a.description}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Languages & Interests */}
      {(languages.length > 0 || interests.length > 0) && (
        <div className="mb-4">
          {renderSectionHeader('Languages & Interests')}
          <div className="text-xs text-slate-700 dark:text-slate-300">
            {languages.length > 0 && (
              <div>
                <b>Languages:</b> {languages.map(l => `${l.language} (${l.proficiency})`).join(', ')}
              </div>
            )}
            {interests.length > 0 && (
              <div className="mt-1">
                <b>Interests:</b> {interests.join(', ')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
