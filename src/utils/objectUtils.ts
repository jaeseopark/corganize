/* eslint-disable import/prefer-default-export */

const deepEquals = (o1, o2): boolean => {
  if (o1 === o2) return true;
  if (typeof o1 !== typeof o2) return false;
  if (typeof o1 === 'object' && o1 && o2) {
    const allUniqueKeys = [...new Set(Object.keys(o1).concat(Object.keys(o2)))];
    const allEqual: boolean = allUniqueKeys.reduce(
      (acc, key) => acc && deepEquals(o1[key], o2[key]),
      true
    );
    return allEqual;
  }
  return false;
};

export const hasAtLeast1Change = (base, delta) => {
  const base1Alt = {};
  Object.keys(delta).forEach((key) => {
    base1Alt[key] = base.hasOwnProperty(key) ? base[key] : null;
  });

  return !deepEquals(base1Alt, delta);
};
