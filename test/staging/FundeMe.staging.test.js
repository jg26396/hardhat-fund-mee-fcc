const {deployments, ethers, getNamedAccounts, network} = require("hardhat")
const {developmentChanins} = require("../../helper-hardhat-config")


developmentChanins.includes(network.name) ? describe.skip:
describe("FundMe", async function() {
    let fundMe
    let deployer
    let mockV3Aggreagator
    const sendValue = ethers.utils.parseEther("1")

    beforeEach(async function() {
        deployer = (await getNamedAccounts()).deployer
        fundMe = await ethers.getContract("FundMe")
        mockV3Aggreagator = await ethers.getContract("MockV3Aggregator", deployer)
    })
    
    it("allows people to fund and withdraw", async function () {
        const fundTxResponse = await fundMe.fund({ value: sendValue })
        await fundTxResponse.wait(1)
        const withdrawTxResponse = await fundMe.withdraw()
        await withdrawTxResponse.wait(1)

        const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
        )
        console.log(
            endingFundMeBalance.toString() +
                " should equal 0, running assert equal..."
        )
        assert.equal(endingFundMeBalance.toString(), "0")
    })
})
