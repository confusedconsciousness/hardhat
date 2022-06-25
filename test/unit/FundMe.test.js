const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts, network } = require("hardhat");

const { developmentChains } = require("../../helper-hardhat-config");

const {} = !developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", async () => {
      let fundMe;
      let deployer;
      let mockV3Aggregator;
      const sendValue = ethers.utils.parseEther("1"); // 1 eth
      beforeEach(async () => {
        // deploy our contract using Hardhat deploy
        // now which account do we want this contract to be associated with? this we can do via namedAccounts
        deployer = (await getNamedAccounts()).deployer;
        // fixture allow us to run the entire deploy folder with as many tags as we want
        await deployments.fixture(["all"]);
        // after they are deployed, its time to fetch the contracts
        fundMe = await ethers.getContract("FundMe", deployer); // this will give most recent deployment
        mockV3Aggregator = await ethers.getContract(
          "MockV3Aggregator",
          deployer
        );
      });

      describe("constructor", async () => {
        it("sets the aggregator addresses correctly", async () => {
          const response = await fundMe.getPriceFeed();
          assert.equal(response, mockV3Aggregator.address);
        });
      });

      describe("fund", async () => {
        it("fails if we don't send enough eth", async () => {
          // this is different than asserting something, this function expects an exception
          //   here waffle (expect) can be used,
          await expect(fundMe.fund()).to.be.revertedWith(
            "You need to send more eth"
          );
        });

        it("updates the amount to be funded to the data structure", async () => {
          await fundMe.fund({ value: sendValue });
          const response = await fundMe.getAddressToAmountFunded(deployer);

          assert.equal(response.toString(), sendValue.toString());
        });

        it("adds funder to the funder array", async () => {
          await fundMe.fund({ value: sendValue });

          const funder = await fundMe.getFunder(0);
          assert.equal(funder, deployer);
        });
      });

      describe("withdraw", async () => {
        // in order to test this, our contract should have some amount of money to withdraw
        beforeEach(async () => {
          await fundMe.fund({ value: sendValue });
        });

        it("withdraw eth from a single funder", async () => {
          // Arrange
          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );

          // Act

          const transactioResponse = await fundMe.withdraw();
          const transactionReceipt = await transactioResponse.wait(1);
          //   find the gas cost from transactionReceipt

          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );

          // Assert

          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          );
        });

        it("allows to withdraw when there are multiple funders", async () => {
          const accounts = await ethers.getSigners();

          for (let i = 0; i < 6; ++i) {
            // our fundMe contract was initially connected to deployer account,
            // if we want to fund it via different accounts,
            // we need to connect it with different accounts
            const fundMeConnectedContract = await fundMe.connect(accounts[i]);
            await fundMeConnectedContract.fund({ value: sendValue });
          }

          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );

          //   Act
          const transactioResponse = await fundMe.withdraw();
          const transactionReceipt = await transactioResponse.wait(1);
          //   find the gas cost from transactionReceipt

          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );

          // Assert

          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          );

          //   Make sure the funders are reset properly
          await expect(fundMe.getFunder(0)).to.be.reverted;

          for (let i = 0; i < 6; ++i) {
            assert.equal(
              await fundMe.getAddressToAmountFunded(accounts[i].address),
              0
            );
          }
        });

        it("only allow owner to withdraw", async () => {
          const accounts = await ethers.getSigners();
          const attacker = accounts[1];

          const attackerConnectedContract = await fundMe.connect(attacker);
          await expect(attackerConnectedContract.withdraw()).to.be.revertedWith(
            "FundMe__NotOwner"
          );
        });
      });
    });
