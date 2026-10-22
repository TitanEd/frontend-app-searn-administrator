import { useIntl } from '@edx/frontend-platform/i18n';
import { useQuery } from '@tanstack/react-query';
import {
  fetchAiTrainingConfidenceOptions,
  fetchAiTrainingStatusOptions,
} from '../../api/aiTraining/aiTrainingApi';
import messages from '../../pages/uploadTrainingWithAi/messages';

export const aiTrainingFilterOptionsQueryKey = ['aiTraining', 'filter-options'];

/**
 * Confidence and status filter options for the AI review toolbar.
 */
const useAiTrainingFilterOptions = ({ enabled = true } = {}) => {
  const { formatMessage } = useIntl();

  const confidenceQuery = useQuery({
    queryKey: [...aiTrainingFilterOptionsQueryKey, 'confidence'],
    enabled,
    queryFn: async () => {
      const result = await fetchAiTrainingConfidenceOptions({ formatMessage });
      if (!result.ok) {
        throw new Error(result.message || formatMessage(messages.toastLoadFailed));
      }
      return result.data ?? [];
    },
  });

  const statusQuery = useQuery({
    queryKey: [...aiTrainingFilterOptionsQueryKey, 'status'],
    enabled,
    queryFn: async () => {
      const result = await fetchAiTrainingStatusOptions({ formatMessage });
      if (!result.ok) {
        throw new Error(result.message || formatMessage(messages.toastLoadFailed));
      }
      return result.data ?? [];
    },
  });

  return {
    confidenceOptions: confidenceQuery.data ?? [],
    statusOptions: statusQuery.data ?? [],
    isLoading: confidenceQuery.isLoading || statusQuery.isLoading,
    isError: confidenceQuery.isError || statusQuery.isError,
  };
};

export default useAiTrainingFilterOptions;
