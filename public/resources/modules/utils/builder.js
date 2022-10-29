export default class Builder {
  constructor(func) {
    this.func = func;
  }

  get value() {
    if (!this.res) {
      this.res = this.func();
    }
    return this.res;
  }
}
