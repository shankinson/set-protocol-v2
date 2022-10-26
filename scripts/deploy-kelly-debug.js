const hre = require("hardhat");
const axios = require('axios');

const lendingPoolAddressesProviderAddr = "0xd05e3E715d945B59290df0ae8eF85c1BdB684744";
const ammWethAddr = "0x28424507fefb6f7f8e9d3860f56504e4e5f5f390";
const usdcAddr = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
const wethAddr = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";
const wmaticAddr = "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270";

const ethUSDAggregatorAddr = "0xF9680D99D6C9589e2a93a78A04A279e509205945";
const ethUSDAggregatorABI = [{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"latestRoundData","outputs":[{"internalType":"uint80","name":"roundId","type":"uint80"},{"internalType":"int256","name":"answer","type":"int256"},{"internalType":"uint256","name":"startedAt","type":"uint256"},{"internalType":"uint256","name":"updatedAt","type":"uint256"},{"internalType":"uint80","name":"answeredInRound","type":"uint80"}],"stateMutability":"view","type":"function"}];

const wethGatewayAddr = "0xAeBF56223F044a73A513FAD7E148A9075227eD9b";
const wethGatewayABI = [{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"onBehalfOf","type":"address"},{"internalType":"uint16","name":"referralCode","type":"uint16"}],"name":"depositETH","outputs":[],"stateMutability":"payable","type":"function"}];

const aaveLendingPoolAddr = "0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf";
const aaveLendingPoolABI = [{"inputs":[{"internalType":"address","name":"asset","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"address","name":"onBehalfOf","type":"address"},{"internalType":"uint16","name":"referralCode","type":"uint16"}],"name":"deposit","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"asset","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"address","name":"to","type":"address"}],"name":"withdraw","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"}];

const erc20ABI = [{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"guy","type":"address"},{"name":"wad","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}];

const uniswapV3FactoryABI = [{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"},{"internalType":"uint24","name":"","type":"uint24"}],"name":"getPool","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}];
const uniswapV3PoolABI = [{"inputs":[],"name":"slot0","outputs":[{"internalType":"uint160","name":"sqrtPriceX96","type":"uint160"},{"internalType":"int24","name":"tick","type":"int24"},{"internalType":"uint16","name":"observationIndex","type":"uint16"},{"internalType":"uint16","name":"observationCardinality","type":"uint16"},{"internalType":"uint16","name":"observationCardinalityNext","type":"uint16"},{"internalType":"uint8","name":"feeProtocol","type":"uint8"},{"internalType":"bool","name":"unlocked","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"token0","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"token1","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}];

const uniRouterAddr = "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff";
const sushiRouterAddr = "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506";
const uniFactoryAddr = "0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32";
const sushiFactoryAddr = "0xc35DADB65012eC5796536bD9864eD8773aBc74C4";

const amWethAddr = "0x28424507fefb6f7f8e9d3860f56504e4e5f5f390";
const uniswapV3FactoryAddr = "0x1F98431c8aD98523631AE4a59f267346ea31F984";

async function main() {
  
  const accounts = await hre.ethers.getSigners();
  const signer = accounts[0];

  const controllerFactory = await hre.ethers.getContractFactory("Controller");
  const controller = await controllerFactory.deploy(signer.address);

  await controller.deployed();

  console.log("Controller deployed to:", controller.address);

  await controller.initialize([], [], [], []);
  
  console.log("Controller is initialized");

  const integrationRegistryFactory = await hre.ethers.getContractFactory("IntegrationRegistry");
  const integrationRegistry = await integrationRegistryFactory.deploy(controller.address);

  await integrationRegistry.deployed();

  console.log("IntegrationRegistry deployed to:", integrationRegistry.address);

  const INTEGRATION_REGISTRY_RESOURCE_ID = 0;
  await controller.addResource(integrationRegistry.address, INTEGRATION_REGISTRY_RESOURCE_ID);

  console.log("IntegrationRegistry added to controller as resource");

  const debtIssuanceModuleV2Factory = await hre.ethers.getContractFactory("DebtIssuanceModuleV2");
  const debtIssuanceModuleV2 = await debtIssuanceModuleV2Factory.deploy(controller.address);

  await debtIssuanceModuleV2.deployed();

  console.log("DebtIssuanceModuleV2 deployed to:", debtIssuanceModuleV2.address);

  await controller.addModule(debtIssuanceModuleV2.address);

  console.log("DebtIssuanceModuleV2 added to controller");

  const streamingFeeModuleFactory = await hre.ethers.getContractFactory("StreamingFeeModule");
  const streamingFeeModule = await streamingFeeModuleFactory.deploy(controller.address);

  await streamingFeeModule.deployed();

  console.log("StreamingFeeModule deployed to:", streamingFeeModule.address);

  await controller.addModule(streamingFeeModule.address);

  console.log("StreamingFeeModule added to controller");

  const aaveV2Factory = await hre.ethers.getContractFactory("AaveV2");
  const aaveV2 = await aaveV2Factory.deploy();
  await aaveV2.deployed();
  console.log("AaveV2 deployed to:", aaveV2.address);

  const aaveLeverageModuleFactory = await hre.ethers.getContractFactory("AaveLeverageModule", {
    libraries: {
      AaveV2: aaveV2.address
    }
  });
  const aaveLeverageModule = await aaveLeverageModuleFactory.deploy(controller.address, lendingPoolAddressesProviderAddr);

  await aaveLeverageModule.deployed();

  console.log("AaveLeverageModule deployed to:", aaveLeverageModule.address);

  await controller.addModule(aaveLeverageModule.address);

  console.log("AaveLeverageModule added to controller");

  await aaveLeverageModule.updateAnySetAllowed(true);
  console.log(`AaveLeverageModule any set allowed`);

  await integrationRegistry.addIntegration(aaveLeverageModule.address, "DefaultIssuanceModule", debtIssuanceModuleV2.address);
  console.log(`DefaultIssuanceModule set`);

  const ammSplitterFactory = await hre.ethers.getContractFactory("AMMSplitter");
  const ammSplitter = await ammSplitterFactory.deploy(uniRouterAddr, sushiRouterAddr, uniFactoryAddr, sushiFactoryAddr);
  await ammSplitter.deployed();
  console.log("AAMSplitter deployed to:", ammSplitter.address);

  const uniswapV2ExchangeAdapterFactory = await hre.ethers.getContractFactory("UniswapV2ExchangeAdapter");
  const uniswapV2ExchangeAdapter = await uniswapV2ExchangeAdapterFactory.deploy(ammSplitter.address);
  await uniswapV2ExchangeAdapter.deployed();
  console.log("UniswapV2ExchangeAdapter deployed to:", uniswapV2ExchangeAdapter.address);

  await integrationRegistry.addIntegration(aaveLeverageModule.address, "AMMSplitterExchangeAdapter", uniswapV2ExchangeAdapter.address);
  console.log("UniswapV2ExchangeAdapter integration added");

  const setTokenCreatorFactory = await hre.ethers.getContractFactory("SetTokenCreator");
  const setTokenCreator = await setTokenCreatorFactory.deploy(controller.address);

  await setTokenCreator.deployed();

  console.log("SetTokenCreator deployed to:", setTokenCreator.address);

  await controller.addFactory(setTokenCreator.address);

  console.log("SetTokenCreator added to controller");
  
  const ethUSDAggregator = await hre.ethers.getContractAt(ethUSDAggregatorABI, ethUSDAggregatorAddr);
  const ethUSDAggregatorDecimals = await ethUSDAggregator.decimals();
  const {answer} = await ethUSDAggregator.latestRoundData();
  console.log(`ETH/USD Aggregator deployed to: ${ethUSDAggregator.address} decimals: ${ethUSDAggregatorDecimals} answer: ${answer}`);

  // Get the pre-scaled amount of ETH
  const amount = hre.ethers.utils.parseEther("100")
    .mul(hre.ethers.BigNumber.from(10).pow(ethUSDAggregatorDecimals)).div(answer);
  console.log(`Set ammWeth Units: ${hre.ethers.utils.formatEther(amount)}`);
  let receipt = await setTokenCreator.connect(signer).create(
    [ammWethAddr],
    [amount],
    [aaveLeverageModule.address, debtIssuanceModuleV2.address, streamingFeeModule.address],
    signer.address,
    "Kelly ETH",
    "KETH");

  const result = await receipt.wait();
  console.log("SetToken has been created in tx: ", receipt.hash);

  const setTokenAddr = result.events.find(obj => obj.event === "SetTokenCreated").args[0];
  console.log(`SetToken deployed to: ${setTokenAddr}`);

  const setToken = await hre.ethers.getContractAt("SetToken", setTokenAddr);
  const name = await setToken.name();
  const symbol = await setToken.symbol();
  console.log(`${symbol}: ${name} @ ${setToken.address}`);

  receipt = await streamingFeeModule.connect(signer).initialize(setTokenAddr, {
    feeRecipient: signer.address,
    maxStreamingFeePercentage: hre.ethers.utils.parseEther("0.4"),
    streamingFeePercentage: hre.ethers.utils.parseEther("0.0195"),
    lastStreamingFeeTimestamp: 0
  });

  await receipt.wait();
  console.log("Streaming Fee has been initialized in tx: ", receipt.hash);

  receipt = await debtIssuanceModuleV2.connect(signer).initialize(
    setTokenAddr,
    hre.ethers.utils.parseEther("0.01"),
    hre.ethers.utils.parseEther("0.001"),
    hre.ethers.utils.parseEther("0.001"),
    signer.address,
    hre.ethers.constants.AddressZero);

  await receipt.wait();
  console.log("Debt Issuance Module has been initialized in tx: ", receipt.hash);

  receipt = await aaveLeverageModule.connect(signer).initialize(
    setTokenAddr,
    [wethAddr],
    [usdcAddr]);

  await receipt.wait();
  console.log("Aave Leverage Module has been initialized in tx: ", receipt.hash);

  const weth = await hre.ethers.getContractAt(erc20ABI, wethAddr);
  const wethDecimals = await weth.decimals();
  let wethBalance = await weth.balanceOf(signer.address);
  console.log(`WETH Balance: ${hre.ethers.utils.formatEther(wethBalance)}`);

  const wethGateway = await hre.ethers.getContractAt(wethGatewayABI, wethGatewayAddr);
  receipt = await wethGateway.connect(signer).depositETH(aaveLendingPoolAddr, signer.address, 0, {value: hre.ethers.utils.parseEther("10000")});

  await receipt.wait();
  console.log("MATIC added to lending pool in tx: ", receipt.hash);

  const aaveLendingPool = await hre.ethers.getContractAt(aaveLendingPoolABI, aaveLendingPoolAddr);
  receipt = await aaveLendingPool.connect(signer).withdraw(wmaticAddr, hre.ethers.constants.Two.pow(256).sub(1), signer.address);

  await receipt.wait();
  console.log("WMATIC withdrawn in tx: ", receipt.hash);

  const wmatic = await hre.ethers.getContractAt(erc20ABI, wmaticAddr);
  const wmaticBalance = await wmatic.balanceOf(signer.address);
  console.log(`WMATIC Balance: ${hre.ethers.utils.formatEther(wmaticBalance)}`);

  let quoteUrl = `https://polygon.api.0x.org/swap/v1/quote?sellToken=${wmaticAddr}&buyToken=${wethAddr}&sellAmount=${wmaticBalance}&slippagePercentage=0.01&enableSlippageProtection=true`;
  let response = await axios.get(quoteUrl);
  if(response.status != 200) {
    throw response.statusText;
  }

  receipt = await wmatic.approve(response.data.to, response.data.sellAmount);
  await receipt.wait();

  const tx = {to: response.data.to, data: response.data.data}
  receipt = await signer.sendTransaction(tx);
  await receipt.wait();

  wethBalance = await weth.balanceOf(signer.address);
  console.log(`WETH Balance: ${hre.ethers.utils.formatEther(wethBalance)}`);

  receipt = await weth.approve(aaveLendingPool.address, wethBalance);
  await receipt.wait();

  receipt = await aaveLendingPool.deposit(wethAddr, wethBalance, signer.address, 0);
  await receipt.wait();

  wethBalance = await weth.balanceOf(signer.address);
  console.log(`WETH Balance: ${hre.ethers.utils.formatEther(wethBalance)}`);

  const ammWeth = await hre.ethers.getContractAt(erc20ABI, ammWethAddr);
  let ammWethBalance = await ammWeth.balanceOf(signer.address);
  console.log(`ammWETH Balance: ${hre.ethers.utils.formatEther(ammWethBalance)}`);

  let setTokenBalance = await setToken.balanceOf(signer.address);
  console.log(`Set Token Balance: ${hre.ethers.utils.formatEther(setTokenBalance)}`);

  const setTokenAmount = hre.ethers.utils.parseEther("10");
  let [componentAddresses,equityNotional,debtNotional] = await debtIssuanceModuleV2.getRequiredComponentIssuanceUnits(setTokenAddr, setTokenAmount);
  
  receipt = await ammWeth.approve(debtIssuanceModuleV2.address, equityNotional[0]);
  await receipt.wait();

  receipt = await debtIssuanceModuleV2.issue(setTokenAddr, setTokenAmount, signer.address);
  await receipt.wait();

  setTokenBalance = await setToken.balanceOf(signer.address);
  console.log(`Set Token Balance: ${hre.ethers.utils.formatEther(setTokenBalance)}`);

  const setSupply = await setToken.totalSupply();
  console.log(`Set Token Supply: ${hre.ethers.utils.formatEther(setSupply)}`);

  const usdc = await hre.ethers.getContractAt(erc20ABI, usdcAddr);
  const usdcDecimals = await usdc.decimals();
  const decimalDelta = wethDecimals - usdcDecimals;  

  const positions = await setToken.getPositions();
  console.log(`Positions: ${positions}`);

  const borrowAmount = hre.ethers.utils.parseUnits("100", 6).div(2);
  let expectedAmount = amount.mul(99).div(200);
  console.log(`Borrow Amount: ${borrowAmount} Expected Amount: ${expectedAmount}`);

  receipt = await aaveLeverageModule.connect(signer)
    .lever(setTokenAddr, usdcAddr, wethAddr, borrowAmount, expectedAmount, "AMMSplitterExchangeAdapter", []);
  await receipt.wait();

  [componentAddresses,equityNotional,debtNotional] = await debtIssuanceModuleV2.getRequiredComponentIssuanceUnits(setTokenAddr, hre.ethers.utils.parseEther("1"));
  console.log(`${componentAddresses} ${equityNotional} ${debtNotional}`);

  let etherValue = equityNotional[0].mul(answer).div(hre.ethers.BigNumber.from("10").pow(12+ethUSDAggregatorDecimals));
  console.log(`Ether Value: ${etherValue}`);

  let leverage = etherValue.mul(hre.ethers.BigNumber.from(10).pow(6)).div(etherValue.sub(debtNotional[1]));
  console.log(`Leverage: ${hre.ethers.utils.formatUnits(leverage, 6)}`);

  const tokenPrice = etherValue.sub(debtNotional[1]);
  const ethValue = tokenPrice.mul(15).div(10);
  const usdcValue = tokenPrice.sub(ethValue).abs();
  const ethAmount = ethValue.mul(hre.ethers.BigNumber.from("10").pow(decimalDelta+ethUSDAggregatorDecimals)).div(answer);
  console.log(`Token Price: ${tokenPrice} ethValue: ${ethValue} usdcValue: ${usdcValue} ethAmount: ${ethAmount}`);

  const deltaEth = equityNotional[0].sub(ethAmount);
  const deltaUsdc = debtNotional[1].sub(usdcValue);
  console.log(`DeltaEth: ${deltaEth} DeltaUSDC: ${deltaUsdc}`);

  if( deltaEth.gt(hre.ethers.constants.Zero)) {
    expectedAmount = deltaUsdc.mul(99).div(100);
    console.log(`Expected Amount: ${expectedAmount}`);
    weth.approve(aaveLeverageModule.address, deltaEth);
    receipt = await aaveLeverageModule.connect(signer)
      .delever(setTokenAddr, wethAddr, usdcAddr, deltaEth, expectedAmount, "AMMSplitterExchangeAdapter", []);
    await receipt.wait();
  }
  else {
    expectedAmount = deltaEth.abs().mul(99).div(100);
    console.log(`Expected Amount: ${expectedAmount}`);
    receipt = await aaveLeverageModule.connect(signer)
      .lever(setTokenAddr, usdcAddr, wethAddr, deltaUsdc.abs(), expectedAmount, "AMMSplitterExchangeAdapter", []);
    await receipt.wait();
  }

  [componentAddresses,equityNotional,debtNotional] = await debtIssuanceModuleV2.getRequiredComponentIssuanceUnits(setTokenAddr, hre.ethers.utils.parseEther("1"));
  console.log(`${componentAddresses} ${equityNotional} ${debtNotional}`);

  etherValue = equityNotional[0].mul(answer).div(hre.ethers.BigNumber.from("10").pow(decimalDelta+ethUSDAggregatorDecimals));
  console.log(`Ether Value: ${etherValue}`);

  leverage = etherValue.mul(hre.ethers.BigNumber.from(10).pow(usdcDecimals)).div(etherValue.sub(debtNotional[1]));
  console.log(`Leverage: ${hre.ethers.utils.formatUnits(leverage, usdcDecimals)}`);

  const flashFactory = await hre.ethers.getContractFactory("Flash");
  const flash = await flashFactory.deploy(uniswapV3FactoryAddr, debtIssuanceModuleV2.address, setToken.address,
    aaveLendingPool.address, aaveLeverageModule.address, amWethAddr, wethAddr, usdcAddr, 500);
  await flash.deployed();

  const uniswapV3Factory = await hre.ethers.getContractAt(uniswapV3FactoryABI, uniswapV3FactoryAddr);
  console.log("UniswapV3Factory deployed to:", uniswapV3Factory.address);

  const uniswapV3PoolAddr = await uniswapV3Factory.getPool(wethAddr, usdcAddr, 500);
  console.log(`UniswapV3Pool address: ${uniswapV3PoolAddr}`);

  const uniswapV3Pool = await hre.ethers.getContractAt(uniswapV3PoolABI, uniswapV3PoolAddr);
  let [sqrtPriceX96] = await uniswapV3Pool.slot0();
  console.log(`sqrtPriceX96: ${sqrtPriceX96}`);

  const debtInETH = (await uniswapV3Pool.token0()) == usdcAddr ? 
    debtNotional[1].mul(sqrtPriceX96).mul(sqrtPriceX96).div(hre.ethers.constants.Two.pow(192)) :
    debtNotional[1].mul(hre.ethers.constants.Two.pow(192)).div(sqrtPriceX96).div(sqrtPriceX96)
  console.log(`Debt in Eth: ${debtInETH}`);

  // Get the unit price in terms of ETH
  const unitPrice = equityNotional[0].sub(debtInETH);
  console.log(`Unit Price: ${unitPrice}`);

  const amWeth = await hre.ethers.getContractAt(erc20ABI, amWethAddr);
  const tokensToMint = hre.ethers.utils.parseEther("60");
  await amWeth.approve(flash.address, unitPrice.mul(tokensToMint));
  await flash.mint(tokensToMint, sqrtPriceX96.mul(99).div(100));

  setTokenBalance = await setToken.balanceOf(signer.address);
  console.log(`Set Token Balance: ${hre.ethers.utils.formatEther(setTokenBalance)}`);

  [sqrtPriceX96] = await uniswapV3Pool.slot0();
  await setToken.approve(flash.address, setTokenBalance);
  await flash.redeem(setTokenBalance, sqrtPriceX96.mul(101).div(99));

  setTokenBalance = await setToken.balanceOf(signer.address);
  console.log(`Set Token Balance: ${hre.ethers.utils.formatEther(setTokenBalance)}`);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });