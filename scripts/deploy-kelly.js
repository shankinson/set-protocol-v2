const hre = require("hardhat");
const axios = require('axios');

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const zeroExApiKey = process.env.ZEROEX_KEY;

const ledgerAddress = "0xaFFB88d48B0Be5cd938015ba104d43E0a9DF86b2";

const controllerAddr = "0x126B4798131f3bE3D18E8f0371fb6824dbAE57b7";
const integrationRegistryAddr = "0xBBbD7172Ea592578394987478ea73025DF30c0aD";
const setTokenCreatorAddr = "0x30386B3e04914be256EF33055AE23CcFa62063D0";
const debtIssuanceeModuleV2Addr = "0xFeCd42400b3B0aECBC13b5B9eb7B7585f0a2201B";
const aaveV3LeverageModuleAddr = "0x4d8eA935D9A7AcD72502dc5cD00B9B1B751C06DC";
const kellyManagerAddr = "0xB856041552C8Fe7084759816f1Fb5A51d6f8435F";
const usdcAddr = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
const wethAddr = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";
const wmaticAddr = "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270";
const uniswapV3FactoryAddr = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
const quoterAddr = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6";
const aPolWETHAddr = "0xe50fA9b3c56FfB159cB0FCA61F5c9D750e8128c8";
const aavePoolAddr = "0x794a61358D6845594F94dc1DB02A252b5b4814aD";
const setTokenAddr = "0x3dc831944DFAfF83654dAd0236a8952Bd0BC7f49";
const aavePoolABI = [{"inputs":[{"internalType":"address","name":"asset","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"address","name":"onBehalfOf","type":"address"},{"internalType":"uint16","name":"referralCode","type":"uint16"}],"name":"supply","outputs":[],"stateMutability":"nonpayable","type":"function"}];

const ethUSDAggregatorAddr = "0xF9680D99D6C9589e2a93a78A04A279e509205945";
const ethUSDAggregatorABI = [{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"latestRoundData","outputs":[{"internalType":"uint80","name":"roundId","type":"uint80"},{"internalType":"int256","name":"answer","type":"int256"},{"internalType":"uint256","name":"startedAt","type":"uint256"},{"internalType":"uint256","name":"updatedAt","type":"uint256"},{"internalType":"uint80","name":"answeredInRound","type":"uint80"}],"stateMutability":"view","type":"function"}];

const erc20ABI = [{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"guy","type":"address"},{"name":"wad","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}];
const wmaticABI = [{"constant":false,"inputs":[{"name":"guy","type":"address"},{"name":"wad","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"deposit","outputs":[],"payable":true,"stateMutability":"payable","type":"function"}];

const uniswapV3FactoryABI = [{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"},{"internalType":"uint24","name":"","type":"uint24"}],"name":"getPool","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}];
const uniswapV3PoolABI = [{"inputs":[],"name":"slot0","outputs":[{"internalType":"uint160","name":"sqrtPriceX96","type":"uint160"},{"internalType":"int24","name":"tick","type":"int24"},{"internalType":"uint16","name":"observationIndex","type":"uint16"},{"internalType":"uint16","name":"observationCardinality","type":"uint16"},{"internalType":"uint16","name":"observationCardinalityNext","type":"uint16"},{"internalType":"uint8","name":"feeProtocol","type":"uint8"},{"internalType":"bool","name":"unlocked","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"token0","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"token1","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}];
const quoterABI = [{"inputs":[{"internalType":"address","name":"tokenIn","type":"address"},{"internalType":"address","name":"tokenOut","type":"address"},{"internalType":"uint24","name":"fee","type":"uint24"},{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint160","name":"sqrtPriceLimitX96","type":"uint160"}],"name":"quoteExactInputSingle","outputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"}],"stateMutability":"nonpayable","type":"function"}];

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

async function main() {

  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [ledgerAddress]
  });
  
  const signer = await hre.ethers.getSigner(ledgerAddress);
  const accounts = await hre.ethers.getSigners();
  const bank = accounts[0];
  const operator = accounts[1];

  let receipt = await bank.sendTransaction({to: ledgerAddress, value: hre.ethers.utils.parseEther("110000")});
  await receipt.wait();

  const controller = await hre.ethers.getContractAt("Controller", controllerAddr, signer);
  console.log("Controller deployed to:", controller.address);

  const integrationRegistry = await hre.ethers.getContractAt("IntegrationRegistry", integrationRegistryAddr, signer);
  console.log("IntegrationRegistry deployed to:", integrationRegistry.address);

  const debtIssuanceModuleV2 = await hre.ethers.getContractAt("DebtIssuanceModuleV2", debtIssuanceeModuleV2Addr, signer);
  console.log("DebtIssuanceModuleV2 deployed to:", debtIssuanceModuleV2.address);

  const aaveV3LeverageModule = await hre.ethers.getContractAt("AaveLeverageModule", aaveV3LeverageModuleAddr, signer);
  console.log("AaveLeverageModule deployed to:", aaveV3LeverageModule.address);

  const setTokenCreator = await hre.ethers.getContractAt("SetTokenCreator", setTokenCreatorAddr, signer);
  console.log("SetTokenCreator deployed to:", setTokenCreator.address);

  const kellyManager = await hre.ethers.getContractAt("KellyManager", kellyManagerAddr, signer);
  console.log("KellyManager deployed to:", kellyManager.address);

  const operatorRole = await kellyManager.OPERATOR_ROLE();
  await kellyManager.grantRole(operatorRole, operator.address);
  console.log(`Operator role has been granted`);

  const ethUSDAggregator = await hre.ethers.getContractAt(ethUSDAggregatorABI, ethUSDAggregatorAddr, signer);
  const ethUSDAggregatorDecimals = await ethUSDAggregator.decimals();
  const {answer} = await ethUSDAggregator.latestRoundData();
  console.log(`ETH/USD Aggregator deployed to: ${ethUSDAggregator.address} decimals: ${ethUSDAggregatorDecimals} answer: ${answer}`);

  const setToken = await hre.ethers.getContractAt("SetToken", setTokenAddr, signer);
  console.log(`SetToken deployed to: ${setToken.address}`);

  const name = await setToken.name();
  const symbol = await setToken.symbol();
  console.log(`${symbol}: ${name} @ ${setToken.address}`);

  const kellyManagerFactory = await hre.ethers.getContractFactory("KellyManager");
  const kellyManager2 = await kellyManagerFactory.deploy(aaveV3LeverageModule.address);
  await kellyManager2.deployed();
  console.log("KellyManager 2 deployed to:", kellyManager2.address);

  let bytecode = setToken.interface.encodeFunctionData("setManager", [kellyManager2.address]);
  receipt = await kellyManager.invoke(setToken.address, 0, bytecode);

  await receipt.wait();
  console.log("SetToken manager has been changed in tx: ", receipt.hash);

  await kellyManager2.grantRole(operatorRole, operator.address);
  console.log(`Operator role has been granted`);

  const weth = await hre.ethers.getContractAt(erc20ABI, wethAddr, signer);
  const wethDecimals = await weth.decimals();
  let wethBalance = await weth.balanceOf(signer.address);
  console.log(`WETH Balance: ${hre.ethers.utils.formatEther(wethBalance)}`);

  const wmatic = await hre.ethers.getContractAt(wmaticABI, wmaticAddr, signer);
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

  const aavePool = await hre.ethers.getContractAt(aavePoolABI, aavePoolAddr, signer);
  console.log(`aavePool address: ${aavePool.address}`);

  receipt = await weth.approve(aavePool.address, wethBalance);
  await receipt.wait();

  receipt = await aavePool.supply(wethAddr, wethBalance, signer.address, 0);
  await receipt.wait();

  wethBalance = await weth.balanceOf(signer.address);
  console.log(`WETH Balance: ${hre.ethers.utils.formatEther(wethBalance)}`);

  const aPolWETH = await hre.ethers.getContractAt(erc20ABI, aPolWETHAddr, signer);
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

  const usdc = await hre.ethers.getContractAt(erc20ABI, usdcAddr, signer);
  const usdcDecimals = await usdc.decimals();
  const decimalDelta = wethDecimals - usdcDecimals;

  const amount = hre.ethers.BigNumber.from("38363648244787077");
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
    receipt = await operator.sendTransaction({to: kellyManager2.address, data: bytecode});
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

  const uniswapV3Factory = await hre.ethers.getContractAt(uniswapV3FactoryABI, uniswapV3FactoryAddr, signer);
  console.log("UniswapV3Factory deployed to:", uniswapV3Factory.address);

  const uniswapV3PoolAddr = await uniswapV3Factory.getPool(wethAddr, usdcAddr, 500);
  console.log(`UniswapV3Pool address: ${uniswapV3PoolAddr}`);

  const uniswapV3Pool = await hre.ethers.getContractAt(uniswapV3PoolABI, uniswapV3PoolAddr, signer);
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

  const quoter = await hre.ethers.getContractAt(quoterABI, quoterAddr, signer);
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
  await leveredSetTokenHelper.connect(signer).mint(signer.address, tokensToMint, averagePrice);

  setTokenBalance = await setToken.balanceOf(signer.address);
  console.log(`Set Token Balance: ${hre.ethers.utils.formatEther(setTokenBalance)}`);

  aPolWETHBalance = await aPolWETH.balanceOf(signer.address);
  console.log(`aPolWETH Balance: ${hre.ethers.utils.formatEther(aPolWETHBalance)}`);

  [sqrtPriceX96] = await uniswapV3Pool.slot0();
  await setToken.approve(leveredSetTokenHelper.address, setTokenBalance);
  await leveredSetTokenHelper.connect(signer).redeem(signer.address, setTokenBalance, sqrtPriceX96.mul(101).div(99));

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