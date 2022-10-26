const Transport = require("@ledgerhq/hw-transport-node-hid").default;
const AppEth = require("@ledgerhq/hw-app-eth").default;
const { ethers } = require("ethers");
const BigNumber = ethers.BigNumber;

const DERIVATION_PATH = "m/44'/60'/0'/0/0"; // Primary Address

const hre = require("hardhat");

const provider = new ethers.providers.JsonRpcProvider("https://polygon-mainnet.infura.io/v3/" + process.env.INFURA_TOKEN);

const ethUSDAggregatorAddr = "0xF9680D99D6C9589e2a93a78A04A279e509205945";

async function main() {

  const devices = await Transport.list();
  if (devices.length === 0) throw 'no device';
  const transport = await Transport.create();
  const eth = new AppEth(transport);

  const kellyResolverFactory = await hre.ethers.getContractFactory("KellyResolver");

  const network = await provider.getNetwork();
  const chainId = await network.chainId;
  const address = await eth.getAddress(DERIVATION_PATH);
  const nonce = await provider.getTransactionCount(address.address);
  const fees = await provider.getFeeData();
  console.log(`${fees.maxFeePerGas} ${fees.maxPriorityFeePerGas} ${fees.gasPrice}`);
  const tx = kellyResolverFactory.getDeployTransaction(ethUSDAggregatorAddr);
  let unsignedTx = { 
    ...tx,
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

  console.log("KellyResolver deployed to:", result.contractAddress);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });