const TransportNodeHid = require("@ledgerhq/hw-transport-node-hid").default;
const AppEth = require("@ledgerhq/hw-app-eth").default;
const { ethers } = require("ethers");
const BigNumber = ethers.BigNumber;

const DERIVATION_PATH = "m/44'/60'/0'/0/0"; // Primary Address

const controllerAddr = "0x126B4798131f3bE3D18E8f0371fb6824dbAE57b7";
const aaveV3LeverageModuleAddr = "0x4d8eA935D9A7AcD72502dc5cD00B9B1B751C06DC";

const hre = require("hardhat");

const provider = new ethers.providers.JsonRpcProvider("https://polygon-mainnet.infura.io/v3/" + process.env.INFURA_TOKEN);

async function main() {

  const devices = await TransportNodeHid.list();
  if (devices.length === 0) throw 'no device';
  const transport = await TransportNodeHid.create();
  const eth = new AppEth(transport);

  const factory = await hre.ethers.getContractFactory("KellyManager");

  const network = await provider.getNetwork();
  const chainId = await network.chainId;
  const address = await eth.getAddress(DERIVATION_PATH);
  const nonce = await provider.getTransactionCount(address.address);
  const fees = await provider.getFeeData();
  console.log(`address: ${address.address}`)
  console.log(`${fees.maxFeePerGas} ${fees.maxPriorityFeePerGas} ${fees.gasPrice}`);

  let maxFeePerGas = ethers.utils.parseUnits("75", "gwei");
  let maxPriorityFeePerGas = ethers.utils.parseUnits("30", "gwei");

  const tx = factory.getDeployTransaction(
    aaveV3LeverageModuleAddr
  );
  let unsignedTx = { 
    ...tx,
    maxPriorityFeePerGas: maxPriorityFeePerGas, //fees.maxPriorityFeePerGas,
    maxFeePerGas: maxFeePerGas, //fees.maxFeePerGas,
    nonce,
    value: 0,
    chainId,
    type: 2,
    from: address.address
  };
  unsignedTx.gasLimit = await provider.estimateGas(unsignedTx);

  const serializedTx = ethers.utils.serializeTransaction(unsignedTx).substring(2);
  const sig = await eth.signTransaction(DERIVATION_PATH, serializedTx, null);

  const signedTx = ethers.utils.serializeTransaction(unsignedTx, {
      v: BigNumber.from("0x" + sig.v).toNumber(),
      r: ("0x" + sig.r),
      s: ("0x" + sig.s)
  });

  console.log(`${JSON.stringify(signedTx)}`);

  let receipt = await provider.sendTransaction(signedTx);
  console.log(`${JSON.stringify(receipt)}`);

  let result = await receipt.wait();
  console.log("Transaction completed");
  console.log(JSON.stringify(result));

  console.log("Contract deployed to:", result.contractAddress);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });