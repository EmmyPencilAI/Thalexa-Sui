// Thalexa Escrow & Product Verification System
// Main contract for handling escrow transactions and product verification on Sui
module thalexa::escrow {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    use sui::clock::{Self, Clock};
    use sui::event;
    use std::string::{Self, String};
    use std::vector;

    // Error codes
    const EInsufficientBalance: u64 = 1;
    const ENotAuthorized: u64 = 2;
    const EInvalidState: u64 = 3;
    const EProductNotFound: u64 = 4;
    const EAlreadyVerified: u64 = 5;
    const ESubscriptionExpired: u64 = 6;
    const EInvalidTier: u64 = 7;

    // Subscription Tiers
    const TIER_STARTER: u8 = 0;
    const TIER_PROFESSIONAL: u8 = 1;
    const TIER_ENTERPRISE: u8 = 2;

    // Subscription Limits
    const STARTER_MONTHLY_LIMIT: u64 = 2_000_000_000; // $2,000 in MIST (1 SUI = 1B MIST)
    const PROFESSIONAL_MONTHLY_LIMIT: u64 = 200_000_000_000; // $200,000
    const PROFESSIONAL_PRODUCT_LIMIT: u64 = 300;
    const PROFESSIONAL_PRICE: u64 = 500_000_000_000; // $500 in MIST

    // Escrow States
    const STATE_PENDING: u8 = 0;
    const STATE_ACCEPTED: u8 = 1;
    const STATE_IN_TRANSIT: u8 = 2;
    const STATE_DELIVERED: u8 = 3;
    const STATE_COMPLETED: u8 = 4;
    const STATE_DISPUTED: u8 = 5;
    const STATE_CANCELLED: u8 = 6;

    // Platform Configuration
    struct PlatformConfig has key {
        id: UID,
        admin: address,
        fee_percentage: u64, // basis points (e.g., 250 = 2.5%)
        min_escrow_amount: u64,
        dispute_timeout: u64, // milliseconds
    }

    // User Account with zkLogin support
    struct UserAccount has key {
        id: UID,
        owner: address,
        email_hash: vector<u8>, // Hash of email for zkLogin
        subscription_tier: u8,
        subscription_expires: u64, // timestamp
        monthly_volume: u64,
        products_created: u64,
        created_at: u64,
        is_verified: bool,
    }

    // Product Registry
    struct Product has key, store {
        id: UID,
        creator: address,
        name: String,
        description: String,
        category: String,
        metadata_ipfs: String, // Pinata IPFS hash
        image_ipfs: String, // Product image on IPFS
        quantity: u64,
        unit_price: u64,
        currency: String,
        manufacturer: address,
        origin_location: String,
        batch_number: String,
        created_at: u64,
        verification_count: u64,
        is_verified: bool,
    }

    // Escrow Contract
    struct EscrowContract has key {
        id: UID,
        buyer: address,
        seller: address,
        arbiter: address,
        product_id: ID,
        amount: Balance<SUI>,
        state: u8,
        created_at: u64,
        accepted_at: u64,
        completed_at: u64,
        terms: String,
        tracking_updates: vector<TrackingUpdate>,
    }

    // Tracking Update
    struct TrackingUpdate has store, drop, copy {
        timestamp: u64,
        location: String,
        status: String,
        updated_by: address,
    }

    // Transaction Record
    struct TransactionRecord has key, store {
        id: UID,
        sender: address,
        receiver: address,
        amount: u64,
        currency: String,
        product_id: ID,
        escrow_id: ID,
        timestamp: u64,
        status: String,
    }

    // Events
    struct ProductCreated has copy, drop {
        product_id: ID,
        creator: address,
        name: String,
        timestamp: u64,
    }

    struct EscrowCreated has copy, drop {
        escrow_id: ID,
        buyer: address,
        seller: address,
        amount: u64,
        product_id: ID,
    }

    struct EscrowStateChanged has copy, drop {
        escrow_id: ID,
        old_state: u8,
        new_state: u8,
        timestamp: u64,
    }

    struct ProductVerified has copy, drop {
        product_id: ID,
        verifier: address,
        timestamp: u64,
    }

    struct SubscriptionUpgraded has copy, drop {
        user: address,
        old_tier: u8,
        new_tier: u8,
        expires_at: u64,
    }

    // Initialize the platform
    fun init(ctx: &mut TxContext) {
        let config = PlatformConfig {
            id: object::new(ctx),
            admin: tx_context::sender(ctx),
            fee_percentage: 250, // 2.5%
            min_escrow_amount: 100_000_000, // 0.1 SUI
            dispute_timeout: 604_800_000, // 7 days
        };
        transfer::share_object(config);
    }

    // Create user account with zkLogin
    public entry fun create_account(
        email_hash: vector<u8>,
        ctx: &mut TxContext
    ) {
        let account = UserAccount {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            email_hash,
            subscription_tier: TIER_STARTER,
            subscription_expires: 0,
            monthly_volume: 0,
            products_created: 0,
            created_at: tx_context::epoch(ctx),
            is_verified: false,
        };
        transfer::transfer(account, tx_context::sender(ctx));
    }

    // Upgrade subscription
    public entry fun upgrade_subscription(
        account: &mut UserAccount,
        payment: Coin<SUI>,
        tier: u8,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(tier == TIER_PROFESSIONAL || tier == TIER_ENTERPRISE, EInvalidTier);
        assert!(tx_context::sender(ctx) == account.owner, ENotAuthorized);

        let payment_amount = coin::value(&payment);
        assert!(payment_amount >= PROFESSIONAL_PRICE, EInsufficientBalance);

        let old_tier = account.subscription_tier;
        account.subscription_tier = tier;
        
        // Set expiration to 30 days from now
        let current_time = clock::timestamp_ms(clock);
        account.subscription_expires = current_time + 2_592_000_000; // 30 days

        // Transfer payment to platform (in production, send to treasury)
        transfer::public_transfer(payment, account.owner);

        event::emit(SubscriptionUpgraded {
            user: account.owner,
            old_tier,
            new_tier: tier,
            expires_at: account.subscription_expires,
        });
    }

    // Create and register a product
    public entry fun create_product(
        account: &mut UserAccount,
        name: vector<u8>,
        description: vector<u8>,
        category: vector<u8>,
        metadata_ipfs: vector<u8>,
        image_ipfs: vector<u8>,
        quantity: u64,
        unit_price: u64,
        currency: vector<u8>,
        manufacturer: address,
        origin_location: vector<u8>,
        batch_number: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == account.owner, ENotAuthorized);
        
        // Check subscription tier limits
        if (account.subscription_tier == TIER_STARTER) {
            assert!(false, EInvalidTier); // Starter tier cannot create products
        };

        if (account.subscription_tier == TIER_PROFESSIONAL) {
            assert!(account.products_created < PROFESSIONAL_PRODUCT_LIMIT, EInvalidTier);
        };

        let product = Product {
            id: object::new(ctx),
            creator: tx_context::sender(ctx),
            name: string::utf8(name),
            description: string::utf8(description),
            category: string::utf8(category),
            metadata_ipfs: string::utf8(metadata_ipfs),
            image_ipfs: string::utf8(image_ipfs),
            quantity,
            unit_price,
            currency: string::utf8(currency),
            manufacturer,
            origin_location: string::utf8(origin_location),
            batch_number: string::utf8(batch_number),
            created_at: clock::timestamp_ms(clock),
            verification_count: 0,
            is_verified: false,
        };

        let product_id = object::id(&product);
        account.products_created = account.products_created + 1;

        event::emit(ProductCreated {
            product_id,
            creator: tx_context::sender(ctx),
            name: string::utf8(name),
            timestamp: clock::timestamp_ms(clock),
        });

        transfer::share_object(product);
    }

    // Create escrow contract
    public entry fun create_escrow(
        seller: address,
        arbiter: address,
        product_id: ID,
        payment: Coin<SUI>,
        terms: vector<u8>,
        config: &PlatformConfig,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let amount_value = coin::value(&payment);
        assert!(amount_value >= config.min_escrow_amount, EInsufficientBalance);

        let escrow = EscrowContract {
            id: object::new(ctx),
            buyer: tx_context::sender(ctx),
            seller,
            arbiter,
            product_id,
            amount: coin::into_balance(payment),
            state: STATE_PENDING,
            created_at: clock::timestamp_ms(clock),
            accepted_at: 0,
            completed_at: 0,
            terms: string::utf8(terms),
            tracking_updates: vector::empty(),
        };

        let escrow_id = object::id(&escrow);

        event::emit(EscrowCreated {
            escrow_id,
            buyer: tx_context::sender(ctx),
            seller,
            amount: amount_value,
            product_id,
        });

        transfer::share_object(escrow);
    }

    // Accept escrow (seller)
    public entry fun accept_escrow(
        escrow: &mut EscrowContract,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == escrow.seller, ENotAuthorized);
        assert!(escrow.state == STATE_PENDING, EInvalidState);

        let old_state = escrow.state;
        escrow.state = STATE_ACCEPTED;
        escrow.accepted_at = clock::timestamp_ms(clock);

        event::emit(EscrowStateChanged {
            escrow_id: object::id(escrow),
            old_state,
            new_state: STATE_ACCEPTED,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    // Update tracking
    public entry fun update_tracking(
        escrow: &mut EscrowContract,
        location: vector<u8>,
        status: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(
            tx_context::sender(ctx) == escrow.seller || 
            tx_context::sender(ctx) == escrow.buyer ||
            tx_context::sender(ctx) == escrow.arbiter,
            ENotAuthorized
        );

        let update = TrackingUpdate {
            timestamp: clock::timestamp_ms(clock),
            location: string::utf8(location),
            status: string::utf8(status),
            updated_by: tx_context::sender(ctx),
        };

        vector::push_back(&mut escrow.tracking_updates, update);

        // Update state based on status
        if (status == b"in_transit" && escrow.state == STATE_ACCEPTED) {
            let old_state = escrow.state;
            escrow.state = STATE_IN_TRANSIT;
            event::emit(EscrowStateChanged {
                escrow_id: object::id(escrow),
                old_state,
                new_state: STATE_IN_TRANSIT,
                timestamp: clock::timestamp_ms(clock),
            });
        } else if (status == b"delivered" && escrow.state == STATE_IN_TRANSIT) {
            let old_state = escrow.state;
            escrow.state = STATE_DELIVERED;
            event::emit(EscrowStateChanged {
                escrow_id: object::id(escrow),
                old_state,
                new_state: STATE_DELIVERED,
                timestamp: clock::timestamp_ms(clock),
            });
        };
    }

    // Complete escrow and release funds (buyer confirms delivery)
    public entry fun complete_escrow(
        escrow: &mut EscrowContract,
        config: &PlatformConfig,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == escrow.buyer, ENotAuthorized);
        assert!(escrow.state == STATE_DELIVERED, EInvalidState);

        let old_state = escrow.state;
        escrow.state = STATE_COMPLETED;
        escrow.completed_at = clock::timestamp_ms(clock);

        // Calculate platform fee
        let total_amount = balance::value(&escrow.amount);
        let fee_amount = (total_amount * config.fee_percentage) / 10000;
        let seller_amount = total_amount - fee_amount;

        // Split balance
        let fee_balance = balance::split(&mut escrow.amount, fee_amount);
        let seller_balance = balance::split(&mut escrow.amount, seller_amount);

        // Transfer funds
        transfer::public_transfer(coin::from_balance(seller_balance, ctx), escrow.seller);
        transfer::public_transfer(coin::from_balance(fee_balance, ctx), config.admin);

        event::emit(EscrowStateChanged {
            escrow_id: object::id(escrow),
            old_state,
            new_state: STATE_COMPLETED,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    // Verify product (via QR scan)
    public entry fun verify_product(
        product: &mut Product,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        product.verification_count = product.verification_count + 1;
        
        event::emit(ProductVerified {
            product_id: object::id(product),
            verifier: tx_context::sender(ctx),
            timestamp: clock::timestamp_ms(clock),
        });
    }

    // Dispute escrow
    public entry fun dispute_escrow(
        escrow: &mut EscrowContract,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(
            tx_context::sender(ctx) == escrow.buyer || 
            tx_context::sender(ctx) == escrow.seller,
            ENotAuthorized
        );
        assert!(escrow.state != STATE_COMPLETED && escrow.state != STATE_CANCELLED, EInvalidState);

        let old_state = escrow.state;
        escrow.state = STATE_DISPUTED;

        event::emit(EscrowStateChanged {
            escrow_id: object::id(escrow),
            old_state,
            new_state: STATE_DISPUTED,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    // Arbiter resolves dispute
    public entry fun resolve_dispute(
        escrow: &mut EscrowContract,
        release_to_seller: bool,
        config: &PlatformConfig,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == escrow.arbiter, ENotAuthorized);
        assert!(escrow.state == STATE_DISPUTED, EInvalidState);

        let total_amount = balance::value(&escrow.amount);
        
        if (release_to_seller) {
            // Release to seller minus platform fee
            let fee_amount = (total_amount * config.fee_percentage) / 10000;
            let seller_amount = total_amount - fee_amount;
            
            let fee_balance = balance::split(&mut escrow.amount, fee_amount);
            let seller_balance = balance::split(&mut escrow.amount, seller_amount);
            
            transfer::public_transfer(coin::from_balance(seller_balance, ctx), escrow.seller);
            transfer::public_transfer(coin::from_balance(fee_balance, ctx), config.admin);
        } else {
            // Refund to buyer
            let buyer_balance = balance::withdraw_all(&mut escrow.amount);
            transfer::public_transfer(coin::from_balance(buyer_balance, ctx), escrow.buyer);
        };

        let old_state = escrow.state;
        escrow.state = STATE_COMPLETED;
        escrow.completed_at = clock::timestamp_ms(clock);

        event::emit(EscrowStateChanged {
            escrow_id: object::id(escrow),
            old_state,
            new_state: STATE_COMPLETED,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    // View functions
    public fun get_product_details(product: &Product): (String, String, u64, String) {
        (product.name, product.metadata_ipfs, product.verification_count, product.origin_location)
    }

    public fun get_escrow_state(escrow: &EscrowContract): u8 {
        escrow.state
    }

    public fun get_user_tier(account: &UserAccount): u8 {
        account.subscription_tier
    }
}
