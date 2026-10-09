#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, token, Address, Env, String,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    NotRelayer = 3,
    ZeroAmount = 4,
    InvalidRecipient = 5,
}

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Token,
    Relayer,
    Nonce,
}

#[contract]
pub struct SourceVault;

#[contractimpl]
impl SourceVault {
    /// Initialize the vault with token address and relayer address.
    pub fn initialize(env: Env, token: Address, relayer: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Token) {
            return Err(Error::AlreadyInitialized);
        }

        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::Relayer, &relayer);
        env.storage().instance().set(&DataKey::Nonce, &0u64);

        Ok(())
    }

    /// Deposit tokens on source chain to request cross-chain payout.
    pub fn deposit(
        env: Env,
        payer: Address,
        recipient: String,
        amount: i128,
        dest_chain_id: u64,
    ) -> Result<u64, Error> {
        payer.require_auth();

        if amount <= 0 {
            return Err(Error::ZeroAmount);
        }
        if recipient.len() == 0 {
            return Err(Error::InvalidRecipient);
        }

        let token: Address = env
            .storage()
            .instance()
            .get(&DataKey::Token)
            .ok_or(Error::NotInitialized)?;

        let mut nonce: u64 = env
            .storage()
            .instance()
            .get(&DataKey::Nonce)
            .unwrap_or(0);

        // Transfer tokens from payer to this vault contract
        let client = token::Client::new(&env, &token);
        client.transfer(&payer, &env.current_contract_address(), &amount);

        let current_nonce = nonce;
        nonce += 1;
        env.storage().instance().set(&DataKey::Nonce, &nonce);

        // Emit PaymentRequested event
        env.events().publish(
            (symbol_short!("pay_req"), payer.clone()),
            (recipient, amount, dest_chain_id, current_nonce),
        );

        Ok(current_nonce)
    }

    pub fn get_token(env: Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Token)
            .ok_or(Error::NotInitialized)
    }

    pub fn get_relayer(env: Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Relayer)
            .ok_or(Error::NotInitialized)
    }

    pub fn get_nonce(env: Env) -> Result<u64, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Nonce)
            .ok_or(Error::NotInitialized)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env, String};

    #[test]
    fn test_initialize_and_deposit() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(SourceVault, ());
        let client = SourceVaultClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let token_contract = env.register_stellar_asset_contract_v2(admin.clone());
        let token_client = token::Client::new(&env, &token_contract.address());
        let token_admin = token::StellarAssetClient::new(&env, &token_contract.address());

        let relayer = Address::generate(&env);
        let payer = Address::generate(&env);

        // Mint 1,000 tokens to payer
        token_admin.mint(&payer, &1000);

        client.initialize(&token_contract.address(), &relayer);

        assert_eq!(client.get_token(), token_contract.address());
        assert_eq!(client.get_relayer(), relayer);
        assert_eq!(client.get_nonce(), 0);

        let recipient = String::from_str(&env, "0xRecipientAddress");
        let nonce = client.deposit(&payer, &recipient, &500, &137);

        assert_eq!(nonce, 0);
        assert_eq!(client.get_nonce(), 1);
        assert_eq!(token_client.balance(&payer), 500);
        assert_eq!(token_client.balance(&contract_id), 500);
    }

    #[test]
    fn test_zero_amount_fails() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(SourceVault, ());
        let client = SourceVaultClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let token_contract = env.register_stellar_asset_contract_v2(admin.clone());
        let relayer = Address::generate(&env);
        let payer = Address::generate(&env);

        client.initialize(&token_contract.address(), &relayer);

        let recipient = String::from_str(&env, "0xRecipientAddress");
        let res = client.try_deposit(&payer, &recipient, &0, &137);
        assert_eq!(res, Err(Ok(Error::ZeroAmount)));
    }
}
