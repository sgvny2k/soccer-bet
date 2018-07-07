import { Mongo } from "meteor/mongo";
import { Roles } from "meteor/alanning:roles";
import { Template } from "meteor/templating";
import { Schemas, Collections } from '../declarations';
import SimpleSchema from 'simpl-schema';
// make sure Market schema is defined
import "./markets";

Schemas.Match = new SimpleSchema({
  name: {
    type: String
  },
  time: {
    type: Date
  },
  result: {
    type: String,
    optional: true
  },
  markets: {
    type: Array,
    optional: true
  },
  'markets.$': Schemas.Market
});

let Matches = Collections.Matches = new Mongo.Collection("matches");
Matches.attachSchema(Schemas.Match);
