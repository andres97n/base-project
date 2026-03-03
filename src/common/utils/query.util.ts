import { FlattenMaps, ObjectId } from 'mongoose';


type LeanWithMongoId<T> = FlattenMaps<T> & { _id?: ObjectId };

export const getResultWithVirtualId = <T>(
  result: LeanWithMongoId<T>,
): FlattenMaps<T> & { id?: string } => {
  const { _id, ...rest } = result;

  if (!_id) return result;

  const id = String(_id);

  return {
    id,
    ...rest,
  } as FlattenMaps<T> & { id: string };
};