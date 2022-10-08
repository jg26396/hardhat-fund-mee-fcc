/*Method used to deploy the solidity contracts*/

const {networkConfig, developmentChain} = require("../helper-hardhat-config")
const {network} = require("hardhat")
const {verify} = require("../utils/verify")

module.exports = async ({getNamedAccounts,deployments}) => {
    
    const {deploy, log} = deployments
    const {deployer} = await getNamedAccounts()
    const chainId = network.config.chainId

    let ethUsdPriceFeedAddress 
    if(developmentChain.includes(network.name)){
        const ethUsdAggregator = await deployments.get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    }else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }
    log("----------------------------------------------------")
    log("Deploying FundMe and waiting for confirmations...")
    
    //Args is used to pass in the eth/usd price feed address into the contracts constructor
    const args = [ethUsdPriceFeedAddress]
    const fundMe = await deploy("FundMe", {
        from: deployer, 
        args:args, 
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    
    if(!developmentChain.includes(network.name) && process.env.ETHERSCAN_API_KEY){
        await verify(fundMe.address, args)
    }
    log("----------------------------------------------------------------")
}

module.exports.tags = ["all", "fundme"]