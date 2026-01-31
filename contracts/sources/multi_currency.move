// Thalexa Multi-Currency Support Module
// Handles multiple currencies including cNGN (Naira stablecoin)
module thalexa::multi_currency {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin, TreasuryCap};
    use sui::balance::{Self, Balance, Supply};
    use sui::event;
    use std::string::{Self, String};
    use std::option::{Self, Option};

    // Error codes
    const EInvalidAmount: u64 = 1;
    const EInsufficientBalance: u64 = 2;
    const ENotAuthorized: u64 = 3;
    const EInvalidCurrency: u64 = 4;

    // Currency wrapper for cNGN (Nigerian Naira stablecoin)
    struct CNGN has drop {}

    // Currency Registry
    struct CurrencyRegistry has key {
        id: UID,
        admin: address,
        supported_currencies: vector<String>,
    }

    // Exchange rate oracle
    struct ExchangeRateOracle has key {
        id: UID,
        admin: address,
        rates: vector<ExchangeRate>,
        last_updated: u64,
    }

    struct ExchangeRate has store, drop, copy {
        currency: String,
        rate_to_usd: u64, // Rate in basis points (10000 = 1 USD)
        last_updated: u64,
    }

    // Multi-currency wallet
    struct MultiCurrencyWallet has key {
        id: UID,
        owner: address,
        sui_balance: Balance<sui::sui::SUI>,
        cngn_balance: Balance<CNGN>,
        // Add more currency balances as needed
    }

    // Transaction with multiple currencies
    struct MultiCurrencyTransaction has key, store {
        id: UID,
        sender: address,
        receiver: address,
        currency: String,
        amount: u64,
        usd_equivalent: u64,
        timestamp: u64,
        tx_hash: vector<u8>,
    }

    // Events
    struct CurrencyExchanged has copy, drop {
        from_currency: String,
        to_currency: String,
        amount: u64,
        rate: u64,
        timestamp: u64,
    }

    struct ExchangeRateUpdated has copy, drop {
        currency: String,
        old_rate: u64,
        new_rate: u64,
        timestamp: u64,
    }

    struct cNGNMinted has copy, drop {
        recipient: address,
        amount: u64,
        timestamp: u64,
    }

    // Initialize cNGN currency
    fun init(witness: CNGN, ctx: &mut TxContext) {
        let (treasury_cap, metadata) = coin::create_currency(
            witness,
            6, // decimals
            b"cNGN",
            b"Nigerian Naira Coin",
            b"Stablecoin pegged to Nigerian Naira",
            option::none(),
            ctx
        );

        transfer::public_freeze_object(metadata);
        transfer::public_transfer(treasury_cap, tx_context::sender(ctx));

        // Initialize currency registry
        let registry = CurrencyRegistry {
            id: object::new(ctx),
            admin: tx_context::sender(ctx),
            supported_currencies: vector[
                string::utf8(b"SUI"),
                string::utf8(b"cNGN"),
                string::utf8(b"BTC"),
                string::utf8(b"ETH"),
                string::utf8(b"SOL"),
                string::utf8(b"USDC"),
                string::utf8(b"USDT"),
            ],
        };
        transfer::share_object(registry);

        // Initialize exchange rate oracle
        let oracle = ExchangeRateOracle {
            id: object::new(ctx),
            admin: tx_context::sender(ctx),
            rates: vector::empty(),
            last_updated: tx_context::epoch(ctx),
        };
        transfer::share_object(oracle);
    }

    // Mint cNGN (only for authorized minter)
    public entry fun mint_cngn(
        treasury_cap: &mut TreasuryCap<CNGN>,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let coin = coin::mint(treasury_cap, amount, ctx);
        transfer::public_transfer(coin, recipient);

        event::emit(cNGNMinted {
            recipient,
            amount,
            timestamp: tx_context::epoch(ctx),
        });
    }

    // Burn cNGN
    public entry fun burn_cngn(
        treasury_cap: &mut TreasuryCap<CNGN>,
        coin: Coin<CNGN>
    ) {
        coin::burn(treasury_cap, coin);
    }

    // Create multi-currency wallet
    public entry fun create_wallet(ctx: &mut TxContext) {
        let wallet = MultiCurrencyWallet {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            sui_balance: balance::zero(),
            cngn_balance: balance::zero(),
        };
        transfer::transfer(wallet, tx_context::sender(ctx));
    }

    // Deposit cNGN to wallet
    public entry fun deposit_cngn(
        wallet: &mut MultiCurrencyWallet,
        coin: Coin<CNGN>,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == wallet.owner, ENotAuthorized);
        let balance = coin::into_balance(coin);
        balance::join(&mut wallet.cngn_balance, balance);
    }

    // Withdraw cNGN from wallet
    public entry fun withdraw_cngn(
        wallet: &mut MultiCurrencyWallet,
        amount: u64,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == wallet.owner, ENotAuthorized);
        assert!(balance::value(&wallet.cngn_balance) >= amount, EInsufficientBalance);
        
        let withdrawn = balance::split(&mut wallet.cngn_balance, amount);
        let coin = coin::from_balance(withdrawn, ctx);
        transfer::public_transfer(coin, wallet.owner);
    }

    // Update exchange rates (admin only)
    public entry fun update_exchange_rate(
        oracle: &mut ExchangeRateOracle,
        currency: vector<u8>,
        rate_to_usd: u64,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == oracle.admin, ENotAuthorized);
        
        let currency_str = string::utf8(currency);
        let timestamp = tx_context::epoch(ctx);
        
        // Find and update existing rate or add new one
        let rates_len = vector::length(&oracle.rates);
        let mut i = 0;
        let mut found = false;
        let mut old_rate = 0;
        
        while (i < rates_len) {
            let rate = vector::borrow_mut(&mut oracle.rates, i);
            if (rate.currency == currency_str) {
                old_rate = rate.rate_to_usd;
                rate.rate_to_usd = rate_to_usd;
                rate.last_updated = timestamp;
                found = true;
                break
            };
            i = i + 1;
        };

        if (!found) {
            let new_rate = ExchangeRate {
                currency: currency_str,
                rate_to_usd,
                last_updated: timestamp,
            };
            vector::push_back(&mut oracle.rates, new_rate);
        };

        oracle.last_updated = timestamp;

        event::emit(ExchangeRateUpdated {
            currency: currency_str,
            old_rate,
            new_rate: rate_to_usd,
            timestamp,
        });
    }

    // Get exchange rate
    public fun get_exchange_rate(oracle: &ExchangeRateOracle, currency: vector<u8>): u64 {
        let currency_str = string::utf8(currency);
        let rates_len = vector::length(&oracle.rates);
        let mut i = 0;
        
        while (i < rates_len) {
            let rate = vector::borrow(&oracle.rates, i);
            if (rate.currency == currency_str) {
                return rate.rate_to_usd
            };
            i = i + 1;
        };
        
        0 // Return 0 if currency not found
    }

    // Convert amount from one currency to USD equivalent
    public fun convert_to_usd(
        oracle: &ExchangeRateOracle,
        currency: vector<u8>,
        amount: u64
    ): u64 {
        let rate = get_exchange_rate(oracle, currency);
        (amount * rate) / 10000
    }

    // Transfer cNGN between wallets
    public entry fun transfer_cngn(
        sender_wallet: &mut MultiCurrencyWallet,
        receiver: address,
        amount: u64,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == sender_wallet.owner, ENotAuthorized);
        assert!(balance::value(&sender_wallet.cngn_balance) >= amount, EInsufficientBalance);
        
        let transferred = balance::split(&mut sender_wallet.cngn_balance, amount);
        let coin = coin::from_balance(transferred, ctx);
        transfer::public_transfer(coin, receiver);
    }

    // View functions
    public fun get_wallet_cngn_balance(wallet: &MultiCurrencyWallet): u64 {
        balance::value(&wallet.cngn_balance)
    }

    public fun get_wallet_sui_balance(wallet: &MultiCurrencyWallet): u64 {
        balance::value(&wallet.sui_balance)
    }

    public fun is_currency_supported(registry: &CurrencyRegistry, currency: String): bool {
        vector::contains(&registry.supported_currencies, &currency)
    }
}
