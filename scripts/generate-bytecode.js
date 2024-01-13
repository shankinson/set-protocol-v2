const hre = require("hardhat");
const axios = require("axios");

const zeroExApiKey = process.env.ZEROEX_KEY;

const debtIssuanceeModuleV2Addr = "0xFeCd42400b3B0aECBC13b5B9eb7B7585f0a2201B";
const aaveV3LeverageModuleAddr = "0x4d8eA935D9A7AcD72502dc5cD00B9B1B751C06DC";
const usdcAddr = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
const wethAddr = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";
const setTokenAddr = "0x3dc831944DFAfF83654dAd0236a8952Bd0BC7f49";
const ledgerAddr = "0xaFFB88d48B0Be5cd938015ba104d43E0a9DF86b2";
const kellyManagerAddr = "0xB856041552C8Fe7084759816f1Fb5A51d6f8435F";
//const newKellyManagerAddr = "0x1D8B42704e8357e2C29B15D41127fb516DF6494c";
//const tradeModuleAddr = "0xd04AabadEd11e92Fefcd92eEdbBC81b184CdAc82";

const desiredLeverage = hre.ethers.BigNumber.from("1500000000000000000");

const ethUSDAggregatorAddr = "0xF9680D99D6C9589e2a93a78A04A279e509205945";
const ethUSDAggregatorABI = [{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"latestRoundData","outputs":[{"internalType":"uint80","name":"roundId","type":"uint80"},{"internalType":"int256","name":"answer","type":"int256"},{"internalType":"uint256","name":"startedAt","type":"uint256"},{"internalType":"uint256","name":"updatedAt","type":"uint256"},{"internalType":"uint80","name":"answeredInRound","type":"uint80"}],"stateMutability":"view","type":"function"}];
const erc20ABI = [{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"guy","type":"address"},{"name":"wad","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}];

async function main() {
  
  const debtIssuanceModuleV2 = await hre.ethers.getContractAt("DebtIssuanceModuleV2", debtIssuanceeModuleV2Addr);
  console.log("DebtIssuanceModuleV2 deployed to:", debtIssuanceModuleV2.address);

  const aavev3LeverageModule = await hre.ethers.getContractAt("AaveV3LeverageModule", aaveV3LeverageModuleAddr);
  console.log("AaveLeverageModule deployed to:", aavev3LeverageModule.address);

  /*const tradeModule = await hre.ethers.getContractAt("TradeModule", tradeModuleAddr);
  console.log("TradeModule deployed to:", tradeModule.address);

  const kellyManager = await hre.ethers.getContractAt("KellyManager", newKellyManagerAddr);
  console.log("KellyManager deployed to:", kellyManager.address);*/

  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: ["0xaFFB88d48B0Be5cd938015ba104d43E0a9DF86b2"],
  });

  const signer = await ethers.getSigner("0xaFFB88d48B0Be5cd938015ba104d43E0a9DF86b2");
  console.log(`signer: ${signer.address}`);
  
  /*let bytecode = streamingFeeModule.interface.encodeFunctionData("initialize", [
    setTokenAddr, 
    {
      feeRecipient: ledgerAddr,
      maxStreamingFeePercentage: hre.ethers.utils.parseEther("0.4"),
      streamingFeePercentage: hre.ethers.utils.parseEther("0.0195"),
      lastStreamingFeeTimestamp: 0
    }
  ]);
  console.log(`Streaming Fee bytecode: ${bytecode}`);*/

  bytecode = debtIssuanceModuleV2.interface.encodeFunctionData("initialize", [
    setTokenAddr,
    hre.ethers.utils.parseEther("0.000"),
    hre.ethers.utils.parseEther("0.000"),
    hre.ethers.utils.parseEther("0.000"),
    ledgerAddr,
    hre.ethers.constants.AddressZero
  ]);
  console.log(`DebtIssuanceModuleV2 bytecode: ${bytecode}`);

  bytecode = aavev3LeverageModule.interface.encodeFunctionData("initialize", [
    setTokenAddr,
    [wethAddr],
    [usdcAddr]
  ]);
  console.log(`AaveLeverageModule bytecode: ${bytecode}`);

  const weth = await hre.ethers.getContractAt(erc20ABI, wethAddr, signer);
  const wethDecimals = await weth.decimals();

  const usdc = await hre.ethers.getContractAt(erc20ABI, usdcAddr, signer);
  const usdcDecimals = await usdc.decimals();
  const decimalDelta = wethDecimals - usdcDecimals;

  // Get the current collateral price
  const ethUSDAggregator = new hre.ethers.Contract(ethUSDAggregatorAddr, ethUSDAggregatorABI, hre.ethers.provider);
  const [,answer] = await ethUSDAggregator.latestRoundData();
  const ethUSDAggregatorDecimals = await ethUSDAggregator.decimals();
  console.log(`answer: ${answer}`);

  const scale = usdcDecimals - wethDecimals - ethUSDAggregatorDecimals;
  console.log(`scale: ${scale}`);

  const [_, units] = await debtIssuanceModuleV2.getRequiredComponentIssuanceUnits(setTokenAddr, hre.ethers.utils.parseEther("1"));
  const amount = units[0];
  const currentValue = amount.mul(answer).div(hre.ethers.BigNumber.from(10).pow(-scale));
  console.log(`currentValue: ${currentValue}`);
  const borrowAmount = currentValue.div(2);
  let expectedAmount = amount.mul(99).div(200);
  console.log(`Borrow Amount: ${borrowAmount} Expected Amount: ${expectedAmount}`);

  const setToken = await hre.ethers.getContractAt("SetToken", setTokenAddr);
  const setSupply = await setToken.totalSupply();

  // let totalBorrowAmount = borrowAmount.mul(setSupply).div(hre.ethers.constants.WeiPerEther);
  // response = await axios.get(`https://polygon.api.0x.org/swap/v1/quote?buyToken=${wethAddr}&sellToken=${usdcAddr}&sellAmount=${totalBorrowAmount}&slippagePercentage=0.01&enableSlippageProtection=true&priceImpactProtectionPercentage=0.01`, {headers: {'0x-api-key': zeroExApiKey}});
  // if(response.status != 200) {
  //   throw response.statusText;
  // }
  // let guaranteedPrice = hre.ethers.utils.parseEther(response.data.guaranteedPrice);
  // let minAmount = totalBorrowAmount.mul(guaranteedPrice).div(hre.ethers.BigNumber.from(10).pow(usdcDecimals));
  // if( minAmount.lt(expectedAmount) ) {
  //   throw `minAmount: ${minAmount} less than expectedAmount: ${expectedAmount}`;
  // }
  // let minAmountPerToken = minAmount.mul(hre.ethers.constants.WeiPerEther).div(setSupply);
  // console.log(`Total Borrow Amount: ${totalBorrowAmount}, minAmount: ${minAmount}`);

  // bytecode = aavev3LeverageModule.interface.encodeFunctionData("lever", [
  //   setTokenAddr, usdcAddr, wethAddr, borrowAmount, minAmountPerToken, "ZeroExchangeAdapter", response.data.data
  // ]);
  // console.log(`Initial Lever bytecode: ${bytecode}`);

  const kellyManager = await hre.ethers.getContractAt("KellyManager", kellyManagerAddr, signer);
  console.log("KellyManager deployed to:", kellyManager.address);
  // await kellyManager.connect(signer).invoke(aavev3LeverageModule.address, 0, bytecode);

  // const amount = hre.ethers.BigNumber.from("73747707346512140");
  // const borrowAmount = hre.ethers.utils.parseUnits("100", 6).div(2);
  // const expectedAmount = amount.mul(99).div(200);
  // console.log(`Borrow Amount: ${borrowAmount} Expected Amount: ${expectedAmount}`);

  // bytecode = await aavev3LeverageModule.interface.encodeFunctionData("lever", [
  //   setTokenAddr, usdcAddr, wethAddr, borrowAmount, expectedAmount, "AMMSplitterExchangeAdapter", []
  // ]);
  // console.log(`Lever bytecode: ${bytecode}`);

  /*bytecode = setToken.interface.encodeFunctionData("setManager", [newKellyManagerAddr]);
  console.log(`Change Manager bytecode: ${bytecode}`);

  bytecode = await aavev3LeverageModule.interface.encodeFunctionData("delever", [
    setTokenAddr, wethAddr, usdcAddr, borrowAmount, expectedAmount, "AMMSplitterExchangeAdapter", []
  ]);
  console.log(`setManager bytecode: ${bytecode}`);*/

  bytecode = await aavev3LeverageModule.interface.encodeFunctionData("deleverToZeroBorrowBalance", [
    setTokenAddr, wethAddr, usdcAddr, ethers.constants.Zero, "AMMSplitterExchangeAdapter", []
  ]);
  console.log(`DeleverToZeroBorrowBalance bytecode: ${bytecode}`);

  /*bytecode = await setToken.interface.encodeFunctionData("addModule", [
    tradeModuleAddr
  ]);
  console.log(`AddModule bytecode: ${bytecode}`);

  bytecode = await tradeModule.interface.encodeFunctionData("initialize", [
    setTokenAddr
  ]);
  console.log(`TradeModule bytecode: ${bytecode}`);*/

  // Convert collateral into debt units
  const components = await setToken.getComponents();
  /*const c0 = await hre.ethers.getContractAt("SetToken", components[0]);
  const c1 = await hre.ethers.getContractAt("SetToken", components[1]);
  const scale = hre.ethers.BigNumber.from(10).pow((await c0.decimals()) + (await ethUSDAggregator.decimals()) - (await c1.decimals()));
  console.log(`scale: ${scale}`);

  const oneEther = hre.ethers.BigNumber.from(10).pow(18);
  let totalUnits = await setToken.totalSupply();
  let usdcBalance = await c1.balanceOf(setTokenAddr);
  console.log(`totalUnits: ${totalUnits} usdcBalance: ${usdcBalance}`);

  const usdcAmount = usdcBalance.mul(oneEther).div(totalUnits);
  console.log(`usdcAmount: ${usdcAmount}`);

  let min = usdcAmount.mul(scale).div(answer).mul(98).div(100);
  console.log(`min: ${min}`);

  bytecode = await tradeModule.interface.encodeFunctionData("trade", [
    setTokenAddr,
    "AMMSplitterExchangeAdapter",
    usdcAddr,
    usdcAmount,
    wethAddr,
    min,
    []
  ]);
  console.log(`trade bytecode: ${bytecode}`);

  // Get the current position data
  
  let collateral = await setToken.getTotalComponentRealUnits(components[0]);
  let debt = components.length > 1 ? -(await setToken.getTotalComponentRealUnits(components[1])) : hre.ethers.constants.Zero;
  console.log(`collateral: ${collateral} debt: ${debt}`);
  //require(collateral > 0 && debt > 0, "invalid debt or collateral");

  let ethValue = collateral.mul(answer).div(scale);

  // What is the value of 1 set token in debt terms
  const tokenPrice = ethValue.sub(debt);
  console.log(`tokenPrice: ${tokenPrice}`);

  // What is the desired value of the collateral in debt terms
  ethValue = tokenPrice.mul(desiredLeverage).div(hre.ethers.BigNumber.from(10).pow(18));
  console.log(`ethValue: ${ethValue}`);
  
  // Get the change in debt and collateral
  debt = hre.ethers.BigNumber.from(debt).sub(ethValue).add(tokenPrice);
  collateral = collateral.sub(ethValue.mul(scale).div(answer));

  const slippage = hre.ethers.BigNumber.from(97).mul(hre.ethers.BigNumber.from(10).pow(18)).div(hre.ethers.BigNumber.from(100)) //await kellyManager.slippage();
  //const slippage = await kellyManager.slippage();
  const minimum = collateral.mul(-1).mul(slippage).div(hre.ethers.BigNumber.from(10).pow(18));
  console.log(`collateral: ${collateral} debt: ${-debt} minimum: ${minimum}`);

  bytecode = await aavev3LeverageModule.interface.encodeFunctionData("lever", [
    setTokenAddr, usdcAddr, wethAddr, -debt, minimum, "AMMSplitterExchangeAdapter", []
  ]);
  console.log(`Lever bytecode: ${bytecode}`);

  await kellyManager.connect(signer).invoke(aaveLeverageModule.address, 0, bytecode);*/

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
    console.log(`Total Delta Eth: ${totalDeltaEth}, minAmount: ${minAmount}`);

    console.log(`operatorExecute delever`);
    console.log(`0: ${setTokenAddr}`);
    console.log(`1: ${wethAddr}`);
    console.log(`2: ${usdcAddr}`);
    console.log(`3: ${deltaEth}`);
    console.log(`4: ${minAmountPerToken}`);
    console.log(`5: ZeroExchangeAdapter`);
    console.log(`6: ${response.data.data}`);

    receipt = await kellyManager.connect(signer).operatorExecute(
      setTokenAddr, wethAddr, usdcAddr, deltaEth, minAmountPerToken, "ZeroExchangeAdapter", response.data.data
    )
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
    console.log(`Total Delta USDC: ${totalDeltaUsdc}, minAmount: ${minAmount}`);

    console.log(`operatorExecute lever`);
    console.log(`0: ${setTokenAddr}`);
    console.log(`1: ${usdcAddr}`);
    console.log(`2: ${wethAddr}`);
    console.log(`3: ${deltaUsdc.abs()}`);
    console.log(`4: ${minAmountPerToken}`);
    console.log(`5: ZeroExchangeAdapter`);
    console.log(`6: ${response.data.data}`);

    receipt = await kellyManager.connect(signer).operatorExecute(
      setTokenAddr, usdcAddr, wethAddr, deltaUsdc.abs(), minAmountPerToken, "ZeroExchangeAdapter", response.data.data
    )
    await receipt.wait();
  }

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
