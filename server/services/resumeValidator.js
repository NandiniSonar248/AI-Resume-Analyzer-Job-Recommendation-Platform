/**
 * Resume Validator - Checks if uploaded file is actually a resume
 */

// Common resume section keywords
const resumeSections = [
  "experience", "education", "skills", "work history", "employment",
  "qualifications", "summary", "objective", "professional", "projects",
  "certifications", "achievements", "awards", "internship", "training",
  "technical skills", "core competencies", "profile", "career", "expertise"
];

// Contact info patterns
const contactPatterns = [
  /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i,  // Email
  /\b\d{10}\b|\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/,  // Phone
  /linkedin\.com\/in\//i,  // LinkedIn
  /github\.com\//i,  // GitHub
];

// Education keywords
const educationKeywords = [
  "bachelor", "master", "phd", "degree", "university", "college", "institute",
  "diploma", "certification", "graduated", "gpa", "cgpa", "b.tech", "m.tech",
  "b.e", "m.e", "bsc", "msc", "mba", "bba", "bca", "mca", "engineering"
];

// Job title keywords
const jobTitleKeywords = [
  "developer", "engineer", "manager", "analyst", "designer", "consultant",
  "specialist", "coordinator", "assistant", "intern", "lead", "senior",
  "junior", "associate", "director", "executive", "administrator", "architect"
];

/**
 * Validate if the text content appears to be a resume
 * @param {string} text - Extracted text from the file
 * @returns {{ isValid: boolean, confidence: number, message: string }}
 */
export function validateResume(text) {
  if (!text || typeof text !== "string") {
    return { isValid: false, confidence: 0, message: "No text content found in file" };
  }

  const lowerText = text.toLowerCase();
  let score = 0;
  const reasons = [];

  // Check for resume sections (max 30 points)
  const foundSections = resumeSections.filter(section => lowerText.includes(section));
  const sectionScore = Math.min(foundSections.length * 5, 30);
  score += sectionScore;
  if (foundSections.length > 0) {
    reasons.push(`Found resume sections: ${foundSections.slice(0, 3).join(", ")}`);
  }

  // Check for contact info (max 20 points)
  const hasContact = contactPatterns.some(pattern => pattern.test(text));
  if (hasContact) {
    score += 20;
    reasons.push("Contains contact information");
  }

  // Check for education keywords (max 20 points)
  const foundEducation = educationKeywords.filter(edu => lowerText.includes(edu));
  if (foundEducation.length > 0) {
    score += Math.min(foundEducation.length * 5, 20);
    reasons.push("Contains education details");
  }

  // Check for job titles (max 15 points)
  const foundTitles = jobTitleKeywords.filter(title => lowerText.includes(title));
  if (foundTitles.length > 0) {
    score += Math.min(foundTitles.length * 3, 15);
    reasons.push("Contains job titles");
  }

  // Check text length (max 15 points)
  const wordCount = text.split(/\s+/).length;
  if (wordCount >= 100 && wordCount <= 2000) {
    score += 15;
    reasons.push("Appropriate length for a resume");
  } else if (wordCount >= 50) {
    score += 8;
  }

  // Determine if valid
  const isValid = score >= 35;
  const confidence = Math.min(score, 100);

  let message;
  if (score >= 70) {
    message = "Valid resume detected";
  } else if (score >= 35) {
    message = "File appears to be a resume";
  } else {
    message = "This file does not appear to be a resume. Please upload a document containing your work experience, education, and skills.";
  }

  return { isValid, confidence, message, reasons };
}
