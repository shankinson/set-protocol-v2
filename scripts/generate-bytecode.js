const hre = require("hardhat");

const debtIssuanceeModuleV2Addr = "0xf2dC2f456b98Af9A6bEEa072AF152a7b0EaA40C9";
const aaveLeverageModuleAddr = "0xB7F72e15239197021480EB720E1495861A1ABdce";
const streamingFeeModuleAddr = "0x8440f6a2c42118bed0D6E6A89Bf170ffd13e21c0";
const usdcAddr = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
const wethAddr = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";
const setTokenAddr = "0xB686bf528C77124cbfB65FB4CFC1EED9794F2D74";
const ledgerAddr = "0xaFFB88d48B0Be5cd938015ba104d43E0a9DF86b2";
const newKellyManagerAddr = "0x1D8B42704e8357e2C29B15D41127fb516DF6494c";
const tradeModuleAddr = "0xd04AabadEd11e92Fefcd92eEdbBC81b184CdAc82";

const ethUSDAggregatorAddr = "0xF9680D99D6C9589e2a93a78A04A279e509205945";
const ethUSDAggregatorABI = [{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"latestRoundData","outputs":[{"internalType":"uint80","name":"roundId","type":"uint80"},{"internalType":"int256","name":"answer","type":"int256"},{"internalType":"uint256","name":"startedAt","type":"uint256"},{"internalType":"uint256","name":"updatedAt","type":"uint256"},{"internalType":"uint80","name":"answeredInRound","type":"uint80"}],"stateMutability":"view","type":"function"}];

async function main() {
  
  const debtIssuanceModuleV2 = await hre.ethers.getContractAt("DebtIssuanceModuleV2", debtIssuanceeModuleV2Addr);
  console.log("DebtIssuanceModuleV2 deployed to:", debtIssuanceModuleV2.address);

  const aaveLeverageModule = await hre.ethers.getContractAt("AaveLeverageModule", aaveLeverageModuleAddr);
  console.log("AaveLeverageModule deployed to:", aaveLeverageModule.address);

  const streamingFeeModule = await hre.ethers.getContractAt("StreamingFeeModule", streamingFeeModuleAddr);
  console.log("StreamingFeeModule deployed to:", streamingFeeModule.address);

  const tradeModule = await hre.ethers.getContractAt("TradeModule", tradeModuleAddr);
  console.log("TradeModule deployed to:", tradeModule.address);

  const kellyManager = await hre.ethers.getContractAt("KellyManager", newKellyManagerAddr);
  console.log("KellyManager deployed to:", kellyManager.address);

  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: ["0xaFFB88d48B0Be5cd938015ba104d43E0a9DF86b2"],
  });

  const signer = await ethers.getSigner("0xaFFB88d48B0Be5cd938015ba104d43E0a9DF86b2");
  console.log(`signer: ${signer.address}`);
  
  let bytecode = streamingFeeModule.interface.encodeFunctionData("initialize", [
    setTokenAddr, 
    {
      feeRecipient: ledgerAddr,
      maxStreamingFeePercentage: hre.ethers.utils.parseEther("0.4"),
      streamingFeePercentage: hre.ethers.utils.parseEther("0.0195"),
      lastStreamingFeeTimestamp: 0
    }
  ]);
  console.log(`Streaming Fee bytecode: ${bytecode}`);

  bytecode = debtIssuanceModuleV2.interface.encodeFunctionData("initialize", [
    setTokenAddr,
    hre.ethers.utils.parseEther("0.01"),
    hre.ethers.utils.parseEther("0.001"),
    hre.ethers.utils.parseEther("0.001"),
    ledgerAddr,
    hre.ethers.constants.AddressZero
  ]);
  console.log(`DebtIssuanceModuleV2 bytecode: ${bytecode}`);

  bytecode = aaveLeverageModule.interface.encodeFunctionData("initialize", [
    setTokenAddr,
    [wethAddr],
    [usdcAddr]
  ]);
  console.log(`AaveLeverageModule bytecode: ${bytecode}`);

  const amount = hre.ethers.BigNumber.from("73747707346512140");
  const borrowAmount = hre.ethers.utils.parseUnits("100", 6).div(2);
  const expectedAmount = amount.mul(99).div(200);
  console.log(`Borrow Amount: ${borrowAmount} Expected Amount: ${expectedAmount}`);

  bytecode = await aaveLeverageModule.interface.encodeFunctionData("lever", [
    setTokenAddr, usdcAddr, wethAddr, borrowAmount, expectedAmount, "AMMSplitterExchangeAdapter", []
  ]);
  console.log(`Lever bytecode: ${bytecode}`);

  const setToken = await hre.ethers.getContractAt("SetToken", setTokenAddr);
  bytecode = setToken.interface.encodeFunctionData("setManager", [newKellyManagerAddr]);
  console.log(`Change Manager bytecode: ${bytecode}`);

  bytecode = await aaveLeverageModule.interface.encodeFunctionData("delever", [
    setTokenAddr, wethAddr, usdcAddr, borrowAmount, expectedAmount, "AMMSplitterExchangeAdapter", []
  ]);
  console.log(`Lever bytecode: ${bytecode}`);

  bytecode = await aaveLeverageModule.interface.encodeFunctionData("deleverToZeroBorrowBalance", [
    setTokenAddr, wethAddr, usdcAddr, ethers.constants.Zero, "AMMSplitterExchangeAdapter", []
  ]);
  console.log(`DeleverToZeroBorrowBalance bytecode: ${bytecode}`);

  bytecode = await setToken.interface.encodeFunctionData("addModule", [
    tradeModuleAddr
  ]);
  console.log(`AddModule bytecode: ${bytecode}`);

  bytecode = await tradeModule.interface.encodeFunctionData("initialize", [
    setTokenAddr
  ]);
  console.log(`TradeModule bytecode: ${bytecode}`);

  // Get the current collateral price
  const ethUSDAggregator = new hre.ethers.Contract(ethUSDAggregatorAddr, ethUSDAggregatorABI, hre.ethers.provider);
  const [,answer] = await ethUSDAggregator.latestRoundData();
  console.log(`answer: ${answer}`);

  // Convert collateral into debt units
  const components = await setToken.getComponents();
  const c0 = await hre.ethers.getContractAt("SetToken", components[0]);
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
  let debt = -(await setToken.getTotalComponentRealUnits(components[1]));
  console.log(`collateral: ${collateral} debt: ${debt}`);
  //require(collateral > 0 && debt > 0, "invalid debt or collateral");

  let ethValue = collateral.mul(answer).div(scale);

  // What is the value of 1 set token in debt terms
  const tokenPrice = ethValue.sub(debt);
  console.log(`tokenPrice: ${tokenPrice}`);

  // What is the desired value of the collateral in debt terms
  ethValue = tokenPrice.mul(await kellyManager.leverage()).div(hre.ethers.BigNumber.from(10).pow(18));
  console.log(`ethValue: ${ethValue}`);
  
  // Get the change in debt and collateral
  debt = hre.ethers.BigNumber.from(debt).sub(ethValue).add(tokenPrice);
  collateral = collateral.sub(ethValue.mul(scale).div(answer));

  const slippage = hre.ethers.BigNumber.from(97).mul(hre.ethers.BigNumber.from(10).pow(18)).div(hre.ethers.BigNumber.from(100)) //await kellyManager.slippage();
  //const slippage = await kellyManager.slippage();
  const minimum = collateral.mul(-1).mul(slippage).div(hre.ethers.BigNumber.from(10).pow(18));
  console.log(`collateral: ${collateral} debt: ${-debt} minimum: ${minimum}`);

  bytecode = await aaveLeverageModule.interface.encodeFunctionData("lever", [
    setTokenAddr, usdcAddr, wethAddr, -debt, minimum, "AMMSplitterExchangeAdapter", []
  ]);
  console.log(`Lever bytecode: ${bytecode}`);

  await kellyManager.connect(signer).invoke(aaveLeverageModule.address, 0, bytecode);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
