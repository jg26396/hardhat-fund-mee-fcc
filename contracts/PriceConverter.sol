//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

//
library PriceConverter {

    
    function getPrice(AggregatorV3Interface priceFeed) internal view returns(uint256){
        //ABI 
         
         (,int price,,,) = priceFeed.latestRoundData();
         //ETH in terms of USD
         //3000.00000
         //Function must return a uint256 with 18 decimal places
         return uint256(price * 1e10);
    }


    function getConversionRate(uint256 ethAmount, AggregatorV3Interface priceFeed) internal view returns(uint256){
        uint256 ethPrice = getPrice(priceFeed);
        uint256 ethAmountInUsd = (ethPrice * ethAmount) / 1e18;
        return ethAmountInUsd;
    }
}