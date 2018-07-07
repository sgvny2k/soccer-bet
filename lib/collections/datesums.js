import { Mongo } from "meteor/mongo";
import { Schemas, Collections } from '../declarations';
import SimpleSchema from 'simpl-schema';

Schemas.DateSum = new SimpleSchema({
  playerId: {
    type: String
  },
  userId: {
    type: String
  },
  date: {
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

let DateSums = Collections.DateSums = new Mongo.Collection("datesums");
DateSums.attachSchema(Schemas.DateSum);
