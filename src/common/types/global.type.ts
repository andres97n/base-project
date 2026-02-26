import { FlattenMaps, Types } from "mongoose";


export type LocalFlattlenMaps<T> = FlattenMaps<T> & {
  _id: Types.ObjectId;
  id?: string;
  createdAt: Date;
  updatedAt: Date;
};