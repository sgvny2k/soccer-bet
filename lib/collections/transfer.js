import { Schemas, Collections } from "../declarations";
import { Mongo } from "meteor/mongo";
import SimpleSchema from 'simpl-schema';

Schemas.Transfer = new SimpleSchema({
  from: {
    type: String
  },
  to: {
    type: String
  },
  amount: {
    type: Number
  },
  when: {
    type: Date
  },
});

let Transfers = Collections.Transfers = new Mongo.Collection("transfers");
Transfers.attachSchema(Schemas.Transfer);
