// eslint-disable-next-line import/prefer-default-export
export const htmlDecode = (input: string): string =>
  new DOMParser().parseFromString(input, 'text/html').body.textContent;
