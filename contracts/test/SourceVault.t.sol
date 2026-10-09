// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {SourceVault} from "../src/SourceVault.sol";
import {MockERC20WithAuthorization} from "./mocks/MockERC20WithAuthorization.sol";

contract SourceVaultTest is Test {
    SourceVault vault;
    MockERC20WithAuthorization token;

    address relayer = address(0xBEEF);
    address payer = address(0xA11CE);
    address recipient = address(0xB0B);

    uint256 constant AMOUNT = 100 ether;
    uint256 constant DEST_CHAIN_ID = 8453;

    function setUp() public {
        token = new MockERC20WithAuthorization();
        vault = new SourceVault(address(token), relayer);
        token.mint(payer, 1_000 ether);
    }

    function _authParams() internal view returns (uint256 validAfter, uint256 validBefore, bytes32 nonce) {
        validAfter = block.timestamp - 1;
        validBefore = block.timestamp + 1 days;
        nonce = keccak256("nonce-1");
    }

    function test_DepositWithAuthorization_SelfBridge() public {
        (uint256 validAfter, uint256 validBefore, bytes32 nonce) = _authParams();

        vm.expectEmit(true, true, false, true, address(vault));
        emit SourceVault.PaymentRequested(payer, payer, AMOUNT, DEST_CHAIN_ID, uint256(nonce));

        vm.prank(relayer);
        vault.depositWithAuthorization(
            payer, payer, AMOUNT, DEST_CHAIN_ID, validAfter, validBefore, nonce, 27, bytes32(0), bytes32(0)
        );

        assertEq(token.balanceOf(address(vault)), AMOUNT);
        assertEq(token.balanceOf(payer), 1_000 ether - AMOUNT);
    }

    function test_DepositWithAuthorization_AgentToAgent_DifferentRecipient() public {
        (uint256 validAfter, uint256 validBefore, bytes32 nonce) = _authParams();

        vm.expectEmit(true, true, false, true, address(vault));
        emit SourceVault.PaymentRequested(payer, recipient, AMOUNT, DEST_CHAIN_ID, uint256(nonce));

        vm.prank(relayer);
        vault.depositWithAuthorization(
            payer, recipient, AMOUNT, DEST_CHAIN_ID, validAfter, validBefore, nonce, 27, bytes32(0), bytes32(0)
        );

        assertEq(token.balanceOf(address(vault)), AMOUNT);
        assertEq(token.balanceOf(payer), 1_000 ether - AMOUNT);
        assertEq(token.balanceOf(recipient), 0);
    }

    function test_RevertWhen_DepositWithAuthorization_CalledByNonRelayer() public {
        (uint256 validAfter, uint256 validBefore, bytes32 nonce) = _authParams();

        vm.expectRevert(SourceVault.NotRelayer.selector);
        vm.prank(address(0xDEAD));
        vault.depositWithAuthorization(
            payer, recipient, AMOUNT, DEST_CHAIN_ID, validAfter, validBefore, nonce, 27, bytes32(0), bytes32(0)
        );
    }

    function test_RevertWhen_DepositWithAuthorization_ZeroAmount() public {
        (uint256 validAfter, uint256 validBefore, bytes32 nonce) = _authParams();

        vm.expectRevert(SourceVault.ZeroAmount.selector);
        vm.prank(relayer);
        vault.depositWithAuthorization(
            payer, recipient, 0, DEST_CHAIN_ID, validAfter, validBefore, nonce, 27, bytes32(0), bytes32(0)
        );
    }

    function test_RevertWhen_DepositWithAuthorization_ZeroRecipient() public {
        (uint256 validAfter, uint256 validBefore, bytes32 nonce) = _authParams();

        vm.expectRevert(SourceVault.ZeroRecipient.selector);
        vm.prank(relayer);
        vault.depositWithAuthorization(
            payer, address(0), AMOUNT, DEST_CHAIN_ID, validAfter, validBefore, nonce, 27, bytes32(0), bytes32(0)
        );
    }

    function test_Deposit_SelfBridge() public {
        vm.prank(payer);
        token.approve(address(vault), AMOUNT);

        vm.expectEmit(true, true, false, true, address(vault));
        emit SourceVault.PaymentRequested(payer, payer, AMOUNT, DEST_CHAIN_ID, 0);

        vm.prank(relayer);
        vault.deposit(payer, payer, AMOUNT, DEST_CHAIN_ID);

        assertEq(token.balanceOf(address(vault)), AMOUNT);
        assertEq(token.balanceOf(payer), 1_000 ether - AMOUNT);
    }

    function test_Deposit_AgentToAgent_DifferentRecipient() public {
        vm.prank(payer);
        token.approve(address(vault), AMOUNT);

        vm.expectEmit(true, true, false, true, address(vault));
        emit SourceVault.PaymentRequested(payer, recipient, AMOUNT, DEST_CHAIN_ID, 0);

        vm.prank(relayer);
        vault.deposit(payer, recipient, AMOUNT, DEST_CHAIN_ID);

        assertEq(token.balanceOf(address(vault)), AMOUNT);
        assertEq(token.balanceOf(payer), 1_000 ether - AMOUNT);
        assertEq(token.balanceOf(recipient), 0);
    }

    function test_Deposit_IncrementsFallbackNonce() public {
        vm.startPrank(payer);
        token.approve(address(vault), AMOUNT * 2);
        vm.stopPrank();

        vm.startPrank(relayer);
        vm.expectEmit(true, true, false, true, address(vault));
        emit SourceVault.PaymentRequested(payer, recipient, AMOUNT, DEST_CHAIN_ID, 0);
        vault.deposit(payer, recipient, AMOUNT, DEST_CHAIN_ID);

        vm.expectEmit(true, true, false, true, address(vault));
        emit SourceVault.PaymentRequested(payer, recipient, AMOUNT, DEST_CHAIN_ID, 1);
        vault.deposit(payer, recipient, AMOUNT, DEST_CHAIN_ID);
        vm.stopPrank();
    }

    function test_RevertWhen_Deposit_CalledByNonRelayer() public {
        vm.expectRevert(SourceVault.NotRelayer.selector);
        vm.prank(address(0xDEAD));
        vault.deposit(payer, recipient, AMOUNT, DEST_CHAIN_ID);
    }

    function test_RevertWhen_Deposit_ZeroAmount() public {
        vm.expectRevert(SourceVault.ZeroAmount.selector);
        vm.prank(relayer);
        vault.deposit(payer, recipient, 0, DEST_CHAIN_ID);
    }

    function test_RevertWhen_Deposit_ZeroRecipient() public {
        vm.expectRevert(SourceVault.ZeroRecipient.selector);
        vm.prank(relayer);
        vault.deposit(payer, address(0), AMOUNT, DEST_CHAIN_ID);
    }

    function test_RevertWhen_Constructor_ZeroToken() public {
        vm.expectRevert(SourceVault.ZeroAddress.selector);
        new SourceVault(address(0), relayer);
    }

    function test_RevertWhen_Constructor_ZeroRelayer() public {
        vm.expectRevert(SourceVault.ZeroAddress.selector);
        new SourceVault(address(token), address(0));
    }
}
