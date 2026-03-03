import { FlattenMaps, ObjectId } from 'mongoose';


type LeanWithMongoId<T> = FlattenMaps<T> & { _id?: ObjectId };

export const getResultWithVirtualId = <T>(
  result: LeanWithMongoId<T>,
): LeanWithMongoId<T> => {
  const { _id, ...rest } = result;

  if (!_id) return result;

  const id = String(_id);

  return {
    id,
    ...rest,
  } as LeanWithMongoId<T>;
};