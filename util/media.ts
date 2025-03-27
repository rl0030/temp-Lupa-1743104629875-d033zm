export function ensureBase64ImageString(base64String: string): string {
    const jpegPrefix = 'data:image/jpeg;base64,';
    const pngPrefix = 'data:image/png;base64,';
  
    if (base64String.startsWith(jpegPrefix) || base64String.startsWith(pngPrefix)) {
      return base64String;
    } else {
      // Assume it's a JPEG image if no prefix is present
      return jpegPrefix + base64String;
    }
  }