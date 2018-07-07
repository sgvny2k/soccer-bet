import { Mongo } from "meteor/mongo";
import { Schemas, Collections } from "../declarations";
import SimpleSchema from 'simpl-schema';

Schemas.Odd = new SimpleSchema({
  _id: {
    type: String
  },
  name: {
    type: String
  },
  value: {
    type: Number
  },
  win: {
    type: Boolean,
    optional: true
  }
});
