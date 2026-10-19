import { useIntl } from '@edx/frontend-platform/i18n';
import { useQuery } from '@tanstack/react-query';
import { fetchChangeHistory } from '../../api/aiTraining/aiTrainingApi';
import messages from '../../pages/uploadTrainingWithAi/messages';

export const changeHistoryQueryKey = (jobId, trainingId) => [
  'aiTraining', 'history', jobId, trainingId,
];

const useChangeHistory = ({ jobId, trainingId, trainingName, enabled = true } = {}) => {
  const { formatMessage } = useIntl();

  const query = useQuery({
    queryKey: changeHistoryQueryKey(jobId, trainingId),
    enabled: Boolean(jobId) && Boolean(trainingId) && enabled,
    queryFn: async () => {
      const result = await fetchChangeHistory({ formatMessage, jobId });
      if (!result.ok) {
        throw new Error(result.message || formatMessage(messages.drawerHistoryEmpty));
      }
      const rows = Array.isArray(result.data) ? result.data : [];
      const wanted = String(trainingId ?? '');
      return rows.filter((entry) => {
        const entryId = String(entry.training_id ?? '');
        if (wanted && entryId && entryId === wanted) {
          return true;
        }
        // Legacy composite ids: job_<doc>_t<draft>
        if (wanted && entryId.endsWith(`_t${wanted}`)) {
          return true;
        }
        return !entry.training_id && entry.training_name === trainingName;
      });
    },
  });

  return {
    events: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
};

export default useChangeHistory;
