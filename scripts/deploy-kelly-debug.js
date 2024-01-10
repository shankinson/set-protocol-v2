const hre = require("hardhat");
const axios = require('axios');

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const zeroExApiKey = process.env.ZEROEX_KEY

const poolAddressesProviderAddr = "0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb";
const aPolWETHAddr = "0xe50fA9b3c56FfB159cB0FCA61F5c9D750e8128c8";
const usdcAddr = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
const wethAddr = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";
const wmaticAddr = "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270";
const wmaticABI = [{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"guy","type":"address"},{"name":"wad","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"src","type":"address"},{"name":"dst","type":"address"},{"name":"wad","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"wad","type":"uint256"}],"name":"withdraw","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"dst","type":"address"},{"name":"wad","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"deposit","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"},{"name":"","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"src","type":"address"},{"indexed":true,"name":"guy","type":"address"},{"indexed":false,"name":"wad","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"src","type":"address"},{"indexed":true,"name":"dst","type":"address"},{"indexed":false,"name":"wad","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"dst","type":"address"},{"indexed":false,"name":"wad","type":"uint256"}],"name":"Deposit","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"src","type":"address"},{"indexed":false,"name":"wad","type":"uint256"}],"name":"Withdrawal","type":"event"}];

const ethUSDAggregatorAddr = "0xF9680D99D6C9589e2a93a78A04A279e509205945";
const ethUSDAggregatorABI = [{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"latestRoundData","outputs":[{"internalType":"uint80","name":"roundId","type":"uint80"},{"internalType":"int256","name":"answer","type":"int256"},{"internalType":"uint256","name":"startedAt","type":"uint256"},{"internalType":"uint256","name":"updatedAt","type":"uint256"},{"internalType":"uint80","name":"answeredInRound","type":"uint80"}],"stateMutability":"view","type":"function"}];

const aavePoolAddr = "0x794a61358D6845594F94dc1DB02A252b5b4814aD";
const aavePoolABI = [{"inputs":[{"internalType":"contract IPoolAddressesProvider","name":"provider","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"reserve","type":"address"},{"indexed":true,"internalType":"address","name":"backer","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"fee","type":"uint256"}],"name":"BackUnbacked","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"reserve","type":"address"},{"indexed":false,"internalType":"address","name":"user","type":"address"},{"indexed":true,"internalType":"address","name":"onBehalfOf","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"enum DataTypes.InterestRateMode","name":"interestRateMode","type":"uint8"},{"indexed":false,"internalType":"uint256","name":"borrowRate","type":"uint256"},{"indexed":true,"internalType":"uint16","name":"referralCode","type":"uint16"}],"name":"Borrow","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"target","type":"address"},{"indexed":false,"internalType":"address","name":"initiator","type":"address"},{"indexed":true,"internalType":"address","name":"asset","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"enum DataTypes.InterestRateMode","name":"interestRateMode","type":"uint8"},{"indexed":false,"internalType":"uint256","name":"premium","type":"uint256"},{"indexed":true,"internalType":"uint16","name":"referralCode","type":"uint16"}],"name":"FlashLoan","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"asset","type":"address"},{"indexed":false,"internalType":"uint256","name":"totalDebt","type":"uint256"}],"name":"IsolationModeTotalDebtUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"collateralAsset","type":"address"},{"indexed":true,"internalType":"address","name":"debtAsset","type":"address"},{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint256","name":"debtToCover","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"liquidatedCollateralAmount","type":"uint256"},{"indexed":false,"internalType":"address","name":"liquidator","type":"address"},{"indexed":false,"internalType":"bool","name":"receiveAToken","type":"bool"}],"name":"LiquidationCall","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"reserve","type":"address"},{"indexed":false,"internalType":"address","name":"user","type":"address"},{"indexed":true,"internalType":"address","name":"onBehalfOf","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":true,"internalType":"uint16","name":"referralCode","type":"uint16"}],"name":"MintUnbacked","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"reserve","type":"address"},{"indexed":false,"internalType":"uint256","name":"amountMinted","type":"uint256"}],"name":"MintedToTreasury","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"reserve","type":"address"},{"indexed":true,"internalType":"address","name":"user","type":"address"}],"name":"RebalanceStableBorrowRate","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"reserve","type":"address"},{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":true,"internalType":"address","name":"repayer","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"bool","name":"useATokens","type":"bool"}],"name":"Repay","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"reserve","type":"address"},{"indexed":false,"internalType":"uint256","name":"liquidityRate","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"stableBorrowRate","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"variableBorrowRate","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"liquidityIndex","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"variableBorrowIndex","type":"uint256"}],"name":"ReserveDataUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"reserve","type":"address"},{"indexed":true,"internalType":"address","name":"user","type":"address"}],"name":"ReserveUsedAsCollateralDisabled","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"reserve","type":"address"},{"indexed":true,"internalType":"address","name":"user","type":"address"}],"name":"ReserveUsedAsCollateralEnabled","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"reserve","type":"address"},{"indexed":false,"internalType":"address","name":"user","type":"address"},{"indexed":true,"internalType":"address","name":"onBehalfOf","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":true,"internalType":"uint16","name":"referralCode","type":"uint16"}],"name":"Supply","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"reserve","type":"address"},{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"enum DataTypes.InterestRateMode","name":"interestRateMode","type":"uint8"}],"name":"SwapBorrowRateMode","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint8","name":"categoryId","type":"uint8"}],"name":"UserEModeSet","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"reserve","type":"address"},{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Withdraw","type":"event"},{"inputs":[],"name":"ADDRESSES_PROVIDER","outputs":[{"internalType":"contract IPoolAddressesProvider","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"BRIDGE_PROTOCOL_FEE","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"FLASHLOAN_PREMIUM_TOTAL","outputs":[{"internalType":"uint128","name":"","type":"uint128"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"FLASHLOAN_PREMIUM_TO_PROTOCOL","outputs":[{"internalType":"uint128","name":"","type":"uint128"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"MAX_NUMBER_RESERVES","outputs":[{"internalType":"uint16","name":"","type":"uint16"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"MAX_STABLE_RATE_BORROW_SIZE_PERCENT","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"POOL_REVISION","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"asset","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"fee","type":"uint256"}],"name":"backUnbacked","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"asset","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"interestRateMode","type":"uint256"},{"internalType":"uint16","name":"referralCode","type":"uint16"},{"internalType":"address","name":"onBehalfOf","type":"address"}],"name":"borrow","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint8","name":"id","type":"uint8"},{"components":[{"internalType":"uint16","name":"ltv","type":"uint16"},{"internalType":"uint16","name":"liquidationThreshold","type":"uint16"},{"internalType":"uint16","name":"liquidationBonus","type":"uint16"},{"internalType":"address","name":"priceSource","type":"address"},{"internalType":"string","name":"label","type":"string"}],"internalType":"struct DataTypes.EModeCategory","name":"category","type":"tuple"}],"name":"configureEModeCategory","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"asset","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"address","name":"onBehalfOf","type":"address"},{"internalType":"uint16","name":"referralCode","type":"uint16"}],"name":"deposit","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"asset","type":"address"}],"name":"dropReserve","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"asset","type":"address"},{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"balanceFromBefore","type":"uint256"},{"internalType":"uint256","name":"balanceToBefore","type":"uint256"}],"name":"finalizeTransfer","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"receiverAddress","type":"address"},{"internalType":"address[]","name":"assets","type":"address[]"},{"internalType":"uint256[]","name":"amounts","type":"uint256[]"},{"internalType":"uint256[]","name":"interestRateModes","type":"uint256[]"},{"internalType":"address","name":"onBehalfOf","type":"address"},{"internalType":"bytes","name":"params","type":"bytes"},{"internalType":"uint16","name":"referralCode","type":"uint16"}],"name":"flashLoan","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"receiverAddress","type":"address"},{"internalType":"address","name":"asset","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"bytes","name":"params","type":"bytes"},{"internalType":"uint16","name":"referralCode","type":"uint16"}],"name":"flashLoanSimple","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"asset","type":"address"}],"name":"getConfiguration","outputs":[{"components":[{"internalType":"uint256","name":"data","type":"uint256"}],"internalType":"struct DataTypes.ReserveConfigurationMap","name":"","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint8","name":"id","type":"uint8"}],"name":"getEModeCategoryData","outputs":[{"components":[{"internalType":"uint16","name":"ltv","type":"uint16"},{"internalType":"uint16","name":"liquidationThreshold","type":"uint16"},{"internalType":"uint16","name":"liquidationBonus","type":"uint16"},{"internalType":"address","name":"priceSource","type":"address"},{"internalType":"string","name":"label","type":"string"}],"internalType":"struct DataTypes.EModeCategory","name":"","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint16","name":"id","type":"uint16"}],"name":"getReserveAddressById","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"asset","type":"address"}],"name":"getReserveData","outputs":[{"components":[{"components":[{"internalType":"uint256","name":"data","type":"uint256"}],"internalType":"struct DataTypes.ReserveConfigurationMap","name":"configuration","type":"tuple"},{"internalType":"uint128","name":"liquidityIndex","type":"uint128"},{"internalType":"uint128","name":"currentLiquidityRate","type":"uint128"},{"internalType":"uint128","name":"variableBorrowIndex","type":"uint128"},{"internalType":"uint128","name":"currentVariableBorrowRate","type":"uint128"},{"internalType":"uint128","name":"currentStableBorrowRate","type":"uint128"},{"internalType":"uint40","name":"lastUpdateTimestamp","type":"uint40"},{"internalType":"uint16","name":"id","type":"uint16"},{"internalType":"address","name":"aTokenAddress","type":"address"},{"internalType":"address","name":"stableDebtTokenAddress","type":"address"},{"internalType":"address","name":"variableDebtTokenAddress","type":"address"},{"internalType":"address","name":"interestRateStrategyAddress","type":"address"},{"internalType":"uint128","name":"accruedToTreasury","type":"uint128"},{"internalType":"uint128","name":"unbacked","type":"uint128"},{"internalType":"uint128","name":"isolationModeTotalDebt","type":"uint128"}],"internalType":"struct DataTypes.ReserveData","name":"","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"asset","type":"address"}],"name":"getReserveNormalizedIncome","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"asset","type":"address"}],"name":"getReserveNormalizedVariableDebt","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getReservesList","outputs":[{"internalType":"address[]","name":"","type":"address[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getUserAccountData","outputs":[{"internalType":"uint256","name":"totalCollateralBase","type":"uint256"},{"internalType":"uint256","name":"totalDebtBase","type":"uint256"},{"internalType":"uint256","name":"availableBorrowsBase","type":"uint256"},{"internalType":"uint256","name":"currentLiquidationThreshold","type":"uint256"},{"internalType":"uint256","name":"ltv","type":"uint256"},{"internalType":"uint256","name":"healthFactor","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getUserConfiguration","outputs":[{"components":[{"internalType":"uint256","name":"data","type":"uint256"}],"internalType":"struct DataTypes.UserConfigurationMap","name":"","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getUserEMode","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"asset","type":"address"},{"internalType":"address","name":"aTokenAddress","type":"address"},{"internalType":"address","name":"stableDebtAddress","type":"address"},{"internalType":"address","name":"variableDebtAddress","type":"address"},{"internalType":"address","name":"interestRateStrategyAddress","type":"address"}],"name":"initReserve","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"contract IPoolAddressesProvider","name":"provider","type":"address"}],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"collateralAsset","type":"address"},{"internalType":"address","name":"debtAsset","type":"address"},{"internalType":"address","name":"user","type":"address"},{"internalType":"uint256","name":"debtToCover","type":"uint256"},{"internalType":"bool","name":"receiveAToken","type":"bool"}],"name":"liquidationCall","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address[]","name":"assets","type":"address[]"}],"name":"mintToTreasury","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"asset","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"address","name":"onBehalfOf","type":"address"},{"internalType":"uint16","name":"referralCode","type":"uint16"}],"name":"mintUnbacked","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"asset","type":"address"},{"internalType":"address","name":"user","type":"address"}],"name":"rebalanceStableBorrowRate","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"asset","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"interestRateMode","type":"uint256"},{"internalType":"address","name":"onBehalfOf","type":"address"}],"name":"repay","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"asset","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"interestRateMode","type":"uint256"}],"name":"repayWithATokens","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"asset","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"interestRateMode","type":"uint256"},{"internalType":"address","name":"onBehalfOf","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint8","name":"permitV","type":"uint8"},{"internalType":"bytes32","name":"permitR","type":"bytes32"},{"internalType":"bytes32","name":"permitS","type":"bytes32"}],"name":"repayWithPermit","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"rescueTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"asset","type":"address"}],"name":"resetIsolationModeTotalDebt","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"asset","type":"address"},{"components":[{"internalType":"uint256","name":"data","type":"uint256"}],"internalType":"struct DataTypes.ReserveConfigurationMap","name":"configuration","type":"tuple"}],"name":"setConfiguration","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"asset","type":"address"},{"internalType":"address","name":"rateStrategyAddress","type":"address"}],"name":"setReserveInterestRateStrategyAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint8","name":"categoryId","type":"uint8"}],"name":"setUserEMode","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"asset","type":"address"},{"internalType":"bool","name":"useAsCollateral","type":"bool"}],"name":"setUserUseReserveAsCollateral","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"asset","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"address","name":"onBehalfOf","type":"address"},{"internalType":"uint16","name":"referralCode","type":"uint16"}],"name":"supply","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"asset","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"address","name":"onBehalfOf","type":"address"},{"internalType":"uint16","name":"referralCode","type":"uint16"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint8","name":"permitV","type":"uint8"},{"internalType":"bytes32","name":"permitR","type":"bytes32"},{"internalType":"bytes32","name":"permitS","type":"bytes32"}],"name":"supplyWithPermit","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"asset","type":"address"},{"internalType":"uint256","name":"interestRateMode","type":"uint256"}],"name":"swapBorrowRateMode","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"protocolFee","type":"uint256"}],"name":"updateBridgeProtocolFee","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint128","name":"flashLoanPremiumTotal","type":"uint128"},{"internalType":"uint128","name":"flashLoanPremiumToProtocol","type":"uint128"}],"name":"updateFlashloanPremiums","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"asset","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"address","name":"to","type":"address"}],"name":"withdraw","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"}];

const erc20ABI = [{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"guy","type":"address"},{"name":"wad","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}];

const zeroExchangeAddr = "0xDef1C0ded9bec7F1a1670819833240f027b25EfF";

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
  
  const ethUSDAggregator = await hre.ethers.getContractAt(ethUSDAggregatorABI, ethUSDAggregatorAddr);
  const ethUSDAggregatorDecimals = await ethUSDAggregator.decimals();
  const {answer} = await ethUSDAggregator.latestRoundData();
  console.log(`ETH/USD Aggregator deployed to: ${ethUSDAggregator.address} decimals: ${ethUSDAggregatorDecimals} answer: ${answer}`);

  // Get the pre-scaled amount of ETH
  const amount = hre.ethers.utils.parseEther("100")
    .mul(hre.ethers.BigNumber.from(10).pow(ethUSDAggregatorDecimals)).div(answer);
  console.log(`Set aPolWETH Units: ${hre.ethers.utils.formatEther(amount)}`);
  let receipt = await setTokenCreator.connect(signer).create(
    [aPolWETHAddr],
    [amount],
    [aaveV3LeverageModule.address, debtIssuanceModuleV2.address],
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

  receipt = await debtIssuanceModuleV2.connect(signer).initialize(
    setTokenAddr,
    hre.ethers.utils.parseEther("0.000"),
    hre.ethers.utils.parseEther("0.000"),
    hre.ethers.utils.parseEther("0.000"),
    signer.address,
    hre.ethers.constants.AddressZero);

  await receipt.wait();
  console.log("Debt Issuance Module has been initialized in tx: ", receipt.hash);

  receipt = await aaveV3LeverageModule.connect(signer).initialize(
    setTokenAddr,
    [wethAddr],
    [usdcAddr]);

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

  let response = await axios.get(`https://polygon.api.0x.org/swap/v1/quote?buyToken=${wethAddr}&sellToken=${wmaticAddr}&sellAmount=${wmaticBalance}&slippagePercentage=0.01&priceImpactProtectionPercentage=0.01`, {headers: {'0x-api-key': zeroExApiKey}});
  if(response.status != 200) {
    throw response.statusText;
  }
  await delay(1000);

  receipt = await wmatic.approve(response.data.to, response.data.sellAmount);
  await receipt.wait();

  const tx = {to: response.data.to, data: response.data.data}
  receipt = await signer.sendTransaction(tx);
  await receipt.wait();
  console.log("Swapped in tx: ", receipt.hash);

  wethBalance = await weth.balanceOf(signer.address);
  console.log(`WETH Balance: ${hre.ethers.utils.formatEther(wethBalance)}`);

  const aavePool = await hre.ethers.getContractAt(aavePoolABI, aavePoolAddr);
  console.log(`aavePool address: ${aavePool.address}`);

  receipt = await weth.approve(aavePool.address, wethBalance);
  await receipt.wait();

  receipt = await aavePool.deposit(wethAddr, wethBalance, signer.address, 0);
  await receipt.wait();

  wethBalance = await weth.balanceOf(signer.address);
  console.log(`WETH Balance: ${hre.ethers.utils.formatEther(wethBalance)}`);

  const aPolWETH = await hre.ethers.getContractAt(erc20ABI, aPolWETHAddr);
  let aPolWETHBalance = await aPolWETH.balanceOf(signer.address);
  console.log(`aPolWETH Balance: ${hre.ethers.utils.formatEther(aPolWETHBalance)}`);

  let setTokenBalance = await setToken.balanceOf(signer.address);
  console.log(`Set Token Balance: ${hre.ethers.utils.formatEther(setTokenBalance)}`);

  const setTokenAmount = hre.ethers.utils.parseEther("500");
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

  const positions = await setToken.getPositions();
  console.log(`Positions: ${positions}`);

  const borrowAmount = hre.ethers.utils.parseUnits("100", 6).div(2);
  let expectedAmount = amount.mul(99).div(200);
  console.log(`Borrow Amount: ${borrowAmount} Expected Amount: ${expectedAmount}`);

  let totalBorrowAmount = borrowAmount.mul(setSupply).div(hre.ethers.constants.WeiPerEther);
  response = await axios.get(`https://polygon.api.0x.org/swap/v1/quote?buyToken=${wethAddr}&sellToken=${usdcAddr}&sellAmount=${totalBorrowAmount}&slippagePercentage=0.01&priceImpactProtectionPercentage=0.01`, {headers: {'0x-api-key': zeroExApiKey}});
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

  receipt = await aaveV3LeverageModule.connect(signer)
    .lever(setTokenAddr, usdcAddr, wethAddr, borrowAmount, minAmountPerToken, "ZeroExchangeAdapter", response.data.data);
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
    weth.approve(aaveV3LeverageModule.address, deltaEth);
    const totalDeltaEth = deltaEth.mul(setSupply).div(hre.ethers.constants.WeiPerEther);
    response = await axios.get(`https://polygon.api.0x.org/swap/v1/quote?buyToken=${usdcAddr}&sellToken=${wethAddr}&sellAmount=${totalDeltaEth}&slippagePercentage=0.01&priceImpactProtectionPercentage=0.01`, {headers: {'0x-api-key': zeroExApiKey}});
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

    receipt = await aaveV3LeverageModule.connect(signer)
      .delever(setTokenAddr, wethAddr, usdcAddr, deltaEth, minAmountPerToken, "ZeroExchangeAdapter", response.data.data);
    await receipt.wait();
  }
  else {
    expectedAmount = deltaEth.abs().mul(99).div(100);
    console.log(`Expected Amount: ${expectedAmount}`);
    const totalDeltaUsdc = deltaUsdc.abs().mul(setSupply).div(hre.ethers.constants.WeiPerEther);
    response = await axios.get(`https://polygon.api.0x.org/swap/v1/quote?buyToken=${wethAddr}&sellToken=${usdcAddr}&sellAmount=${totalDeltaUsdc}&slippagePercentage=0.01&priceImpactProtectionPercentage=0.01`, {headers: {'0x-api-key': zeroExApiKey}});
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

    receipt = await aaveV3LeverageModule.connect(signer)
      .lever(setTokenAddr, usdcAddr, wethAddr, deltaUsdc.abs(), minAmountPerToken, "ZeroExchangeAdapter", response.data.data);
    await receipt.wait();
  }

  [componentAddresses,equityNotional,debtNotional] = await debtIssuanceModuleV2.getRequiredComponentIssuanceUnits(setTokenAddr, hre.ethers.utils.parseEther("1"));
  console.log(`${componentAddresses} ${equityNotional} ${debtNotional}`);

  etherValue = equityNotional[0].mul(answer).div(hre.ethers.BigNumber.from("10").pow(decimalDelta+ethUSDAggregatorDecimals));
  console.log(`Ether Value: ${etherValue}`);

  leverage = etherValue.mul(hre.ethers.BigNumber.from(10).pow(usdcDecimals)).div(etherValue.sub(debtNotional[1]));
  console.log(`Leverage: ${hre.ethers.utils.formatUnits(leverage, usdcDecimals)}`);

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