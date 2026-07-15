from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime

# ----------------- User Schemas -----------------
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: Optional[str] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- Resume Sub-schemas -----------------
class PersonalInfoSchema(BaseModel):
    full_name: str = Field(..., description="Full Name")
    professional_title: str = Field(..., description="Professional Title (e.g., Software Engineer)")
    email: str = Field(..., description="Email Address")
    phone: str = Field(..., description="Phone Number")
    address: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    portfolio: Optional[str] = None

class EducationSchema(BaseModel):
    degree: str
    college: Optional[str] = None
    university: Optional[str] = None
    cgpa: Optional[str] = None
    start_year: str
    end_year: str

class ProjectSchema(BaseModel):
    project_name: str
    description: str
    technologies: str  # Comma-separated or string
    github_link: Optional[str] = None
    live_link: Optional[str] = None

class InternshipSchema(BaseModel):
    company: str
    role: str
    description: str
    start_date: str
    end_date: str

class WorkExperienceSchema(BaseModel):
    company: str
    role: str
    description: str
    start_date: str
    end_date: str

class CertificationSchema(BaseModel):
    name: str
    issuer: str
    year: str

class AchievementSchema(BaseModel):
    title: str
    description: str

class LanguageSchema(BaseModel):
    language: str
    proficiency: str # e.g. Native, Professional, Intermediate

class ResumeDataSchema(BaseModel):
    personal_info: PersonalInfoSchema
    objective: str
    education: List[EducationSchema] = []
    skills: List[str] = []
    projects: List[ProjectSchema] = []
    internships: List[InternshipSchema] = []
    work_experience: List[WorkExperienceSchema] = []
    certifications: List[CertificationSchema] = []
    achievements: List[AchievementSchema] = []
    languages: List[LanguageSchema] = []
    interests: List[str] = []
    target_role: str
    preferred_template: str = "modern"

# ----------------- DB Input/Output Schemas -----------------
class ResumeCreateRequest(BaseModel):
    title: str = "My Resume"
    template_name: str = "modern"
    raw_data: ResumeDataSchema

class ResumeResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    title: str
    template_name: str
    raw_data: ResumeDataSchema
    enhanced_data: Optional[ResumeDataSchema] = None
    ats_score: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SectionImprovementRequest(BaseModel):
    section_name: str # e.g. "objective", "experience", "projects", "skills"
    content: str
    target_role: str

class SectionImprovementResponse(BaseModel):
    original_content: str
    improved_content: str

class ATSReportSchema(BaseModel):
    score: float
    suggestions: List[str]
    missing_keywords: List[str]
    overall_feedback: str

class ResumeGenerationResponse(BaseModel):
    resume_id: Optional[int] = None
    enhanced_data: ResumeDataSchema
    ats_report: ATSReportSchema

class TemplateResponse(BaseModel):
    id: int
    name: str
    stylesheet_config: dict

    class Config:
        from_attributes = True
