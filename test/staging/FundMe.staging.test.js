const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts, network } = require("hardhat");

const { developmentChains } = require("../../helper-hardhat-config");

// these will be run on test networks, first we will need to deploy it to test network
// yarn hardhat deploy --network rinkeby
const {} = developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", async () => {
      let fundMe;
      let deployer;
      const sendValue = ethers.utils.parseEther("1"); // 1 eth
      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        // after they are deployed, its time to fetch the contracts
        //   notice here we are not using deployments.fixture() to deploy our contracts that we used to do in unit tests
        // in staging test we are assuming that it is already deployed to the test network
        fundMe = await ethers.getContract("FundMe", deployer); // this will give most recent deployment
        // also we do not need a mockV3Aggregator since again we are assuming it is present
      });

      it("allows people to fund and withdraw", async () => {
        await fundMe.fund({ value: sendValue });
        await fundMe.withdraw();

        const endingBalance = await fundMe.provider.getBalance(fundMe.address);
        assert.equal(endingBalance.toString(), "0");
      });
    });
