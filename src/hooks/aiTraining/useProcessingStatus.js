import { useIntl } from '@edx/frontend-platform/i18n';
import { useQuery } from '@tanstack/react-query';
import { fetchProcessingStatus } from '../../api/aiTraining/aiTrainingApi';
import aiTrainingMessages from '../../api/aiTraining/aiTrainingMessages';

export const processingStatusQueryKey = (jobId) => ['aiTraining', 'status', jobId];

/**
 * Poll processing status while phase is processing.
 * @param {{ jobId: string|null, enabled?: boolean, refetchInterval?: number|false }} opts
 */
const useProcessingStatus = ({
  jobId,
  enabled = true,
  refetchInterval = 2500,
} = {}) => {
  const { formatMessage } = useIntl();

  const query = useQuery({
    queryKey: processingStatusQueryKey(jobId),
    enabled: Boolean(jobId) && enabled,
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      if (status === 'completed' || status === 'failed') {
        return false;
      }
      return refetchInterval;
    },
    queryFn: async () => {
      const result = await fetchProcessingStatus({ formatMessage, jobId });
      if (!result.ok) {
        throw new Error(result.message || formatMessage(aiTrainingMessages.statusLoadError));
      }
      return result.data;
    },
  });

  return {
    status: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    errorMessage: query.error?.message ?? formatMessage(aiTrainingMessages.statusLoadError),
    refetch: query.refetch,
  };
};

export default useProcessingStatus;
