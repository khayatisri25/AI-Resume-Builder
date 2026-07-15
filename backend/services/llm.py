import json
import re
from abc import ABC, abstractmethod
from google import genai
from google.genai import types as genai_types
from openai import OpenAI
from backend.config import settings
from backend.services.logging_service import logger, log_execution_time


class BaseLLM(ABC):
    @abstractmethod
    def generate_text(self, prompt: str, system_instruction: str = None) -> str:
        pass


class GeminiLLM(BaseLLM):
    def __init__(self, api_key: str, model_name: str):
        self.model_name = model_name
        self.client = genai.Client(api_key=api_key)
        logger.info(f"Initialized Gemini LLM (google-genai SDK) with model: {model_name}")

    @log_execution_time("Gemini API Call")
    def generate_text(self, prompt: str, system_instruction: str = None) -> str:
        try:
            config = genai_types.GenerateContentConfig(
                temperature=0.2,
                system_instruction=system_instruction if system_instruction else None,
            )
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=config,
            )
            return response.text.strip()
        except Exception as e:
            logger.error(f"Gemini API failure: {str(e)}")
            raise e


class OpenAILLM(BaseLLM):
    def __init__(self, api_key: str, model_name: str):
        self.client = OpenAI(api_key=api_key)
        self.model_name = model_name
        logger.info(f"Initialized OpenAI LLM with model: {model_name}")

    @log_execution_time("OpenAI API Call")
    def generate_text(self, prompt: str, system_instruction: str = None) -> str:
        try:
            messages = []
            if system_instruction:
                messages.append({"role": "system", "content": system_instruction})
            messages.append({"role": "user", "content": prompt})

            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                temperature=0.2
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"OpenAI API failure: {str(e)}")
            raise e


class MockLLM(BaseLLM):
    """
    Mock LLM to return high-quality resume enhancements and ATS reports
    when no API keys are provided.
    """
    def __init__(self):
        logger.info("Initialized Mock LLM Service (fallback mode)")

    def generate_text(self, prompt: str, system_instruction: str = None) -> str:
        prompt_lower = prompt.lower()
        
        # 1. Check if objective prompt
        if "objective" in prompt_lower or "career objective" in prompt_lower:
            # Extract target job role if possible
            match = re.search(r"Target Job Role:\s*(.*)", prompt)
            role = match.group(1).strip() if match else "Software Engineer"
            return f"Driven and result-oriented {role} with a proven track record of designing, building, and deploying high-performance applications. Adept at leveraging modern methodologies and frameworks to solve complex technical challenges, improve development workflows, and deliver robust software solutions that align with business objectives and enhance user experiences."

        # 2. Check if skills prompt
        elif "skills" in prompt_lower or "current skills" in prompt_lower:
            match = re.search(r"Target Job Role:\s*(.*)", prompt)
            role = match.group(1).strip() if match else "Software Engineer"
            # Return appropriate skills based on role
            if "frontend" in role.lower() or "web" in role.lower():
                return "JavaScript, TypeScript, React, HTML5, CSS3, Tailwind CSS, Next.js, Redux, Git, REST APIs, Webpack, Testing Library"
            elif "backend" in role.lower() or "python" in role.lower():
                return "Python, FastAPI, Django, Flask, PostgreSQL, SQLite, SQLAlchemy, Redis, Docker, Git, REST APIs, CI/CD, Unit Testing"
            else:
                return "Python, Java, JavaScript, React, SQL, PostgreSQL, Docker, Git, REST APIs, Agile Methodology, Data Structures, Algorithms"

        # 3. Check if projects prompt
        elif "project" in prompt_lower or "technologies" in prompt_lower:
            match_role = re.search(r"Target Job Role:\s*(.*)", prompt)
            role = match_role.group(1).strip() if match_role else "Software Engineer"
            match_proj = re.search(r"Project Name:\s*(.*)", prompt)
            proj = match_proj.group(1).strip() if match_proj else "Portfolio App"
            match_tech = re.search(r"Technologies Used:\s*(.*)", prompt)
            tech = match_tech.group(1).strip() if match_tech else "React, Node.js"
            
            return f"- Engineered and launched '{proj}' utilizing {tech}, streamlining user workflows and improving page load times by 25%.\n- Developed robust modular components and integrated scalable API endpoints, leading to a 35% reduction in frontend-backend roundtrip times.\n- Implemented modern security protocols and caching mechanisms, securing data transmission and boosting page load speeds by 40%."

        # 4. Check if experience prompt
        elif "experience" in prompt_lower or "work experience" in prompt_lower:
            match_role = re.search(r"Target Job Role:\s*(.*)", prompt)
            role = match_role.group(1).strip() if match_role else "Software Engineer"
            match_company = re.search(r"Company:\s*(.*)", prompt)
            company = match_company.group(1).strip() if match_company else "Tech Solutions Inc."
            
            return f"- Spearheaded design and integration of core cloud microservices using Python and Docker, optimizing API throughput by 45%.\n- Directed a cross-functional team of 5 engineers to deliver high-priority client modules, reducing bug density in production by 30%.\n- Engineered automated testing pipelines and optimized SQL queries, reducing deployment cycles by 18 hours per week and database CPU spikes by 25%."

        # 5. Check if ATS prompt
        elif "ats" in prompt_lower or "ats_reports" in prompt_lower:
            match_role = re.search(r"Target Job Role:\s*(.*)", prompt)
            role = match_role.group(1).strip() if match_role else "Software Engineer"
            
            mock_report = {
                "score": 88.0,
                "suggestions": [
                    f"Incorporate more standard action verbs like 'Engineered', 'Optimized', or 'Spearheaded' to start your bullet points for the {role} role.",
                    "Ensure your educational history is complete and links directly to relevant coursework or honors.",
                    "Include quantifiable business or performance metrics in all experience sections to emphasize your direct achievements.",
                    "Structure your skills category into sections (e.g., Languages, Frameworks, Developer Tools) to improve readability."
                ],
                "missing_keywords": [
                    "Docker",
                    "CI/CD Pipelines",
                    "System Architecture",
                    "Agile/Scrum",
                    "PostgreSQL"
                ],
                "overall_feedback": f"Your resume has a strong starting structure for a {role} role, but formatting could be optimized by categorizing technical skills and focusing more on business results and scale."
            }
            return json.dumps(mock_report)
            
        else:
            # Catch all default
            return "Professional profile matches requirements for target role. Bullet points successfully formatted using active verbs and metrics."


def get_llm_service(
    gemini_key: str | None = None,
    openai_key: str | None = None,
    provider: str | None = None
) -> BaseLLM:
    """
    Factory function to retrieve the appropriate LLM service instance
    based on settings and API key availability.
    """
    selected_provider = (provider or settings.DEFAULT_LLM_PROVIDER).lower()
    
    if selected_provider == "gemini":
        key = gemini_key or settings.GEMINI_API_KEY
        if key:
            return GeminiLLM(api_key=key, model_name=settings.DEFAULT_GEMINI_MODEL)
        else:
            logger.warning("Gemini API Key missing. Falling back to MockLLM.")
            return MockLLM()
            
    elif selected_provider == "openai":
        key = openai_key or settings.OPENAI_API_KEY
        if key:
            return OpenAILLM(api_key=key, model_name=settings.DEFAULT_OPENAI_MODEL)
        else:
            logger.warning("OpenAI API Key missing. Falling back to MockLLM.")
            return MockLLM()
            
    else:
        return MockLLM()
