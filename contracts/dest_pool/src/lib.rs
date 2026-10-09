#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, token, Address, BytesN, Env,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    NotRelayer = 3,
    NotOwner = 4,
    ContractPaused = 5,
    InsufficientLiquidity = 6,
    ZeroAmount = 7,
    FeeTooHigh = 8,
}

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Token,
    Relayer,
    Owner,
    FeeBps,
    Paused,
}

#[contract]
pub struct DestPool;

#[contractimpl]
impl DestPool {
    /// Initialize the destination liquidity pool.
    pub fn initialize(
        env: Env,
        token: Address,
        relayer: Address,
        owner: Address,
        fee_bps: u32,
    ) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Token) {
            return Err(Error::AlreadyInitialized);
        }
        if fee_bps > 10_000 {
            return Err(Error::FeeTooHigh);
        }

        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::Relayer, &relayer);
        env.storage().instance().set(&DataKey::Owner, &owner);
        env.storage().instance().set(&DataKey::FeeBps, &fee_bps);
        env.storage().instance().set(&DataKey::Paused, &false);

        Ok(())
    }

    /// Relayer calls release to pay out funds on destination chain to recipient minus fee.
    pub fn release(
        env: Env,
        recipient: Address,
        amount: i128,
        source_ref: BytesN<32>,
    ) -> Result<i128, Error> {
        let relayer: Address = env
            .storage()
            .instance()
            .get(&DataKey::Relayer)
            .ok_or(Error::NotInitialized)?;
        relayer.require_auth();

        let paused: bool = env
            .storage()
            .instance()
            .get(&DataKey::Paused)
            .unwrap_or(false);
        if paused {
            return Err(Error::ContractPaused);
        }

        if amount <= 0 {
            return Err(Error::ZeroAmount);
        }

        let fee_bps: u32 = env
            .storage()
            .instance()
            .get(&DataKey::FeeBps)
            .unwrap_or(0);
        let fee = (amount * fee_bps as i128) / 10_000;
        let payout = amount - fee;

        let token: Address = env
            .storage()
            .instance()
            .get(&DataKey::Token)
            .ok_or(Error::NotInitialized)?;
        let client = token::Client::new(&env, &token);

        let contract_balance = client.balance(&env.current_contract_address());
        if contract_balance < payout {
            return Err(Error::InsufficientLiquidity);
        }

        // Payout to recipient
        client.transfer(&env.current_contract_address(), &recipient, &payout);

        // Emit Released event
        env.events().publish(
            (symbol_short!("released"), recipient.clone()),
            (payout, fee, source_ref),
        );

        Ok(payout)
    }

    /// Owner updates the relayer address.
    pub fn set_relayer(env: Env, new_relayer: Address) -> Result<(), Error> {
        let owner: Address = env
            .storage()
            .instance()
            .get(&DataKey::Owner)
            .ok_or(Error::NotInitialized)?;
        owner.require_auth();

        env.storage().instance().set(&DataKey::Relayer, &new_relayer);
        Ok(())
    }

    /// Owner pauses the pool.
    pub fn pause(env: Env) -> Result<(), Error> {
        let owner: Address = env
            .storage()
            .instance()
            .get(&DataKey::Owner)
            .ok_or(Error::NotInitialized)?;
        owner.require_auth();

        env.storage().instance().set(&DataKey::Paused, &true);
        Ok(())
    }

    /// Owner unpauses the pool.
    pub fn unpause(env: Env) -> Result<(), Error> {
        let owner: Address = env
            .storage()
            .instance()
            .get(&DataKey::Owner)
            .ok_or(Error::NotInitialized)?;
        owner.require_auth();

        env.storage().instance().set(&DataKey::Paused, &false);
        Ok(())
    }

    /// Owner withdraws collected fees or reclaims pool liquidity.
    pub fn withdraw_fees(env: Env, to: Address, amount: i128) -> Result<(), Error> {
        let owner: Address = env
            .storage()
            .instance()
            .get(&DataKey::Owner)
            .ok_or(Error::NotInitialized)?;
        owner.require_auth();

        if amount <= 0 {
            return Err(Error::ZeroAmount);
        }

        let token: Address = env
            .storage()
            .instance()
            .get(&DataKey::Token)
            .ok_or(Error::NotInitialized)?;
        let client = token::Client::new(&env, &token);

        let contract_balance = client.balance(&env.current_contract_address());
        if contract_balance < amount {
            return Err(Error::InsufficientLiquidity);
        }

        client.transfer(&env.current_contract_address(), &to, &amount);
        Ok(())
    }

    pub fn get_balance(env: Env) -> Result<i128, Error> {
        let token: Address = env
            .storage()
            .instance()
            .get(&DataKey::Token)
            .ok_or(Error::NotInitialized)?;
        let client = token::Client::new(&env, &token);
        Ok(client.balance(&env.current_contract_address()))
    }

    pub fn is_paused(env: Env) -> Result<bool, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Paused)
            .ok_or(Error::NotInitialized)
    }

    pub fn get_fee_bps(env: Env) -> Result<u32, Error> {
        env.storage()
            .instance()
            .get(&DataKey::FeeBps)
            .ok_or(Error::NotInitialized)
    }

    pub fn get_relayer(env: Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Relayer)
            .ok_or(Error::NotInitialized)
    }

    pub fn get_owner(env: Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Owner)
            .ok_or(Error::NotInitialized)
    }

    pub fn get_token(env: Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Token)
            .ok_or(Error::NotInitialized)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, BytesN, Env};

    #[test]
    fn test_initialize_and_release() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(DestPool, ());
        let client = DestPoolClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let token_contract = env.register_stellar_asset_contract_v2(admin.clone());
        let token_client = token::Client::new(&env, &token_contract.address());
        let token_admin = token::StellarAssetClient::new(&env, &token_contract.address());

        let relayer = Address::generate(&env);
        let owner = Address::generate(&env);
        let recipient = Address::generate(&env);

        // 50 bps = 0.5% fee
        client.initialize(&token_contract.address(), &relayer, &owner, &50);

        // Fund destination pool with 10,000 tokens
        token_admin.mint(&contract_id, &10000);

        assert_eq!(client.get_balance(), 10000);
        assert_eq!(client.is_paused(), false);
        assert_eq!(client.get_fee_bps(), 50);

        let source_ref = BytesN::from_array(&env, &[1u8; 32]);
        let payout = client.release(&recipient, &1000, &source_ref);

        // 1000 * 50 / 10000 = 5 fee -> 995 payout
        assert_eq!(payout, 995);
        assert_eq!(token_client.balance(&recipient), 995);
        assert_eq!(client.get_balance(), 9005);
    }

    #[test]
    fn test_pause_blocks_release() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(DestPool, ());
        let client = DestPoolClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let token_contract = env.register_stellar_asset_contract_v2(admin.clone());
        let token_admin = token::StellarAssetClient::new(&env, &token_contract.address());

        let relayer = Address::generate(&env);
        let owner = Address::generate(&env);
        let recipient = Address::generate(&env);

        client.initialize(&token_contract.address(), &relayer, &owner, &50);
        token_admin.mint(&contract_id, &10000);

        client.pause();
        assert_eq!(client.is_paused(), true);

        let source_ref = BytesN::from_array(&env, &[1u8; 32]);
        let res = client.try_release(&recipient, &1000, &source_ref);
        assert_eq!(res, Err(Ok(Error::ContractPaused)));

        client.unpause();
        assert_eq!(client.is_paused(), false);
        let payout = client.release(&recipient, &1000, &source_ref);
        assert_eq!(payout, 995);
    }

    #[test]
    fn test_withdraw_fees() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(DestPool, ());
        let client = DestPoolClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let token_contract = env.register_stellar_asset_contract_v2(admin.clone());
        let token_client = token::Client::new(&env, &token_contract.address());
        let token_admin = token::StellarAssetClient::new(&env, &token_contract.address());

        let relayer = Address::generate(&env);
        let owner = Address::generate(&env);

        client.initialize(&token_contract.address(), &relayer, &owner, &50);
        token_admin.mint(&contract_id, &5000);

        client.withdraw_fees(&owner, &1000);
        assert_eq!(token_client.balance(&owner), 1000);
        assert_eq!(client.get_balance(), 4000);
    }
}
