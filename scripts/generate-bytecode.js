const hre = require("hardhat");

const debtIssuanceeModuleV2Addr = "0xf2dC2f456b98Af9A6bEEa072AF152a7b0EaA40C9";
const aaveLeverageModuleAddr = "0xB7F72e15239197021480EB720E1495861A1ABdce";
const streamingFeeModuleAddr = "0x8440f6a2c42118bed0D6E6A89Bf170ffd13e21c0";
const usdcAddr = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
const wethAddr = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";
const setTokenAddr = "0xB686bf528C77124cbfB65FB4CFC1EED9794F2D74";
const ledgerAddr = "0xaFFB88d48B0Be5cd938015ba104d43E0a9DF86b2";
const newKellyManagerAddr = "0x1D8B42704e8357e2C29B15D41127fb516DF6494c";

async function main() {
  
  const debtIssuanceModuleV2 = await hre.ethers.getContractAt("DebtIssuanceModuleV2", debtIssuanceeModuleV2Addr);
  console.log("DebtIssuanceModuleV2 deployed to:", debtIssuanceModuleV2.address);

  const aaveLeverageModule = await hre.ethers.getContractAt("AaveLeverageModule", aaveLeverageModuleAddr);
  console.log("AaveLeverageModule deployed to:", aaveLeverageModule.address);

  const streamingFeeModule = await hre.ethers.getContractAt("StreamingFeeModule", streamingFeeModuleAddr);
  console.log("StreamingFeeModule deployed to:", streamingFeeModule.address);

  
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
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
