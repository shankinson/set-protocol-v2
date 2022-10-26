const Transport = require("@ledgerhq/hw-transport-node-hid").default;
const AppEth = require("@ledgerhq/hw-app-eth").default;
const { ethers } = require("ethers");
const BigNumber = ethers.BigNumber;

const DERIVATION_PATH = "m/44'/60'/0'/0/0"; // Primary Address

const amWethAddr = "0x28424507fefb6f7f8e9d3860f56504e4e5f5f390";
const usdcAddr = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
const wethAddr = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";
const aaveLendingPoolAddr = "0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf";
const aaveLeverageModuleAddr = "0xB7F72e15239197021480EB720E1495861A1ABdce";
const uniswapV3FactoryAddr = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
const debtIssuanceeModuleV2Addr = "0xf2dC2f456b98Af9A6bEEa072AF152a7b0EaA40C9";
const setTokenAddr = "0xB686bf528C77124cbfB65FB4CFC1EED9794F2D74";

const hre = require("hardhat");

const provider = new ethers.providers.JsonRpcProvider("https://polygon-mainnet.infura.io/v3/" + process.env.INFURA_TOKEN);

async function main() {

  const devices = await Transport.list();
  if (devices.length === 0) throw 'no device';
  const transport = await Transport.create();
  const eth = new AppEth(transport);

  const leveredSetTokenHelperFactory = await hre.ethers.getContractFactory("LeveredSetTokenHelper");

  const network = await provider.getNetwork();
  const chainId = await network.chainId;
  const address = await eth.getAddress(DERIVATION_PATH);
  const nonce = await provider.getTransactionCount(address.address);
  const fees = await provider.getFeeData();
  console.log(`${fees.maxFeePerGas} ${fees.maxPriorityFeePerGas} ${fees.gasPrice}`);
  const tx = leveredSetTokenHelperFactory.getDeployTransaction(
    uniswapV3FactoryAddr,
    debtIssuanceeModuleV2Addr,
    setTokenAddr,
    aaveLendingPoolAddr,
    aaveLeverageModuleAddr,
    amWethAddr,
    wethAddr,
    usdcAddr,
    500
  );
  let unsignedTx = { 
    ...tx,
    from: address.address,
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

  console.log("LeveredSetTokenHelper deployed to:", result.contractAddress);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });