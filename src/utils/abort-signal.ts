/**
 * turn timeoutMs to AbortSignal then combine with other AbortSignals
 *
 * @param param0 - An object containing the signals and timeoutMs.
 * @returns A combined AbortSignal or undefined if no signals are provided.
 */
export function combineSignals({
  signal,
  timeoutMs,
}: {
  signal?: AbortSignal | undefined;
  timeoutMs: number;
}) {
  if (!timeoutMs || timeoutMs <= 0)
    throw new Error(
      `Invalid timeoutMs: ${timeoutMs}. Please use Infinity or a positive number.`
    );
  const signals = [];
  if (signal) signals.push(signal);
  if (timeoutMs !== Infinity) {
    signals.push(AbortSignal.timeout(timeoutMs));
  }
  return signals.length > 0 ? AbortSignal.any(signals) : undefined;
}
