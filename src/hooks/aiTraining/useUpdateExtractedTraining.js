import { useIntl } from '@edx/frontend-platform/i18n';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  reanalyzeExtractedTraining,
  revertHistoryEvent,
  updateExtractedTraining,
  updateMappings,
} from '../../api/aiTraining/aiTrainingApi';

/**
 * Mutations for mapping toggles and full field edits.
 */
const useUpdateExtractedTraining = ({ jobId } = {}) => {
  const { formatMessage } = useIntl();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['aiTraining', 'extracted', jobId] });
    queryClient.invalidateQueries({ queryKey: ['aiTraining', 'history', jobId] });
  };

  const mappingsMutation = useMutation({
    mutationFn: async ({ trainingId, payload }) => {
      const result = await updateMappings({
        formatMessage,
        jobId,
        trainingId,
        payload,
      });
      if (!result.ok) {
        throw new Error(result.message);
      }
      return result;
    },
    onSuccess: invalidate,
  });

  const reanalyzeMutation = useMutation({
    mutationFn: async ({ trainingId }) => {
      const result = await reanalyzeExtractedTraining({ formatMessage, jobId, trainingId });
      if (!result.ok) throw new Error(result.message);
      return result;
    },
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ trainingId, payload }) => {
      const result = await updateExtractedTraining({
        formatMessage,
        jobId,
        trainingId,
        payload,
      });
      if (!result.ok) {
        throw new Error(result.message);
      }
      return result;
    },
    onSuccess: invalidate,
  });

  const revertMutation = useMutation({
    mutationFn: async ({ eventId }) => {
      const result = await revertHistoryEvent({ formatMessage, jobId, eventId });
      if (!result.ok) {
        throw new Error(result.message);
      }
      return result;
    },
    onSuccess: invalidate,
  });

  return {
    updateMappings: mappingsMutation.mutateAsync,
    updateTraining: updateMutation.mutateAsync,
    reanalyzeTraining: reanalyzeMutation.mutateAsync,
    revertHistory: revertMutation.mutateAsync,
    isUpdating: mappingsMutation.isPending || updateMutation.isPending || revertMutation.isPending,
  };
};

export default useUpdateExtractedTraining;
