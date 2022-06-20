const { network } = require("hardhat");

const { networkConfig } = require("helper-hardhat-config.js");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  //   this we will get from hardhat.config.js
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  //   when going for localhost or hardhat we need mocks for AggregatorPriceV3 etc
  const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];

  //   what about the localhost? in that scenario there is no price feed address?
  //   we need to create mock contracts, we need to deploy the minimal version of it for local testing

  const fundMe = await deploy("FundMe", {
    from: deployer,
    args: [ethUsdPriceFeedAddress], // put price feed address
    log: true,
  });
};
