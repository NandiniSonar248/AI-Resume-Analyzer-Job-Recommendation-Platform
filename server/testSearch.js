import { searchJobs } from "../../server/services/jobAggregator.js";

async function run() {
  console.log("Searching for 'React developer' in India...");
  try {
    const jobs = await searchJobs("React developer", "India", 1);
    console.log(`Found ${jobs.length} jobs.`);
    
    // Print top 3 to verify
    for (let i = 0; i < Math.min(3, jobs.length); i++) {
      const j = jobs[i];
      console.log(`\n[${i+1}] ${j.title} at ${j.company}`);
      console.log(`    Source: ${j.source} | Location: ${j.location}`);
      console.log(`    URL: ${j.url}`);
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
