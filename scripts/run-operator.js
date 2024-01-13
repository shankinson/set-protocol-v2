const Transport = require("@ledgerhq/hw-transport-node-hid").default;
const AppEth = require("@ledgerhq/hw-app-eth").default;
const { ethers } = require("ethers");
const BigNumber = ethers.BigNumber;
const axios = require("axios");

const DERIVATION_PATH = "m/44'/60'/0'/0/0"; // Primary Address

const hre = require("hardhat");

const provider = new hre.ethers.providers.JsonRpcProvider("https://polygon-mainnet.infura.io/v3/" + process.env.INFURA_TOKEN);

const usdcAddr = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
const wethAddr = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";
const kellyManagerAddr = "0xB856041552C8Fe7084759816f1Fb5A51d6f8435F";
const setTokenAddr = "0x3dc831944DFAfF83654dAd0236a8952Bd0BC7f49";
const debtIssuanceeModuleV2Addr = "0xFeCd42400b3B0aECBC13b5B9eb7B7585f0a2201B";

const ethUSDAggregatorAddr = "0xF9680D99D6C9589e2a93a78A04A279e509205945";
const ethUSDAggregatorABI = [{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"latestRoundData","outputs":[{"internalType":"uint80","name":"roundId","type":"uint80"},{"internalType":"int256","name":"answer","type":"int256"},{"internalType":"uint256","name":"startedAt","type":"uint256"},{"internalType":"uint256","name":"updatedAt","type":"uint256"},{"internalType":"uint80","name":"answeredInRound","type":"uint80"}],"stateMutability":"view","type":"function"}];

const zeroExApiKey = process.env.ZEROEX_KEY

async function main() {

  const devices = await Transport.list();
  if (devices.length === 0) throw 'no device';
  const transport = await Transport.create();
  const eth = new AppEth(transport);

  const network = await provider.getNetwork();
  const chainId = await network.chainId;
  const address = await eth.getAddress(DERIVATION_PATH);
  const nonce = await provider.getTransactionCount(address.address);

  const kellyManager = await hre.ethers.getContractAt("KellyManager", kellyManagerAddr);
  console.log("KellyManager deployed to:", kellyManager.address);

  const setToken = await hre.ethers.getContractAt("SetToken", setTokenAddr);
  console.log("SetToken deployed to:", setToken.address);

  const usdcDecimals = 6;
  const wethDecimals = 18; 
  const decimalDelta = wethDecimals - usdcDecimals;
  const setSupply = await setToken.totalSupply();

  const ethUSDAggregatorDecimals = 8;
  const ethUSDAggregator = await hre.ethers.getContractAt(ethUSDAggregatorABI, ethUSDAggregatorAddr);
  const {answer} = await ethUSDAggregator.latestRoundData();
  console.log(`ETH/USD Aggregator: answer: ${answer}`);

  const debtIssuanceModuleV2 = await hre.ethers.getContractAt("DebtIssuanceModuleV2", debtIssuanceeModuleV2Addr);
  const [componentAddresses, equityNotional, debtNotional] = await debtIssuanceModuleV2.getRequiredComponentIssuanceUnits(setTokenAddr, ethers.utils.parseEther("1"));
  console.log(`${componentAddresses} ${equityNotional} ${debtNotional}`);

  let etherValue = equityNotional[0].mul(answer).div(BigNumber.from("10").pow(decimalDelta+ethUSDAggregatorDecimals));
  console.log(`Ether Value: ${etherValue}`);

  let leverage = etherValue.mul(BigNumber.from(10).pow(usdcDecimals)).div(etherValue.sub(debtNotional[1]));
  console.log(`Leverage: ${ethers.utils.formatUnits(leverage, usdcDecimals)}`);

  const tokenPrice = etherValue.sub(debtNotional[1]);
  const ethValue = tokenPrice.mul(15).div(10);
  const usdcValue = tokenPrice.sub(ethValue).abs();
  const ethAmount = ethValue.mul(BigNumber.from("10").pow(decimalDelta+ethUSDAggregatorDecimals)).div(answer);
  console.log(`Token Price: ${tokenPrice} ethValue: ${ethValue} usdcValue: ${usdcValue} ethAmount: ${ethAmount}`);

  const deltaEth = equityNotional[0].sub(ethAmount);
  const deltaUsdc = debtNotional[1].sub(usdcValue);
  console.log(`DeltaEth: ${deltaEth} DeltaUSDC: ${deltaUsdc}`);

  let execPayload;
  if( deltaEth.gt(ethers.constants.Zero)) {
    const expectedAmount = deltaUsdc.mul(99).div(100);
    console.log(`Expected Amount: ${expectedAmount}`);
    const totalDeltaEth = deltaEth.mul(setSupply).div(ethers.constants.WeiPerEther);
    const response = await axios.get(`https://polygon.api.0x.org/swap/v1/quote?buyToken=${usdcAddr}&sellToken=${wethAddr}&sellAmount=${totalDeltaEth}&slippagePercentage=0.01&enableSlippageProtection=true&priceImpactProtectionPercentage=0.01`, {headers: {'0x-api-key': zeroExApiKey}});
    if(response.status != 200) {
      throw response.statusText;
    }
    const guaranteedPrice = ethers.utils.parseUnits(response.data.guaranteedPrice, 6);
    const minAmount = totalDeltaEth.mul(guaranteedPrice).div(BigNumber.from(10).pow(wethDecimals));
    if( minAmount.lt(expectedAmount) ) {
      throw `minAmount: ${minAmount} less than expectedAmount: ${expectedAmount}`;
    }
    const minAmountPerToken = minAmount.mul(ethers.constants.WeiPerEther).div(setSupply);
    console.log(`Total Delta Eth: ${totalDeltaEth}, minAmount: ${minAmount}`);

    execPayload = kellyManager.interface.encodeFunctionData("operatorExecute", [
      setTokenAddr, wethAddr, usdcAddr, deltaEth, minAmountPerToken, "ZeroExchangeAdapter", response.data.data
    ]);
  }
  else {
    const expectedAmount = deltaEth.abs().mul(99).div(100);
    console.log(`Expected Amount: ${expectedAmount}`);
    const totalDeltaUsdc = deltaUsdc.abs().mul(setSupply).div(ethers.constants.WeiPerEther);
    const response = await axios.get(`https://polygon.api.0x.org/swap/v1/quote?buyToken=${wethAddr}&sellToken=${usdcAddr}&sellAmount=${totalDeltaUsdc}&slippagePercentage=0.01&enableSlippageProtection=true&priceImpactProtectionPercentage=0.01`, {headers: {'0x-api-key': zeroExApiKey}});
    if(response.status != 200) {
      throw response.statusText;
    }
    const guaranteedPrice = ethers.utils.parseEther(response.data.guaranteedPrice);
    const minAmount = totalDeltaUsdc.mul(guaranteedPrice).div(BigNumber.from(10).pow(usdcDecimals));
    if( minAmount.lt(expectedAmount) ) {
      throw `minAmount: ${minAmount} less than expectedAmount: ${expectedAmount}`;
    }
    const minAmountPerToken = minAmount.mul(ethers.constants.WeiPerEther).div(setSupply);
    console.log(`Total Delta USDC: ${totalDeltaUsdc}, minAmount: ${minAmount}`);

    execPayload = kellyManager.interface.encodeFunctionData("operatorExecute", [
      setTokenAddr, usdcAddr, wethAddr, deltaUsdc.abs(), minAmountPerToken, "ZeroExchangeAdapter", response.data.data
    ]);
  }

  const response = await axios.get(`https://api.polygonscan.com/api?module=gastracker&action=gasoracle&apikey=${process.env.ETHERSCAN_API_KEY}`);
  if(response.status != 200 || response.data.message != 'OK') {
    throw response.statusText;
  }
  const safeGasPrice = hre.ethers.utils.parseUnits(response.data.result.SafeGasPrice, 'gwei');
  console.log(`safeGasPrice: ${safeGasPrice}`);

  const fees = await provider.getFeeData();
  console.log(`maxFeePerGas: ${fees.maxFeePerGas} maxPriorityFeePerGas: ${fees.maxPriorityFeePerGas} gasPrice: ${fees.gasPrice}`);
  
  let unsignedTx = {
    to: kellyManagerAddr,
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