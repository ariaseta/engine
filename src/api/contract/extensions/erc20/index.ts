import { FastifyInstance } from 'fastify';

import { erc20Allowance } from "./read/allowance";
import { erc20AllowanceOf } from "./read/allowanceOf";
import { erc20TotalSupply } from "./read/totalSupply";
import { erc20Balance } from './read/balance';
import { erc20BalanceOf } from './read/balanceOf';
import { erc20GetMetadata } from './read/get';
import { erc20NormalizeAmount } from './read/normalizeAmount';

import { erc20SetAlowance } from './write/setAllowance';
import { erc20Transfer } from './write/transfer';
import { erc20TransferFrom } from './write/transferFrom';

export const erc20Routes = async (fastify: FastifyInstance) => {
    // GET
    await fastify.register(erc20Allowance);
    await fastify.register(erc20AllowanceOf);
    await fastify.register(erc20Balance);
    await fastify.register(erc20BalanceOf);
    await fastify.register(erc20GetMetadata);
    await fastify.register(erc20NormalizeAmount);
    await fastify.register(erc20TotalSupply);
    
    //POST
    await fastify.register(erc20SetAlowance);
    await fastify.register(erc20Transfer);
    await fastify.register(erc20TransferFrom);
};