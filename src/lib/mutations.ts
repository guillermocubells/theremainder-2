import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

interface BaseOptions<TOutput, TInput> {
  queryKeys?: string[][];
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (data: TOutput, variables: TInput) => void;
  onError?: (error: Error, variables: TInput) => void;
}

interface CrudOptions<TOutput, TInput> extends BaseOptions<TOutput, TInput> {
  /** Column projection passed to `.select()`. Defaults to `'*'`. */
  select?: string;
}

interface UpdateOptions<TOutput, TInput> extends CrudOptions<TOutput, TInput> {
  /** Column used to match the row. Defaults to `'id'`. */
  idField?: string;
}

interface EdgeOptions<TOutput, TInput> extends BaseOptions<TOutput, TInput> {
  /** HTTP method forwarded to `supabase.functions.invoke`. */
  method?: 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function invalidateAll(
  queryClient: ReturnType<typeof useQueryClient>,
  keys?: string[][],
) {
  keys?.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
}

function buildCallbacks<TOutput, TInput>(
  queryClient: ReturnType<typeof useQueryClient>,
  opts: BaseOptions<TOutput, TInput>,
) {
  return {
    onSuccess: (data: TOutput, variables: TInput) => {
      invalidateAll(queryClient, opts.queryKeys);
      if (opts.successMessage) toast.success(opts.successMessage);
      opts.onSuccess?.(data, variables);
    },
    onError: (error: Error, variables: TInput) => {
      if (opts.errorMessage) toast.error(opts.errorMessage);
      else if (error.message) toast.error(error.message);
      opts.onError?.(error, variables);
    },
  };
}

// ---------------------------------------------------------------------------
// 1. INSERT
// ---------------------------------------------------------------------------

/**
 * Inserts a row into `table`, returns the created record via `.select().single()`.
 *
 * ```ts
 * const create = useInsertMutation<CreateInput, Plant>('owned_plants', {
 *   queryKeys: [['owned-plants']],
 *   successMessage: 'Plant created',
 * });
 * ```
 */
export function useInsertMutation<
  TInput extends Record<string, unknown>,
  TOutput = TInput,
>(table: string, opts: CrudOptions<TOutput, TInput> = {}) {
  const queryClient = useQueryClient();
  const selectCols = opts.select ?? '*';

  return useMutation<TOutput, Error, TInput>({
    mutationFn: async (input) => {
      const { data, error } = await supabase
        .from(table as any)
        .insert(input as any)
        .select(selectCols)
        .single();
      if (error) throw error;
      return data as unknown as TOutput;
    },
    ...buildCallbacks(queryClient, opts),
  });
}

// ---------------------------------------------------------------------------
// 2. UPDATE
// ---------------------------------------------------------------------------

/**
 * Updates a row by its id (or a custom `idField`), returns the updated record.
 *
 * The mutation input **must** include the id field.
 *
 * ```ts
 * const update = useUpdateMutation<UpdateInput & { id: string }, Plant>('owned_plants', {
 *   queryKeys: [['owned-plants']],
 * });
 * update.mutate({ id: '...', nickname: 'New name' });
 * ```
 */
export function useUpdateMutation<
  TInput extends Record<string, unknown>,
  TOutput = TInput,
>(table: string, opts: UpdateOptions<TOutput, TInput> = {}) {
  const queryClient = useQueryClient();
  const idField = opts.idField ?? 'id';
  const selectCols = opts.select ?? '*';

  return useMutation<TOutput, Error, TInput>({
    mutationFn: async (input) => {
      const { [idField]: idValue, ...updates } = input;
      if (!idValue) throw new Error(`Missing "${idField}" in mutation input`);

      const { data, error } = await supabase
        .from(table as any)
        .update(updates as any)
        .eq(idField, idValue as any)
        .select(selectCols)
        .single();
      if (error) throw error;
      return data as unknown as TOutput;
    },
    ...buildCallbacks(queryClient, opts),
  });
}

// ---------------------------------------------------------------------------
// 3. DELETE
// ---------------------------------------------------------------------------

/**
 * Deletes a row by its id (passed as the mutation variable).
 *
 * ```ts
 * const remove = useDeleteMutation('owned_plants', {
 *   queryKeys: [['owned-plants']],
 *   successMessage: 'Plant removed',
 * });
 * remove.mutate('some-uuid');
 * ```
 */
export function useDeleteMutation(
  table: string,
  opts: BaseOptions<void, string> & { idField?: string } = {},
) {
  const queryClient = useQueryClient();
  const idField = opts.idField ?? 'id';

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from(table as any)
        .delete()
        .eq(idField, id as any);
      if (error) throw error;
    },
    ...buildCallbacks(queryClient, opts),
  });
}

// ---------------------------------------------------------------------------
// 4. Edge Function
// ---------------------------------------------------------------------------

/**
 * Invokes a Supabase Edge Function.
 *
 * ```ts
 * const invoke = useEdgeMutation<{ action: string }, ResponseData>('auction-deposit', {
 *   method: 'POST',
 *   queryKeys: [['auctions']],
 * });
 * ```
 */
export function useEdgeMutation<
  TInput = unknown,
  TOutput = unknown,
>(functionName: string, opts: EdgeOptions<TOutput, TInput> = {}) {
  const queryClient = useQueryClient();

  return useMutation<TOutput, Error, TInput>({
    mutationFn: async (input) => {
      const { data, error } = await supabase.functions.invoke(functionName, {
        method: opts.method,
        body: input as any,
      });
      if (error) throw error;
      return data as TOutput;
    },
    ...buildCallbacks(queryClient, opts),
  });
}

// ---------------------------------------------------------------------------
// 5. RPC
// ---------------------------------------------------------------------------

/**
 * Calls a Supabase RPC (database function).
 *
 * ```ts
 * const bid = useRpcMutation<{ p_auction_id: string; p_amount: number }, BidResult>('place_bid', {
 *   queryKeys: [['auction-live'], ['auction-bids']],
 *   successMessage: 'Bid placed!',
 * });
 * ```
 */
export function useRpcMutation<
  TInput extends Record<string, unknown> = Record<string, unknown>,
  TOutput = unknown,
>(rpcName: string, opts: BaseOptions<TOutput, TInput> = {}) {
  const queryClient = useQueryClient();

  return useMutation<TOutput, Error, TInput>({
    mutationFn: async (input) => {
      const { data, error } = await supabase.rpc(rpcName as any, input as any);
      if (error) throw error;
      return data as unknown as TOutput;
    },
    ...buildCallbacks(queryClient, opts),
  });
}
