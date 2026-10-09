// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {DestPool} from "../src/DestPool.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract MockERC20 is ERC20 {
    constructor() ERC20("Mock USDC", "mUSDC") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract DestPoolTest is Test {
    DestPool pool;
    MockERC20 token;

    address owner = address(0x0AA0);
    address relayer = address(0xBEEF);
    address recipient = address(0xB0B);
    address agentRecipient = address(0xCAFE);

    uint256 constant FEE_BPS = 50;
    uint256 constant LIQUIDITY = 1_000 ether;

    function setUp() public {
        token = new MockERC20();
        pool = new DestPool(address(token), relayer, owner, FEE_BPS);
        token.mint(address(pool), LIQUIDITY);
    }

    function test_Release_HappyPath_WithFee() public {
        uint256 amount = 100 ether;
        uint256 fee = (amount * FEE_BPS) / 10_000;
        uint256 payout = amount - fee;
        bytes32 sourceRef = keccak256("src-ref-1");

        vm.expectEmit(true, false, false, true, address(pool));
        emit DestPool.Released(recipient, payout, fee, sourceRef);

        vm.prank(relayer);
        pool.release(recipient, amount, sourceRef);

        assertEq(token.balanceOf(recipient), payout);
        assertEq(token.balanceOf(address(pool)), LIQUIDITY - payout);
    }

    function test_Release_ToDifferentRecipient_AgentToAgent() public {
        uint256 amount = 50 ether;
        uint256 fee = (amount * FEE_BPS) / 10_000;
        uint256 payout = amount - fee;
        bytes32 sourceRef = keccak256("src-ref-agent");

        vm.expectEmit(true, false, false, true, address(pool));
        emit DestPool.Released(agentRecipient, payout, fee, sourceRef);

        vm.prank(relayer);
        pool.release(agentRecipient, amount, sourceRef);

        assertEq(token.balanceOf(agentRecipient), payout);
        assertEq(token.balanceOf(recipient), 0);
    }

    function test_RevertWhen_Release_CalledByNonRelayer() public {
        vm.expectRevert(DestPool.NotRelayer.selector);
        vm.prank(address(0xDEAD));
        pool.release(recipient, 100 ether, bytes32(0));
    }

    function test_RevertWhen_Release_ContractPaused() public {
        vm.prank(owner);
        pool.pause();

        vm.expectRevert(DestPool.ContractPaused.selector);
        vm.prank(relayer);
        pool.release(recipient, 100 ether, bytes32(0));
    }

    function test_RevertWhen_Release_InsufficientLiquidity() public {
        uint256 amount = LIQUIDITY * 2;

        vm.expectRevert(DestPool.InsufficientLiquidity.selector);
        vm.prank(relayer);
        pool.release(recipient, amount, bytes32(0));
    }

    function test_RevertWhen_Release_ZeroRecipient() public {
        vm.expectRevert(DestPool.ZeroRecipient.selector);
        vm.prank(relayer);
        pool.release(address(0), 100 ether, bytes32(0));
    }

    function test_RevertWhen_Release_ZeroAmount() public {
        vm.expectRevert(DestPool.ZeroAmount.selector);
        vm.prank(relayer);
        pool.release(recipient, 0, bytes32(0));
    }

    function test_FeeMath_ZeroFeeBps() public {
        DestPool zeroFeePool = new DestPool(address(token), relayer, owner, 0);
        token.mint(address(zeroFeePool), LIQUIDITY);

        uint256 amount = 100 ether;

        vm.expectEmit(true, false, false, true, address(zeroFeePool));
        emit DestPool.Released(recipient, amount, 0, bytes32(0));

        vm.prank(relayer);
        zeroFeePool.release(recipient, amount, bytes32(0));

        assertEq(token.balanceOf(recipient), amount);
    }

    function test_FeeMath_TypicalFeeBps() public {
        uint256 amount = 100 ether;
        uint256 fee = (amount * 50) / 10_000;
        uint256 payout = amount - fee;

        vm.prank(relayer);
        pool.release(recipient, amount, bytes32(0));

        assertEq(token.balanceOf(recipient), payout);
        assertEq(fee, 0.5 ether);
    }

    function test_FeeMath_FullFeeBps_HundredPercent() public {
        DestPool fullFeePool = new DestPool(address(token), relayer, owner, 10_000);
        token.mint(address(fullFeePool), LIQUIDITY);

        uint256 amount = 100 ether;

        vm.expectEmit(true, false, false, true, address(fullFeePool));
        emit DestPool.Released(recipient, 0, amount, bytes32(0));

        vm.prank(relayer);
        fullFeePool.release(recipient, amount, bytes32(0));

        assertEq(token.balanceOf(recipient), 0);
        assertEq(token.balanceOf(address(fullFeePool)), LIQUIDITY);
    }

    function test_FeeMath_SmallAmountRoundsDownFeeToZero() public {
        uint256 amount = 1;

        vm.expectEmit(true, false, false, true, address(pool));
        emit DestPool.Released(recipient, 1, 0, bytes32(0));

        vm.prank(relayer);
        pool.release(recipient, amount, bytes32(0));

        assertEq(token.balanceOf(recipient), 1);
    }

    function test_RevertWhen_Constructor_FeeTooHigh() public {
        vm.expectRevert(DestPool.FeeTooHigh.selector);
        new DestPool(address(token), relayer, owner, 10_001);
    }

    function test_RevertWhen_Constructor_ZeroToken() public {
        vm.expectRevert(DestPool.ZeroAddress.selector);
        new DestPool(address(0), relayer, owner, FEE_BPS);
    }

    function test_RevertWhen_Constructor_ZeroRelayer() public {
        vm.expectRevert(DestPool.ZeroAddress.selector);
        new DestPool(address(token), address(0), owner, FEE_BPS);
    }

    function test_RevertWhen_Constructor_ZeroOwner() public {
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableInvalidOwner.selector, address(0)));
        new DestPool(address(token), relayer, address(0), FEE_BPS);
    }

    function test_Pause_OnlyOwner() public {
        vm.prank(owner);
        pool.pause();
        assertTrue(pool.paused());
    }

    function test_RevertWhen_Pause_CalledByNonOwner() public {
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, address(this)));
        pool.pause();
    }

    function test_Unpause_OnlyOwner() public {
        vm.prank(owner);
        pool.pause();

        vm.prank(owner);
        pool.unpause();
        assertFalse(pool.paused());
    }

    function test_RevertWhen_Unpause_CalledByNonOwner() public {
        vm.prank(owner);
        pool.pause();

        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, address(this)));
        pool.unpause();
    }

    function test_SetRelayer_UpdatesRelayer() public {
        address newRelayer = address(0x1234);

        vm.prank(owner);
        pool.setRelayer(newRelayer);

        assertEq(pool.relayer(), newRelayer);
    }

    function test_RevertWhen_SetRelayer_CalledByNonOwner() public {
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, address(this)));
        pool.setRelayer(address(0x1234));
    }

    function test_RevertWhen_SetRelayer_ZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(DestPool.ZeroAddress.selector);
        pool.setRelayer(address(0));
    }

    function test_WithdrawFees_SweepsFullBalanceToOwner() public {
        uint256 poolBalance = token.balanceOf(address(pool));
        uint256 ownerBalanceBefore = token.balanceOf(owner);

        vm.prank(owner);
        pool.withdrawFees();

        assertEq(token.balanceOf(owner), ownerBalanceBefore + poolBalance);
        assertEq(token.balanceOf(address(pool)), 0);
    }

    function test_RevertWhen_WithdrawFees_CalledByNonOwner() public {
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, address(this)));
        pool.withdrawFees();
    }
}
