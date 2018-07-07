import { Mongo } from "meteor/mongo";
import { Schemas, Collections } from "../declarations";
import SimpleSchema from 'simpl-schema';

// make sure Odd schema has been defined
import "./odds"

Schemas.Market = new SimpleSchema({
  name: {
    type: String
  },
  odds: {
    type: Array,
    optional: true
  },
  'odds.$': Schemas.Odd
});
