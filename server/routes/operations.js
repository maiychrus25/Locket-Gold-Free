import sdk from "locket.js";
import { z } from "zod";
import { operationMap, validateOperation } from "../../shared/operations.js";
import { deviceSummary, getLatestPage } from "../services/locket/client.js";
import { sendResult, fail } from "../session/context.js";

export function registerOperationsRoutes(app, { authenticated, limited, run }) {
  app.post(
    "/api/operations/:group/:method",
    authenticated,
    limited,
    async (req, res) => {
      const operation = operationMap.get(
        `${req.params.group}/${req.params.method}`,
      );
      if (!operation)
        return res.status(404).json({ error: "Chức năng không được hỗ trợ." });
      if (operation.media || operation.stream)
        return res.status(400).json({
          error:
            "Dùng màn hình tải tệp hoặc kết nối trực tiếp cho chức năng này.",
        });
      let values;
      try {
        values = validateOperation(operation, req.body);
        if (operation.group === "moments" && operation.method === "getLatest" && !values.includeHistory && values.pageToken)
          z.string().max(150).regex(/^[\w@.:-]+$/).parse(values.pageToken);
      } catch (error) {
        return fail(res, error, 400);
      }
      try {
        const data = await run(req.account, async (client) => {
          if (operation.group === "moments" && operation.method === "getLatest")
            return getLatestPage(client, values.pageToken, values.includeHistory);
          if (operation.group === "client" && operation.method === "getDevice")
            return deviceSummary(client);
          if (
            operation.group === "client" &&
            operation.method === "setDevice"
          ) {
            client.setDevice(values);
            return deviceSummary(client);
          }
          if (
            operation.group === "chat" &&
            operation.method === "getSupportedReactions"
          )
            return sdk.ChatModule.getSupportedReactions();
          if (operation.method === "updateProfile")
            return client.user.updateProfile(values.profile);
          const target =
            operation.group === "client" ? client : client[operation.group];
          const args = operation.object
            ? [values]
            : operation.fields.map((field) => values[field.name]);
          const result = await target[operation.method](...args);
          if (
            operation.group === "moments" &&
            operation.method === "getMoments" &&
            result?.moments
          ) {
            result.moments = result.moments.map((moment) => ({
              ...moment,
              user_uid: values.filteredByUserId || null,
              authorVerified: Boolean(values.filteredByUserId),
            }));
          }
          return result;
        });
        sendResult(res, req.account, data);
      } catch (error) {
        fail(res, error, error instanceof z.ZodError ? 400 : 502, req.account);
      }
    },
  );

}
