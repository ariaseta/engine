// import { FastifyInstance, RouteGenericInterface } from 'fastify';
// import { StatusCodes } from 'http-status-codes';
// import { getSDK } from '../../../../helpers/sdk';
// import { Static } from '@sinclair/typebox';
// import { fullRouteSchema, schemaTypes } from '../../../../sharedApiSchemas';

// export async function erc1155ReadContract(fastify: FastifyInstance) {
//   fastify.route<schemaTypes>({
//     method: 'GET',
//     url: '/contract/:chain_name_or_id/:contract_address/erc1155/read',
//     schema: {
//       description: 'Read From ERC1155 Contract',
//       tags: ['extensions'],
//       operationId: 'erc1155Read',
//       ...fullRouteSchema,
//     },
//     handler: async (request, reply) => {
//       const { chain_name_or_id, contract_address } = request.params;
//       const { function_name, args } = request.query;
//       request.log.info('Inside Read Function');
//       request.log.debug(`Chain : ${chain_name_or_id}`)
//       request.log.debug(`Contract Address : ${contract_address}`);

//       request.log.debug(`Function Name : ${function_name}`)
//       request.log.debug(`Args : ${args}`);

//       const sdk = await getSDK(chain_name_or_id);
//       const contract = await sdk.getContract(contract_address);

//       const returnData: any = "adad";
//       // await contract.erc1155.call(function_name, args ? args.split(',') : []);
      
//       reply.status(StatusCodes.OK).send({
//         result: {
//           data: returnData
//         }
//       });
//     },
//   });
// }