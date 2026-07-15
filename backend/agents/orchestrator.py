from backend.schemas import ResumeDataSchema, ResumeGenerationResponse, ATSReportSchema
from backend.services.logging_service import logger, log_execution_time
from backend.agents.formatting import FormattingAgent
from backend.agents.validation import ValidationAgent
from backend.agents.enhancement import EnhancementAgent
from backend.agents.ats_analysis import ATSAnalysisAgent

class OrchestratorAgent:
    """
    Coordinates the execution of the multi-agent AI resume builder workflow.
    Ensures input is parsed, validated, enhanced, scored, and returned.
    """

    def __init__(self, llm_service=None):
        self.formatter = FormattingAgent()
        self.validator = ValidationAgent()
        self.enhancer = EnhancementAgent(llm_service=llm_service)
        self.analyzer = ATSAnalysisAgent(llm_service=llm_service)

    @log_execution_time("Orchestrator Workflow Run")
    def run_workflow(self, raw_data: ResumeDataSchema, target_role: str) -> ResumeGenerationResponse:
        """
        Executes the full pipeline:
        1. Format & Sanitize raw data.
        2. Validate inputs. If critical errors exist, they are logged (can be raised or checked).
        3. Rewrite sections to make them ATS-friendly.
        4. Analyze keyword gaps and score the enhanced resume.
        """
        logger.info(f"Orchestrator triggered for target role: {target_role}")

        # Step 1: Format data (strip urls, organize lists)
        cleaned_data = self.formatter.clean(raw_data)

        # Step 2: Validate user inputs
        validation_result = self.validator.validate(cleaned_data)
        
        # If there are hard errors, we still try our best but note them down.
        # Alternatively, we can raise a ValueError that gets caught by the router.
        # For maximum robustness, if critical errors exist (like missing Name),
        # we raise a ValueError to prompt the user.
        if validation_result["errors"]:
            error_msg = "; ".join(validation_result["errors"])
            logger.warning(f"Validation errors detected in orchestrator: {error_msg}")
            # Raise exception for critical missing inputs
            raise ValueError(f"Validation failed: {error_msg}")

        # Step 3: Enhancement Agent (LLM rewrite)
        enhanced_data = self.enhancer.enhance(cleaned_data, target_role)

        # Step 4: ATS Analysis Agent (Scoring & keyword match)
        ats_report = self.analyzer.analyze(enhanced_data, target_role)

        # Append any validation warnings as part of the ATS recommendations
        if validation_result["warnings"]:
            # Insert warnings at the top of recommendations
            merged_suggestions = validation_result["warnings"] + ats_report.suggestions
            ats_report.suggestions = merged_suggestions

        logger.info("Orchestrator workflow completed successfully.")
        return ResumeGenerationResponse(
            enhanced_data=enhanced_data,
            ats_report=ats_report
        )
