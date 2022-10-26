const Transport = require("@ledgerhq/hw-transport-node-hid").default;
const AppEth = require("@ledgerhq/hw-app-eth").default;
const { ethers } = require("ethers");
const BigNumber = ethers.BigNumber;

const DERIVATION_PATH = "m/44'/60'/0'/0/0"; // Primary Address

const hre = require("hardhat");

const provider = new hre.ethers.providers.JsonRpcProvider("https://polygon-mainnet.infura.io/v3/" + process.env.INFURA_TOKEN);
 
const kellyManagerAddr = "0x1c147184C707a3011761B387898e847d3f3c38A6";
const setTokenAddr = "0xB686bf528C77124cbfB65FB4CFC1EED9794F2D74";

async function main() {

  const devices = await Transport.list();
  if (devices.length === 0) throw 'no device';
  const transport = await Transport.create();
  const eth = new AppEth(transport);

  const kellyManager = await hre.ethers.getContractAt("KellyManager", kellyManagerAddr);
  console.log("KellyManager deployed to:", kellyManager.address);

  const [canExec, execPayload] = await kellyManager.checker(setTokenAddr);
  console.log(`${canExec} ${execPayload}`);

  const network = await provider.getNetwork();
  const chainId = await network.chainId;
  const address = await eth.getAddress(DERIVATION_PATH);
  const nonce = await provider.getTransactionCount(address.address);
  const fees = await provider.getFeeData();
  console.log(`${fees.maxFeePerGas} ${fees.maxPriorityFeePerGas} ${fees.gasPrice}`);
  let unsignedTx = {
    to: kellyManagerAddr,
    data: execPayload,
    maxPriorityFeePerGas: ethers.utils.parseUnits("35", "gwei"), //fees.maxPriorityFeePerGas,
    maxFeePerGas: fees.maxFeePerGas,
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

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });