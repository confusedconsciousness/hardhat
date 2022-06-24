const { network } = require("hardhat");

const { networkConfig, developmentChains } = require("../helper-hardhat-config");
const {verify} = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  //   this we will get from hardhat.config.js
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  
  let ethUsdPriceFeedAddress;
  //   when going for localhost or hardhat we need mocks for AggregatorPriceV3 etc
  if (developmentChains.includes(network.name)) {
    const ethUsdAggregator = await deployments.get("MockV3Aggregator");
    // fetch the address of the mock deployed
    ethUsdPriceFeedAddress = ethUsdAggregator.address;
  } else {
    ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
  }

  //   what about the localhost? in that scenario there is no price feed address?
  //   we need to create mock contracts, we need to deploy the minimal version of it for local testing
  const args = [ethUsdPriceFeedAddress]
  const fundMe = await deploy("FundMe", {
    from: deployer,
    args: args, // put price feed address
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });


  if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
      await verify(fundMe.address, args);
  }

  log("-------------------------------------------")
};

module.exports.tags = ["all", "fundme"]
