import { useIntl } from '@edx/frontend-platform/i18n';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchExtractedTrainings } from '../../api/aiTraining/aiTrainingApi';
import { AI_TRAINING_REVIEW_PAGE_SIZE } from '../../api/endpoints';
import messages from '../../pages/uploadTrainingWithAi/messages';

export const extractedTrainingsQueryKey = (jobId, page, pageSize, search, filters) => [
  'aiTraining', 'extracted', jobId, page, pageSize, search ?? '', filters?.confidence ?? 'all', filters?.created ?? 'all',
];

/**
 * Paginated extracted trainings for review phase.
 */
const useExtractedTrainings = ({
  jobId,
  page = 1,
  pageSize = AI_TRAINING_REVIEW_PAGE_SIZE,
  search = '',
  filters = { confidence: 'all', created: 'all' },
  enabled = true,
} = {}) => {
  const { formatMessage } = useIntl();

  const query = useQuery({
    queryKey: extractedTrainingsQueryKey(jobId, page, pageSize, search, filters),
    enabled: Boolean(jobId) && enabled,
    placeholderData: keepPreviousData,
    refetchOnMount: 'always',
    queryFn: async () => {
      const result = await fetchExtractedTrainings({
        formatMessage,
        jobId,
        page,
        pageSize,
        search,
        filters,
      });
      if (!result.ok) {
        throw new Error(result.message || formatMessage(messages.toastLoadFailed));
      }
      return result.data;
    },
  });

  return {
    items: query.data?.items ?? [],
    summary: query.data?.summary ?? null,
    pageSize: query.data?.page_size ?? pageSize,
    totalPages: query.data?.total_pages ?? 1,
    total: query.data?.total ?? 0,
    matchingIds: query.data?.matching_ids ?? [],
    results: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    errorMessage: query.error?.message ?? formatMessage(messages.toastLoadFailed),
    refetch: query.refetch,
  };
};

export default useExtractedTrainings;
