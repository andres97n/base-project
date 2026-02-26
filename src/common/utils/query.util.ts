import { FlattenMaps } from "mongoose";


type LeanWithMongoId<T> = FlattenMaps<T> & { _id?: any };

export const getVirtualIdFromQuery = <T>(
  result: FlattenMaps<T>,
): FlattenMaps<T> => {
  const { _id, ...rest } = result as LeanWithMongoId<T>;
  if (!_id) return result;

  return {
    ...rest,
    _id,
    id: _id?.toString(),
  } as FlattenMaps<T>;
};