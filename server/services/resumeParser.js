import fs from "fs";
import path from "path";
import pdf from "pdf-parse";
import mammoth from "mammoth";

/**
 * Parse resume from multiple formats: PDF, DOCX, DOC, TXT
 */
export async function parseResume(filePath, originalName = "") {
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(originalName || filePath).toLowerCase();

  let text = "";

  try {
    if (ext === ".pdf" || (!ext && isPDF(buffer))) {
      text = await parsePDF(buffer);
    } else if (ext === ".docx" || ext === ".doc") {
      text = await parseDOCX(buffer);
    } else if (ext === ".txt") {
      text = buffer.toString("utf-8");
    } else {
      // Try PDF first, then DOCX
      try {
        text = await parsePDF(buffer);
      } catch {
        try {
          text = await parseDOCX(buffer);
        } catch {
          text = buffer.toString("utf-8");
        }
      }
    }

    // Clean text preserving line breaks and sentence punctuation for explainability
    text = cleanText(text);

    if (text.length < 30) {
      throw new Error("Could not extract enough text from resume. Please try a different file format (PDF, DOCX, or TXT).");
    }

    return text;
  } catch (err) {
    console.error("Resume parsing error:", err.message);
    throw new Error("Unable to parse resume. Please upload a valid PDF, DOCX, or TXT file.");
  }
}

/**
 * Parse PDF file
 */
async function parsePDF(buffer) {
  try {
    // First attempt with default options
    const data = await pdf(buffer, { max: 5 });
    
    if (data.text && data.text.trim().length > 30) {
      return data.text;
    }

    // If text is too short, it might be a scanned PDF
    throw new Error("PDF appears to be scanned/image-based. Please upload a text-based PDF or convert to DOCX/TXT format.");
  } catch (err) {
    if (err.message.includes("scanned")) {
      throw err;
    }
    throw new Error("Failed to parse PDF. Please try uploading a DOCX or TXT version of your resume.");
  }
}

/**
 * Parse DOCX file
 */
async function parseDOCX(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (err) {
    throw new Error("Failed to parse Word document. Please ensure it's a valid .docx file.");
  }
}

/**
 * Check if buffer is a PDF
 */
function isPDF(buffer) {
  return buffer.slice(0, 5).toString() === "%PDF-";
}

/**
 * Clean text while preserving sentence punctuation, bullet formatting, and structure
 */
function cleanText(text) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 20000);
}
