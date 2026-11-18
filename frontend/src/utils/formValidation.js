export function getFieldErrors(error, fieldAliases = {}) {
  const validationErrors = error?.response?.data?.errors;
  if (!validationErrors || typeof validationErrors !== 'object') return {};

  return Object.fromEntries(
    Object.entries(validationErrors).map(([field, messages]) => {
      const message = Array.isArray(messages) ? messages[0] : messages;
      return [fieldAliases[field] || field, String(message)];
    })
  );
}

export function getFormError(error, fallback = 'Please check the form and try again.') {
  const responseData = error?.response?.data;
  if (typeof responseData === 'string') return responseData;
  return responseData?.message || fallback;
}
