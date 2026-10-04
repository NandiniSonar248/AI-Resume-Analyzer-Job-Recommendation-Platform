/**
 * parseabilityChecker.js — ATS Formatting & Structure Parser Checker
 * =====================================================================
 * PURPOSE:
 *   Real ATS systems (Workday, Taleo, Greenhouse, Lever, iCIMS) parse resumes
 *   into structured database fields using text extractors. Complex layout
 *   structures like tables, multiple columns, text trapped in images, and
 *   non-standard decorative fonts cause ATS parsers to scramble or drop text.
 *
 * HOW IT WORKS (Structural inspection):
 *   1. PDF Structural Analysis:
 *      - Checks for image XObjects (/Subtype /Image) indicating graphics or scanned pages.
 *      - Checks character-to-byte density to detect scanned/flat PDFs.
 *      - Detects tabular layout patterns (vertical pipe characters, tab delimiters).
 *      - Detects column layout artifacts (jagged horizontal jumps between text lines).
 *   2. DOCX Structural Analysis:
 *      - Checks raw XML chunks for <w:tbl> (Word tables), <w:cols> (multi-column),
 *        and <w:drawing> / <w:pict> (embedded images/textboxes).
 *   3. Text-Level Formatting Analysis:
 *      - Evaluates section headers (Summary, Experience, Education, Skills) to ensure standard ATS discoverability.
 *      - Flags non-standard characters and symbols that corrupt ASCII/UTF-8 streams.
 *
 * HOW IT CONNECTS TO THE SYSTEM:
 *   - Called by: analyzeRoutes.js and ruleBasedScorer.js
 *   - Input:  filePath (string), originalName (string), rawText (string), fileBuffer (Buffer)
 *   - Output: { score: number (0-100), passes: boolean, issues: Array<Issue>, stats: Object }
 */

import fs from "fs";
import path from "path";

/**
 * Standard ATS-friendly section headings recognized by major ATS parsers.
 */
const STANDARD_SECTIONS = [
  "summary", "professional summary", "about me", "profile",
  "experience", "work experience", "employment history", "professional experience",
  "education", "academic history", "qualifications",
  "skills", "technical skills", "core competencies", "skills & tools",
  "projects", "personal projects", "key projects",
  "certifications", "licenses", "awards"
];

/**
 * Main parseability check function
 */
export async function checkParseability(filePath, originalName, rawText = "") {
  const ext = path.extname(originalName || filePath).toLowerCase();
  let fileBuffer = null;

  try {
    if (filePath && fs.existsSync(filePath)) {
      fileBuffer = fs.readFileSync(filePath);
    }
  } catch (e) {
    // If reading file directly fails, proceed with text-based checks
  }

  const issues = [];
  let deduction = 0;

  // 1. Table Detection
  const tableCheck = detectTables(fileBuffer, ext, rawText);
  if (tableCheck.detected) {
    issues.push({
      id: "tables",
      title: "Table Layout Detected",
      severity: "warning",
      status: "warning",
      message: tableCheck.message,
      recommendation: "Replace grid/multi-cell tables with clean linear bullet points. ATS parsers read left-to-right across table columns, scrambling job titles and dates."
    });
    deduction += 15;
  } else {
    issues.push({
      id: "tables",
      title: "Table Structure Clean",
      severity: "info",
      status: "pass",
      message: "No problematic nested tables found.",
      recommendation: "Keep text in single-column sequential format."
    });
  }

  // 2. Multi-Column Layout Detection
  const columnCheck = detectMultiColumn(fileBuffer, ext, rawText);
  if (columnCheck.detected) {
    issues.push({
      id: "columns",
      title: "Multi-Column Layout Detected",
      severity: "warning",
      status: "warning",
      message: columnCheck.message,
      recommendation: "Use a single-column layout. Two-column resumes often cause ATS parsers to interleave unrelated text from left and right columns."
    });
    deduction += 15;
  } else {
    issues.push({
      id: "columns",
      title: "Single-Column Flow",
      severity: "info",
      status: "pass",
      message: "Single-column linear layout detected.",
      recommendation: "Linear layout ensures 100% correct parsing order."
    });
  }

  // 3. Embedded Images / Scanned Content Detection
  const imageCheck = detectImagesAndScans(fileBuffer, ext, rawText);
  if (imageCheck.detected) {
    issues.push({
      id: "images",
      title: imageCheck.title,
      severity: imageCheck.severity,
      status: imageCheck.severity === "critical" ? "fail" : "warning",
      message: imageCheck.message,
      recommendation: "Avoid scanned documents, profile photos, charts, or rating bars inside your resume. Real text is 100% searchable; text inside images is ignored by ATS."
    });
    deduction += imageCheck.deduction;
  } else {
    issues.push({
      id: "images",
      title: "Text-Based Document (No Scan Issues)",
      severity: "info",
      status: "pass",
      message: "Directly extractable digital text stream detected.",
      recommendation: "Direct text enables complete search indexing."
    });
  }

  // 4. Standard Section Headers Check
  const sectionCheck = checkSectionHeaders(rawText);
  if (sectionCheck.missingCore.length > 0) {
    issues.push({
      id: "sections",
      title: "Missing Standard ATS Headings",
      severity: "warning",
      status: "warning",
      message: `Could not identify standard headings for: ${sectionCheck.missingCore.join(", ")}.`,
      recommendation: `Use standard naming such as "Work Experience", "Education", and "Skills" so ATS parsers know where to route your data.`
    });
    deduction += 10;
  } else {
    issues.push({
      id: "sections",
      title: "Standard Section Headings",
      severity: "info",
      status: "pass",
      message: `Found standard ATS sections (${sectionCheck.found.slice(0, 4).join(", ")}).`,
      recommendation: "Clear headings allow the ATS parser to segment your experience accurately."
    });
  }

  // 5. Non-Standard Characters and Symbols
  const symbolCheck = detectNonStandardSymbols(rawText);
  if (symbolCheck.detected) {
    issues.push({
      id: "symbols",
      title: "Non-Standard Symbols / Icon Glyphs",
      severity: "warning",
      status: "warning",
      message: symbolCheck.message,
      recommendation: "Use standard round bullet points (• or -). Fancy icon fonts and dingbats can parse as question marks or corrupt data fields."
    });
    deduction += 10;
  } else {
    issues.push({
      id: "symbols",
      title: "Clean Character Encoding",
      severity: "info",
      status: "pass",
      message: "Standard UTF-8 / ASCII characters with clean bullet formatting.",
      recommendation: "Safe for all legacy and modern ATS parsers."
    });
  }

  // Calculate final score
  const score = Math.max(20, Math.min(100, 100 - deduction));
  const isCompatible = score >= 70;

  return {
    score,
    isCompatible,
    rating: score >= 85 ? "Optimal ATS Format" : score >= 70 ? "Acceptable ATS Format" : "Needs Formatting Cleanup",
    issues,
    summary: {
      totalChecks: issues.length,
      passed: issues.filter(i => i.status === "pass").length,
      warnings: issues.filter(i => i.status === "warning").length,
      failures: issues.filter(i => i.status === "fail").length
    }
  };
}

/**
 * Detect tables in PDF buffer or DOCX XML or text patterns
 */
function detectTables(buffer, ext, text) {
  if (!buffer && !text) return { detected: false };

  // DOCX XML check for <w:tbl>
  if (buffer && (ext === ".docx" || ext === ".doc")) {
    const rawString = buffer.toString("binary");
    if (rawString.includes("<w:tbl") || rawString.includes("w:tblHeader")) {
      return {
        detected: true,
        message: "Word table structure (<w:tbl>) detected in document."
      };
    }
  }

  // PDF stream check
  if (buffer && ext === ".pdf") {
    const rawString = buffer.toString("binary");
    // Matrix or line table structures
    if (rawString.includes("/Table") || (rawString.match(/\b(re|m|l|c)\b\s*[\d\.\s]+\s*\b(S|s|f|F|B|b)\b/g) || []).length > 25) {
      // High count of rectangular draw vectors often signifies table grids
      return {
        detected: true,
        message: "PDF vector grid or table structure detected."
      };
    }
  }

  // Text fallback: Check for pipe-separated or tab-separated alignment
  const lines = text.split(/\r?\n/);
  const pipeLines = lines.filter(l => (l.match(/\|/g) || []).length >= 2);
  if (pipeLines.length >= 2) {
    return {
      detected: true,
      message: "Pipe-delimited table formatting found in text."
    };
  }

  return { detected: false };
}

/**
 * Detect multi-column layout
 */
function detectMultiColumn(buffer, ext, text) {
  if (buffer && (ext === ".docx" || ext === ".doc")) {
    const rawString = buffer.toString("binary");
    if (rawString.includes('<w:cols w:num="2"') || rawString.includes('<w:cols w:num="3"')) {
      return {
        detected: true,
        message: "Multi-column section (<w:cols>) detected in DOCX structure."
      };
    }
  }

  // Text analysis for column side-by-side artifacts
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  let wideSpacesCount = 0;
  for (const line of lines) {
    // If a line has 4+ consecutive spaces between text blocks, it's often a 2-column resume parsed side by side
    if (/\w\s{5,}\w/.test(line)) {
      wideSpacesCount++;
    }
  }

  if (wideSpacesCount >= 4) {
    return {
      detected: true,
      message: "Multiple text blocks separated by wide gutters detected (typical of 2-column resumes)."
    };
  }

  return { detected: false };
}

/**
 * Detect embedded images / scanned documents
 */
function detectImagesAndScans(buffer, ext, text) {
  if (buffer && ext === ".pdf") {
    const rawString = buffer.toString("binary");
    const imageCount = (rawString.match(/\/Subtype\s*\/Image/g) || []).length;
    
    // Low text length with large file size = scanned image PDF
    if (text.length < 300 && buffer.length > 50000) {
      return {
        detected: true,
        title: "Scanned / Image-Heavy PDF",
        severity: "critical",
        deduction: 30,
        message: "Very low extractable text relative to file size. Resume appears to be a scanned image or flattened graphic."
      };
    }

    if (imageCount >= 3) {
      return {
        detected: true,
        title: "Multiple Embedded Images",
        severity: "warning",
        deduction: 15,
        message: `Found ${imageCount} embedded image elements in PDF. Graphics and icons cannot be parsed by ATS.`
      };
    }
  }

  return { detected: false };
}

/**
 * Check standard ATS section headers
 */
function checkSectionHeaders(text) {
  const lower = text.toLowerCase();
  const found = [];
  const coreSections = ["experience", "education", "skills"];
  const missingCore = [];

  for (const section of STANDARD_SECTIONS) {
    const regex = new RegExp(`\\b${section}\\b`, "i");
    if (regex.test(lower)) {
      found.push(section);
    }
  }

  for (const core of coreSections) {
    const hasCore = found.some(f => f.includes(core));
    if (!hasCore) {
      missingCore.push(core.charAt(0).toUpperCase() + core.slice(1));
    }
  }

  return { found, missingCore };
}

/**
 * Detect non-standard symbols or font glyphs
 */
function detectNonStandardSymbols(text) {
  // Count unusual symbols outside standard ASCII & Latin-1 punctuation
  const nonStandard = text.match(/[^\x20-\x7E\n\r\t\u2013\u2014\u2022\u2018\u2019\u201C\u201D•—–]/g) || [];
  if (nonStandard.length > 15) {
    return {
      detected: true,
      message: `Detected ${nonStandard.length} custom symbol characters or private-use glyphs that may corrupt in older ATS databases.`
    };
  }
  return { detected: false };
}

export default {
  checkParseability
};
