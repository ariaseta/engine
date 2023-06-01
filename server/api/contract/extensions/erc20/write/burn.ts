import { FastifyInstance } from "fastify";
import { StatusCodes } from "http-status-codes";
import { Static, Type } from "@sinclair/typebox";
import { getContractInstace } from "../../../../../../core/index";
import {
  erc20ContractParamSchema,
  standardResponseSchema,
  baseReplyErrorSchema,
  transactionWritesResponseSchema,
} from "../../../../../helpers/sharedApiSchemas";
import { queueTransaction } from "../../../../../helpers";

// INPUTS
const requestSchema = erc20ContractParamSchema;
const requestBodySchema = Type.Object({
  amount: Type.String({
    description: 'The amount of tokens you want to burn',
    }),
});
  
// Example for the Request Body
requestBodySchema.examples = [
  {
    amount: "0.1",
  },
];


export async function erc20burn(fastify: FastifyInstance) {
  fastify.route<{
    Params: Static<typeof requestSchema>;
    Reply: Static<typeof transactionWritesResponseSchema>;
    Body: Static<typeof requestBodySchema>;
  }>({
    method: "POST",
    url: "/contract/:chain_name_or_id/:contract_address/erc20/burn",
    schema: {
      description: "Burn Tokens held by the connected wallet.",
      tags: ["ERC20"],
      operationId: "erc20_burn",
      params: requestSchema,
      body: requestBodySchema,
      response: {
        ...standardResponseSchema,
        [StatusCodes.OK]: transactionWritesResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const { chain_name_or_id, contract_address } = request.params;
      const { amount } = request.body;
      const contract = await getContractInstace(chain_name_or_id, contract_address);
      const tx = await contract.erc20.burn.prepare(amount);
      const queuedId = await queueTransaction(
        request,
        tx,
        chain_name_or_id,
        "erc20",
      );
      reply.status(StatusCodes.OK).send({
        result: queuedId,
      });
    },
  });
}