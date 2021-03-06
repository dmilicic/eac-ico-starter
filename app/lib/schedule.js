import { Utils } from './utils';
import { stores } from '../stores/index';

const { transactionStore } = stores;

export class Schedule {
  enabledInfoSelector;
  disabledInfoSelector;
  sendButtonSelector;

  windowStart;
  windowSize;
  toAddress;
  fee;
  payment;
  requiredDeposit;

  callValue;
  callGasPrice;
  callGasAmount;
  callMethodSignature;
  callMethodParameterTypes;
  callMethodParameterValues;

  successHandler;

  constructor({
    enabledInfoSelector,
    disabledInfoSelector,
    lockedInfoSelector,
    sendButtonSelector,
    windowStart,
    windowSize,
    toAddress,
    fee = 0,
    payment = 0,
    requiredDeposit = 0,
    callValue = 0,
    callGasPrice,
    callGasAmount = 0,
    callMethodSignature,
    callMethodParameterTypes,
    callMethodParameterValues,
    successHandler = () => {}
  }) {
    this.enabledInfoSelector = enabledInfoSelector;
    this.disabledInfoSelector = disabledInfoSelector;
    this.sendButtonSelector = sendButtonSelector;
    this.lockedInfoSelector = lockedInfoSelector;

    this.computeUIState();

    if (!this.web3Enabled) {
      return;
    }

    this.windowStart = windowStart;
    this.windowSize = windowSize;
    this.toAddress = toAddress;

    this.fee = fee;
    this.payment = payment;
    this.requiredDeposit = requiredDeposit;

    this.callValue = callValue;
    this.callGasPrice = callGasPrice || Utils.castGweiToWei(50);
    this.callGasAmount = callGasAmount;
    this.callMethodSignature = callMethodSignature;
    this.callMethodParameterTypes = callMethodParameterTypes;
    this.callMethodParameterValues = callMethodParameterValues;

    this.successHandler = successHandler;

    this.sendTransaction = this.sendTransaction.bind(this);
    this.attachSendClickHandler();
  }

  get web3Enabled() {
    return Utils.isWeb3Enabled();
  }

  get finalCallGasAmount() {
    return this.callGasAmount;
  }

  get callData() {
    if (!this.callMethodSignature) {
      return null;
    }

    return this.callMethodSignature + this.ABIEncodedParams;
  }

  get ABIEncodedParams() {
    if (!this.callMethodParameterTypes) {
      return '';
    }

    return Utils.getABIEncodedParams(this.callMethodParameterTypes, this.callMethodParameterValues);
  }

  _showElement(element) {
    if (!element) {
      return;
    }

    element.style.opacity = 1;
  }

  _hideElement(element) {
    if (!element) {
      return;
    }

    element.style.opacity = 0;
  }

  _disableElement(element) {
    if (!element) {
      return;
    }

    element.disabled = true;
  }

  _enableElement(element) {
    if (!element) {
      return;
    }

    element.disabled = false;
  }

  computeUIState() {
    if (typeof window === 'undefined') {
      return;
    }

    const sendButton = document.querySelector(this.sendButtonSelector);
    const disabledInfo = document.querySelector(this.disabledInfoSelector);
    const enabledInfo = document.querySelector(this.enabledInfoSelector);
    const lockedInfo = document.querySelector(this.lockedInfoSelector);

    let checkAgain = true;

    if (this.web3Enabled) {
      if (Utils.isWalletLocked()) {
        this._disableElement(sendButton);
        this._showElement(lockedInfo);
        this._hideElement(enabledInfo);
      } else {
        this._enableElement(sendButton);
        this._hideElement(lockedInfo);
        this._showElement(enabledInfo);
      }

      this._hideElement(disabledInfo);
    } else {
      this._disableElement(sendButton);
      this._hideElement(lockedInfo);
      this._showElement(disabledInfo);

      checkAgain = false;
    }

    if (checkAgain) {
      setTimeout(() => this.computeUIState(), 1000);
    }
  }

  attachSendClickHandler() {
    const sendButton = document.querySelector(this.sendButtonSelector);

    sendButton.onclick = this.sendTransaction;
  }

  async sendTransaction() {
    const initialGasPrice = await Utils.getRecommendedGasPrice();

    const transaction = await transactionStore.schedule(
      this.toAddress,
      this.callData,
      this.finalCallGasAmount,
      this.callValue,
      this.windowSize,
      this.windowStart,
      this.callGasPrice,
      this.fee,
      this.payment,
      this.requiredDeposit,
      false,
      initialGasPrice
    );

    this.successHandler(transaction);
  }
}
