import { supabase } from './index';
import { PostgrestError } from '@supabase/supabase-js';

export type SupabaseResponse<T> = {
  data: T | null;
  error: PostgrestError | null;
};

export const fetchOne = async <T>(
  table: string,
  column: string,
  value: string | number
): Promise<SupabaseResponse<T>> => {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq(column, value)
    .single();

  return { data, error };
};

export const fetchMany = async <T>(
  table: string,
  column?: string,
  value?: string | number,
  options?: {
    limit?: number;
    orderBy?: { column: string; ascending: boolean };
    filters?: Array<{ column: string; operator: string; value: any }>;
  }
): Promise<SupabaseResponse<T[]>> => {
  let query = supabase.from(table).select('*');

  if (column && value !== undefined) {
    query = query.eq(column, value);
  }

  if (options?.filters) {
    options.filters.forEach(filter => {
      switch (filter.operator) {
        case 'eq':
          query = query.eq(filter.column, filter.value);
          break;
        case 'neq':
          query = query.neq(filter.column, filter.value);
          break;
        case 'gt':
          query = query.gt(filter.column, filter.value);
          break;
        case 'lt':
          query = query.lt(filter.column, filter.value);
          break;
        case 'gte':
          query = query.gte(filter.column, filter.value);
          break;
        case 'lte':
          query = query.lte(filter.column, filter.value);
          break;
        case 'like':
          query = query.like(filter.column, filter.value);
          break;
        case 'ilike':
          query = query.ilike(filter.column, filter.value);
          break;
        case 'in':
          query = query.in(filter.column, filter.value);
          break;
        case 'contains':
          query = query.contains(filter.column, filter.value);
          break;
        default:
          break;
      }
    });
  }

  if (options?.orderBy) {
    query = query.order(options.orderBy.column, {
      ascending: options.orderBy.ascending,
    });
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  return { data, error };
};

export const insert = async <T>(
  table: string,
  data: Partial<T> | Partial<T>[]
): Promise<SupabaseResponse<T>> => {
  const { data: result, error } = await supabase
    .from(table)
    .insert(data)
    .select();

  return { data: result as T, error };
};

export const update = async <T>(
  table: string,
  column: string,
  value: string | number,
  data: Partial<T>
): Promise<SupabaseResponse<T>> => {
  const { data: result, error } = await supabase
    .from(table)
    .update(data)
    .eq(column, value)
    .select();

  return { data: result as T, error };
};

export const remove = async (
  table: string,
  column: string,
  value: string | number
): Promise<SupabaseResponse<null>> => {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq(column, value);

  return { data: null, error };
};

export const rpc = async <T>(
  functionName: string,
  params?: Record<string, any>
): Promise<SupabaseResponse<T>> => {
  const { data, error } = await supabase.rpc(functionName, params);

  return { data, error };
};