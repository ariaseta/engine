import { knex } from "../../db/client";
import { getConfig } from "../../utils/cache/getConfig";
import { logger } from "../../utils/logger";
import { minedTxListener } from "./minedTxListener";
import { queuedTxListener } from "./queuedTxListener";
import { retryTxListener } from "./retryTxListener";

export const newConfigurationListener = async (): Promise<void> => {
  logger({
    service: "worker",
    level: "info",
    message: `Listening for new configuration data`,
  });

  // TODO: This doesn't even need to be a listener
  const connection = await knex.client.acquireConnection();
  connection.query(`LISTEN new_configuration_data`);

  // Whenever we receive a new transaction, process it
  connection.on(
    "notification",
    async (msg: { channel: string; payload: string }) => {
      // Update Configs Data
      await getConfig(false);
    },
  );

  connection.on("end", async () => {
    await knex.destroy();
    knex.client.releaseConnection(connection);

    logger({
      service: "worker",
      level: "info",
      message: `Released database connection on end`,
    });
  });

  connection.on("error", async (err: any) => {
    logger({
      service: "worker",
      level: "error",
      message: `Database connection error`,
      error: err,
    });

    await knex.destroy();
    knex.client.releaseConnection(connection);

    logger({
      service: "worker",
      level: "info",
      message: `Released database connection on error`,
      error: err,
    });
  });
};

export const updatedConfigurationListener = async (): Promise<void> => {
  logger({
    service: "worker",
    level: "info",
    message: `Listening for updated configuration data`,
  });

  // TODO: This doesn't even need to be a listener
  const connection = await knex.client.acquireConnection();
  connection.query(`LISTEN updated_configuration_data`);

  // Whenever we receive a new transaction, process it
  connection.on(
    "notification",
    async (msg: { channel: string; payload: string }) => {
      // Update Configs Data
      logger({
        service: "worker",
        level: "info",
        message: `Updated configuration data`,
      });
      await getConfig(false);
      await queuedTxListener();
      await minedTxListener();
      await retryTxListener();
    },
  );

  connection.on("end", async () => {
    await knex.destroy();
    knex.client.releaseConnection(connection);

    logger({
      service: "worker",
      level: "info",
      message: `Released database connection on end`,
    });
  });

  connection.on("error", async (err: any) => {
    logger({
      service: "worker",
      level: "error",
      message: `Database connection error`,
      error: err,
    });

    await knex.destroy();
    knex.client.releaseConnection(connection);

    logger({
      service: "worker",
      level: "info",
      message: `Released database connection on error`,
      error: err,
    });
  });
};
