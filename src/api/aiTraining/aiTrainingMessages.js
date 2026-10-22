import { defineMessages } from '@edx/frontend-platform/i18n';

const aiTrainingMessages = defineMessages({
  historyLoadError: {
    id: 'app.aiTraining.api.historyLoadError',
    defaultMessage: 'Unable to load import history. Please try again.',
    description: 'Fallback when import history request fails',
  },
  importDetailLoadError: {
    id: 'app.aiTraining.api.importDetailLoadError',
    defaultMessage: 'Unable to load this import. Please try again.',
    description: 'Fallback when a single import detail request fails',
  },
  changeHistoryLoadError: {
    id: 'app.aiTraining.api.changeHistoryLoadError',
    defaultMessage: 'Unable to load change history. Please try again.',
    description: 'Fallback when change history request fails',
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
  confidenceOptionsLoadError: {
    id: 'app.aiTraining.api.confidenceOptionsLoadError',
    defaultMessage: 'Unable to load confidence filter options.',
    description: 'Fallback when confidence filter options fail',
  },
  statusOptionsLoadError: {
    id: 'app.aiTraining.api.statusOptionsLoadError',
    defaultMessage: 'Unable to load status filter options.',
    description: 'Fallback when status filter options fail',
  },
  updateError: {
    id: 'app.aiTraining.api.updateError',
    defaultMessage: 'Unable to save training changes.',
    description: 'Fallback when extracted training update fails',
  },
  mappingsUpdateError: {
    id: 'app.aiTraining.api.mappingsUpdateError',
    defaultMessage: 'Unable to update competency or activity mappings.',
    description: 'Fallback when mapping patch fails',
  },
  reanalyzeError: {
    id: 'app.aiTraining.api.reanalyzeError',
    defaultMessage: 'Unable to re-analyse this training.',
    description: 'Fallback when reanalyze request fails',
  },
  revertError: {
    id: 'app.aiTraining.api.revertError',
    defaultMessage: 'Unable to revert this change.',
    description: 'Fallback when history revert fails',
  },
  createError: {
    id: 'app.aiTraining.api.createError',
    defaultMessage: 'Unable to create trainings.',
    description: 'Fallback when create job fails',
  },
  createStatusLoadError: {
    id: 'app.aiTraining.api.createStatusLoadError',
    defaultMessage: 'Unable to load training create progress.',
    description: 'Fallback when create-job status polling fails',
  },
  unsupportedFile: {
    id: 'app.aiTraining.api.unsupportedFile',
    defaultMessage: 'Unsupported file type. Use PDF, DOCX, XLSX, CSV or TXT.',
    description: 'Validation when file type is not allowed',
  },
  invalidSourceUrl: {
    id: 'app.aiTraining.api.invalidSourceUrl',
    defaultMessage: 'Enter a valid http or https URL.',
    description: 'Validation when the shared document URL is invalid',
  },
  jobNotFound: {
    id: 'app.aiTraining.api.jobNotFound',
    defaultMessage: 'Import job not found.',
    description: 'When job id is unknown',
  },
});

export default aiTrainingMessages;
