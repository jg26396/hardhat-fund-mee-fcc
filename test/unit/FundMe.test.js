const { assert, expect } = require("chai")
const {deployments, ethers, getNamedAccounts} = require("hardhat")


!developmentChanins.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function() {
        let fundMe
        let deployer
        let mockV3Aggreagator
        const sendValue = ethers.utils.parseEther("1")

        beforeEach(async function() {
            //deploy our fundMe contract using hardhat-deploy
            const accounts = await ethers.getSigners()
            deployer = (await getNamedAccounts()).deployer
            await deployments.fixture(["all"])
            fundMe = await ethers.getContract("FundMe")
            mockV3Aggreagator = await ethers.getContract("MockV3Aggregator", deployer)
        })
        describe("constructor", async function() {
            it("sets the aggregator address correctly", async function() {
            const response = await fundMe.getPriceFeed() 
            assert.equal(response, mockV3Aggreagator.address)
            })
        })

        describe("fund", async function() {
            it("Fails if you do not send enough ETH", async function() {
                await expect(fundMe.fund()).to.be.revertedWith("You need to spend more ETH")
            })

            it("Updates the amount funded data structure", async function() {
            await fundMe.fund({value: sendValue})
            const response = await fundMe.getAddressToAmountFunded(deployer) 
            assert.equal(response.toString(), sendValue.toString())
            })

            it("Adds funded to array of s_funders", async function() {
                await fundMe.fund({value: sendValue})
                const funder = await fundMe.getFunder(0)
                assert.equal(funder, deployer)
            })
        })

        describe("withdraw", async function() {
            beforeEach(async function() {
                await fundMe.fund({value: sendValue})
            })

            it("withdraw ETH from a single funder", async function() {
                /* 
                    Order to think about running test:
                    Arrange 
                    Act 
                    Assert
                */

                //Arrange
                const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
                const startingDeployerBalance = await fundMe.provider.getBalance(deployer)

                //Act
                const transactionResponse = await fundMe.withdraw()
                const transactionReciept = await transactionResponse.wait(1)
                const {gasUsed, effectiveGasPrice} = transactionReciept
                const gasCost = gasUsed.mul(effectiveGasPrice)
                const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
                const endingDeployerBalance = await fundMe.provider.getBalance(deployer)
                //gasCost


                //Assert
                assert.equal(endingFundMeBalance, 0)
                //.add() is used to make adding Big Numbers easier https://docs.ethers.io/v5/api/utils/bignumber/
                assert.equal(startingFundMeBalance.add(startingDeployerBalance).toString(), endingDeployerBalance.add(gasCost).toString())
            })

            it("allows us to withdraw with multiple s_funders", async function() {
                //Arrange
                const accounts = await ethers.getSigners()
                for(let i=1; i< 6; i++){
                    const fundMeConnectedContract = await fundMe.connect(
                        accounts[i]
                    )
                    await fundMeConnectedContract.fund({ value: sendValue })
                }
                const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
                const startingDeployerBalance = await fundMe.provider.getBalance(deployer)
                
                
                //Act
                const transactionResponse = await fundMe.withdraw()
                const transactionReciept = await transactionResponse.wait(1)
                const {gasUsed, effectiveGasPrice} = transactionReciept
                const gasCost = gasUsed.mul(effectiveGasPrice)

                //Assert
                const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
                const endingDeployerBalance = await fundMe.provider.getBalance(deployer)
                assert.equal(endingFundMeBalance, 0)
                //.add() is used to make adding Big Numbers easier https://docs.ethers.io/v5/api/utils/bignumber/
                assert.equal(
                    startingFundMeBalance.add(startingDeployerBalance).toString(), 
                    endingDeployerBalance.add(gasCost).toString()
                )

                //Make sure that the s_funders (array) is reset properly
                await expect(fundMe.getFunder(0)).to.be.reverted

                for(i=1; i<6; i++){
                    assert.equal(
                        await fundMe.getAddressToAmountFunded(accounts[i].address), 
                        0
                    )
                }
            })

            it("Only allows the owner to withdraw", async function (){
                const accounts = await ethers.getSigners()
                const fundMeConnectedContract = await fundMe.connect(accounts[1])
                await expect(fundMeConnectedContract.withdraw()).to.be.revertedWithCustomError(
                    fundMe,
                    "FundMe__NotOwner"
                )
            })
            
            it("allows us to withdraw with multiple s_funders", async function() {
                //Arrange
                const accounts = await ethers.getSigners()
                for(let i=1; i< 6; i++){
                    const fundMeConnectedContract = await fundMe.connect(
                        accounts[i]
                    )
                    await fundMeConnectedContract.fund({ value: sendValue })
                }
                const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
                const startingDeployerBalance = await fundMe.provider.getBalance(deployer)
                
                
                //Act
                const transactionResponse = await fundMe.cheaperWithdraw()
                const transactionReciept = await transactionResponse.wait(1)
                const {gasUsed, effectiveGasPrice} = transactionReciept
                const gasCost = gasUsed.mul(effectiveGasPrice)

                //Assert
                const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
                const endingDeployerBalance = await fundMe.provider.getBalance(deployer)
                assert.equal(endingFundMeBalance, 0)
                //.add() is used to make adding Big Numbers easier https://docs.ethers.io/v5/api/utils/bignumber/
                assert.equal(
                    startingFundMeBalance.add(startingDeployerBalance).toString(), 
                    endingDeployerBalance.add(gasCost).toString()
                )

                //Make sure that the s_funders (array) is reset properly
                await expect(fundMe.getFunder(0)).to.be.reverted

                for(i=1; i<6; i++){
                    assert.equal(
                        await fundMe.getAddressToAmountFunded(accounts[i].address), 
                        0
                    )
                }
            })
            
        })
    })