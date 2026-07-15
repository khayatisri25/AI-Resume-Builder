import json
import re
from backend.schemas import ResumeDataSchema, ATSReportSchema
from backend.services.llm import BaseLLM, get_llm_service
from backend.services.logging_service import logger
from backend.agents.enhancement import load_prompt

def parse_json_safely(text: str) -> dict:
    """
    Safely extracts and parses JSON content from LLM response text,
    handling markdown fences, whitespace, and formatting variances.
    """
    text = text.strip()
    
    # Try loading directly
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
        
    # Attempt to extract JSON from markdown fences
    match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except json.JSONDecodeError:
            pass
            
    # Fallback to scanning for the first { and last }
    start_idx = text.find('{')
    end_idx = text.rfind('}')
    if start_idx != -1 and end_idx != -1:
        try:
            return json.loads(text[start_idx:end_idx+1].strip())
        except json.JSONDecodeError:
            pass
            
    raise ValueError("LLM response did not contain a valid JSON object.")

class ATSAnalysisAgent:
    """
    Analyzes the resume data against the target role using LLM to extract
    an ATS score, keyword coverage gaps, spelling/grammar reviews, and recommendations.
    """
    
    def __init__(self, llm_service: BaseLLM = None):
        self.llm = llm_service or get_llm_service()

    def analyze(self, data: ResumeDataSchema, target_role: str) -> ATSReportSchema:
        """
        Analyzes the resume data and returns an ATSReportSchema.
        """
        logger.info(f"ATS Analysis Agent starting for target role: {target_role}")
        
        # Serialize the schema for the prompt
        resume_dict = data.model_dump()
        resume_json_str = json.dumps(resume_dict, indent=2)
        
        try:
            prompt_tpl = load_prompt("ats.txt")
            prompt = prompt_tpl.format(
                target_role=target_role,
                resume_json=resume_json_str
            )
            
            logger.info("Executing LLM for ATS scoring and analysis...")
            response_text = self.llm.generate_text(prompt)
            
            report_data = parse_json_safely(response_text)
            
            # Map database or API formats to ATSReportSchema
            report = ATSReportSchema(
                score=float(report_data.get("score", 70.0)),
                suggestions=report_data.get("suggestions", []),
                missing_keywords=report_data.get("missing_keywords", []),
                overall_feedback=report_data.get("overall_feedback", "Successfully analyzed.")
            )
            
            logger.info(f"ATS Analysis completed. Score: {report.score}")
            return report
            
        except Exception as e:
            logger.error(f"Failed to analyze resume with LLM: {str(e)}")
            # Return a calculated default report in case of failure
            return self._generate_fallback_report(data, target_role)

    def _generate_fallback_report(self, data: ResumeDataSchema, target_role: str) -> ATSReportSchema:
        """
        Rule-based fallback scoring if LLM fails to output valid JSON.
        """
        logger.warning("Generating fallback ATS report due to parsing error.")
        score = 60.0
        suggestions = []
        missing_keywords = []

        # Simple rules
        if data.personal_info.email: score += 5
        if data.personal_info.phone: score += 5
        if data.objective: score += 10
        
        if len(data.education) > 0: score += 10
        else: suggestions.append("Add an education section.")
            
        if len(data.work_experience) > 0:
            score += 20
            # Check length of details
            if len(data.work_experience[0].description) < 50:
                suggestions.append("Expand work experience bullet points to show metrics.")
        else:
            suggestions.append("Add a work experience section to improve credibility.")

        if len(data.projects) > 0: score += 15
        else: suggestions.append("Add key projects detailing technical tasks.")

        if len(data.skills) > 5: score += 15
        else:
            suggestions.append("List at least 5-10 technical skills relevant to your domain.")
            missing_keywords.extend(["System Design", "Cloud Computing"])

        # Cap score at 100
        score = min(score, 100.0)
        
        return ATSReportSchema(
            score=score,
            suggestions=suggestions or ["Optimize bullet points", "Include details of tech stack"],
            missing_keywords=missing_keywords or ["Agile", "Unit Testing", "APIs"],
            overall_feedback=f"Analysis completed using baseline rules for target role: {target_role}. Please review your section sizes."
        )
