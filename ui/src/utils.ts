export const deepCopy = (obj: any) => JSON.parse(JSON.stringify(obj));

type Item = { [key: string]: number | undefined | null };

export function getAveragePropertyValue<T extends Item>(array: T[], property: keyof T): number | null {
  // Filter out items where the property is undefined or null
  const validValues = array
    .map((item) => item[property])
    .filter((value) => value !== undefined && value !== null) as number[];

  // If no valid values, return null
  if (validValues.length === 0) {
    return null;
  }

  // Calculate and return the average
  const sum = validValues.reduce((acc, value) => acc + value, 0);
  return sum / validValues.length;
}
