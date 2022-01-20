/**
 * createGetter - creates function getter which allows select value from object
 * @param {string} path - the strings path separated by dot
 * @returns {function} - function-getter which allow get value from object by set path
 */
export function createGetter(path) {
  const fun = (obj) => {
    let obj_new = {};

    const path2 = path.split('.');
    if (!obj.hasOwnProperty(path2[0])) return undefined;

    for (let p in path2) {
      if (Object.keys(obj_new).length == 0) {obj_new = obj[path2[p]];}
      else obj_new = obj_new[path2[p]];
    }

    return obj_new;
  }
  return fun;
}
