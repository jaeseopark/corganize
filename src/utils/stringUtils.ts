// eslint-disable-next-line import/prefer-default-export
export const htmlDecode = (input: string): string => {
  return new DOMParser().parseFromString(input, 'text/html').body.textContent;
};
