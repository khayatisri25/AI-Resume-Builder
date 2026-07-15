from typing import Dict, Any, List
from backend.schemas import ResumeDataSchema
from backend.services.logging_service import logger

class FormattingAgent:
    """
    Cleanses, normalizes, and packages raw resume content into a strictly
    structured ResumeDataSchema. Ensures URLs, date formatting, and
    list attributes conform to clean standards.
    """
    
    def __init__(self):
        pass

    def format_url(self, url: str | None) -> str | None:
        """
        Ensures a URL starts with http:// or https://.
        """
        if not url:
            return None
        url = url.strip()
        if not url:
            return None
        if not url.startswith(("http://", "https://")):
            return f"https://{url}"
        return url

    def clean_skills(self, skills: List[str] | Any) -> List[str]:
        """
        Standardizes skills, handling accidental comma-separated single items.
        """
        if not skills:
            return []
        
        # If skills is passed as a single string, split it
        if isinstance(skills, str):
            skills = [skills]
            
        cleaned = []
        for item in skills:
            if not item:
                continue
            # If item itself has commas (e.g. "React, Node.js"), split it
            if "," in item:
                for sub in item.split(","):
                    val = sub.strip()
                    if val and val not in cleaned:
                        cleaned.append(val)
            else:
                val = item.strip()
                if val and val not in cleaned:
                    cleaned.append(val)
        return cleaned

    def clean(self, data: ResumeDataSchema) -> ResumeDataSchema:
        """
        Standardizes field items. Returns a validated clean ResumeDataSchema.
        """
        logger.info("Formatting Agent starting sanitization...")
        
        # 1. Clean Personal URLs
        p = data.personal_info
        p.linkedin = self.format_url(p.linkedin)
        p.github = self.format_url(p.github)
        p.portfolio = self.format_url(p.portfolio)
        
        # 2. Clean Skills
        data.skills = self.clean_skills(data.skills)
        
        # 3. Clean Projects URLs and descriptions
        for i, proj in enumerate(data.projects):
            data.projects[i].github_link = self.format_url(proj.github_link)
            data.projects[i].live_link = self.format_url(proj.live_link)
            # Ensure description is nicely trimmed
            data.projects[i].description = proj.description.strip()

        # 4. Clean Experiences
        for i, exp in enumerate(data.work_experience):
            data.work_experience[i].description = exp.description.strip()
            
        for i, intern in enumerate(data.internships):
            data.internships[i].description = intern.description.strip()

        logger.info("Formatting Agent completed sanitization.")
        return data
