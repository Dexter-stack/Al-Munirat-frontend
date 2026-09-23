import type { ReactNode } from "react";
import { LoadingState } from "@/components/states/LoadingState";
import { ErrorState } from "@/components/states/ErrorState";
import { EmptyState } from "@/components/states/EmptyState";

interface QueryStateProps<T> {
  isLoading: boolean;
  error: unknown;
  data: T | undefined;
  onRetry?: () => void;
  isEmpty?: (data: T) => boolean;
  emptyProps?: Parameters<typeof EmptyState>[0];
  loadingLabel?: string;
  children: (data: T) => ReactNode;
}

/**
 * Collapses the loading / error / empty / data branches every API-driven
 * page needs (per the frontend spec's "never leave a blank screen" rule)
 * into one component instead of repeating the same four-way check.
 */
export function QueryState<T>({
  isLoading,
  error,
  data,
  onRetry,
  isEmpty,
  emptyProps,
  loadingLabel,
  children,
}: QueryStateProps<T>) {
  if (isLoading) return <LoadingState label={loadingLabel} />;
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (data === undefined) return <ErrorState onRetry={onRetry} />;
  if (isEmpty?.(data)) return <EmptyState {...emptyProps} />;
  return <>{children(data)}</>;
}
