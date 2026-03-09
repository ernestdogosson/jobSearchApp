import pino from "pino";

const logger = pino({
  transport: {
    target: "pino-pretty",
  },
});

interface Employer {
  name: string;
}

interface WorkplaceAddress {
  municipality: string;
}

interface Job {
  headline: string;
  publication_date: string;
  employer: Employer;
  workplace_address: WorkplaceAddress;
}

interface JobSearchResponse {
  hits: Job[];
}

const searchJobs = async (keyword: string): Promise<void> => {
  try {
    const url = `https://jobsearch.api.jobtechdev.se/search?q=${encodeURIComponent(
      keyword,
    )}&offset=0&limit=10`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data: JobSearchResponse = await response.json();

    logger.info(`Found ${data.hits.length} jobs for "${keyword}"`);

    // Show nested structure clearly
    console.dir(data.hits, { depth: 2 });

    data.hits.forEach((job, index) => {
      const pubDate = new Date(job.publication_date);

      logger.info(
        {
          index: index + 1,
          company: job.employer?.name ?? "Unknown",
          location: job.workplace_address?.municipality ?? "Unknown",
          published: pubDate.toISOString().split("T")[0],
        },
        job.headline,
      );
    });
  } catch (error) {
    logger.error("Something went wrong while fetching jobs:");
    console.dir(error, { depth: null });
  }
};

// Usage:
//   node dist/index.js "Software Developer" --city "Malmö"
//   node dist/index.js "Software Developer" --region "Skåne"
//   node dist/index.js "Software Developer" --city "Malmö" --region "Skåne"
const args = process.argv.slice(2);
const profession = args[0];

const cityFlag = args.indexOf("--city");
const regionFlag = args.indexOf("--region");

const city = cityFlag !== -1 ? args[cityFlag + 1] : undefined;
const region = regionFlag !== -1 ? args[regionFlag + 1] : undefined;

if (!profession || (!city && !region)) {
  logger.error("Usage: node dist/index.js <profession> --city <city>");
  logger.error("       node dist/index.js <profession> --region <region>");
  process.exit(1);
}

if (city && region) {
  logger.error("Use either --city or --region, not both.");
  process.exit(1);
}

const location = city ?? region;
searchJobs(`${profession} in ${location}`);
