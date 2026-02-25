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
  if (!timeoutMs || timeoutMs <= 0 || timeoutMs === Infinity)
    throw new Error(
      `Invalid timeoutMs: ${timeoutMs}. Non-positive or Infinity values are not allowed.`
    );
  const signals = [AbortSignal.timeout(timeoutMs)];
  if (signal) signals.push(signal);
  return AbortSignal.any(signals);
}
