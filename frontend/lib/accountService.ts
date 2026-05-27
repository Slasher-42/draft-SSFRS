import executionApi from "./executionApi";

export interface AccountResponse {
  id: string;
  userId: string;
  role: string;
  accountNumber: string;
  balance: number;
  pendingBalance: number;
  createdAt: string;
}

export interface BankAccountResponse {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  defaultAccount: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BankAccountRequest {
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
}

export const accountService = {
  async getAccount(): Promise<AccountResponse> {
    const res = await executionApi.get<AccountResponse>("/api/account");
    return res.data;
  },

  async deposit(projectId: string, amount: number, bankAccountId: string): Promise<AccountResponse> {
    const res = await executionApi.post<AccountResponse>("/api/account/deposit", {
      projectId,
      bankAccountId,
      amount,
    });
    return res.data;
  },

  async getBankAccounts(): Promise<BankAccountResponse[]> {
    const res = await executionApi.get<BankAccountResponse[]>("/api/account/bank-accounts");
    return res.data;
  },

  async addBankAccount(data: BankAccountRequest): Promise<BankAccountResponse> {
    const res = await executionApi.post<BankAccountResponse>("/api/account/bank-accounts", data);
    return res.data;
  },

  async updateBankAccount(id: string, data: BankAccountRequest): Promise<BankAccountResponse> {
    const res = await executionApi.put<BankAccountResponse>(`/api/account/bank-accounts/${id}`, data);
    return res.data;
  },

  async deleteBankAccount(id: string): Promise<void> {
    await executionApi.delete(`/api/account/bank-accounts/${id}`);
  },

  async setDefaultBankAccount(id: string): Promise<void> {
    await executionApi.patch(`/api/account/bank-accounts/${id}/default`);
  },
};
