import { Schemas, Collections } from "../declarations";
import { Mongo } from "meteor/mongo";
import SimpleSchema from 'simpl-schema';

Schemas.Parser = new SimpleSchema({
  text: {
    type: String
  }
});

let Parser = Collections.Parser = new Mongo.Collection("parser");
Parser.attachSchema(Schemas.Parser);
