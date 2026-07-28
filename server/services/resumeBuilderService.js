/**
 * Resume Builder Service
 * Creates ATS-optimized resumes based on job description
 */

import PDFDocument from "pdfkit";
import { generateAISuggestions } from "./aiService.js";

/**
 * Generate ATS-optimized resume content based on job description
 */
export async function generateOptimizedResume(userData, jobDescription, targetKeywords = []) {
  try {
    // Extract key requirements from job description
    const requirements = extractRequirements(jobDescription);
    
    // Calculate initial score for AI suggestions
    const initialScore = calculateATSScore(userData, targetKeywords);
    const userSkills = (userData.skills || []).map(s => s.toLowerCase());
    const matchedKeywords = targetKeywords.filter(kw => 
      userSkills.some(s => s.includes(kw.toLowerCase()) || kw.toLowerCase().includes(s))
    );
    const missingKeywords = targetKeywords.filter(kw => 
      !userSkills.some(s => s.includes(kw.toLowerCase()) || kw.toLowerCase().includes(s))
    );
    
    // Generate AI suggestions for resume optimization
    const aiResult = await generateAISuggestions(
      initialScore,
      matchedKeywords,
      missingKeywords,
      { skills: userData.skills, role: userData.targetRole }
    );
    const aiSuggestions = aiResult.suggestions || "Focus on highlighting your relevant skills and experience.";

    // Build optimized resume structure
    const optimizedResume = {
      personalInfo: {
        name: userData.name || "Your Name",
        email: userData.email || "email@example.com",
        phone: userData.phone || "+91 XXXXXXXXXX",
        location: userData.location || "City, Country",
        linkedin: userData.linkedin || "",
        portfolio: userData.portfolio || ""
      },
      
      summary: generateProfessionalSummary(userData, targetKeywords),
      
      skills: optimizeSkills(userData.skills || [], targetKeywords),
      
      experience: optimizeExperience(userData.experience || [], targetKeywords),
      
      education: userData.education || [],
      
      certifications: userData.certifications || [],
      
      projects: optimizeProjects(userData.projects || [], targetKeywords),
      
      keywords: targetKeywords,
      
      atsScore: calculateATSScore(userData, targetKeywords),
      
      suggestions: aiSuggestions
    };

    return optimizedResume;
  } catch (error) {
    console.error("Resume generation error:", error.message);
    throw error;
  }
}

/**
 * Extract requirements from job description
 */
function extractRequirements(jobDescription) {
  const requirements = {
    experience: [],
    skills: [],
    education: [],
    responsibilities: []
  };

  const lines = jobDescription.split(/[\n.]/);
  
  lines.forEach(line => {
    const lower = line.toLowerCase().trim();
    
    if (lower.includes("year") && (lower.includes("experience") || lower.includes("exp"))) {
      requirements.experience.push(line.trim());
    }
    if (lower.includes("bachelor") || lower.includes("master") || lower.includes("degree")) {
      requirements.education.push(line.trim());
    }
    if (lower.includes("skill") || lower.includes("proficien") || lower.includes("knowledge")) {
      requirements.skills.push(line.trim());
    }
    if (lower.includes("respons") || lower.includes("will be") || lower.includes("duties")) {
      requirements.responsibilities.push(line.trim());
    }
  });

  return requirements;
}

/**
 * Generate professional summary with keywords
 */
function generateProfessionalSummary(userData, keywords) {
  const yearsExp = userData.yearsOfExperience || "X";
  const role = userData.targetRole || "Software Developer";
  const topSkills = (userData.skills || []).slice(0, 5).join(", ");
  
  const keywordPhrase = keywords.slice(0, 3).join(", ");
  
  return `Results-driven ${role} with ${yearsExp}+ years of experience in ${topSkills}. ` +
    `Proven expertise in ${keywordPhrase}. ` +
    `Passionate about delivering high-quality solutions and driving business growth through technology. ` +
    `Strong problem-solving abilities with excellent communication skills.`;
}

/**
 * Optimize skills section with keywords
 */
function optimizeSkills(userSkills, keywords) {
  const skillSet = new Set([
    ...userSkills.map(s => s.toLowerCase()),
    ...keywords.map(k => k.toLowerCase())
  ]);
  
  // Categorize skills
  const categories = {
    "Programming Languages": ["javascript", "python", "java", "c++", "typescript", "go", "rust", "php", "ruby", "swift", "kotlin"],
    "Frontend": ["react", "angular", "vue", "html", "css", "sass", "tailwind", "bootstrap", "jquery", "next.js"],
    "Backend": ["node.js", "express", "django", "flask", "spring", "fastapi", ".net", "laravel", "rails"],
    "Database": ["mongodb", "mysql", "postgresql", "redis", "elasticsearch", "oracle", "sql server", "dynamodb"],
    "Cloud & DevOps": ["aws", "azure", "gcp", "docker", "kubernetes", "jenkins", "terraform", "ci/cd", "git"],
    "Tools & Others": ["agile", "scrum", "jira", "figma", "rest api", "graphql", "microservices", "linux"]
  };

  const categorized = {};
  const uncategorized = [];

  for (const skill of skillSet) {
    let found = false;
    for (const [category, categorySkills] of Object.entries(categories)) {
      if (categorySkills.some(cs => skill.includes(cs) || cs.includes(skill))) {
        if (!categorized[category]) categorized[category] = [];
        categorized[category].push(skill);
        found = true;
        break;
      }
    }
    if (!found) uncategorized.push(skill);
  }

  if (uncategorized.length > 0) {
    categorized["Other Skills"] = uncategorized;
  }

  return categorized;
}

/**
 * Optimize experience with action verbs and keywords
 */
function optimizeExperience(experience, keywords) {
  const actionVerbs = [
    "Developed", "Implemented", "Designed", "Led", "Managed",
    "Created", "Built", "Optimized", "Improved", "Delivered",
    "Collaborated", "Architected", "Automated", "Streamlined", "Spearheaded"
  ];

  return experience.map(exp => ({
    ...exp,
    bullets: (exp.bullets || []).map((bullet, i) => {
      // Ensure bullet starts with action verb
      const startsWithVerb = actionVerbs.some(v => bullet.startsWith(v));
      if (!startsWithVerb) {
        return `${actionVerbs[i % actionVerbs.length]} ${bullet.charAt(0).toLowerCase() + bullet.slice(1)}`;
      }
      return bullet;
    }),
    relevantKeywords: keywords.filter(kw => 
      (exp.description || "").toLowerCase().includes(kw.toLowerCase()) ||
      (exp.bullets || []).some(b => b.toLowerCase().includes(kw.toLowerCase()))
    )
  }));
}

/**
 * Optimize projects section
 */
function optimizeProjects(projects, keywords) {
  return projects.map(project => ({
    ...project,
    technologies: [
      ...(project.technologies || []),
      ...keywords.filter(kw => 
        (project.description || "").toLowerCase().includes(kw.toLowerCase())
      )
    ].slice(0, 8)
  }));
}

/**
 * Calculate ATS score for optimized resume
 */
function calculateATSScore(userData, keywords) {
  let score = 50; // Base score
  
  // Check keyword coverage
  const userText = JSON.stringify(userData).toLowerCase();
  const matchedKeywords = keywords.filter(kw => userText.includes(kw.toLowerCase()));
  score += (matchedKeywords.length / keywords.length) * 30;
  
  // Check completeness
  if (userData.name) score += 2;
  if (userData.email) score += 2;
  if (userData.phone) score += 2;
  if (userData.experience?.length > 0) score += 5;
  if (userData.education?.length > 0) score += 5;
  if (userData.skills?.length > 5) score += 4;
  
  return Math.min(100, Math.round(score));
}

/**
 * Generate PDF resume
 */
export function generatePDFResume(resumeData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];
      
      doc.on("data", chunk => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const { personalInfo, summary, skills, experience, education, projects } = resumeData;

      // Header - Name
      doc.fontSize(24).font("Helvetica-Bold")
        .text(personalInfo.name, { align: "center" });
      
      // Contact info
      doc.fontSize(10).font("Helvetica")
        .text(
          `${personalInfo.email} | ${personalInfo.phone} | ${personalInfo.location}`,
          { align: "center" }
        );
      
      if (personalInfo.linkedin) {
        doc.text(personalInfo.linkedin, { align: "center", link: personalInfo.linkedin });
      }

      doc.moveDown();

      // Summary
      doc.fontSize(12).font("Helvetica-Bold").text("PROFESSIONAL SUMMARY");
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica").text(summary);
      doc.moveDown();

      // Skills
      doc.fontSize(12).font("Helvetica-Bold").text("TECHNICAL SKILLS");
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);
      
      for (const [category, skillList] of Object.entries(skills)) {
        doc.fontSize(10).font("Helvetica-Bold").text(`${category}: `, { continued: true });
        doc.font("Helvetica").text(skillList.join(", "));
      }
      doc.moveDown();

      // Experience
      if (experience && experience.length > 0) {
        doc.fontSize(12).font("Helvetica-Bold").text("WORK EXPERIENCE");
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);

        experience.forEach(exp => {
          doc.fontSize(11).font("Helvetica-Bold").text(exp.title);
          doc.fontSize(10).font("Helvetica")
            .text(`${exp.company} | ${exp.location || ""} | ${exp.dates || ""}`);
          
          (exp.bullets || []).forEach(bullet => {
            doc.text(`• ${bullet}`, { indent: 15 });
          });
          doc.moveDown(0.5);
        });
      }

      // Education
      if (education && education.length > 0) {
        doc.fontSize(12).font("Helvetica-Bold").text("EDUCATION");
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);

        education.forEach(edu => {
          doc.fontSize(11).font("Helvetica-Bold").text(edu.degree);
          doc.fontSize(10).font("Helvetica")
            .text(`${edu.institution} | ${edu.year || ""}`);
        });
        doc.moveDown();
      }

      // Projects
      if (projects && projects.length > 0) {
        doc.fontSize(12).font("Helvetica-Bold").text("PROJECTS");
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);

        projects.forEach(project => {
          doc.fontSize(11).font("Helvetica-Bold").text(project.name);
          doc.fontSize(10).font("Helvetica").text(project.description);
          if (project.technologies?.length > 0) {
            doc.fontSize(9).fillColor("gray")
              .text(`Technologies: ${project.technologies.join(", ")}`);
            doc.fillColor("black");
          }
          doc.moveDown(0.5);
        });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export default {
  generateOptimizedResume,
  generatePDFResume
};
