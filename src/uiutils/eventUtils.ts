export const ignoreEvent = (event) => {
  event.preventDefault();
  event.stopPropagation();
};
