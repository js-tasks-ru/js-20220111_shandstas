/**
 * omit - creates an object composed of enumerable property fields
 * @param {object} obj - the source object
 * @param {...string} fields - the properties paths to omit
 * @returns {object} - returns the new object
 */
export const omit = (obj, ...fields) => {
  const obj_new = {};

  for (const [key, value] of Object.entries(obj)) {
    if (!fields.includes(key)) {
      obj_new[key] = value;
    }
  }

  return obj_new;
};
