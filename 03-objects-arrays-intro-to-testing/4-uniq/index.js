/**
 * uniq - returns array of uniq values:
 * @param {*[]} arr - the array of primitive values
 * @returns {*[]} - the new array with uniq values
 */
export function uniq(arr) {
  if (arr === undefined) return [];

  if (arr.length > 0) {
    return arr.reduce((unique, item) => unique.includes(item) ? unique : [...unique, item], []);
  } else return [];
}
