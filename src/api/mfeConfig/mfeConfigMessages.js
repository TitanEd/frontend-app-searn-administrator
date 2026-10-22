import { defineMessages } from '@edx/frontend-platform/i18n';

const mfeConfigMessages = defineMessages({
  loadError: {
    id: 'app.mfeConfig.api.loadError',
    defaultMessage: 'Unable to load MFE configuration. Please try again.',
    description: 'Fallback when the MFE config API request fails',
  },
});

export default mfeConfigMessages;
