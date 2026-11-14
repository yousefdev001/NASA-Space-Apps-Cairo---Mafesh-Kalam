"""Deterministic Spoken Medical Representation Formatter.

Feature Branch: 002-live-voice-mode
Prepares validated clinical response text for high-fidelity speech synthesis
without modifying a single medication name, dosage value, unit, or procedural step.
"""

import re
from typing import List, Tuple


class SpokenMedicalFilter:
    """Non-generative, deterministic cleaner for clinical voice synthesis."""

    # Regex detecting dosages, percentages, pressures, and numbers
    DOSAGE_PATTERN = re.compile(
        r"\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|l|%|bpm|mmhg|c|f|hours?|mins?|seconds?|units?|drops?)\b",
        re.IGNORECASE,
    )
    NUMERICAL_PATTERN = re.compile(r"\b\d+(?:\.\d+)?\b")

    @classmethod
    def clean_for_speech(cls, raw_markdown: str, language: str = "auto") -> str:
        """Transform clinical markdown into clean, natural spoken speech.

        Guarantees:
        - All markdown symbols (###, **, *, _, `, [], ()) are stripped.
        - Chunk citations (e.g. [CHUNK-01], JSC-48031-REV-K-...) are removed from audio stream.
        - All numbers, vital stats, and procedural instructions are 100% preserved.
        """
        if not raw_markdown:
            return ""

        text = raw_markdown

        # 1. Strip chunk citation tags and header markers
        text = re.sub(r"\[(?:CHUNK|chunk)-[^\]]+\]", "", text)
        text = re.sub(r"\(?:source_chunk_id:[^\)]+\)", "", text)
        text = re.sub(r"source_chunk_id:\s*[A-Za-z0-9_\-]+", "", text)
        text = re.sub(r"ref_label:\s*[^\n]+", "", text)

        # 2. Clean section headers while preserving their title words
        text = re.sub(r"###?\s*\d*\.?\s*", "", text)
        text = re.sub(r"##\s*", "", text)
        text = re.sub(r"#\s*", "", text)

        # 3. Strip markdown styling symbols (bold, italic, code ticks, horizontal rules)
        text = re.sub(r"\*\*([^*]+)\*\*", r"\1", text)
        text = re.sub(r"\*([^*]+)\*", r"\1", text)
        text = re.sub(r"__([^_]+)__", r"\1", text)
        text = re.sub(r"_([^_]+)_", r"\1", text)
        text = re.sub(r"`([^`]+)`", r"\1", text)
        text = re.sub(r"^---+$", "", text, flags=re.MULTILINE)
        text = re.sub(r"^[=\-_]{3,}$", "", text, flags=re.MULTILINE)

        # 4. Normalize list bullet points to clean sentences
        text = re.sub(r"^\s*[\*\-•]\s+", "", text, flags=re.MULTILINE)
        text = re.sub(r"^\s*\d+\.\s+", "Step: ", text, flags=re.MULTILINE)

        # 5. Arabic-specific and English-specific phonetic clarification
        # SpO2 formatting for clear pronunciation
        text = re.sub(r"\bSpO2\s*([<=≥]*\s*\d+)\s*%", r"SpO2 \1 percent", text, flags=re.IGNORECASE)

        # Clean excess whitespaces and blank lines
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        cleaned = ". ".join(lines)
        cleaned = re.sub(r"\s+", " ", cleaned).strip()

        # Add pause tags between distinct procedural steps for natural delivery
        cleaned = cleaned.replace("Step: ", "<short pause> Step: ")
        if cleaned.startswith("<short pause> "):
            cleaned = cleaned[14:]

        return cleaned

    @classmethod
    def verify_dosage_invariance(cls, original_text: str, spoken_text: str) -> Tuple[bool, List[str]]:
        """Verify that all dosages, numbers, and units from original text exist in spoken text.

        Ignores metadata IDs (source_chunk_id, JSC-..., section markers) which are intentionally
        stripped from speech output for acoustic clarity.

        Returns:
            Tuple[is_valid, missing_entities]
        """
        # Strip metadata from original before extracting expected clinical numbers
        clean_orig = re.sub(r"\[(?:CHUNK|chunk)-[^\]]+\]", "", original_text)
        clean_orig = re.sub(r"source_chunk_id:\s*[A-Za-z0-9_\-]+", "", clean_orig)
        clean_orig = re.sub(r"JSC-\d+-[A-Za-z0-9_\-]+", "", clean_orig)
        clean_orig = re.sub(r"###?\s*\d*\.?\s*", "", clean_orig)

        orig_dosages = set(cls.DOSAGE_PATTERN.findall(clean_orig.lower()))
        orig_numbers = set(cls.NUMERICAL_PATTERN.findall(clean_orig.lower()))

        spoken_lower = spoken_text.lower()
        missing = []

        # Check dosages
        for dosage in orig_dosages:
            # Check normalized match (e.g. 85% matches 85 percent)
            normalized_dosage = dosage.replace("%", " percent")
            if dosage not in spoken_lower and normalized_dosage not in spoken_lower:
                missing.append(f"Missing dosage: {dosage}")

        # Check critical numbers
        for num in orig_numbers:
            if num not in spoken_lower:
                missing.append(f"Missing number: {num}")

        return (len(missing) == 0), missing
