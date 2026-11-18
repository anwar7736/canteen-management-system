interface JQuery {
  select2(options?: Record<string, unknown> | string): JQuery;
}

declare module 'select2' {
  function initializeSelect2(root: Window, jquery: JQueryStatic): JQueryStatic;
  export default initializeSelect2;
}
