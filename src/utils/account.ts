import LRUMap from "mnemonist/lru-map";
import { getAddress, type Address, type Chain } from "thirdweb";
import type { Account } from "thirdweb/wallets";
import {
  getWalletDetails,
  isSmartBackendWallet,
  type ParsedWalletDetails,
} from "../db/wallets/getWalletDetails";
import { WalletType } from "../schema/wallet";
import { splitAwsKmsArn } from "../server/utils/wallets/awsKmsArn";
import { getConnectedSmartWallet } from "../server/utils/wallets/createSmartWallet";
import { getAwsKmsAccount } from "../server/utils/wallets/getAwsKmsAccount";
import { getGcpKmsAccount } from "../server/utils/wallets/getGcpKmsAccount";
import {
  encryptedJsonToAccount,
  getLocalWalletAccount,
} from "../server/utils/wallets/getLocalWallet";
import { getSmartWalletV5 } from "./cache/getSmartWalletV5";
import { getChain } from "./chain";
import { thirdwebClient } from "./sdk";

export const _accountsCache = new LRUMap<string, Account>(2048);

export const getAccount = async (args: {
  chainId: number;
  from: Address;
  accountAddress?: Address;
}): Promise<Account> => {
  const { chainId, from, accountAddress } = args;
  const chain = await getChain(chainId);

  if (accountAddress) return getSmartWalletV5({ chain, accountAddress, from });

  // Get from cache.
  const cacheKey = getAccountCacheKey({ chainId, from, accountAddress });
  const cached = _accountsCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const walletDetails = await getWalletDetails({
    address: from,
  });

  const { account } = await walletDetailsToAccount({ walletDetails, chain });
  _accountsCache.set(cacheKey, account);
  return account;
};

export const walletDetailsToAccount = async ({
  walletDetails,
  chain,
}: {
  walletDetails: ParsedWalletDetails;
  chain: Chain;
}) => {
  switch (walletDetails.type) {
    case WalletType.awsKms: {
      const { keyId, region } = splitAwsKmsArn(walletDetails.awsKmsArn);

      const account = await getAwsKmsAccount({
        client: thirdwebClient,
        keyId,
        config: {
          region,
          credentials: {
            accessKeyId: walletDetails.awsKmsAccessKeyId,
            secretAccessKey: walletDetails.awsKmsSecretAccessKey,
          },
        },
      });

      return { account };
    }
    case WalletType.gcpKms: {
      const account = await getGcpKmsAccount({
        client: thirdwebClient,
        name: walletDetails.gcpKmsResourcePath,
        clientOptions: {
          credentials: {
            client_email: walletDetails.gcpApplicationCredentialEmail,
            private_key: walletDetails.gcpApplicationCredentialPrivateKey,
          },
        },
      });
      return { account };
    }
    case WalletType.local: {
      const account = await getLocalWalletAccount(
        getAddress(walletDetails.address),
      );
      return { account };
    }
    case WalletType.smartAwsKms: {
      const { keyId, region } = splitAwsKmsArn(walletDetails.awsKmsArn);

      const adminAccount = await getAwsKmsAccount({
        client: thirdwebClient,
        keyId,
        config: {
          region,
          credentials: {
            accessKeyId: walletDetails.awsKmsAccessKeyId,
            secretAccessKey: walletDetails.awsKmsSecretAccessKey,
          },
        },
      });

      const connectedWallet = await getConnectedSmartWallet({
        adminAccount: adminAccount,
        accountFactoryAddress: walletDetails.accountFactoryAddress ?? undefined,
        entrypointAddress: walletDetails.entrypointAddress ?? undefined,
        chain: chain,
      });

      return { account: connectedWallet, adminAccount: adminAccount };
    }

    case WalletType.smartGcpKms: {
      const adminAccount = await getGcpKmsAccount({
        client: thirdwebClient,
        name: walletDetails.gcpKmsResourcePath,
        clientOptions: {
          credentials: {
            client_email: walletDetails.gcpApplicationCredentialEmail,
            private_key: walletDetails.gcpApplicationCredentialPrivateKey,
          },
        },
      });

      const connectedWallet = await getConnectedSmartWallet({
        adminAccount: adminAccount,
        accountFactoryAddress: walletDetails.accountFactoryAddress ?? undefined,
        entrypointAddress: walletDetails.entrypointAddress ?? undefined,
        chain: chain,
      });

      return { account: connectedWallet, adminAccount };
    }

    case WalletType.smartLocal: {
      const adminAccount = await encryptedJsonToAccount(
        walletDetails.encryptedJson,
      );

      const connectedWallet = await getConnectedSmartWallet({
        adminAccount: adminAccount,
        accountFactoryAddress: walletDetails.accountFactoryAddress ?? undefined,
        entrypointAddress: walletDetails.entrypointAddress ?? undefined,
        chain: chain,
      });

      return { account: connectedWallet, adminAccount };
    }
    default:
      throw new Error(`Wallet type not supported: ${walletDetails.type}`);
  }
};

export const _adminAccountsCache = new LRUMap<string, Account>(2048);

/**
 * Get the admin account for a smart backend wallet (cached)
 * Will throw if the wallet is not a smart backend wallet
 */
export const getSmartBackendWalletAdminAccount = async ({
  chainId,
  accountAddress,
}: {
  chainId: number;
  accountAddress: Address;
}) => {
  const chain = await getChain(chainId);

  // Get from cache.
  const cacheKey = getAdminAccountCacheKey({ chainId, accountAddress });
  const cached = _adminAccountsCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const walletDetails = await getWalletDetails({
    address: accountAddress,
  });

  if (!isSmartBackendWallet(walletDetails)) {
    throw new Error(
      "Wallet is not a smart backend wallet and does not have an admin account",
    );
  }

  const { adminAccount } = await walletDetailsToAccount({
    walletDetails,
    chain,
  });

  if (!adminAccount) {
    // todo: error improvement, make it easy to parse whether user error or system error
    throw new Error("Unexpected error: admin account not found");
  }

  _adminAccountsCache.set(cacheKey, adminAccount);
  return adminAccount;
};

const getAdminAccountCacheKey = (args: {
  chainId: number;
  accountAddress: Address;
}) => `${args.chainId}-${args.accountAddress}`;

const getAccountCacheKey = (args: {
  chainId: number;
  from: Address;
  accountAddress?: Address;
}) =>
  args.accountAddress
    ? `${args.chainId}-${args.from}-${args.accountAddress}`
    : `${args.chainId}-${args.from}`;
