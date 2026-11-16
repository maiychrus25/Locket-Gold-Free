import { userOperations } from "./operations/user.js";
import { momentOperations } from "./operations/moments.js";
import { friendOperations } from "./operations/friends.js";
import { chatOperations } from "./operations/chat.js";
import { systemOperations } from "./operations/system.js";
export const operations = [
  ...userOperations,
  ...momentOperations,
  ...friendOperations,
  ...chatOperations,
  ...systemOperations,
];
export const operationMap = new Map(
  operations.map((value) => [`${value.group}/${value.method}`, value]),
);
export const publicOperations = operations.map(
  ({ fields, object: _object, ...rest }) => ({
    ...rest,
    fields: fields.map(({ schema: _schema, ...field }) => field),
  }),
);
export { validateOperation } from "./operations/validation.js";
