import { toast } from 'sonner';

const cogoToast = {
  success: (message) => toast.success(message),
  error: (message) => toast.error(message),
  warn: (message) => toast.warning(message),
  info: (message) => toast.info(message),
};

export default cogoToast;
