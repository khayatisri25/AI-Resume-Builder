import os
from copy import deepcopy
from backend.config import BASE_DIR
from backend.schemas import ResumeDataSchema
from backend.services.llm import BaseLLM, get_llm_service
from backend.services.logging_service import logger

def load_prompt(filename: str) -> str:
    """
    Helper to load prompt templates safely from prompts folder.
    """
    path = os.path.join(BASE_DIR, "backend", "prompts", filename)
    if not os.path.exists(path):
        # Alternative resolve path
        path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompts", filename)
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

class EnhancementAgent:
    """
    Rewrites resume sections (objective, work experience, projects, internships, skills)
    using LLMs to make them ATS-friendly and metric-driven.
    """
    
    def __init__(self, llm_service: BaseLLM = None):
        self.llm = llm_service or get_llm_service()

    def enhance(self, data: ResumeDataSchema, target_role: str) -> ResumeDataSchema:
        """
        Enhances the resume sections. Returns a new ResumeDataSchema instance.
        """
        logger.info(f"Enhancement Agent starting for target role: {target_role}")
        
        # Create a deep copy to keep raw data untouched
        enhanced = deepcopy(data)
        enhanced.target_role = target_role

        # 1. Enhance Career Objective
        if enhanced.objective.strip():
            try:
                prompt_tpl = load_prompt("objective.txt")
                prompt = prompt_tpl.format(
                    target_role=target_role,
                    original_objective=enhanced.objective.strip()
                )
                logger.info("Enhancing career objective...")
                enhanced.objective = self.llm.generate_text(prompt)
            except Exception as e:
                logger.error(f"Failed to enhance objective: {str(e)}")
                # Retain original objective on failure
        else:
            # Generate a new objective from scratch based on details
            try:
                prompt_tpl = load_prompt("summary.txt")
                # Create brief summary outline of details
                profile_context = f"Candidate: {enhanced.personal_info.full_name}\nTitle: {enhanced.personal_info.professional_title}\n"
                if enhanced.skills:
                    profile_context += f"Skills: {', '.join(enhanced.skills)}\n"
                if enhanced.work_experience:
                    profile_context += f"Last Role: {enhanced.work_experience[0].role} at {enhanced.work_experience[0].company}\n"
                    
                prompt = prompt_tpl.format(
                    target_role=target_role,
                    resume_content=profile_context
                )
                logger.info("Generating objective from scratch...")
                enhanced.objective = self.llm.generate_text(prompt)
            except Exception as e:
                logger.error(f"Failed to generate summary: {str(e)}")
                enhanced.objective = f"Ambitious professional seeking to leverage skills as a {target_role} to drive success and technical innovation."

        # 2. Enhance Work Experience descriptions
        if enhanced.work_experience:
            prompt_tpl = load_prompt("experience.txt")
            for idx, exp in enumerate(enhanced.work_experience):
                if not exp.description.strip():
                    continue
                try:
                    prompt = prompt_tpl.format(
                        target_role=target_role,
                        company=exp.company,
                        role=exp.role,
                        original_description=exp.description.strip()
                    )
                    logger.info(f"Enhancing work experience role: {exp.role} at {exp.company}")
                    enhanced.work_experience[idx].description = self.llm.generate_text(prompt)
                except Exception as e:
                    logger.error(f"Failed to enhance work experience [{idx}]: {str(e)}")

        # 3. Enhance Internship descriptions
        if enhanced.internships:
            prompt_tpl = load_prompt("experience.txt") # Shares same prompt configuration as work experience
            for idx, intern in enumerate(enhanced.internships):
                if not intern.description.strip():
                    continue
                try:
                    prompt = prompt_tpl.format(
                        target_role=target_role,
                        company=intern.company,
                        role=intern.role,
                        original_description=intern.description.strip()
                    )
                    logger.info(f"Enhancing internship role: {intern.role} at {intern.company}")
                    enhanced.internships[idx].description = self.llm.generate_text(prompt)
                except Exception as e:
                    logger.error(f"Failed to enhance internship [{idx}]: {str(e)}")

        # 4. Enhance Project descriptions
        if enhanced.projects:
            prompt_tpl = load_prompt("projects.txt")
            for idx, proj in enumerate(enhanced.projects):
                if not proj.description.strip():
                    continue
                try:
                    prompt = prompt_tpl.format(
                        target_role=target_role,
                        project_name=proj.project_name,
                        technologies=proj.technologies,
                        original_description=proj.description.strip()
                    )
                    logger.info(f"Enhancing project: {proj.project_name}")
                    enhanced.projects[idx].description = self.llm.generate_text(prompt)
                except Exception as e:
                    logger.error(f"Failed to enhance project [{idx}]: {str(e)}")

        # 5. Enhance Skills list
        if enhanced.skills:
            try:
                prompt_tpl = load_prompt("skills.txt")
                prompt = prompt_tpl.format(
                    target_role=target_role,
                    current_skills=", ".join(enhanced.skills)
                )
                logger.info("Enhancing and expanding skills list...")
                skills_raw = self.llm.generate_text(prompt)
                # Split skills by comma, strip whitespace and discard empty elements
                new_skills = [s.strip() for s in skills_raw.split(",") if s.strip()]
                if new_skills:
                    enhanced.skills = new_skills
            except Exception as e:
                logger.error(f"Failed to enhance skills list: {str(e)}")

        logger.info("Enhancement Agent processing completed successfully.")
        return enhanced
