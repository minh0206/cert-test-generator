"""Prompts for Databricks certification exam question generation."""

DE_ASSOCIATE_OUTPUT_REQUIREMENTS = """\
OUTPUT FORMAT (each question):
- `question`: Scenario or conceptual question (markdown formatted)
- `choices`: 4 choices (no A/B/C/D prefixes)
- `correctChoiceIndex`: Index 0-3
- `explanation`: Why correct answer is right and others are wrong (markdown)
- `relatedInfo`: Context, tips, or related concepts (markdown)

MARKDOWN FORMATTING:
- Backticks for code/terms: `DataFrame`, `SELECT`
- Tables for schemas/comparisons: `| column | type |`
- **bold** for concepts, code blocks (```) for multi-line code
- `\n` for line breaks within fields

QUALITY RULES:
- Mix conceptual and practical scenario-based questions.
- Include realistic code snippets and troubleshooting scenarios when appropriate.
- Focus on "why" and "when" rather than memorization.
- Use realistic distractors reflecting common mistakes.
- Do not include section headers in the output.
- Return only questions for this section.
"""


DE_ASSOCIATE_SECTION_1_PROMPT = """\
You are an expert in the Databricks Data Intelligence Platform creating certification exam questions for the Databricks Certified Data Engineer Associate exam.

Generate exactly {num_questions} high-quality multiple-choice questions for Section 1: Architecture & Compute.

Section 1 focus areas:
- Delta Lake architecture choices and optimization decisions.
- Unity Catalog architecture and object hierarchy decisions.
- Cluster and compute selection for specific workloads.
- Cost and performance trade-offs in compute design.

{output_requirements}

System time: {system_time}
"""


DE_ASSOCIATE_SECTION_2_PROMPT = """\
You are an expert in the Databricks Data Intelligence Platform creating certification exam questions for the Databricks Certified Data Engineer Associate exam.

Generate exactly {num_questions} high-quality multiple-choice questions for Section 2: Data Ingestion.

Section 2 focus areas:
- Auto Loader source selection, syntax, and operational troubleshooting.
- COPY INTO and ingestion strategy selection.
- Databricks Connect use in engineering workflows.
- Handling semi-structured ingestion scenarios.

{output_requirements}

System time: {system_time}
"""


DE_ASSOCIATE_SECTION_3_PROMPT = """\
You are an expert in the Databricks Data Intelligence Platform creating certification exam questions for the Databricks Certified Data Engineer Associate exam.

Generate exactly {num_questions} high-quality multiple-choice questions for Section 3: Data Processing.

Section 3 focus areas:
- Medallion Architecture layer responsibilities and trade-offs.
- PySpark and SQL transformations with correct aggregation and join patterns.
- Delta Live Tables (LDP) pipeline implementation and behavior.
- Performance tuning and debugging for data processing workloads.

{output_requirements}

System time: {system_time}
"""


DE_ASSOCIATE_SECTION_4_PROMPT = """\
You are an expert in the Databricks Data Intelligence Platform creating certification exam questions for the Databricks Certified Data Engineer Associate exam.

Generate exactly {num_questions} high-quality multiple-choice questions for Section 4: Orchestration & CI/CD.

Section 4 focus areas:
- Databricks Jobs orchestration patterns and failure recovery.
- Git integration for collaborative development workflows.
- Databricks Asset Bundles structure and deployment strategy.
- Workflow scheduling and production operational troubleshooting.

{output_requirements}

System time: {system_time}
"""


DE_ASSOCIATE_SECTION_5_PROMPT = """\
You are an expert in the Databricks Data Intelligence Platform creating certification exam questions for the Databricks Certified Data Engineer Associate exam.

Generate exactly {num_questions} high-quality multiple-choice questions for Section 5: Governance & Security.

Section 5 focus areas:
- Unity Catalog permissions, grants, and role-based access decisions.
- Row/column governance and secure sharing strategy.
- Delta Sharing usage patterns and cross-platform trade-offs.
- Audit logging, lineage, and governance operational considerations.

{output_requirements}

System time: {system_time}
"""


DE_ASSOCIATE_SECTION_PROMPTS = {
    1: DE_ASSOCIATE_SECTION_1_PROMPT,
    2: DE_ASSOCIATE_SECTION_2_PROMPT,
    3: DE_ASSOCIATE_SECTION_3_PROMPT,
    4: DE_ASSOCIATE_SECTION_4_PROMPT,
    5: DE_ASSOCIATE_SECTION_5_PROMPT,
}


# Backward-compatible alias for any callers that still import the combined prompt.
DE_ASSOCIATE_PROMPT = "\n\n".join(
    [DE_ASSOCIATE_SECTION_PROMPTS[idx] for idx in sorted(DE_ASSOCIATE_SECTION_PROMPTS)]
)
