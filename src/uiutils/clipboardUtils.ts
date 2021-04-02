/* eslint-disable import/prefer-default-export */

/**
 * https://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript
 */
export const copyTextToClipboard = (text: string) => {
  return navigator.clipboard
    .writeText(text)
    .then(() => true)
    .catch(() => false);
};
