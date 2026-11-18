export const demoPreviewEnabled =
  process.env.NODE_ENV === 'development' &&
  process.env.NEXT_PUBLIC_DEMO_PREVIEW !== 'false';
