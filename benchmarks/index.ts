import * as fs from "fs";
import {join} from "path";
import {repeat, take, collect} from "../iterable";
import { pipe } from "fp-ts/lib/pipeable";

function chars (chars: string, num = 1) {
  return pipe(
    repeat(chars),
    x => take(x, num),
    collect,
    x => x.join("")
  );
}

fs.readdirSync(__dirname).forEach(flatFilename => {
  if (flatFilename !== "index.ts") {
    console.log(`${chars("=", 20)} ${flatFilename.split(".")[0]} ${chars("=", 20)}`)
    require(join(__dirname, flatFilename));
  }
});