/**
 * Converts an enum object to an array of its values.
 * @param {Object} enumObject - The enum object to convert.
 * @param {boolean} [includeKeys=false] - Whether to include the enum keys in the result.
 * @returns {Array} An array of enum values (and optionally keys).
 */
export function enumToArray(enumObject, includeKeys = false) {
    // Get an array of the enum's property names (keys)
    const keys = Object.keys(enumObject);
    
    // Filter out any reverse mappings that TypeScript adds for numeric enums
    const filteredKeys = keys.filter(key => isNaN(Number(key)));
    
    // Map the filtered keys to their corresponding values
    const values = filteredKeys.map(key => enumObject[key]);
    
    // If includeKeys is true, return an array of objects with both key and value
    if (includeKeys) {
      return filteredKeys.map(key => ({ key, value: enumObject[key] }));
    }
    
    // Otherwise, just return the array of values
    return values;
  }