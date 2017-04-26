/*jshint -W041 */
class Chip {
  constructor(type) {
    this.mType = type;
    this.mColor = -1;
    this.mView = null;
    this.mI = this.mJ = 0;
    this.mMoveSteps = [];
    this.mIsMoved = false;
    this.mStartDestroy = false;
    this.mDestroyed = false;
    //this.mIsEffectShow = false;
    this.mIgnoreDestroyEffect = false;

    this.mMoveTime = 0;
    this.mTempPos = {};
    this.mBootOffset = 0;
    this.mCanSwap = true;
    this.mCanFall = true;
    this.mCanMatch = true;
  }

  get canSwap()
  {
    return this.mCanSwap;
  }

  set canSwap(value)
  {
    this.mCanSwap = value;
  }

  get canMatch()
  {
    return this.mCanMatch;
  }

  set canMatch(value)
  {
    this.mCanMatch = value;
  }


  get canFall()
  {
    return this.mCanFall;
  }

  set canFall(value)
  {
    this.mCanFall = value;
  }

  saveTempPosition() {
    this.mTempPos.x = this.x;
    this.mTempPos.y = this.y;
  }

  get bootOffset()
  {
    return this.mBootOffset;
  }

  set bootOffset(value)
  {
    this.mBootOffset = value;
  }


  get x() {
    return this.mView.getX();
  }

  set x(x) {
    this.mView.setX(x);
  }

  get y() {
    return this.mView.getY();
  }

  set y(y) {
    this.mView.setY(y);
  }

  // get isEffectShow() {
  //   return this.mIsEffectShow;
  // }
  //
  // set isEffectShow(value) {
  //   this.mIsEffectShow = value;
  // }

  get color() {
    return this.mColor;
  }

  set color(color) {
    this.mColor = color;
  }

  set position(pos) {
    this.mI = pos.i;
    this.mJ = pos.j;
  }

  get position() {
    return {i: this.mI, j: this.mJ};
  }

  set type(type) {
    this.mType = type;
  }

  get type() {
    return this.mType;
  }

  onChipUpdateIndex() {}

  onChipUpdate() {}

  destroy(targetRecipe, delay) {
    if( this.mIgnoreDestroyEffect)
    {
      this.mDestroyed = true;
      return;
    }

    if (!this.mStartDestroy) {
      this.mStartDestroy = true;
      this.mView.destroyEffect(()=> {
        this.mDestroyed = true;
      }, targetRecipe, delay);
    }
  }

  specialDestroy(targetPos) {
    if( this.mIgnoreDestroyEffect)
    {
      this.mDestroyed = true;
      return;
    }
    if (!this.mStartDestroy) {
      this.mStartDestroy = true;

      this.mView.specialDestroyEffect(targetPos, ()=> {
        this.mDestroyed = true;
      });
    }
  }

  setType(newType, newColor) {
    if (!this.mStartDestroy) {
      this.mType = newType!=null? newType:this.mType;
      this.mColor = newColor!=null? newColor:this.mColor;
      this.mView.setNewType(()=> {
       this.mStartDestroy = false;
      });
    }
  }

  get isDestroyed() {
    return this.mDestroyed;
  }

  get view() {
    return this.mView;
  }

  set view(view) {
    this._mView = view;
  }
}


class RegularChip extends Chip {
  constructor() {
    super(0);
  }
}

class CustomChip extends Chip{
  constructor(type, settings)
  {
    super(type);
  }
}

// class BombChip extends Chip {
//   constructor() {
//     super(1);
//   }
// }

export {RegularChip};
