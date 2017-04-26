export default class Input {
  constructor() {
    this._x = 0;
    this._y = 0;
    this._onDown = false;
  }

  set x(value) {
    this._x = value;
  }

  get x() {
    return this._x;
  }

  set y(value) {
    this._y = value;
  }

  get y() {
    return this._y;
  }

  set onDown(value) {
    this._onDown = value;
  }

  get onDown() {
    return this._onDown;
  }
}
