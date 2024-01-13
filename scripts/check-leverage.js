require("dotenv").config();

const { ethers } = require("ethers");

const setTokenAddr = "0x3dc831944DFAfF83654dAd0236a8952Bd0BC7f49";
const setTokenABI = [{"inputs":[],"name":"getPositions","outputs":[{"components":[{"internalType":"address","name":"component","type":"address"},{"internalType":"address","name":"module","type":"address"},{"internalType":"int256","name":"unit","type":"int256"},{"internalType":"uint8","name":"positionState","type":"uint8"},{"internalType":"bytes","name":"data","type":"bytes"}],"internalType":"struct ISetToken.Position[]","name":"","type":"tuple[]"}],"stateMutability":"view","type":"function"}];

const ethUSDAggregatorAddr = "0xF9680D99D6C9589e2a93a78A04A279e509205945";
const ethUSDAggregatorABI = [{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"latestRoundData","outputs":[{"internalType":"uint80","name":"roundId","type":"uint80"},{"internalType":"int256","name":"answer","type":"int256"},{"internalType":"uint256","name":"startedAt","type":"uint256"},{"internalType":"uint256","name":"updatedAt","type":"uint256"},{"internalType":"uint80","name":"answeredInRound","type":"uint80"}],"stateMutability":"view","type":"function"}];

const provider = new ethers.providers.JsonRpcProvider("https://polygon-mainnet.infura.io/v3/" + process.env.INFURA_TOKEN);

async function main() {
  
  const ethUSDAggregator = new ethers.Contract(ethUSDAggregatorAddr, ethUSDAggregatorABI, provider);
  const ethUSDAggregatorDecimals = await ethUSDAggregator.decimals();
  const {answer} = await ethUSDAggregator.latestRoundData();
  console.log(`ETH Price: $${ethers.utils.formatUnits(answer, ethUSDAggregatorDecimals)}`);
  
  const setToken = new ethers.Contract(setTokenAddr, setTokenABI, provider);
  const [collateralPosition, debtPosition] = await setToken.getPositions();
  const [,,collateral] = collateralPosition;
  const [,,debt] = debtPosition;
  const etherValue = collateral.mul(answer).div(ethers.BigNumber.from("10").pow(20));

  console.log(`Collateral: ${ethers.utils.formatEther(collateral)} Value: $${ethers.utils.formatUnits(etherValue, 6)}`);
  console.log(`Debt: -$${ethers.utils.formatUnits(-debt, 6)}`);

  const tokenPrice = etherValue.add(debt);
  console.log(`Token Price: $${ethers.utils.formatUnits(tokenPrice, 6)}`);

  leverage = etherValue.mul(ethers.BigNumber.from(10).pow(6)).div(etherValue.add(debt));
  console.log(`Leverage: ${ethers.utils.formatUnits(leverage, 6)}`);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });