import { useIntl } from '@edx/frontend-platform/i18n';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createTrainings,
  fetchCreateJobStatus,
} from '../../api/aiTraining/aiTrainingApi';

const sleep = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

/**
 * Create selected trainings and poll until complete.
 */
const useCreateTrainings = ({ jobId } = {}) => {
  const { formatMessage } = useIntl();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (trainingIds) => {
      const start = await createTrainings({ formatMessage, jobId, trainingIds });
      if (!start.ok) {
        throw new Error(start.message);
      }
      let job = start.data;
      let { message } = start;
      /* Sequential poll of create-job status; each request depends on the previous. */
      while (job.status === 'processing') {
        // eslint-disable-next-line no-await-in-loop
        await sleep(600);
        // eslint-disable-next-line no-await-in-loop
        const poll = await fetchCreateJobStatus({
          formatMessage,
          createJobId: job.create_job_id,
        });
        if (!poll.ok) {
          throw new Error(poll.message);
        }
        job = poll.data;
        if (poll.message) {
          message = poll.message;
        }
      }
      return { ok: true, data: job, message };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiTraining', 'extracted', jobId] });
      queryClient.invalidateQueries({ queryKey: ['aiTraining', 'importHistory'] });
    },
  });

  return {
    create: mutation.mutateAsync,
    isCreating: mutation.isPending,
    createResult: mutation.data ?? null,
    errorMessage: mutation.error?.message ?? null,
    reset: mutation.reset,
  };
};

export default useCreateTrainings;
