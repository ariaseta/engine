import { createHash, randomBytes } from "crypto";
import { webhookCache } from "../../../server/utils/cache/getWebhook";
import { WebhooksEventTypes } from "../../schema/webhooks";
import { prisma } from "../client";

interface CreateWebhooksParams {
  url: string;
  name: string;
  eventType: WebhooksEventTypes;
}

export const insertWebhook = async ({
  url,
  name,
  eventType,
}: CreateWebhooksParams) => {
  // generate random bytes
  const bytes = randomBytes(4096);
  // hash the bytes to create the secret (this will not be stored by itself)
  const secret = createHash("sha512").update(bytes).digest("base64url");

  // Clear Cache
  webhookCache.clear();

  return prisma.webhooks.create({
    data: {
      url,
      name,
      eventType,
      secret,
    },
  });
};
