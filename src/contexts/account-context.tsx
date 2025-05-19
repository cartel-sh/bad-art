"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Account } from "@lens-protocol/client";
import { getLensClient } from "@/lib/lens/client";
import { fetchAccount } from "@lens-protocol/client/actions";

type AccountContextType = {
  account: Account | null;
  loading: boolean;
};

const AccountContext = createContext<AccountContextType | undefined>(undefined);

async function getAuthenticatedAccount(): Promise<Account | null> {
  const client = await getLensClient();

  if (!client.isSessionClient()) {
    return null;
  }

  const authenticatedUser = client.getAuthenticatedUser().unwrapOr(null);
  if (!authenticatedUser) {
    return null;
  }

  return fetchAccount(client, { address: authenticatedUser.address }).unwrapOr(null);
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuthenticatedAccount()
      .then(setAccount)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AccountContext.Provider value={{ account, loading }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error("useAccount must be used within an AccountProvider");
  }
  return context;
} 