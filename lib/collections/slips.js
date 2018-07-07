import { Schemas, Collections } from "../declarations";
import { Mongo } from "meteor/mongo";
import SimpleSchema from 'simpl-schema';

Schemas.Slip = new SimpleSchema({
  playerId: {
    type: String
  },
  userId: {
    type: String
  },
  matchId: {
    type: String
  },
  matchTime: {
    type: Date
  },
  marketIdx: {
    type: Number
  },
  oddIdx: {
    type: Number
  },
  oddValue: {
    type: Number,
    optional: true
  },
  bet: {
    type: Number,
    optional: true,
    min: 5
  },
  won: {
    type: Number,
    optional: true
  }
});

let Slips = Collections.Slips = new Mongo.Collection("slips");
Slips.attachSchema(Schemas.Slip);
