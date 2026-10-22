import { useIntl } from '@edx/frontend-platform/i18n';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchImportHistory } from '../../api/aiTraining/aiTrainingApi';
import { AI_TRAINING_IMPORT_HISTORY_PAGE_SIZE } from '../../api/endpoints';
import messages from '../../pages/uploadTrainingWithAi/messages';

export const importHistoryQueryKey = ({ page } = {}) => ['aiTraining', 'importHistory', page];

/**
 * Uploaded documents history for Upload Training with AI landing page.
 */
const useImportHistory = ({ page = 1, enabled = true } = {}) => {
  const { formatMessage } = useIntl();

  const query = useQuery({
    queryKey: importHistoryQueryKey({ page }),
    enabled,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const result = await fetchImportHistory({
        formatMessage,
        page,
        pageSize: AI_TRAINING_IMPORT_HISTORY_PAGE_SIZE,
      });
      if (!result.ok) {
        throw new Error(result.message || formatMessage(messages.loadErrorFallback));
      }
      const data = result.data ?? {};
      return {
        items: Array.isArray(data.results) ? data.results : [],
        count: data.count ?? 0,
        page: data.page ?? page,
        pageSize: data.page_size ?? AI_TRAINING_IMPORT_HISTORY_PAGE_SIZE,
        totalPages: data.total_pages ?? 1,
      };
    },
  });

  return {
    rows: query.data?.items ?? [],
    count: query.data?.count ?? 0,
    currentPage: query.data?.page ?? page,
    pageSize: query.data?.pageSize ?? AI_TRAINING_IMPORT_HISTORY_PAGE_SIZE,
    totalPages: query.data?.totalPages ?? 1,
    isLoading: query.isLoading,
    isError: query.isError,
    errorMessage: query.error?.message ?? formatMessage(messages.loadErrorFallback),
    refetch: query.refetch,
  };
};

export default useImportHistory;
