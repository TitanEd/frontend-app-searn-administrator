import { defineMessages } from '@edx/frontend-platform/i18n';

const aiTrainingMessages = defineMessages({
  historyLoadError: {
    id: 'app.aiTraining.api.historyLoadError',
    defaultMessage: 'Unable to load import history. Please try again.',
    description: 'Fallback when import history request fails',
  },
  uploadError: {
    id: 'app.aiTraining.api.uploadError',
    defaultMessage: 'Document could not be uploaded. Please try again.',
    description: 'Fallback when upload fails',
  },
  statusLoadError: {
    id: 'app.aiTraining.api.statusLoadError',
    defaultMessage: 'Unable to load processing status.',
    description: 'Fallback when processing status fails',
  },
  resultsLoadError: {
    id: 'app.aiTraining.api.resultsLoadError',
    defaultMessage: 'Unable to load extracted trainings.',
    description: 'Fallback when extracted trainings fail',
  },
  updateError: {
    id: 'app.aiTraining.api.updateError',
    defaultMessage: 'Unable to save training changes.',
    description: 'Fallback when update/mappings fail',
  },
  createError: {
    id: 'app.aiTraining.api.createError',
    defaultMessage: 'Unable to create trainings.',
    description: 'Fallback when create job fails',
  },
  unsupportedFile: {
    id: 'app.aiTraining.api.unsupportedFile',
    defaultMessage: 'Unsupported file type. Use PDF, DOCX, XLSX, CSV or TXT.',
    description: 'Validation when file type is not allowed',
  },
  jobNotFound: {
    id: 'app.aiTraining.api.jobNotFound',
    defaultMessage: 'Import job not found.',
    description: 'When job id is unknown',
  },
});

export default aiTrainingMessages;
