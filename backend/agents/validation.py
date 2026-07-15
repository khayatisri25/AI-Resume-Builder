import re
from typing import Dict, List, Any
from backend.schemas import ResumeDataSchema
from backend.services.logging_service import logger

class ValidationAgent:
    """
    Validates user input fields for completeness, formatting correctness,
    and identifies duplicates or omissions before AI processing.
    """
    
    def __init__(self):
        pass

    def validate(self, data: ResumeDataSchema) -> Dict[str, Any]:
        """
        Validates the resume data.
        Returns a dict: {"is_valid": bool, "errors": list, "warnings": list}
        """
        errors = []
        warnings = []
        
        # 1. Validate Personal Info
        personal = data.personal_info
        if not personal.full_name.strip():
            errors.append("Personal Info: Full Name is required.")
        if not personal.professional_title.strip():
            warnings.append("Personal Info: Professional title is missing; AI will generate a generic title.")
            
        # Email Check
        email = personal.email.strip()
        if not email:
            errors.append("Personal Info: Email address is required.")
        elif not re.match(r"^[\w\.-]+@[\w\.-]+\.\w+$", email):
            errors.append(f"Personal Info: Invalid email format '{email}'.")
            
        # Phone Check
        phone = personal.phone.strip()
        if not phone:
            errors.append("Personal Info: Phone number is required.")
        else:
            # Simple digits count check (must have at least 7 digits)
            digits = re.sub(r"\D", "", phone)
            if len(digits) < 7:
                warnings.append("Personal Info: Phone number seems too short or invalid.")
                
        # 2. Objective / Summary
        if not data.objective.strip():
            warnings.append("Objective: Career objective is blank. AI will synthesize one from scratch.")
            
        # 3. Education Check
        if not data.education:
            warnings.append("Education: No education history provided. Resumes without education are generally rejected by ATS.")
        else:
            for i, edu in enumerate(data.education):
                if not edu.degree.strip():
                    errors.append(f"Education [{i+1}]: Degree name is required.")
                if not edu.college and not edu.university:
                    warnings.append(f"Education [{i+1}]: Institution name (College or University) is missing.")
                if not edu.start_year or not edu.end_year:
                    warnings.append(f"Education [{i+1}]: Start/end years are missing.")

        # 4. Skills Duplicate Check
        if not data.skills:
            warnings.append("Skills: No skills listed. Add technical and soft skills to improve ATS keyword matches.")
        else:
            seen_skills = set()
            duplicates = []
            for s in data.skills:
                norm_s = s.strip().lower()
                if norm_s in seen_skills:
                    duplicates.append(s.strip())
                else:
                    seen_skills.add(norm_s)
            if duplicates:
                warnings.append(f"Skills: Duplicate skills detected and will be merged: {', '.join(duplicates)}")

        # 5. Projects Check
        if data.projects:
            for i, proj in enumerate(data.projects):
                if not proj.project_name.strip():
                    errors.append(f"Projects [{i+1}]: Project name is required.")
                if not proj.description.strip():
                    warnings.append(f"Projects [{i+1}]: Description is missing or too short.")
                if len(proj.description.strip()) < 20 and proj.description.strip():
                    warnings.append(f"Projects [{i+1}]: Description is very short. Provide details on scale and achievements.")

        # 6. Work Experience Check
        if not data.work_experience and not data.internships:
            warnings.append("Work Experience: No work experience or internships provided. Adding experience significantly boosts ATS scoring.")
        else:
            for i, exp in enumerate(data.work_experience):
                if not exp.role.strip():
                    errors.append(f"Work Experience [{i+1}]: Role title is required.")
                if not exp.company.strip():
                    errors.append(f"Work Experience [{i+1}]: Company name is required.")
                if not exp.description.strip():
                    warnings.append(f"Work Experience [{i+1}]: Role description is empty.")
                    
            for i, intern in enumerate(data.internships):
                if not intern.role.strip():
                    errors.append(f"Internship [{i+1}]: Role title is required.")
                if not intern.company.strip():
                    errors.append(f"Internship [{i+1}]: Company name is required.")
                if not intern.description.strip():
                    warnings.append(f"Internship [{i+1}]: Internship description is empty.")

        is_valid = len(errors) == 0
        logger.info(f"Validation Agent run: Is Valid={is_valid} | Errors={len(errors)} | Warnings={len(warnings)}")
        
        return {
            "is_valid": is_valid,
            "errors": errors,
            "warnings": warnings
        }
