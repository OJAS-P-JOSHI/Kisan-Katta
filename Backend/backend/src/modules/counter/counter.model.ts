import { Schema, model } from "mongoose";

/**
 * Atomic sequence counters. One document per named sequence.
 *
 * Example document:
 *   { _id: "gram_sahakari_application", sequence: 124 }
 *
 * The `_id` is a human-readable string key (the sequence name), NOT an ObjectId.
 */
interface ICounter {
  _id: string;
  sequence: number;
}

const CounterSchema = new Schema<ICounter>(
  {
    _id: { type: String, required: true },
    sequence: { type: Number, required: true, default: 0 },
  },
  {
    collection: "counters",
    versionKey: false,
  }
);

export type { ICounter };
export const Counter = model<ICounter>("Counter", CounterSchema);
