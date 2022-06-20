// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

library PriceConverter {
    /**
    This function gets us the price of ETH/USD from chainlink oracle,
    to execute this function we must provide some LINK token
     */
    function getPrice(AggregatorV3Interface priceFeed)
        internal
        view
        returns (uint256)
    {
        // this function should take an address no?
        (, int256 price, , , ) = priceFeed.latestRoundData();
        return uint256(price * 1e10);
    }

    function getConversionRate(
        uint256 ethAmount,
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256) {
        uint256 ethPriceInUSD = getPrice(priceFeed);

        uint256 ethAmountInUSD = (ethPriceInUSD * ethAmount) / 1e18;
        return ethAmountInUSD;
    }
}
