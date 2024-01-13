//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.10;

import "@uniswap/v3-core/contracts/libraries/FullMath.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@uniswap/v3-core/contracts/interfaces/callback/IUniswapV3SwapCallback.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/SafeCast.sol";
import {
    IERC20,
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import { IPool } from "../interfaces/external/aave-v3/IPool.sol";
import "../protocol/modules/v1/AaveV3LeverageModule.sol";
import "../protocol/modules/v1/DebtIssuanceModuleV2.sol";
import "../interfaces/ISetToken.sol";

struct RefundState {
    IERC20 weth;
    uint256 wethInitialBalance;
    uint256 wethEndingBalance;
    IERC20 amWeth;
    uint256 amWethInitialBalance;
    uint256 amWethEndingBalance;
    IERC20 usdc;
    uint256 usdcInitialBalance;
    uint256 usdcEndingBalance;
    IERC20 setToken;
    uint256 setTokenInitialBalance;
    uint256 setTokenEndingBalance;
}

contract LeveredSetTokenHelper is IUniswapV3SwapCallback {
    using SafeERC20 for IERC20;
    using SafeERC20 for ISetToken;

    ISetToken internal setToken;
    AaveV3LeverageModule internal aavev3LeverageModule;
    DebtIssuanceModuleV2 internal debtIssuanceModule;
    IUniswapV3Pool internal pool;
    IPool internal lendingPool;
    address internal amWeth;
    address internal weth;
    address internal usdc;
    uint24 internal fee;

    event Minted(address indexed receiver, uint256 mintAmount);
    event Redeemed(address indexed receiver, uint256 redeemAmount);

    modifier refund(address receiver) {
        RefundState memory refundState;

        refundState.weth = IERC20(weth);
        refundState.wethInitialBalance = refundState.weth.balanceOf(address(this));

        refundState.amWeth = IERC20(amWeth);
        refundState.amWethInitialBalance = refundState.amWeth.balanceOf(address(this));

        refundState.usdc = IERC20(usdc);
        refundState.usdcInitialBalance = refundState.usdc.balanceOf(address(this));

        refundState.setToken = IERC20(setToken);
        refundState.setTokenInitialBalance = refundState.setToken.balanceOf(address(this));

        _;

        refundState.wethEndingBalance = refundState.weth.balanceOf(address(this));
        if( refundState.wethEndingBalance > refundState.wethInitialBalance ) {
            refundState.weth.safeTransfer(receiver, refundState.wethEndingBalance - refundState.wethInitialBalance);
        }

        refundState.amWethEndingBalance = refundState.amWeth.balanceOf(address(this));
        if( refundState.amWethEndingBalance > refundState.amWethInitialBalance ) {
            refundState.amWeth.safeTransfer(receiver, refundState.amWethEndingBalance - refundState.amWethInitialBalance);
        }

        refundState.usdcEndingBalance = refundState.usdc.balanceOf(address(this));
        if( refundState.usdcEndingBalance > refundState.usdcInitialBalance ) {
            refundState.usdc.safeTransfer(receiver, refundState.usdcEndingBalance - refundState.usdcInitialBalance);
        }

        refundState.setTokenEndingBalance = refundState.setToken.balanceOf(address(this));
        if( refundState.setTokenEndingBalance > refundState.setTokenInitialBalance ) {
            refundState.setToken.safeTransfer(receiver, refundState.setTokenEndingBalance - refundState.setTokenInitialBalance);
        }
    }

    /**
     * Contract initialization.
     */
    constructor(address _factory, address _debtIssuanceModule, address _setToken, address _lendingPool, 
        address _aavev3LeverageModule, address _amWeth, address _weth, address _usdc, uint24 _fee) public {

        // Save a pointer to the pool and pool tokens
        setToken = ISetToken(_setToken);
        pool = IUniswapV3Pool(IUniswapV3Factory(_factory).getPool(_weth, _usdc, _fee));
        debtIssuanceModule = DebtIssuanceModuleV2(_debtIssuanceModule);
        aavev3LeverageModule = AaveV3LeverageModule(_aavev3LeverageModule);
        lendingPool = IPool(_lendingPool);
        amWeth = _amWeth;
        weth = _weth;
        usdc = _usdc;
        fee = _fee;

    }

    function mintCallback(
        IUniswapV3Pool _pool,
        int256 amount0Delta,
        int256 amount1Delta,
        bytes calldata data
    ) internal {
        address _weth = weth;
        address _amWeth = amWeth;

        // How much WETH did we get?
        uint256 balance = _pool.token0() == _weth ? SafeCast.toUint256(-amount0Delta) : 
            SafeCast.toUint256(-amount1Delta);
        
        // Deposit this into AAVE
        {
            IPool _lendingPool = lendingPool;
            IERC20(_weth).approve(address(_lendingPool), balance);
            _lendingPool.deposit(_weth, balance, address(this), 0);
        }
        

        // Decode the parameters
        (address sender, uint256 amount, uint256 collateral) = abi.decode(data, (address, uint256, uint256));

        // Transfer the user portion to the contract
        require(collateral >= balance, "collateral overflow");
        IERC20(_amWeth).safeTransferFrom(sender, address(this), collateral - balance);

        // Issue the tokens
        {
            ISetToken _setToken = setToken;
            DebtIssuanceModuleV2 _debtIssuanceModule = debtIssuanceModule;
            IERC20(_amWeth).approve(address(_debtIssuanceModule), collateral);
            _debtIssuanceModule.issue(_setToken, amount, address(this));
        }

        // Complete the swap
        if (amount0Delta > 0) IERC20(_pool.token0()).safeTransfer(msg.sender, uint256(amount0Delta));
        if (amount1Delta > 0) IERC20(_pool.token1()).safeTransfer(msg.sender, uint256(amount1Delta));
    }

    function redeemCallback(
        IUniswapV3Pool _pool,
        address _usdc,
        int256 amount0Delta,
        int256 amount1Delta,
        bytes calldata data
    ) internal {
        address _weth = weth;

        // Decode the parameters
        (uint256 amount) = abi.decode(data, (uint256));

        // Redeem the tokens
        {
            ISetToken _setToken = setToken;
            DebtIssuanceModuleV2 _debtIssuanceModule = debtIssuanceModule;
            IERC20(_usdc).approve(address(_debtIssuanceModule), 
                _usdc == _pool.token0() ? SafeCast.toUint256(-amount0Delta) : SafeCast.toUint256(-amount1Delta));
            _debtIssuanceModule.redeem(_setToken, amount, address(this));
        }
        
        // Determine how much we owe to the swap pool
        uint256 owed = _weth == _pool.token0() ?
                SafeCast.toUint256(amount0Delta) : SafeCast.toUint256(amount1Delta);

        // Convert some of the amWeth back to WETH
        {
            IPool _lendingPool = lendingPool;
            _lendingPool.withdraw(_weth, owed, address(this));
        }

        // Complete the swap
        if (amount0Delta > 0) IERC20(_pool.token0()).safeTransfer(msg.sender, uint256(amount0Delta));
        if (amount1Delta > 0) IERC20(_pool.token1()).safeTransfer(msg.sender, uint256(amount1Delta));
        
    }

    /// @notice Called to `msg.sender` after executing a swap via IUniswapV3Pool#swap.
    /// @param amount0Delta The amount of token0 that was sent (negative) or must be received (positive) by the pool by
    /// the end of the swap. If positive, the callback must send that amount of token0 to the pool.
    /// @param amount1Delta The amount of token1 that was sent (negative) or must be received (positive) by the pool by
    /// the end of the swap. If positive, the callback must send that amount of token1 to the pool.
    function uniswapV3SwapCallback(
        int256 amount0Delta,
        int256 amount1Delta,
        bytes calldata data
    ) external override {
        IUniswapV3Pool _pool = pool;
        address _usdc = usdc;
        require(msg.sender == address(_pool), "callback caller");

        // Issue the correct callback depending on token ordering
        if( _pool.token0() == _usdc ) {
            amount0Delta < 0 ? redeemCallback(_pool, _usdc, amount0Delta, amount1Delta, data) :
                mintCallback(_pool, amount0Delta, amount1Delta, data);
        }
        else {
            amount1Delta < 0 ? redeemCallback(_pool, _usdc, amount0Delta, amount1Delta, data) :
                mintCallback(_pool, amount0Delta, amount1Delta, data);
        }
    }

    function mint(address receiver, uint256 amount, uint160 sqrtPriceLimitX96) external refund(receiver) {
        IUniswapV3Pool _pool = pool;
        address _usdc = usdc;
        
        uint256 loan;
        uint256 collateral;
        {
            ISetToken _setToken = setToken;

            // Make sure we are up to date
            aavev3LeverageModule.sync(_setToken);

            // Get the required units per token
            (address[] memory components, uint256[] memory totalEquityUnits, uint256[] memory totalDebtUnits) =
                debtIssuanceModule.getRequiredComponentIssuanceUnits(_setToken, 1 ether);
            require(components[0] == amWeth, "invalid collateral");
            require(components[1] == _usdc, "invalid debt");
            require(totalEquityUnits[0] > 0 && totalEquityUnits[1] == 0, "invalid equity units");
            require(totalDebtUnits[0] == 0 && totalDebtUnits[1] > 0, "invalid debt units");

            // How much USDC do I need to mint the Set Tokens?
            loan = FullMath.mulDiv(amount, totalDebtUnits[1], 1 ether);

            // How much amWeth is required?
            collateral = FullMath.mulDivRoundingUp(amount, totalEquityUnits[0], 1 ether);
        }

        // Encode the required data for the swap loan
        bytes memory data = abi.encode(msg.sender, amount, collateral);

        // Take out the loan and mint the tokens
        _pool.swap(
            address(this),
            _pool.token0() == _usdc ? true : false,
            SafeCast.toInt256(loan),
            sqrtPriceLimitX96,
            data
        );

        emit Minted(receiver, amount);
    }

    function redeem(address receiver, uint256 amount, uint160 sqrtPriceLimitX96) external refund(receiver) {
        IUniswapV3Pool _pool = pool;
        address _usdc = usdc;

        uint256 loan;
        {
            ISetToken _setToken = setToken;

            // Make sure we are up to date
            aavev3LeverageModule.sync(_setToken);

            // Get the required units per token
            (address[] memory components, uint256[] memory totalEquityUnits, uint256[] memory totalDebtUnits) =
                debtIssuanceModule.getRequiredComponentRedemptionUnits(_setToken, 1 ether);
            require(components[0] == amWeth, "invalid collateral");
            require(components[1] == _usdc, "invalid debt");
            require(totalEquityUnits[0] > 0 && totalEquityUnits[1] == 0, "invalid equity units");
            require(totalDebtUnits[0] == 0 && totalDebtUnits[1] > 0, "invalid debt units");

            // Transfer the set tokens to this contract
            IERC20(_setToken).safeTransferFrom(msg.sender, address(this), amount);

            // How much USDC do I need to redeem the Set Tokens?
            loan = FullMath.mulDivRoundingUp(amount, totalDebtUnits[1], 1 ether);
        }        

        // Encode the required data for the swap loan
        bytes memory data = abi.encode(amount);

        // Take out the loan and redeem the tokens
        _pool.swap(
            address(this),
            _pool.token0() == _usdc ? false : true,
            -SafeCast.toInt256(loan),
            sqrtPriceLimitX96,
            data
        );

        emit Redeemed(receiver, amount);
    }

}