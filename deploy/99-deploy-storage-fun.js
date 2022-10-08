const {networkConfig, developmentChain} = require("../helper-hardhat-config")
const {network} = require("hardhat")
const {verify} = require("../utils/verify")
const { keccak256 } = require("ethers/lib/utils")

module.exports = async ({getNamedAccounts,deployments}) => {
    
    const {deploy, log} = deployments
    const {deployer} = await getNamedAccounts()
    const chainId = network.config.chainId
    const abiCoder = new ethers.utils.AbiCoder()

    let ethUsdPriceFeedAddress 
    if(developmentChain.includes(network.name)){
        const ethUsdAggregator = await deployments.get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    }else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }
    log("----------------------------------------------------")
    log("Deploying FunWithStorage and waiting for confirmations...")
    const funWithStorage = await deploy("FunWithStorage", {
        from: deployer,
        args: [],
        log: true,
        // we need to wait if on a live network so we can verify properly
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    
    if (!developmentChain.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(funWithStorage.address, [])
    }

    log("Logging storage...")
    let rawData = ethers.utils.keccak256(abiCoder.encode(["uint256"], [2])) 
    let data = await ethers.provider.getStorageAt(funWithStorage.address, rawData)

    for (let i = 0; i < 10; i++) {
        log(
            `Location ${i}: ${await ethers.provider.getStorageAt(
                funWithStorage.address,
                i
            )}`
        )
        if(i==2){
            data = 
            log(
                `Location ${i}: data at position 0: ${ethers.utils.arrayify(data)}`
            )
        }
    }

    
    const secondElementLocation = ethers.utils.keccak256(
    abiCoder.encode(["uint256"], ["2"])
    )


  const mapElement = await ethers.provider.getStorageAt(
  funWithStorage.address,
  secondElementLocation
)

log(`Location ${secondElementLocation}: ${mapElement}`)

    // You can use this to trace!
    // const trace = await network.provider.send("debug_traceTransaction", [
    //     funWithStorage.transactionHash,
    // ])
    // for (structLog in trace.structLogs) {
    //     if (trace.structLogs[structLog].op == "SSTORE") {
    //         console.log(trace.structLogs[structLog])
    //     }
    // }
    // const firstelementLocation = ethers.utils.keccak256(
    //     "0x0000000000000000000000000000000000000000000000000000000000000002"
    // )
    // const arrayElement = await ethers.provider.getStorageAt(
    //     funWithStorage.address,
    //     firstelementLocation
    // )
    // log(`Location ${firstelementLocation}: ${arrayElement}`)

    // Can you write a function that finds the storage slot of the arrays and mappings?
    // And then find the data in those slots?
}

module.exports.tags = ["storage"]