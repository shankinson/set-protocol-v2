const hre = require("hardhat");
const axios = require('axios');

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const zeroExApiKey = process.env.ZEROEX_KEY

// const controllerAddr = "0x75FBBDEAfE23a48c0736B2731b956b7a03aDcfB2";
// const integrationRegistryAddr = "0x4c4C649455c6433dC48ff1571C9e50aC58f0CeFA";
// const setTokenCreatorAddr = "0x14f0321be5e581abF9d5BC76260bf015Dc04C53d";
// const debtIssuanceeModuleV2Addr = "0xf2dC2f456b98Af9A6bEEa072AF152a7b0EaA40C9";
// const aaveLeverageModuleAddr = "0xB7F72e15239197021480EB720E1495861A1ABdce";
const poolAddressesProviderAddr = "0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb";
const usdcAddr = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
const wethAddr = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";
const wmaticAddr = "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270";
const uniswapV3FactoryAddr = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
const quoterAddr = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6";
const aPolWETHAddr = "0xe50fA9b3c56FfB159cB0FCA61F5c9D750e8128c8";
const zeroExchangeAddr = "0xDef1C0ded9bec7F1a1670819833240f027b25EfF";
const aavePoolAddr = "0x794a61358D6845594F94dc1DB02A252b5b4814aD";
const aavePoolABI = [{"inputs":[{"internalType":"address","name":"asset","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"address","name":"onBehalfOf","type":"address"},{"internalType":"uint16","name":"referralCode","type":"uint16"}],"name":"supply","outputs":[],"stateMutability":"nonpayable","type":"function"}];

const ethUSDAggregatorAddr = "0xF9680D99D6C9589e2a93a78A04A279e509205945";
const ethUSDAggregatorABI = [{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"latestRoundData","outputs":[{"internalType":"uint80","name":"roundId","type":"uint80"},{"internalType":"int256","name":"answer","type":"int256"},{"internalType":"uint256","name":"startedAt","type":"uint256"},{"internalType":"uint256","name":"updatedAt","type":"uint256"},{"internalType":"uint80","name":"answeredInRound","type":"uint80"}],"stateMutability":"view","type":"function"}];

const aaveLendingPoolAddr = "0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf";
const aaveLendingPoolABI = [{"inputs":[{"internalType":"address","name":"asset","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"address","name":"onBehalfOf","type":"address"},{"internalType":"uint16","name":"referralCode","type":"uint16"}],"name":"deposit","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"asset","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"address","name":"to","type":"address"}],"name":"withdraw","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"}];

const erc20ABI = [{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"guy","type":"address"},{"name":"wad","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}];
const wmaticABI = [{"constant":false,"inputs":[{"name":"guy","type":"address"},{"name":"wad","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"deposit","outputs":[],"payable":true,"stateMutability":"payable","type":"function"}];

const uniswapV3FactoryABI = [{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"},{"internalType":"uint24","name":"","type":"uint24"}],"name":"getPool","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}];
const uniswapV3PoolABI = [{"inputs":[],"name":"slot0","outputs":[{"internalType":"uint160","name":"sqrtPriceX96","type":"uint160"},{"internalType":"int24","name":"tick","type":"int24"},{"internalType":"uint16","name":"observationIndex","type":"uint16"},{"internalType":"uint16","name":"observationCardinality","type":"uint16"},{"internalType":"uint16","name":"observationCardinalityNext","type":"uint16"},{"internalType":"uint8","name":"feeProtocol","type":"uint8"},{"internalType":"bool","name":"unlocked","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"token0","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"token1","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}];
const quoterABI = [{"inputs":[{"internalType":"address","name":"tokenIn","type":"address"},{"internalType":"address","name":"tokenOut","type":"address"},{"internalType":"uint24","name":"fee","type":"uint24"},{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint160","name":"sqrtPriceLimitX96","type":"uint160"}],"name":"quoteExactInputSingle","outputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"}],"stateMutability":"nonpayable","type":"function"}];

const MAGICVALUE = 0x1626ba7e;

function babylonianSqrt(x) {

  let guess = x;
  while(true) {
      const next = x.div(guess).add(guess).div(hre.ethers.constants.Two);
      if( next.eq(guess) ) {
          return guess;
      }
      else {
          guess = next;
      }
  }    

}

function sign(address, data) {
  return hre.network.provider.send(
    "eth_sign",
    [address, data]
  )
}

async function main() {
  
  const accounts = await hre.ethers.getSigners();
  const signer = accounts[0];
  const operator = accounts[1];

  // We get the contract to deploy
  // const controller = await hre.ethers.getContractAt("Controller", controllerAddr);
  // console.log("Controller deployed to:", controller.address);

  const controllerFactory = await hre.ethers.getContractFactory("Controller");
  const controller = await controllerFactory.deploy(signer.address);

  await controller.deployed();

  console.log("Controller deployed to:", controller.address);

  await controller.initialize([], [], [], []);
  
  console.log("Controller is initialized");

  // const integrationRegistry = await hre.ethers.getContractAt("IntegrationRegistry", integrationRegistryAddr);
  // console.log("IntegrationRegistry deployed to:", integrationRegistry.address);

  const integrationRegistryFactory = await hre.ethers.getContractFactory("IntegrationRegistry");
  const integrationRegistry = await integrationRegistryFactory.deploy(controller.address);

  await integrationRegistry.deployed();

  console.log("IntegrationRegistry deployed to:", integrationRegistry.address);

  const INTEGRATION_REGISTRY_RESOURCE_ID = 0;
  await controller.addResource(integrationRegistry.address, INTEGRATION_REGISTRY_RESOURCE_ID);

  console.log("IntegrationRegistry added to controller as resource");

  // const debtIssuanceModuleV2 = await hre.ethers.getContractAt("DebtIssuanceModuleV2", debtIssuanceeModuleV2Addr);
  // console.log("DebtIssuanceModuleV2 deployed to:", debtIssuanceModuleV2.address);

  const debtIssuanceModuleV2Factory = await hre.ethers.getContractFactory("DebtIssuanceModuleV2");
  const debtIssuanceModuleV2 = await debtIssuanceModuleV2Factory.deploy(controller.address);

  await debtIssuanceModuleV2.deployed();

  console.log("DebtIssuanceModuleV2 deployed to:", debtIssuanceModuleV2.address);

  await controller.addModule(debtIssuanceModuleV2.address);

  console.log("DebtIssuanceModuleV2 added to controller");

  // const aaveLeverageModule = await hre.ethers.getContractAt("AaveLeverageModule", aaveLeverageModuleAddr);
  // console.log("AaveLeverageModule deployed to:", aaveLeverageModule.address);

  const aaveV3Factory = await hre.ethers.getContractFactory("AaveV3");
  const aaveV3 = await aaveV3Factory.deploy();
  await aaveV3.deployed();
  console.log("AaveV3 deployed to:", aaveV3.address);

  const aaveV3LeverageModuleFactory = await hre.ethers.getContractFactory("AaveV3LeverageModule", {
    libraries: {
      AaveV3: aaveV3.address
    }
  });
  
  const aaveV3LeverageModule = await aaveV3LeverageModuleFactory.deploy(controller.address, poolAddressesProviderAddr);
  await aaveV3LeverageModule.deployed();

  console.log("AaveV3LeverageModule deployed to:", aaveV3LeverageModule.address);

  await controller.addModule(aaveV3LeverageModule.address);

  console.log("AaveV3LeverageModule added to controller");

  await aaveV3LeverageModule.updateAnySetAllowed(true);
  console.log(`AaveV3LeverageModule any set allowed`);

  await integrationRegistry.addIntegration(aaveV3LeverageModule.address, "DefaultIssuanceModule", debtIssuanceModuleV2.address);
  console.log(`DefaultIssuanceModule set`);

  // const setTokenCreator = await hre.ethers.getContractAt("SetTokenCreator", setTokenCreatorAddr);
  // console.log("SetTokenCreator deployed to:", setTokenCreator.address);

  const zeroExchangeAdapterFactory = await hre.ethers.getContractFactory("ZeroExApiAdapter");
  const zeroExchangeAdapter = await zeroExchangeAdapterFactory.deploy(zeroExchangeAddr, wmaticAddr);
  await zeroExchangeAdapter.deployed();
  console.log("ZeroExApiAdapter deployed to:", zeroExchangeAdapter.address);

  await integrationRegistry.addIntegration(aaveV3LeverageModule.address, "ZeroExchangeAdapter", zeroExchangeAdapter.address);
  console.log("ZeroExchangeAdapter integration added");

  const setTokenCreatorFactory = await hre.ethers.getContractFactory("SetTokenCreator");
  const setTokenCreator = await setTokenCreatorFactory.deploy(controller.address);

  await setTokenCreator.deployed();

  console.log("SetTokenCreator deployed to:", setTokenCreator.address);

  await controller.addFactory(setTokenCreator.address);

  console.log("SetTokenCreator added to controller");

  const kellyManagerFactory = await hre.ethers.getContractFactory("KellyManager");
  const kellyManager = await kellyManagerFactory.deploy(
    aaveV3LeverageModule.address,
    hre.ethers.utils.parseEther("1.5"),
    hre.ethers.utils.parseEther("0.99"),
    hre.ethers.utils.parseUnits("250", "gwei")
  );
  await kellyManager.deployed();
  console.log("KellyManager deployed to:", kellyManager.address);

  const b = "Version 1";
  const hash = hre.ethers.utils.hashMessage(b);
  let signature = await sign(signer.address, hre.ethers.utils.hexlify(hre.ethers.utils.toUtf8Bytes(b)));
  let isSigValid = await kellyManager.isValidSignature(hash, signature);
  if( isSigValid != MAGICVALUE) {
    throw "invalid signature";
  }

  const operatorRole = await kellyManager.OPERATOR_ROLE();
  await kellyManager.grantRole(operatorRole, operator.address);
  console.log(`Operator role has been granted`);

  const ethUSDAggregator = await hre.ethers.getContractAt(ethUSDAggregatorABI, ethUSDAggregatorAddr);
  const ethUSDAggregatorDecimals = await ethUSDAggregator.decimals();
  const {answer} = await ethUSDAggregator.latestRoundData();
  console.log(`ETH/USD Aggregator deployed to: ${ethUSDAggregator.address} decimals: ${ethUSDAggregatorDecimals} answer: ${answer}`);

  // Get the pre-scaled amount of ETH
  const amount = hre.ethers.utils.parseEther("100")
    .mul(hre.ethers.BigNumber.from(10).pow(ethUSDAggregatorDecimals)).div(answer);
  console.log(`Set Weth Units: ${hre.ethers.utils.formatEther(amount)}`);
  let receipt = await setTokenCreator.connect(signer).create(
    [aPolWETHAddr],
    [amount],
    [aaveV3LeverageModule.address, debtIssuanceModuleV2.address],
    kellyManager.address,
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

  const kellyManager2 = await kellyManagerFactory.deploy(
    aaveV3LeverageModule.address,
    hre.ethers.utils.parseEther("1.5"),
    hre.ethers.utils.parseEther("0.99"),
    hre.ethers.utils.parseUnits("250", "gwei")
  );
  await kellyManager2.deployed();
  console.log("KellyManager 2 deployed to:", kellyManager2.address);

  signature = await sign(signer.address, hre.ethers.utils.hexlify(hre.ethers.utils.toUtf8Bytes(b)));
  isSigValid = await kellyManager2.isValidSignature(hash, signature);
  if( isSigValid != MAGICVALUE) {
    throw "invalid signature";
  }

  let bytecode = setToken.interface.encodeFunctionData("setManager", [kellyManager2.address]);
  receipt = await kellyManager.invoke(setToken.address, 0, bytecode);

  await receipt.wait();
  console.log("SetToken manager has been changed in tx: ", receipt.hash);

  await kellyManager2.grantRole(operatorRole, operator.address);
  console.log(`Operator role has been granted`);  

  bytecode = debtIssuanceModuleV2.interface.encodeFunctionData("initialize", [
    setTokenAddr,
    hre.ethers.utils.parseEther("0.000"),
    hre.ethers.utils.parseEther("0.000"),
    hre.ethers.utils.parseEther("0.000"),
    signer.address,
    hre.ethers.constants.AddressZero
  ]);
  receipt = await kellyManager2.invoke(debtIssuanceModuleV2.address, 0, bytecode);

  await receipt.wait();
  console.log("Debt Issuance Module has been initialized in tx: ", receipt.hash);

  bytecode = aaveV3LeverageModule.interface.encodeFunctionData("initialize", [
    setTokenAddr,
    [wethAddr],
    [usdcAddr]
  ]);
  receipt = await kellyManager2.invoke(aaveV3LeverageModule.address, 0, bytecode);

  await receipt.wait();
  console.log("Aave Leverage Module has been initialized in tx: ", receipt.hash);

  const weth = await hre.ethers.getContractAt(erc20ABI, wethAddr);
  const wethDecimals = await weth.decimals();
  let wethBalance = await weth.balanceOf(signer.address);
  console.log(`WETH Balance: ${hre.ethers.utils.formatEther(wethBalance)}`);

  const wmatic = await hre.ethers.getContractAt(wmaticABI, wmaticAddr);
  receipt = await wmatic.connect(signer).deposit({value: hre.ethers.utils.parseEther("100000")});

  await receipt.wait();
  console.log("MATIC wrapped in tx: ", receipt.hash);

  const wmaticBalance = await wmatic.balanceOf(signer.address);
  console.log(`WMATIC Balance: ${hre.ethers.utils.formatEther(wmaticBalance)}`);

  let quoteUrl = `https://polygon.api.0x.org/swap/v1/quote?sellToken=${wmaticAddr}&buyToken=${wethAddr}&sellAmount=${wmaticBalance}&slippagePercentage=0.01&enableSlippageProtection=true&priceImpactProtectionPercentage=0.01`;
  let response = await axios.get(quoteUrl, {headers: {'0x-api-key': zeroExApiKey}});
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

  const aavePool = await hre.ethers.getContractAt(aavePoolABI, aavePoolAddr);
  console.log(`aavePool address: ${aavePool.address}`);

  receipt = await weth.approve(aavePool.address, wethBalance);
  await receipt.wait();

  receipt = await aavePool.supply(wethAddr, wethBalance, signer.address, 0);
  await receipt.wait();

  wethBalance = await weth.balanceOf(signer.address);
  console.log(`WETH Balance: ${hre.ethers.utils.formatEther(wethBalance)}`);

  const aPolWETH = await hre.ethers.getContractAt(erc20ABI, aPolWETHAddr);
  let aPolWETHBalance = await aPolWETH.balanceOf(signer.address);
  console.log(`aPolWETH Balance: ${hre.ethers.utils.formatEther(aPolWETHBalance)}`);

  let setTokenBalance = await setToken.balanceOf(signer.address);
  console.log(`Set Token Balance: ${hre.ethers.utils.formatEther(setTokenBalance)}`);

  const setTokenAmount = hre.ethers.utils.parseEther("10");
  let [componentAddresses,equityNotional,debtNotional] = await debtIssuanceModuleV2.getRequiredComponentIssuanceUnits(setTokenAddr, setTokenAmount);
  
  receipt = await aPolWETH.approve(debtIssuanceModuleV2.address, equityNotional[0]);
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

  const borrowAmount = hre.ethers.utils.parseUnits("100", usdcDecimals).div(2);
  let expectedAmount = amount.mul(99).div(200);
  console.log(`Borrow Amount: ${borrowAmount} Expected Amount: ${expectedAmount}`);

  let totalBorrowAmount = borrowAmount.mul(setSupply).div(hre.ethers.constants.WeiPerEther);
  response = await axios.get(`https://polygon.api.0x.org/swap/v1/quote?buyToken=${wethAddr}&sellToken=${usdcAddr}&sellAmount=${totalBorrowAmount}&slippagePercentage=0.01&enableSlippageProtection=true&priceImpactProtectionPercentage=0.01`, {headers: {'0x-api-key': zeroExApiKey}});
  if(response.status != 200) {
    throw response.statusText;
  }
  let guaranteedPrice = hre.ethers.utils.parseEther(response.data.guaranteedPrice);
  let minAmount = totalBorrowAmount.mul(guaranteedPrice).div(hre.ethers.BigNumber.from(10).pow(usdcDecimals));
  if( minAmount.lt(expectedAmount) ) {
    throw `minAmount: ${minAmount} less than expectedAmount: ${expectedAmount}`;
  }
  let minAmountPerToken = minAmount.mul(hre.ethers.constants.WeiPerEther).div(setSupply);
  await delay(1000);
  console.log(`Total Borrow Amount: ${totalBorrowAmount}, minAmount: ${minAmount}`);

  bytecode = aaveV3LeverageModule.interface.encodeFunctionData("lever", [
    setTokenAddr, usdcAddr, wethAddr, borrowAmount, minAmountPerToken, "ZeroExchangeAdapter", response.data.data
  ]);
  receipt = await kellyManager2.invoke(aaveV3LeverageModule.address, 0, bytecode);
  await receipt.wait();

  [componentAddresses,equityNotional,debtNotional] = await debtIssuanceModuleV2.getRequiredComponentIssuanceUnits(setTokenAddr, hre.ethers.utils.parseEther("1"));
  console.log(`${componentAddresses} ${equityNotional} ${debtNotional}`);

  let etherValue = equityNotional[0].mul(answer).div(hre.ethers.BigNumber.from("10").pow(decimalDelta+ethUSDAggregatorDecimals));
  console.log(`Ether Value: ${etherValue}`);

  let leverage = etherValue.mul(hre.ethers.BigNumber.from(10).pow(usdcDecimals)).div(etherValue.sub(debtNotional[1]));
  console.log(`Leverage: ${hre.ethers.utils.formatUnits(leverage, usdcDecimals)}`);

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
    const totalDeltaEth = deltaEth.mul(setSupply).div(hre.ethers.constants.WeiPerEther);
    response = await axios.get(`https://polygon.api.0x.org/swap/v1/quote?buyToken=${usdcAddr}&sellToken=${wethAddr}&sellAmount=${totalDeltaEth}&slippagePercentage=0.01&enableSlippageProtection=true&priceImpactProtectionPercentage=0.01`, {headers: {'0x-api-key': zeroExApiKey}});
    if(response.status != 200) {
      throw response.statusText;
    }
    guaranteedPrice = hre.ethers.utils.parseUnits(response.data.guaranteedPrice, 6);
    minAmount = totalDeltaEth.mul(guaranteedPrice).div(hre.ethers.BigNumber.from(10).pow(wethDecimals));
    if( minAmount.lt(expectedAmount) ) {
      throw `minAmount: ${minAmount} less than expectedAmount: ${expectedAmount}`;
    }
    minAmountPerToken = minAmount.mul(hre.ethers.constants.WeiPerEther).div(setSupply);
    await delay(1000);
    console.log(`Total Delta Eth: ${totalDeltaEth}, minAmount: ${minAmount}`);

    bytecode = kellyManager2.interface.encodeFunctionData("operatorExecute", [
      setTokenAddr, wethAddr, usdcAddr, deltaEth, minAmountPerToken, "ZeroExchangeAdapter", response.data.data
    ]);
    receipt = await operator.sendTransaction({to: kellyManager2.address, data: bytecode});
    await receipt.wait();
  }
  else {
    expectedAmount = deltaEth.abs().mul(99).div(100);
    console.log(`Expected Amount: ${expectedAmount}`);
    const totalDeltaUsdc = deltaUsdc.abs().mul(setSupply).div(hre.ethers.constants.WeiPerEther);
    response = await axios.get(`https://polygon.api.0x.org/swap/v1/quote?buyToken=${wethAddr}&sellToken=${usdcAddr}&sellAmount=${totalDeltaUsdc}&slippagePercentage=0.01&enableSlippageProtection=true&priceImpactProtectionPercentage=0.01`, {headers: {'0x-api-key': zeroExApiKey}});
    if(response.status != 200) {
      throw response.statusText;
    }
    guaranteedPrice = hre.ethers.utils.parseEther(response.data.guaranteedPrice);
    minAmount = totalDeltaUsdc.mul(guaranteedPrice).div(hre.ethers.BigNumber.from(10).pow(usdcDecimals));
    if( minAmount.lt(expectedAmount) ) {
      throw `minAmount: ${minAmount} less than expectedAmount: ${expectedAmount}`;
    }
    minAmountPerToken = minAmount.mul(hre.ethers.constants.WeiPerEther).div(setSupply);
    await delay(1000);
    console.log(`Total Delta USDC: ${totalDeltaUsdc}, minAmount: ${minAmount}`);

    bytecode = kellyManager2.interface.encodeFunctionData("operatorExecute", [
      setTokenAddr, usdcAddr, wethAddr, deltaUsdc.abs(), minAmountPerToken, "ZeroExchangeAdapter", response.data.data
    ]);
    receipt = await operator.sendTransaction({to: kellyManager2.address, data: execPayload});
    await receipt.wait();
  }

  [componentAddresses,equityNotional,debtNotional] = await debtIssuanceModuleV2.getRequiredComponentIssuanceUnits(setTokenAddr, hre.ethers.utils.parseEther("1"));
  console.log(`${componentAddresses} ${equityNotional} ${debtNotional}`);

  etherValue = equityNotional[0].mul(answer).div(hre.ethers.BigNumber.from("10").pow(decimalDelta+ethUSDAggregatorDecimals));
  console.log(`Ether Value: ${etherValue}`);

  leverage = etherValue.mul(hre.ethers.BigNumber.from(10).pow(usdcDecimals)).div(etherValue.sub(debtNotional[1]));
  console.log(`Leverage: ${hre.ethers.utils.formatUnits(leverage, usdcDecimals)}`);

  aPolWETHBalance = await aPolWETH.balanceOf(signer.address);
  console.log(`aPolWETH Balance: ${hre.ethers.utils.formatEther(aPolWETHBalance)}`);

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

  // How much USDC should we try to borrow?
  const loan = hre.ethers.utils.parseEther("5").mul(debtNotional[1]).div(unitPrice);
  console.log(`loan: ${loan}`);

  const quoter = await hre.ethers.getContractAt(quoterABI, quoterAddr);
  const quote = await quoter.callStatic.quoteExactInputSingle(usdcAddr, wethAddr, 500, loan,
      (await uniswapV3Pool.token0()) == usdcAddr ? sqrtPriceX96.mul(99).div(100) : sqrtPriceX96.mul(101).div(100));
  console.log(`quote: ${quote}`);

  const averagePrice = babylonianSqrt(quote.mul(hre.ethers.constants.Two.pow(192)).div(loan));
  console.log(`average sqrtPX96: ${averagePrice}`);

  const leveredSetTokenHelperFactory = await hre.ethers.getContractFactory("LeveredSetTokenHelper");
  const leveredSetTokenHelper = await leveredSetTokenHelperFactory.deploy(uniswapV3FactoryAddr, debtIssuanceModuleV2.address, setToken.address,
    aavePool.address, aaveV3LeverageModule.address, aPolWETHAddr, wethAddr, usdcAddr, 500);
  await leveredSetTokenHelper.deployed();

  const tokensToMint = hre.ethers.utils.parseEther("60");
  await aPolWETH.approve(leveredSetTokenHelper.address, unitPrice.mul(tokensToMint));
  await leveredSetTokenHelper.mint(signer.address, tokensToMint, averagePrice);

  setTokenBalance = await setToken.balanceOf(signer.address);
  console.log(`Set Token Balance: ${hre.ethers.utils.formatEther(setTokenBalance)}`);

  aPolWETHBalance = await aPolWETH.balanceOf(signer.address);
  console.log(`aPolWETH Balance: ${hre.ethers.utils.formatEther(aPolWETHBalance)}`);

  [sqrtPriceX96] = await uniswapV3Pool.slot0();
  await setToken.approve(leveredSetTokenHelper.address, setTokenBalance);
  await leveredSetTokenHelper.redeem(signer.address, setTokenBalance, sqrtPriceX96.mul(101).div(99));

  setTokenBalance = await setToken.balanceOf(signer.address);
  console.log(`Set Token Balance: ${hre.ethers.utils.formatEther(setTokenBalance)}`);

  aPolWETHBalance = await aPolWETH.balanceOf(signer.address);
  console.log(`aPolWETH Balance: ${hre.ethers.utils.formatEther(aPolWETHBalance)}`);

  console.log(`Contract Set Token Balance: ${hre.ethers.utils.formatEther(await setToken.balanceOf(leveredSetTokenHelper.address))}`);
  console.log(`Contract aPolWETH Balance: ${hre.ethers.utils.formatEther(await aPolWETH.balanceOf(leveredSetTokenHelper.address))}`);
  console.log(`Contract weth Balance: ${hre.ethers.utils.formatEther(await weth.balanceOf(leveredSetTokenHelper.address))}`);
  console.log(`Contract usdc Balance: ${hre.ethers.utils.formatEther(await usdc.balanceOf(leveredSetTokenHelper.address))}`);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });