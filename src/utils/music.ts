/** Uniform random selection, excluding the currently displayed line. */
export function randomMusicIndex(
  length: number,
  current = -1,
  random = Math.random,
) {
  if (!Number.isInteger(length) || length < 1)
    throw new RangeError("歌词列表不能为空");
  if (length === 1) return 0;
  if (current < 0 || current >= length) return Math.floor(random() * length);
  const candidate = Math.floor(random() * (length - 1));
  return candidate >= current ? candidate + 1 : candidate;
}
