export function getPaginationParams(page: number = 1, limit: number = 10) {
  const take = limit;
  const skip = (page - 1) * limit;
  return { take, skip };
}
