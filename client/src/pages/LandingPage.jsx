/**
 * Landing Page
 * ============================================
 * PURPOSE: First impression page for new visitors
 * 
 * INTERVIEW EXPLANATION:
 * - Hero section explains what the product does
 * - Features showcase the main capabilities
 * - How it works - step by step guide
 * - Stats to build trust (can be dynamic later)
 * - CTA buttons to drive signups
 * 
 * WHY THIS PAGE MATTERS:
 * - First thing users see
 * - Explains value proposition
 * - Converts visitors to users
 * - Professional look builds trust
 */

import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-nav-container">
          <Link to="/" className="landing-brand">
            <span className="brand-icon">🎯</span>
            <span className="brand-name">JobMatch<span className="brand-highlight">Pro</span></span>
          </Link>
          
          <div className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#faq">FAQ</a>
          </div>
          
          <div className="landing-nav-actions">
            <Link to="/login" className="nav-login-btn">Sign In</Link>
            <Link to="/register" className="nav-signup-btn">Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-badge">
            <span>🚀</span> AI-Powered Resume Analysis
          </div>
          
          <h1 className="hero-title">
            Land More Interviews with an
            <span className="hero-highlight"> ATS-Optimized Resume</span>
          </h1>
          
          <p className="hero-subtitle">
            Stop getting rejected by Applicant Tracking Systems. Our AI analyzes your resume 
            against any job description and tells you exactly what to fix to get shortlisted.
          </p>
          
          <div className="hero-cta">
            <Link to="/register" className="hero-primary-btn">
              <span>🎯</span> Analyze My Resume Free
            </Link>
            <a href="#how-it-works" className="hero-secondary-btn">
              See How It Works →
            </a>
          </div>
          
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="stat-number">50K+</span>
              <span className="stat-label">Resumes Analyzed</span>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat">
              <span className="stat-number">85%</span>
              <span className="stat-label">Avg Score Improvement</span>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat">
              <span className="stat-number">3X</span>
              <span className="stat-label">More Interview Calls</span>
            </div>
          </div>
        </div>
        
        {/* Hero Image/Demo */}
        <div className="hero-demo">
          <div className="demo-window">
            <div className="demo-header">
              <div className="demo-dots">
                <span></span><span></span><span></span>
              </div>
              <span className="demo-title">ATS Analysis Result</span>
            </div>
            <div className="demo-content">
              <div className="demo-score">
                <div className="score-circle demo-animate">
                  <span className="score-value">87</span>
                  <span className="score-label">ATS Score</span>
                </div>
                <span className="score-badge">🎯 Excellent Match</span>
              </div>
              <div className="demo-keywords">
                <div className="demo-keyword-section">
                  <span className="keyword-label">✅ Matched Keywords</span>
                  <div className="keyword-tags">
                    <span className="tag matched">React</span>
                    <span className="tag matched">JavaScript</span>
                    <span className="tag matched">Node.js</span>
                    <span className="tag matched">MongoDB</span>
                  </div>
                </div>
                <div className="demo-keyword-section">
                  <span className="keyword-label">❌ Missing Keywords</span>
                  <div className="keyword-tags">
                    <span className="tag missing">TypeScript</span>
                    <span className="tag missing">AWS</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="problem-section">
        <div className="section-container">
          <h2 className="section-title">Why Your Resume Gets Rejected</h2>
          <p className="section-subtitle">
            75% of resumes are rejected by ATS before a human ever sees them
          </p>
          
          <div className="problem-grid">
            <div className="problem-card">
              <div className="problem-icon">🤖</div>
              <h3>ATS Can't Read Your Resume</h3>
              <p>Fancy formatting, tables, and graphics confuse Applicant Tracking Systems, causing automatic rejection.</p>
            </div>
            <div className="problem-card">
              <div className="problem-icon">🔑</div>
              <h3>Missing Keywords</h3>
              <p>Your resume doesn't contain the exact keywords from the job description that ATS scans for.</p>
            </div>
            <div className="problem-card">
              <div className="problem-icon">📝</div>
              <h3>Wrong Format</h3>
              <p>Using the wrong file format or structure makes it impossible for ATS to parse your information.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="section-container">
          <h2 className="section-title">Everything You Need to Beat the ATS</h2>
          <p className="section-subtitle">
            Our AI-powered platform helps you optimize your resume for any job
          </p>
          
          <div className="features-grid">
            <div className="feature-card featured">
              <div className="feature-icon">🎯</div>
              <h3>ATS Score Analysis</h3>
              <p>Get an instant score showing how well your resume matches the job description. See exactly what's working and what's not.</p>
              <ul className="feature-list">
                <li>✓ Real-time scoring</li>
                <li>✓ Keyword matching</li>
                <li>✓ Format validation</li>
              </ul>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>AI Suggestions</h3>
              <p>Powered by advanced AI that gives you specific, actionable advice to improve your resume.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🔑</div>
              <h3>Keyword Analysis</h3>
              <p>See which keywords you're missing and which ones are already in your resume.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">💼</div>
              <h3>Job Matching</h3>
              <p>Find jobs that match your skills and get recommendations based on your profile.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📝</div>
              <h3>Resume Builder</h3>
              <p>Build an ATS-optimized resume from scratch with our guided builder.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📄</div>
              <h3>PDF Export</h3>
              <p>Download your optimized resume as a professional PDF ready to submit.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section" id="how-it-works">
        <div className="section-container">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">
            Get your resume analyzed in 3 simple steps
          </p>
          
          <div className="steps-container">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-icon">📤</div>
              <h3>Upload Your Resume</h3>
              <p>Upload your resume in PDF, DOCX, or TXT format. We support all common resume formats.</p>
            </div>
            
            <div className="step-connector">→</div>
            
            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-icon">📋</div>
              <h3>Paste Job Description</h3>
              <p>Copy and paste the job description you're applying for. Our AI will analyze the requirements.</p>
            </div>
            
            <div className="step-connector">→</div>
            
            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-icon">🎯</div>
              <h3>Get Your Score & Tips</h3>
              <p>Instantly see your ATS score, missing keywords, and AI-powered suggestions to improve.</p>
            </div>
          </div>
          
          <div className="steps-cta">
            <Link to="/register" className="hero-primary-btn">
              Try It Free - No Credit Card Required
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="section-container">
          <h2 className="section-title">Success Stories</h2>
          <p className="section-subtitle">
            Join thousands who landed their dream jobs
          </p>
          
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-content">
                <p>"I was applying to 50+ jobs with no response. After using JobMatch Pro, I optimized my resume and got 5 interview calls in the first week!"</p>
              </div>
              <div className="testimonial-author">
                <div className="author-avatar">RS</div>
                <div className="author-info">
                  <span className="author-name">Rahul Sharma</span>
                  <span className="author-role">Software Developer at Infosys</span>
                </div>
              </div>
            </div>
            
            <div className="testimonial-card">
              <div className="testimonial-content">
                <p>"The keyword analysis showed me exactly what was missing. I added those skills and my ATS score jumped from 45% to 89%. Got the job!"</p>
              </div>
              <div className="testimonial-author">
                <div className="author-avatar">PM</div>
                <div className="author-info">
                  <span className="author-name">Priya Mehta</span>
                  <span className="author-role">Data Analyst at TCS</span>
                </div>
              </div>
            </div>
            
            <div className="testimonial-card">
              <div className="testimonial-content">
                <p>"As a fresher, I had no idea what recruiters look for. This tool taught me how to write an effective resume. Landed my first job!"</p>
              </div>
              <div className="testimonial-author">
                <div className="author-avatar">AK</div>
                <div className="author-info">
                  <span className="author-name">Amit Kumar</span>
                  <span className="author-role">Frontend Developer at Wipro</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section" id="faq">
        <div className="section-container">
          <h2 className="section-title">Frequently Asked Questions</h2>
          
          <div className="faq-grid">
            <div className="faq-item">
              <h3>What is an ATS?</h3>
              <p>ATS (Applicant Tracking System) is software used by companies to filter resumes before they reach human recruiters. It scans for keywords and formatting to determine if your resume is a good match.</p>
            </div>
            
            <div className="faq-item">
              <h3>Is JobMatch Pro free?</h3>
              <p>Yes! You can analyze unlimited resumes for free. We believe everyone deserves access to tools that help them get jobs.</p>
            </div>
            
            <div className="faq-item">
              <h3>What file formats are supported?</h3>
              <p>We support PDF, DOCX, DOC, and TXT files. For best results, use PDF or DOCX format.</p>
            </div>
            
            <div className="faq-item">
              <h3>Is my resume data secure?</h3>
              <p>Absolutely. We don't store your resume content. Files are analyzed in real-time and deleted immediately after processing.</p>
            </div>
            
            <div className="faq-item">
              <h3>How accurate is the ATS score?</h3>
              <p>Our scoring algorithm is based on real ATS systems used by major companies. The score reflects how likely your resume is to pass initial screening.</p>
            </div>
            
            <div className="faq-item">
              <h3>Do I need to create an account?</h3>
              <p>You can try the analyzer as a guest, but creating a free account lets you save your analysis history and access all features.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="section-container">
          <div className="cta-content">
            <h2>Ready to Land Your Dream Job?</h2>
            <p>Join thousands of job seekers who improved their resumes and got more interviews.</p>
            <Link to="/register" className="cta-button">
              <span>🎯</span> Start Free Analysis Now
            </Link>
            <span className="cta-note">No credit card required • 100% free</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <span className="brand-icon">🎯</span>
            <span className="brand-name">JobMatch<span className="brand-highlight">Pro</span></span>
            <p className="footer-tagline">Helping job seekers land their dream jobs with AI-powered resume optimization.</p>
          </div>
          
          <div className="footer-links-grid">
            <div className="footer-links-column">
              <h4>Product</h4>
              <Link to="/register">ATS Analyzer</Link>
              <Link to="/register">Resume Builder</Link>
              <Link to="/register">Job Search</Link>
            </div>
            
            <div className="footer-links-column">
              <h4>Company</h4>
              <Link to="/about">About Us</Link>
              <Link to="/contact">Contact</Link>
              <a href="#faq">FAQ</a>
            </div>
            
            <div className="footer-links-column">
              <h4>Legal</h4>
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms of Service</Link>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>© 2026 JobMatch Pro. All rights reserved. Made with ❤️ for job seekers.</p>
        </div>
      </footer>
    </div>
  );
}
