import { Mongo } from "meteor/mongo";
import { Schemas, Collections } from '../declarations';
import SimpleSchema from 'simpl-schema';

Schemas.MatchSum = new SimpleSchema({
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
  win_sum: {
    type: Number
  },
  bet_sum: {
    type: Number
  },
  win_rate: {
    type: Number
  },
  win_point: {
    type: Number
  },
});

let MatchSums = Collections.MatchSums = new Mongo.Collection("matchsums");
MatchSums.attachSchema(Schemas.MatchSum);
