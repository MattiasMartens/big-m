import { defined } from "types/utils";

export function describeThis<T>(thing: T, testFn: (subject: T) => void) {
  const name = defined((thing as any)["name"], "Can't call describeThis on something anonymous");

  // @ts-ignore
  describe(name, () => testFn(thing));
}