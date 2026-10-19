import { useIntl } from '@edx/frontend-platform/i18n';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadTrainingDocument } from '../../api/aiTraining/aiTrainingApi';

/**
 * Upload document mutation. Returns job_id on success.
 */
const useUploadTrainingDocument = () => {
  const { formatMessage } = useIntl();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ file, fileName, sourceUrl, onProgress }) => {
      const result = await uploadTrainingDocument({
        formatMessage,
        file,
        fileName,
        sourceUrl,
        onProgress,
      });
      if (!result.ok) {
        throw new Error(result.message);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiTraining', 'importHistory'] });
    },
  });

  return {
    upload: mutation.mutateAsync,
    isUploading: mutation.isPending,
    errorMessage: mutation.error?.message ?? null,
    reset: mutation.reset,
  };
};

export default useUploadTrainingDocument;
