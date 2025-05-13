import { supabase } from './index';

export const uploadFile = async (
  bucket: string,
  path: string,
  file: File | Blob | ArrayBuffer | string,
  options?: {
    contentType?: string;
    upsert?: boolean;
    cacheControl?: string;
  }
) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType: options?.contentType,
      upsert: options?.upsert || false,
      cacheControl: options?.cacheControl || '3600',
    });

  if (error) {
    throw error;
  }

  return data;
};

export const getPublicUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

export const downloadFile = async (bucket: string, path: string) => {
  const { data, error } = await supabase.storage.from(bucket).download(path);

  if (error) {
    throw error;
  }

  return data;
};

export const listFiles = async (bucket: string, path?: string) => {
  const { data, error } = await supabase.storage.from(bucket).list(path || '');

  if (error) {
    throw error;
  }

  return data;
};

export const removeFile = async (bucket: string, paths: string[]) => {
  const { data, error } = await supabase.storage.from(bucket).remove(paths);

  if (error) {
    throw error;
  }

  return data;
};

export const storeMediaFromBase64 = async (
  base64String: string,
  storagePath: string,
): Promise<string> => {
  try {
    // Remove data URL prefix if present
    const base64Data = base64String.includes('base64,') 
      ? base64String.split('base64,')[1] 
      : base64String;
    
    // Determine bucket and path
    const [bucket, ...pathParts] = storagePath.split('/');
    const path = pathParts.join('/');
    
    // Upload the file
    await uploadFile(bucket, path, base64Data, {
      contentType: 'image/jpeg',
      upsert: true
    });
    
    // Get the public URL
    return getPublicUrl(bucket, path);
  } catch (error) {
    console.error('Error in storeMediaFromBase64:', error);
    throw error;
  }
};

export const uploadVideoToStorage = async (path: string, uri: string) => {
  try {
    // Determine bucket and path from the full path
    const [bucket, ...pathParts] = path.split('/');
    const filePath = pathParts.join('/');
    
    // Fetch the file as a blob
    const response = await fetch(uri);
    const blob = await response.blob();
    
    // Upload the file
    await uploadFile(bucket, filePath, blob, {
      contentType: 'video/mp4',
      upsert: true
    });
    
    // Return the public URL
    return getPublicUrl(bucket, filePath);
  } catch (error) {
    console.error('Error uploading video:', error);
    throw error;
  }
};