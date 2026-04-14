/**
 * No-op fallback for @css-inline/css-inline.
 * Returns HTML unchanged when the native binary cannot load.
 */
module.exports.inline = function inline(html) {
  return html;
};
module.exports.inlineFragment = function inlineFragment(html) {
  return html;
};
module.exports.version = '0.0.0-fallback';
