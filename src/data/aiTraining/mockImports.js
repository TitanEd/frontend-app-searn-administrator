/** Re-export AI upload mocks. Source files live in src/mock/uploadTrainingWithAi/. */
import changeHistory from '../../mock/uploadTrainingWithAi/changeHistory.json';
import extractedTrainings from '../../mock/uploadTrainingWithAi/extractedTrainings.json';
import importHistory from '../../mock/uploadTrainingWithAi/importHistory.json';
import uploadedTrainingContent from '../../mock/uploadTrainingWithAi/uploadedTrainingContent.json';
import { buildReviewExtracted } from '../../mock/uploadTrainingWithAi/buildReviewExtracted';

const asResults = (payload) => (Array.isArray(payload) ? payload : (payload?.results ?? []));

const asJobMap = (payload) => Object.fromEntries(
  Object.entries(payload || {}).map(([jobId, value]) => [jobId, asResults(value)]),
);

const reviewCatalogue = buildReviewExtracted('job_mvbu3hso', 50);
const reviewTemplate = buildReviewExtracted('job_seed_template', 50);

export const MOCK_IMPORTS = asResults(importHistory);
export const MOCK_EXTRACTED = {
  ...asJobMap(extractedTrainings),
  job_mvbu3hso: reviewCatalogue,
  job_seed_template: reviewTemplate,
  job_seed_2026: buildReviewExtracted('job_seed_2026', 50),
  job_uploaded_content: asResults(uploadedTrainingContent),
};
export const MOCK_CHANGE_HISTORY = asJobMap(changeHistory);

export default MOCK_IMPORTS;
