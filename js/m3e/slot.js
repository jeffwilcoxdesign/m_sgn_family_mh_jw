/*jshint -W041 */
class Slot {
  constructor(type, moveFunc) {
    this.mType = type;
    this.mIsSwapable = true;
    this.mI = 0;
    this.mJ = 0;
    this.mIsBoot = false;
    this.mView = null;
    this.mCurrentChip = Slot.NO_CHIP;
    this.mBootChipsQueue = [];
    this.mPendingDestroy = false;

    this.mSimpleDestroy = false;
    this.mTargetPosition = [];
    this.mNewType = null;
    this.mNewColor = null;
    this.mThrowSpecialDestroy = false;
    this.mSkipPostMove = false;
    this.mPendingMatch = false;
    //additional params
    this.mColorType = 0;
    this.mSwapChip = false;
    this.mSwapBack = false;
    this.mMoveFunctions = moveFunc;
  }

  addToBootQueue(chip) {
    this.mBootChipsQueue.push(chip);
    chip.x = this.mI;
    chip.y = this.mJ - this.mBootChipsQueue.length;
    // add bootQueue movement steps for bootSlot
    for (let i = 0; i < this.mBootChipsQueue.length; i++) {
      chip.mMoveSteps.push({x: this.mI, y: this.mJ - (this.mBootChipsQueue.length - 1 - i) + 0});
    }
  }

  resetBootQueue() {
    this.mBootChipsQueue = [];
  }

  updateData() {
    this.mColorType = (this.mI + this.mJ) % 2;
  }

  onSlotUpdate(dt) {
    let updateStatus = {isDone: true, postMoveStart:false};
    if (this.currentChip != Slot.NO_CHIP) {
      if (!this.mSwapChip)
        updateStatus = this.updateChipMove(dt);
      else
        updateStatus = this.updateChipSwap(dt);
    }
    return updateStatus;
  }

  updateChipMove(dt) {
    let isDone = true;
    let postMoveStart = false;
    if (this.currentChip.mMoveSteps.length !== 0) {
      let curStep = this.currentChip.mMoveSteps[0];
      if (this.currentChip.mMoveSteps.length != 1) {
        this.chipTransform(this.mMoveFunctions.move, this.mMoveFunctions.move, this.mMoveFunctions.scaleX, this.mMoveFunctions.scaleY, this.currentChip.mMoveTime, dt, curStep.x, curStep.y);
        if (this.currentChip.mMoveTime >= 1) {
          this.currentChip.mMoveTime = 0;
          this.currentChip.saveTempPosition();
          this.currentChip.mMoveSteps.shift();
        }
      }
      else {
        this.chipTransform(this.mMoveFunctions.moveXEnd, this.mMoveFunctions.moveYEnd, this.mMoveFunctions.scaleEndX, this.mMoveFunctions.scaleEndY, this.currentChip.mMoveTime, dt, curStep.x, curStep.y);
        if (this.currentChip.mMoveTime >= 1) {
          this.chipTransform(this.mMoveFunctions.moveXEnd, this.mMoveFunctions.moveYEnd, this.mMoveFunctions.scaleEndX, this.mMoveFunctions.scaleEndY, 1, dt, curStep.x, curStep.y);
          this.currentChip.mMoveTime = 0;
          this.currentChip.mIsMoved = true;
          this.currentChip.saveTempPosition();
          this.currentChip.mMoveSteps.shift();
        }
      }
      isDone = false;
    }
    else if (this.currentChip.mIsMoved && (this.mMoveFunctions.postMoveX != null || this.mMoveFunctions.postMoveY != null || this.mMoveFunctions.postScaleX != null || this.mMoveFunctions.postScaleY != null)) {
     if(this.mSkipPostMove == false)
     {
        postMoveStart = true;

        this.chipTransform(this.mMoveFunctions.postMoveX, this.mMoveFunctions.postMoveY, this.mMoveFunctions.postScaleX, this.mMoveFunctions.postScaleY, this.currentChip.mMoveTime, dt, false, false, this.mMoveFunctions.postRotate);
        if (this.currentChip.mMoveTime >= 1) {
          this.chipTransform(this.mMoveFunctions.postMoveX, this.mMoveFunctions.postMoveY, this.mMoveFunctions.postScaleX, this.mMoveFunctions.postScaleY, 1, dt, false, false, this.mMoveFunctions.postRotate);
          this.currentChip.mMoveTime = 0;
          this.currentChip.mIsMoved = false;
          this.currentChip.saveTempPosition();
          this.mSkipPostMove = false;
        }
        // else
        // {
        //   this.chipTransform(this.mMoveFunctions.postMoveX, this.mMoveFunctions.postMoveY, this.mMoveFunctions.postScaleX, this.mMoveFunctions.postScaleY, 1, dt);
        //   this.currentChip.mMoveTime = 0;
        //   this.currentChip.mIsMoved = false;
        //   this.currentChip.saveTempPosition();
        //   this.mSkipPostMove = false;
        // }
        isDone = false;
      }

    }
    this.currentChip.position = {i:this.mI, j:this.mJ};
    return {isDone, postMoveStart};
  }

  updateChipSwap(dt) {
    let isDone = true;
    if (this.currentChip.mMoveSteps.length !== 0) {
      let curStep = this.currentChip.mMoveSteps[0];
      if (this.mSwapBack) {
        if (this.currentChip.mMoveSteps.length != 1) {
          this.chipTransform(this.mMoveFunctions.swapBackInX, this.mMoveFunctions.swapBackInY, this.mMoveFunctions.swapBackInScaleX, this.mMoveFunctions.swapBackInScaleY, this.currentChip.mMoveTime, dt, curStep.x, curStep.y);
          if (this.currentChip.mMoveTime >= 1) {
            this.chipTransform(this.mMoveFunctions.swapBackInX, this.mMoveFunctions.swapBackInY, this.mMoveFunctions.swapBackInScaleX, this.mMoveFunctions.swapBackInScaleY, 1, dt, curStep.x, curStep.y);
            this.currentChip.mMoveTime = 0;
            this.currentChip.saveTempPosition();
            this.currentChip.mMoveSteps.shift();
          }
        }
        else {
          this.chipTransform(this.mMoveFunctions.swapBackOutX, this.mMoveFunctions.swapBackOutY, this.mMoveFunctions.swapBackOutScaleX, this.mMoveFunctions.swapBackOutScaleY, this.currentChip.mMoveTime, dt, curStep.x, curStep.y);
          if (this.currentChip.mMoveTime >= 1) {
            this.chipTransform(this.mMoveFunctions.swapBackOutX, this.mMoveFunctions.swapBackOutY, this.mMoveFunctions.swapBackOutScaleX, this.mMoveFunctions.swapBackOutScaleY, 1, dt, curStep.x, curStep.y);
            this.currentChip.mMoveTime = 0;
            this.currentChip.mIsMoved = false;
            this.currentChip.saveTempPosition();
            this.currentChip.mMoveSteps.shift();
          }
        }
        isDone = false;
      }
      else {
        this.chipTransform(this.mMoveFunctions.swapX, this.mMoveFunctions.swapY, this.mMoveFunctions.swapScaleX, this.mMoveFunctions.swapScaleY, this.currentChip.mMoveTime, dt, curStep.x, curStep.y);
        if (this.currentChip.mMoveTime >= 1) {
          this.chipTransform(this.mMoveFunctions.swapX, this.mMoveFunctions.swapY, this.mMoveFunctions.swapScaleX, this.mMoveFunctions.swapScaleY, 1, dt, curStep.x, curStep.y);
          this.currentChip.mMoveTime = 0;
          this.currentChip.mIsMoved = false;
          this.currentChip.saveTempPosition();
          this.currentChip.mMoveSteps.shift();
        }
        isDone = false;
      }
    }
    if (isDone) {
      this.mSwapChip = false;
      this.mSwapBack = false;
    }
    return {isDone:isDone, postMoveStart:false};
  }

  chipTransform(moveX, moveY, scaleX, scaleY, time, dt, targetX = false, targetY = false, rotate = null) {
    if(targetY!==false && targetY>this.currentChip.bootOffset-0.5)
      this.currentChip.view.setVisible(true);

    let moveResultX = moveX(this.currentChip.mTempPos.x, targetX ? targetX : 0, time);
    let moveResultY = moveY(this.currentChip.mTempPos.y, targetY ? targetY : 0, time);
    this.currentChip.mMoveTime += dt * moveResultX.speed;
    this.currentChip.x = moveResultX.result;
    this.currentChip.y = moveResultY.result;

    let scaleResultX = scaleX(this.currentChip.view._sprite.scale.x, this.currentChip.mMoveTime);
    let scaleResultY = scaleY(this.currentChip.view._sprite.scale.y, this.currentChip.mMoveTime);
    this.currentChip.view._sprite.scale.x = scaleResultX.result;
    this.currentChip.view._sprite.scale.y = scaleResultY.result;

    if(rotate == null) return;
    let rotateResult = rotate(this.currentChip.view._sprite.angle, this.currentChip.mMoveTime);
    this.currentChip.view._sprite.angle = rotateResult.result;
  }

  assignChip(chip) {
    this.currentChip = '';
    this.currentChip = chip;
  }

  get currentChip() {
    return this.mCurrentChip;
  }

  set currentChip(value)
  {
    this.mCurrentChip = value;
  }

  removeChip() {
    this.currentChip = Slot.NO_CHIP;
  }

  pendingDestroy(params) {

    this.mSimpleDestroy = params.simpleDestroy;
    let targetX = params.targetSlot.mI;
    let targetY = params.targetSlot.mJ;
    this.mTargetPosition = false;
    if (targetX == this.mI && targetY == this.mJ) {
      this.mNewType = params.newType;
      this.mNewColor = params.newColor;
    }
    else {
      let newTargetPosX = [];
      let newTargetPosY = [];

      newTargetPosX.push(this.mI + Math.sign(targetX - this.mI));
      newTargetPosY.push(this.mJ + Math.sign(targetY - this.mJ));
      let isDone = false;
      while (!isDone) {
        let doneX = false;
        let doneY = false;
        let newX = newTargetPosX[newTargetPosX.length - 1];
        let newY = newTargetPosY[newTargetPosY.length - 1];
        if (newX != targetX)
          newX = newX + Math.sign(targetX - newX);
        else
          doneX = true;
        if (newY != targetY)
          newY = newY + Math.sign(targetY - newY);
        else
          doneY = true;
        if (doneX && doneY) {
          isDone = true;
        }
        else {
          newTargetPosX.push(newX);
          newTargetPosY.push(newY);
        }
      }
      this.mTargetPosition = {x: newTargetPosX, y: newTargetPosY};
    }
    this.mPendingDestroy = true;
  }

  destroyChipEffect(targetRecipe = false, delay = 0) {
    if (this.currentChip != Slot.NO_CHIP) {
      this.mPendingDestroy = true;

      if (this.mSimpleDestroy)
        this.currentChip.destroy(targetRecipe, delay);
      else {
        if (this.mTargetPosition != false)
          this.currentChip.specialDestroy(this.mTargetPosition);
        else {
          this.currentChip.setType(this.mNewType, this.mNewColor);
        }
      }
    }
  }

  // setType(value) {
  //   this.mType = value;
  //   this.currentChip.mView.setNewType(value);
  //
  // }

  get type()
  {
    return this.mType;
  }

  set type(value)
  {
    this.mType = value;
  }

  get pendingMatch() {
    return this.mPendingMatch;
  }

  set pendingMatch(value) {
    this.mPendingMatch = value;
  }

  get view() {
    return this.mView;
  }

  set view(view) {
    this.mView = view;
  }
}

class EmptySlot extends Slot {
  constructor() {
    super(0);
    this.mIsSwapable = false;
  }
}

class CustomSlot extends Slot {
  constructor(moveFunctions, typeNumber) {
    super(typeNumber, moveFunctions);
    if(typeNumber<=2 && typeNumber>=0)
      console.warn('please use another number for slot type cuase 0-2 are reserved');
  }
}

class RegularSlot extends Slot {
  constructor(moveFunctions) {
    super(1, moveFunctions);
  }
}

class ObstacleSlot extends Slot {
  constructor(moveFunctions) {
    super(2);
    this.mIsSwapable = false;
  }
}

class Border {
  constructor(type, slot) {
    this.mType = type;
    this.mView = null;
    this.parentSlot = slot;
  }

  get view() {
    return this.mView;
  }

  set view(view) {
    this.mView = view;
  }
}

export {EmptySlot, CustomSlot, RegularSlot, ObstacleSlot, Border};

Slot.NO_CHIP = "no_chip";
Slot.CHIP_MOVE_SPEED = 0.1;
