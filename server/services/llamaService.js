/**
 * Dynamic Rule-Based Suggestion Generator
 * Used as fallback when AI is not available
 */

// Skill categories for smart suggestions
const skillCategories = {
  frontend: ["react", "reactjs", "angular", "vue", "vuejs", "html", "css", "javascript", "typescript", "jquery", "bootstrap", "tailwind", "sass", "scss", "redux", "nextjs", "gatsby"],
  backend: ["node", "nodejs", "express", "python", "django", "flask", "java", "spring", "php", "laravel", "ruby", "rails", "golang", "go", "rust", "c#", "dotnet", ".net"],
  database: ["mongodb", "mysql", "postgresql", "postgres", "sql", "oracle", "redis", "elasticsearch", "dynamodb", "firebase", "cassandra", "sqlite"],
  cloud: ["aws", "azure", "gcp", "google cloud", "heroku", "digitalocean", "cloudflare", "netlify", "vercel"],
  devops: ["docker", "kubernetes", "k8s", "jenkins", "cicd", "ci/cd", "terraform", "ansible", "linux", "nginx", "apache"],
  mobile: ["react native", "flutter", "swift", "kotlin", "ios", "android", "mobile"],
  tools: ["git", "github", "gitlab", "jira", "confluence", "postman", "figma", "vscode"],
  softSkills: ["leadership", "communication", "teamwork", "agile", "scrum", "problem-solving", "management", "collaboration"]
};

/**
 * Analyze which skill categories are missing
 */
function analyzeSkillGaps(matchedKeywords, missingKeywords) {
  const gaps = {};
  const strengths = {};

  for (const [category, skills] of Object.entries(skillCategories)) {
    const missingInCategory = missingKeywords.filter(k => 
      skills.some(s => k.toLowerCase().includes(s) || s.includes(k.toLowerCase()))
    );
    const matchedInCategory = matchedKeywords.filter(k => 
      skills.some(s => k.toLowerCase().includes(s) || s.includes(k.toLowerCase()))
    );

    if (missingInCategory.length > 0) {
      gaps[category] = missingInCategory;
    }
    if (matchedInCategory.length > 0) {
      strengths[category] = matchedInCategory;
    }
  }

  return { gaps, strengths };
}

/**
 * Generate truly dynamic suggestions based on resume analysis
 * Used as primary rule-based system and fallback for AI
 */
export function generateSuggestions(score, matchedKeywords, missingKeywords) {
  return generateFallbackSuggestions(score, matchedKeywords, missingKeywords);
}

/**
 * Fallback suggestion generator (exported for AI service)
 */
export function generateFallbackSuggestions(score, matchedKeywords, missingKeywords) {
  const suggestions = [];
  const { gaps, strengths } = analyzeSkillGaps(matchedKeywords, missingKeywords);

  // Dynamic score-based header with specific feedback
  if (score >= 80) {
    suggestions.push("🎯 **Excellent Match!** Your resume strongly aligns with this job requirement.");
    if (matchedKeywords.length > 0) {
      suggestions.push(`✅ You have ${matchedKeywords.length} matching keywords which is great!`);
    }
  } else if (score >= 60) {
    suggestions.push("👍 **Good Match!** Your profile fits well, but there's room for optimization.");
    suggestions.push(`📊 Match Rate: ${matchedKeywords.length} matched vs ${missingKeywords.length} missing keywords`);
  } else if (score >= 40) {
    suggestions.push("📝 **Fair Match.** Your resume needs more alignment with this job.");
    suggestions.push(`⚠️ You're missing ${missingKeywords.length} key terms from the job description.`);
  } else {
    suggestions.push("🔴 **Low Match.** This role may require skills different from your current profile.");
    suggestions.push(`📉 Only ${matchedKeywords.length} keywords match out of ${matchedKeywords.length + missingKeywords.length} total.`);
  }

  // Show what's strong in the resume
  if (Object.keys(strengths).length > 0) {
    suggestions.push("\n**✅ Your Strengths (Already in Resume):**");
    for (const [category, skills] of Object.entries(strengths)) {
      const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
      suggestions.push(`• ${categoryName}: ${skills.slice(0, 4).join(", ")}`);
    }
  }

  // Dynamic missing keywords section
  if (missingKeywords.length > 0) {
    suggestions.push("\n**🔑 Missing Keywords to Add:**");
    const topMissing = missingKeywords.slice(0, 12);
    suggestions.push(`${topMissing.join(", ")}`);
  }

  // Category-specific actionable suggestions
  if (Object.keys(gaps).length > 0) {
    suggestions.push("\n**💡 Personalized Improvement Tips:**");

    if (gaps.frontend) {
      suggestions.push(`• **Frontend Gap:** Add projects using ${gaps.frontend.slice(0, 3).join(", ")}. Consider building a portfolio website.`);
    }
    if (gaps.backend) {
      suggestions.push(`• **Backend Gap:** Highlight any API development or server-side work with ${gaps.backend.slice(0, 3).join(", ")}.`);
    }
    if (gaps.database) {
      suggestions.push(`• **Database Gap:** Mention database design, queries, or data modeling experience with ${gaps.database.slice(0, 2).join(" or ")}.`);
    }
    if (gaps.cloud) {
      suggestions.push(`• **Cloud Gap:** Add any cloud deployment experience. Consider getting ${gaps.cloud[0]?.toUpperCase()} certifications.`);
    }
    if (gaps.devops) {
      suggestions.push(`• **DevOps Gap:** Include CI/CD pipeline setup, containerization, or deployment automation experience.`);
    }
    if (gaps.mobile) {
      suggestions.push(`• **Mobile Gap:** Highlight any mobile app development or responsive design experience.`);
    }
    if (gaps.tools) {
      suggestions.push(`• **Tools Gap:** Add version control (Git) and collaboration tools to your skills section.`);
    }
    if (gaps.softSkills) {
      suggestions.push(`• **Soft Skills Gap:** Include examples of ${gaps.softSkills.slice(0, 2).join(" and ")} in your experience bullets.`);
    }
  }

  // General tips based on score
  suggestions.push("\n**📄 Quick Wins:**");
  
  if (score < 50) {
    suggestions.push("• Restructure your resume to match the job description's format and terminology");
    suggestions.push("• Add a 'Technical Skills' section prominently at the top");
  }
  
  if (missingKeywords.length > 8) {
    suggestions.push("• Add a 'Summary' section that includes key terms from the job posting");
  }

  // Quantification tip - always valuable
  suggestions.push("• Quantify achievements: 'Improved performance by 40%' instead of 'Improved performance'");
  
  if (score < 70) {
    suggestions.push("• Mirror exact phrases from the job description in your experience bullets");
  }

  // Final encouragement based on score
  if (score >= 70) {
    suggestions.push("\n🚀 **Next Step:** Your resume is competitive! Focus on tailoring your cover letter.");
  } else if (score >= 50) {
    suggestions.push("\n📈 **Next Step:** Add the missing keywords and re-analyze to improve your score.");
  } else {
    suggestions.push("\n🎯 **Next Step:** Consider taking online courses for the key missing skills, then update your resume.");
  }

  return suggestions.join("\n");
}