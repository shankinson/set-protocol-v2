const Transport = require("@ledgerhq/hw-transport-node-hid").default;
const AppEth = require("@ledgerhq/hw-app-eth").default;
const { ethers } = require("ethers");
const BigNumber = ethers.BigNumber;
const axios = require("axios");

const DERIVATION_PATH = "m/44'/60'/0'/0/0"; // Primary Address

const hre = require("hardhat");

const provider = new hre.ethers.providers.JsonRpcProvider("https://polygon-mainnet.infura.io/v3/" + process.env.INFURA_TOKEN);

const uniV3FactoryAddr = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
const leveredSetTokenHelperAddr = "0xe44e61ffCe8A87d6095f4875f04E7c229D38a5B1";
const usdcAddr = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
const wethAddr = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";
const setTokenAddr = "0x3dc831944DFAfF83654dAd0236a8952Bd0BC7f49";

const uniswapV3FactoryABI = [{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"},{"internalType":"uint24","name":"","type":"uint24"}],"name":"getPool","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}];
const uniswapV3PoolABI = [{"inputs":[],"name":"slot0","outputs":[{"internalType":"uint160","name":"sqrtPriceX96","type":"uint160"},{"internalType":"int24","name":"tick","type":"int24"},{"internalType":"uint16","name":"observationIndex","type":"uint16"},{"internalType":"uint16","name":"observationCardinality","type":"uint16"},{"internalType":"uint16","name":"observationCardinalityNext","type":"uint16"},{"internalType":"uint8","name":"feeProtocol","type":"uint8"},{"internalType":"bool","name":"unlocked","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"token0","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"token1","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}];

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

  const devices = await Transport.list();
  if (devices.length === 0) throw 'no device';
  const transport = await Transport.create();
  const eth = new AppEth(transport);

  const network = await provider.getNetwork();
  const chainId = await network.chainId;
  const address = await eth.getAddress(DERIVATION_PATH);
  const nonce = await provider.getTransactionCount(address.address);

  const setToken = await hre.ethers.getContractAt("SetToken", setTokenAddr);
  console.log("SetToken deployed to:", setToken.address);

  const leveredSetTokenHelper = await hre.ethers.getContractAt("LeveredSetTokenHelper", leveredSetTokenHelperAddr);
  console.log("LeveredSetTokenHelper deployed to:", leveredSetTokenHelper.address);

  const uniswapV3Factory = await hre.ethers.getContractAt(uniswapV3FactoryABI, uniV3FactoryAddr);
  console.log("UniswapV3Factory deployed to:", uniswapV3Factory.address);

  const uniswapV3PoolAddr = await uniswapV3Factory.getPool(wethAddr, usdcAddr, 500);
  console.log(`UniswapV3Pool address: ${uniswapV3PoolAddr}`);

  const uniswapV3Pool = await hre.ethers.getContractAt(uniswapV3PoolABI, uniswapV3PoolAddr);

  const tokensToRedeem = hre.ethers.utils.parseEther("1");
  let execPayload = setToken.interface.encodeFunctionData("approve", [
    leveredSetTokenHelper.address, tokensToRedeem]
  );

  let response = await axios.get(`https://api.polygonscan.com/api?module=gastracker&action=gasoracle&apikey=${process.env.ETHERSCAN_API_KEY}`);
  if(response.status != 200 || response.data.message != 'OK') {
    throw response.statusText;
  }
  let safeGasPrice = hre.ethers.utils.parseUnits(response.data.result.SafeGasPrice, 'gwei');
  console.log(`safeGasPrice: ${safeGasPrice}`);

  let fees = await provider.getFeeData();
  console.log(`maxFeePerGas: ${fees.maxFeePerGas} maxPriorityFeePerGas: ${fees.maxPriorityFeePerGas} gasPrice: ${fees.gasPrice}`);
  
  let unsignedTx = {
    to: setTokenAddr,
    data: execPayload,
    maxPriorityFeePerGas: hre.ethers.utils.parseUnits("30", "gwei"),
    maxFeePerGas: safeGasPrice,
    nonce,
    value: 0,
    chainId,
    type: 2,
    from: address.address
  };
  unsignedTx.gasLimit = await provider.estimateGas(unsignedTx);

  let serializedTx = ethers.utils.serializeTransaction(unsignedTx).substring(2);
  let sig = await eth.signTransaction(DERIVATION_PATH, serializedTx, null);

  let signedTx = ethers.utils.serializeTransaction(unsignedTx, {
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

  let [sqrtPriceX96] = await uniswapV3Pool.slot0();
  console.log(`sqrtPriceX96: ${sqrtPriceX96}`);

  execPayload = leveredSetTokenHelper.interface.encodeFunctionData("redeem", [
    address.address, tokensToRedeem, babylonianSqrt(sqrtPriceX96.pow(2).mul(1005).div(1000))
  ]);

  response = await axios.get(`https://api.polygonscan.com/api?module=gastracker&action=gasoracle&apikey=${process.env.ETHERSCAN_API_KEY}`);
  if(response.status != 200 || response.data.message != 'OK') {
    throw response.statusText;
  }
  safeGasPrice = hre.ethers.utils.parseUnits(response.data.result.SafeGasPrice, 'gwei');
  console.log(`safeGasPrice: ${safeGasPrice}`);

  fees = await provider.getFeeData();
  console.log(`maxFeePerGas: ${fees.maxFeePerGas} maxPriorityFeePerGas: ${fees.maxPriorityFeePerGas} gasPrice: ${fees.gasPrice}`);
  
  unsignedTx = {
    to: leveredSetTokenHelperAddr,
    data: execPayload,
    maxPriorityFeePerGas: hre.ethers.utils.parseUnits("30", "gwei"),
    maxFeePerGas: safeGasPrice,
    nonce,
    value: 0,
    chainId,
    type: 2,
    from: address.address
  };
  unsignedTx.gasLimit = await provider.estimateGas(unsignedTx);

  serializedTx = ethers.utils.serializeTransaction(unsignedTx).substring(2);
  sig = await eth.signTransaction(DERIVATION_PATH, serializedTx, null);

  signedTx = ethers.utils.serializeTransaction(unsignedTx, {
      v: BigNumber.from("0x" + sig.v).toNumber(),
      r: ("0x" + sig.r),
      s: ("0x" + sig.s)
  });

  console.log(`${JSON.stringify(signedTx)}`);

  receipt = await provider.sendTransaction(signedTx);
  console.log(`${JSON.stringify(receipt)}`);

  result = await receipt.wait();
  console.log("Transaction completed");
  console.log(JSON.stringify(result));

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });