import { toast } from 'react-toastify';

const containerId = 'app';

const cogoToast = {
  success: (message) => toast.success(message, { containerId }),
  error: (message) => toast.error(message, { containerId }),
  warn: (message) => toast.warning(message, { containerId }),
  info: (message) => toast.info(message, { containerId }),
};

export default cogoToast;
