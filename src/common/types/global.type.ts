import { FlattenMaps, Types } from "mongoose";


export type LeanDoc<T> = FlattenMaps<T> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};