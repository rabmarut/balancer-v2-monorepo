import { Interface } from 'ethers/lib/utils';
import { BigNumber, Contract, ContractTransaction } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';

import * as expectEvent from '../../test/expectEvent';
import { BigNumberish } from '../../numbers';
import { ANY_ADDRESS, ONES_BYTES32 } from '../../constants';

import TimelockAuthorizerDeployer from './TimelockAuthorizerDeployer';
import { TimelockAuthorizerDeployment } from './types';
import { Account, NAry, TxParams } from '../types/types';
import { advanceToTimestamp } from '../../time';

export default class TimelockAuthorizer {
  static GENERAL_PERMISSION_SPECIFIER = ONES_BYTES32;
  static EVERYWHERE = ANY_ADDRESS;

  instance: Contract;
  root: SignerWithAddress;

  static async create(deployment: TimelockAuthorizerDeployment = {}): Promise<TimelockAuthorizer> {
    return TimelockAuthorizerDeployer.deploy(deployment);
  }

  constructor(instance: Contract, root: SignerWithAddress) {
    this.instance = instance;
    this.root = root;
  }

  get address(): string {
    return this.instance.address;
  }

  get interface(): Interface {
    return this.instance.interface;
  }

  async GRANT_ACTION_ID(): Promise<string> {
    return this.instance.GRANT_ACTION_ID();
  }

  async REVOKE_ACTION_ID(): Promise<string> {
    return this.instance.REVOKE_ACTION_ID();
  }

  async SCHEDULE_DELAY_ACTION_ID(): Promise<string> {
    return this.instance.SCHEDULE_DELAY_ACTION_ID();
  }

  async getPermissionId(action: string, account: Account, where: Account): Promise<string> {
    return this.instance.getPermissionId(action, this.toAddress(account), this.toAddress(where));
  }

  async getGrantPermissionActionId(actionId: string): Promise<string> {
    return this.instance.getGrantPermissionActionId(actionId);
  }

  async getRevokePermissionActionId(actionId: string): Promise<string> {
    return this.instance.getRevokePermissionActionId(actionId);
  }

  async getExecuteExecutionActionId(executionId: BigNumberish): Promise<string> {
    return this.instance.getExecuteExecutionActionId(executionId);
  }

  async getScheduleDelayActionId(actionId: string): Promise<string> {
    return this.instance.getScheduleDelayActionId(actionId);
  }

  async isRoot(account: Account): Promise<boolean> {
    return this.instance.isRoot(this.toAddress(account));
  }

  async isPendingRoot(account: Account): Promise<boolean> {
    return this.instance.isPendingRoot(this.toAddress(account));
  }

  async isExecutor(scheduledExecutionId: BigNumberish, account: Account): Promise<boolean> {
    return this.instance.isExecutor(scheduledExecutionId, this.toAddress(account));
  }

  async isCanceler(scheduledExecutionId: BigNumberish, account: Account): Promise<boolean> {
    return this.instance.isCanceler(scheduledExecutionId, this.toAddress(account));
  }

  async delay(action: string): Promise<BigNumber> {
    return this.instance.getActionIdDelay(action);
  }

  async getActionIdRevokeDelay(actionId: string): Promise<BigNumber> {
    return this.instance.getActionIdRevokeDelay(actionId);
  }

  async getActionIdGrantDelay(actionId: string): Promise<BigNumber> {
    return this.instance.getActionIdGrantDelay(actionId);
  }

  async getScheduledExecution(id: BigNumberish): Promise<{
    executed: boolean;
    cancelled: boolean;
    protected: boolean;
    executableAt: BigNumber;
    data: string;
    where: string;
  }> {
    return this.instance.getScheduledExecution(id);
  }

  async canPerform(action: string, account: Account, where: Account): Promise<boolean> {
    return this.instance.canPerform(action, this.toAddress(account), this.toAddress(where));
  }

  async isGranter(actionId: string, account: Account, where: Account): Promise<boolean> {
    return this.instance.isGranter(actionId, this.toAddress(account), this.toAddress(where));
  }

  async isRevoker(account: Account, where: Account): Promise<boolean> {
    return this.instance.isRevoker(this.toAddress(account), this.toAddress(where));
  }

  async scheduleRootChange(root: Account, executors: Account[], params?: TxParams): Promise<number> {
    const receipt = await this.with(params).scheduleRootChange(this.toAddress(root), this.toAddresses(executors));
    const event = expectEvent.inReceipt(await receipt.wait(), 'ExecutionScheduled');
    return event.args.scheduledExecutionId;
  }

  async claimRoot(params?: TxParams): Promise<ContractTransaction> {
    return this.with(params).claimRoot();
  }

  async scheduleDelayChange(
    action: string,
    delay: BigNumberish,
    executors: Account[],
    params?: TxParams
  ): Promise<number> {
    const receipt = await this.with(params).scheduleDelayChange(action, delay, this.toAddresses(executors));
    const event = expectEvent.inReceipt(await receipt.wait(), 'ExecutionScheduled');
    return event.args.scheduledExecutionId;
  }

  async scheduleGrantDelayChange(
    action: string,
    delay: BigNumberish,
    executors: Account[],
    params?: TxParams
  ): Promise<number> {
    const receipt = await this.with(params).scheduleGrantDelayChange(action, delay, this.toAddresses(executors));
    const event = expectEvent.inReceipt(await receipt.wait(), 'ExecutionScheduled');
    return event.args.scheduledExecutionId;
  }

  async scheduleRevokeDelayChange(
    action: string,
    delay: BigNumberish,
    executors: Account[],
    params?: TxParams
  ): Promise<number> {
    const receipt = await this.with(params).scheduleRevokeDelayChange(action, delay, this.toAddresses(executors));
    const event = expectEvent.inReceipt(await receipt.wait(), 'ExecutionScheduled');
    return event.args.scheduledExecutionId;
  }

  async schedule(where: Account, data: string, executors: Account[], params?: TxParams): Promise<number> {
    const receipt = await this.with(params).schedule(this.toAddress(where), data, this.toAddresses(executors));
    const event = expectEvent.inReceipt(await receipt.wait(), 'ExecutionScheduled');
    return event.args.scheduledExecutionId;
  }

  async scheduleGrantPermission(
    action: string,
    account: Account,
    where: Account,
    executors: Account[],
    params?: TxParams
  ): Promise<number> {
    const receipt = await this.with(params).scheduleGrantPermission(
      action,
      this.toAddress(account),
      this.toAddress(where),
      this.toAddresses(executors)
    );

    const event = expectEvent.inReceipt(await receipt.wait(), 'ExecutionScheduled');
    return event.args.scheduledExecutionId;
  }

  async scheduleRevokePermission(
    action: string,
    account: Account,
    where: Account,
    executors: Account[],
    params?: TxParams
  ): Promise<number> {
    const receipt = await this.with(params).scheduleRevokePermission(
      action,
      this.toAddress(account),
      this.toAddress(where),
      this.toAddresses(executors)
    );

    const event = expectEvent.inReceipt(await receipt.wait(), 'ExecutionScheduled');
    return event.args.scheduledExecutionId;
  }

  async execute(id: BigNumberish, params?: TxParams): Promise<ContractTransaction> {
    return this.with(params).execute(id);
  }

  async cancel(id: BigNumberish, params?: TxParams): Promise<ContractTransaction> {
    return this.with(params).cancel(id);
  }

  async addCanceler(
    scheduledExecutionId: BigNumberish,
    account: Account,
    params?: TxParams
  ): Promise<ContractTransaction> {
    return this.with(params).addCanceler(scheduledExecutionId, this.toAddress(account));
  }

  async removeCanceler(
    scheduledExecutionId: BigNumberish,
    account: Account,
    params?: TxParams
  ): Promise<ContractTransaction> {
    return this.with(params).removeCanceler(scheduledExecutionId, this.toAddress(account));
  }

  async addGranter(action: string, account: Account, where: Account, params?: TxParams): Promise<ContractTransaction> {
    return this.with(params).addGranter(action, this.toAddress(account), this.toAddress(where));
  }

  async removeGranter(
    action: string,
    account: Account,
    wheres: Account,
    params?: TxParams
  ): Promise<ContractTransaction> {
    return this.with(params).removeGranter(action, this.toAddress(account), this.toAddress(wheres));
  }

  async addRevoker(account: Account, where: Account, params?: TxParams): Promise<ContractTransaction> {
    return this.with(params).addRevoker(this.toAddress(account), this.toAddress(where));
  }

  async removeRevoker(account: Account, wheres: Account, params?: TxParams): Promise<ContractTransaction> {
    return this.with(params).removeRevoker(this.toAddress(account), this.toAddress(wheres));
  }

  async grantPermissions(
    actions: NAry<string>,
    account: Account,
    wheres: NAry<Account>,
    params?: TxParams
  ): Promise<ContractTransaction> {
    return this.with(params).grantPermissions(this.toList(actions), this.toAddress(account), this.toAddresses(wheres));
  }

  async revokePermissions(
    actions: NAry<string>,
    account: Account,
    wheres: NAry<Account>,
    params?: TxParams
  ): Promise<ContractTransaction> {
    return this.with(params).revokePermissions(this.toList(actions), this.toAddress(account), this.toAddresses(wheres));
  }

  async renouncePermissions(
    actions: NAry<string>,
    wheres: NAry<Account>,
    params?: TxParams
  ): Promise<ContractTransaction> {
    return this.with(params).renouncePermissions(this.toList(actions), this.toAddresses(wheres));
  }

  async grantPermissionsGlobally(
    actions: NAry<string>,
    account: Account,
    params?: TxParams
  ): Promise<ContractTransaction> {
    const wheres = this.toList(actions).map(() => TimelockAuthorizer.EVERYWHERE);
    return this.with(params).grantPermissions(this.toList(actions), this.toAddress(account), wheres);
  }

  async revokePermissionsGlobally(
    actions: NAry<string>,
    account: Account,
    params?: TxParams
  ): Promise<ContractTransaction> {
    const wheres = this.toList(actions).map(() => TimelockAuthorizer.EVERYWHERE);
    return this.with(params).revokePermissions(this.toList(actions), this.toAddress(account), wheres);
  }

  async renouncePermissionsGlobally(actions: NAry<string>, params: TxParams): Promise<ContractTransaction> {
    const wheres = this.toList(actions).map(() => TimelockAuthorizer.EVERYWHERE);
    return this.with(params).renouncePermissions(this.toList(actions), wheres);
  }

  async scheduleAndExecuteDelayChange(action: string, delay: number, params?: TxParams): Promise<void> {
    const id = await this.scheduleDelayChange(action, delay, [], params);
    await advanceToTimestamp((await this.getScheduledExecution(id)).executableAt);
    await this.execute(id);
  }

  async scheduleAndExecuteGrantDelayChange(action: string, delay: number, params?: TxParams): Promise<void> {
    const id = await this.scheduleGrantDelayChange(action, delay, [], params);
    await advanceToTimestamp((await this.getScheduledExecution(id)).executableAt);
    await this.execute(id);
  }

  async scheduleAndExecuteRevokeDelayChange(action: string, delay: number, params?: TxParams): Promise<void> {
    const id = await this.scheduleRevokeDelayChange(action, delay, [], params);
    await advanceToTimestamp((await this.getScheduledExecution(id)).executableAt);
    await this.execute(id);
  }

  toAddress(account: Account): string {
    return typeof account === 'string' ? account : account.address;
  }

  toAddresses(accounts: NAry<Account>): string[] {
    return this.toList(accounts).map(this.toAddress);
  }

  toList<T>(items: NAry<T>): T[] {
    return Array.isArray(items) ? items : [items];
  }

  with(params: TxParams = {}): Contract {
    return params.from ? this.instance.connect(params.from) : this.instance;
  }
}
