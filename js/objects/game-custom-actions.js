/*jshint -W041 */
import Action from 'm3e/action';
import Utils from 'm3e/utils';

export default class GameCustomActions {
  constructor(m3e, addSettings) {
    this.m3e = m3e;
    this.collectedPaws = 0;
  //  let self = this;
    this.m3e.addAction('tutorial', TutorialAction, addSettings);
   // this.m3e.addAction('foxMove', FoxMove, function () {
    //  return self.getCollectedPaws();
    //});
    //this.m3e.addAction('pawsShake', PawsShake);
  }

  addCollectedPaws() {
    this.collectedPaws++;
  }

  getCollectedPaws() {
    let paws = this.collectedPaws;
    this.resetCollectedPaws();
    return paws;
  }

  resetCollectedPaws() {
    this.collectedPaws = 0;
  }
}

class TutorialAction extends Action {
  constructor(m3e, addSettings) {
    super('tutorial', m3e);
    this._addSettings = addSettings;
    this.mPendingExit = false;

    this._firstSlot = 'empty';
    this._secondSlot = 'empty';
    this._canSwap = false;
    this._stepNumber = 0;
    this._tutorialView = m3e.level.tutorialView;
    this.findMove = {};
    this._canInput = false;

    this.timer = 0;
    this.step1MaxTime = this._addSettings.max1Time;
    this.step2MaxTime = this._addSettings.max2Time;
    if (this.step1MaxTime === 0)
      this.startStep2();
    else
      this.startStep1();

  }

  startStep1() {
    this._stepNumber = 1;
    //
    // let slotViews = [];
    // this.m3e.forEachSlot((slot)=> {
    //   if (slot.currentChip != 'no_ship' && slot.currentChip.type == 6) {
    //     slot.currentChip.view.shake();
    //     slotViews.push(slot.currentChip.view);
    //   }
    // });
    this._tutorialView.highlight();

    this._tutorialView.drawHelpPanelRecipes(()=> {
      this._canInput = true;
    });
  }

  startStep2() {
    this._stepNumber = 2;
    const endRow = 2;
    let possibleMoves = this.m3e.defaultMatcher.getPossibleMoves(0, endRow);

    if (possibleMoves.length === 0) {
      possibleMoves = this.m3e.defaultMatcher.getPossibleMoves();
      if (possibleMoves == false)
        return;
      this.findMove = possibleMoves[0];
    }
    else {
      this.findMove = possibleMoves[Utils.random(0, possibleMoves.length - 1)];
    }

    let targetSprite1 = this.findMove.slot1.currentChip.view;
    let targetSprite2 = this.findMove.slot2.currentChip.view;

    let slotViews = [this.findMove.slot1.currentChip.view, this.findMove.slot2.currentChip.view];
    for (let result of this.findMove.result) {
      slotViews.push(result.slot.currentChip.view);
    }

    this._tutorialView.highlightField(slotViews);
    this._tutorialView.moveElements(targetSprite1, targetSprite2);
    this._tutorialView.drawHelpPanel(targetSprite1, ['Tips', 'Match 3 of the same gems\n to collect them!'], true, ()=> {
      this._canInput = true;
    });
  }

  destroyStep1() {
    this._canInput = false;
    this._tutorialView.destroyHighlight();
    this._tutorialView.removeHelperPanel();
  }

  destroyStep2() {
    if (this.step2MaxTime === 0) return;
    this._tutorialView.removeFieldHelper();
    this._tutorialView.removeHelperPanel(true);
  }

  getSlots() {
    let slotX = this.m3e.mInput.x;
    let slotY = this.m3e.mInput.y;
    let pickedSlot = this.m3e.getSlot(slotX, slotY);
    if (this._firstSlot == 'empty') {

      if (pickedSlot.exist && pickedSlot.slot.currentChip != 'no_chip')
        this._firstSlot = pickedSlot.slot;
    }

    else {
      if (this._firstSlot.mI != slotX || this._firstSlot.mJ != slotY) {
        let deltaX = Math.sign(this._firstSlot.mI - slotX);
        let deltaY = Math.sign(this._firstSlot.mJ - slotY);
        if (Math.abs(deltaX) + Math.abs(deltaY) == 1) {
          slotX = this._firstSlot.mI - deltaX;
          slotY = this._firstSlot.mJ - deltaY;
          pickedSlot = this.m3e.getSlot(slotX, slotY);
          if (pickedSlot.exist && pickedSlot.slot.currentChip != 'no_chip')
            this._secondSlot = pickedSlot.slot;
        }
      }
    }
  }

  tapSlots() {
    this.m3e.level.cbHideHelpMoves();
    this.m3e.resetPendingDestroy();
    this.m3e.setAllChipsMatchPending(false);
    let firstChipMatchedGroup = this.m3e.matchSlot(this._firstSlot.mI, this._firstSlot.mJ);
    if (firstChipMatchedGroup.exist) {
      for (let item of firstChipMatchedGroup.result) {
        if (item.slot !== null)
          item.slot.pendingDestroy(item);
      }
      this.m3e.decreaseMoves();
      return true;
    }
    else {
      this._firstSlot.currentChip.view.shake(500);
      return false;
    }
  }

  swapSlots() {
    this.m3e.resetPendingDestroy();
    this.m3e.setAllChipsMatchPending(false);
    this._firstSlot.currentChip.mMoveSteps.push({x: this._secondSlot.mI, y: this._secondSlot.mJ});
    this._secondSlot.currentChip.mMoveSteps.push({x: this._firstSlot.mI, y: this._firstSlot.mJ});

    this._firstSlot.mSwapChip = true;
    this._secondSlot.mSwapChip = true;

    let tmpChip = this._secondSlot.currentChip;
    this._secondSlot.currentChip = this._firstSlot.currentChip;
    this._firstSlot.currentChip = tmpChip;

    if ((this._firstSlot.currentChip.type > 0 && this._secondSlot.currentChip.type > 0) || (this._firstSlot.currentChip.color == -1 || this._secondSlot.currentChip.color == -1)) {
      this.m3e.specialSlotsMatch(this._firstSlot, this._secondSlot);
      this.m3e.decreaseMoves();
    }
    else {
      let firstChipMatchedGroup = this.m3e.matchSlot(this._firstSlot.mI, this._firstSlot.mJ);
      if (firstChipMatchedGroup.exist) {
        for (let item of firstChipMatchedGroup.result) {
          if (item.slot !== null)
            item.slot.pendingDestroy(item);
        }
      }

      let secondChipMatchedGroup = this.m3e.matchSlot(this._secondSlot.mI, this._secondSlot.mJ);
      if (secondChipMatchedGroup.exist) {
        for (let item of secondChipMatchedGroup.result) {
          if (item.slot !== null)
            item.slot.pendingDestroy(item);
        }
      }
      if (firstChipMatchedGroup.exist || secondChipMatchedGroup.exist)
        this.m3e.decreaseMoves();
    }
  }

  onUpdate(dt) {
    this.timer += dt;
    switch (this._stepNumber) {
      case 0:
        break;
      case 1:
        if (this.timer >= this.step1MaxTime) {
          this.destroyStep1();
          if (this.step2MaxTime !== 0) {
            this._stepNumber = 2;
            this.startStep2();
          }

          else {
            this.nextActionName = 'userAction';
            this.mPendingExit = true;
          }
          this.timer = 0;
          return;
        }
        break;
      case 2:
        if (this.timer >= this.step2MaxTime) {
          this.destroyStep2();
          this.nextActionName = 'userAction';
          this.mPendingExit = true;
          return;
        }
        break;
    }

    let isDone = false;
    if (!this._canInput) return;
    if (this.m3e.mInput.onDown) {
      if (this._stepNumber == 2)
        this.getSlots();
      else {
        if (this._stepNumber == 1) {
          this.destroyStep1();
          if (this.step2MaxTime !== 0 && this._stepNumber == 1)
            this.startStep2();
          else {
            this.nextActionName = 'userAction';
            this.mPendingExit = true;
          }
        }
        this.timer = 0;
        return;
      }
    }
    else if (!this._canSwap && !isDone && this._stepNumber == 2) {

      if (this.m3e.level.gameSettings.inputType == 'swipe') {
        if (this._firstSlot != 'empty' && this._secondSlot != 'empty') {
          if ((this.m3e.slotsEqual(this.findMove.slot1, this._firstSlot) && this.m3e.slotsEqual(this.findMove.slot2, this._secondSlot)) ||
              (this.m3e.slotsEqual(this.findMove.slot2, this._firstSlot) && this.m3e.slotsEqual(this.findMove.slot1, this._secondSlot))) {
            this.destroyStep2();
            this.swapSlots();
            this._canSwap = true;
          }
        }
      } else if (this.m3e.level.gameSettings.inputType == 'tap') {
        if (this._firstSlot != 'empty') {

          for (let s of this.findMove.result) {
            if (this.m3e.slotsEqual(this._firstSlot, s.slot) || this.m3e.slotsEqual(this.findMove.slot1, this._firstSlot) || this.m3e.slotsEqual(this.findMove.slot2, this._firstSlot)) {
              isDone = this.tapSlots();
              this.destroyStep2();
              break;
            }
          }
        }
      }
      this._firstSlot = 'empty';
      this._secondSlot = 'empty';
    }

    if (this._stepNumber != 2)
      return;
    if (this._canSwap) {
      isDone = true;
      this.m3e.forEachSlot((slot)=> {
        let state = slot.onSlotUpdate(dt);
        if (isDone) {
          isDone = state.isDone;
        }
      });
    }
    if (isDone) {
      this._canSwap = false;
      this.nextActionName = 'removeChips';
      this.mPendingExit = true;
    }
  }
}
/*
class FoxMove extends Action {
  constructor(m3e, getCollectedPaws) {
    super('foxMove', m3e);
    this._chipMoveDone = false;
    this._foxMoveDone = false;
    this._foxSlot = null;
    this._targetSlot = null;
    this._makeChanges = false;
    this.getEndState = false;
    // this.getCollectedPaws = getCollectedPaws;
    this._totalMoves = getCollectedPaws();
    this.moveFox(this._totalMoves);

  }

  moveFox() {
    this._chipMoveDone = false;
    this._foxMoveDone = false;
    let moves = this._totalMoves--;

    if (moves == 0) {

      if (this._makeChanges) {
        this.nextActionName = 'moveChips';
        this.mPendingExit = true;
      }
      else {
        this.nextActionName = 'userAction';
        this.mPendingExit = true;
      }
      return;
    }

    this._makeChanges = true;

    this._foxSlot = null;
    this._targetSlot = null;

    this.m3e.forEachSlot((slot)=> {
      let curChip = slot.currentChip;
      if (!this._foxSlot && curChip != 'no_chip' && curChip.type == 7)
        this._foxSlot = slot;
    });
    let slotFind = false;

    this.m3e.getAllNeighbours(this._foxSlot,
        (borderType, c, r, newC, newR) => {
          if (!slotFind && (borderType == 'right' || borderType == 'top' || borderType == 'bottom' )) {
            let slot = this.m3e.getSlot(newC, newR);

            if (slot.exist && slot.slot.type >= 3) {
              slotFind = true;
              this._targetSlot = slot.slot;
            }
          }
        });
    if (this._targetSlot.currentChip.type == 8) {
      this.getEndState = true;
    }

    let currentFoxMoves = this.m3e.level.gameType.getProp('currentFoxMoves');
    currentFoxMoves++;
    this.m3e.level.gameType.setProp('currentFoxMoves', currentFoxMoves);
    this.m3e.level.view._uiView.showStars(currentFoxMoves, this.m3e.level.gameType.getProp('maxFoxMoves'));

    [this._targetSlot.mCurrentChip, this._foxSlot.mCurrentChip] = [this._foxSlot.mCurrentChip, this._targetSlot.mCurrentChip];

    this._foxSlot.currentChip.view.moveToSlot(this._targetSlot.currentChip, ()=> {
      this._foxMoveDone = true;
      if (this._foxSlot.currentChip.type == 8) {

        this._foxSlot.currentChip.view.maximize();
        this.m3e.level.cbShowCTA({win: true, lose: false});
        this.m3e.removeAllActions();
        this.m3e.pauseAllActions();

        this.getEndState = true;
      }
    });
    this._targetSlot.currentChip.view.moveFoxTo(this._foxSlot.currentChip, ()=> {
      this._chipMoveDone = true;
    });
  }


  onUpdate(dt) {
    if (this._chipMoveDone && this._foxMoveDone && !this.mPendingExit) {
      //this._targetSlot.currentChip.view.updatePos(this._targetSlot.currentChip);
      // this._foxSlot.currentChip.view.updatePos(this._foxSlot.currentChip);
      this._targetSlot.currentChip.saveTempPosition();
      this._foxSlot.currentChip.saveTempPosition();
      [this._targetSlot, this._foxSlot] = [this._foxSlot, this._targetSlot];

      this._targetSlot.mPendingMatch = true;
      this._foxSlot.mPendingMatch = true;

      //
      // [this._foxSlot.currentChip.color, this._targetSlot.currentChip.color] = [this._targetSlot.currentChip.color, this._foxSlot.currentChip.color];
      // [this._foxSlot.currentChip.type, this._targetSlot.currentChip.type] = [this._targetSlot.currentChip.type, this._foxSlot.currentChip.type];


      // let tmpChip = this._targetSlot.currentChip;
      // this._targetSlot.currentChip = this._foxSlot.currentChip;
      // this._foxSlot.currentChip = tmpChip;

      if (!this.getEndState)

        this.moveFox();

    }
  }
}

class PawsShake extends Action {
  constructor(m3e) {
    super('pawsShake', m3e);
    this.m3e.forEachSlot((slot)=> {
      let curChip = slot.currentChip;
      if (curChip != 'no_chip' && curChip.type == 6)
        curChip.view.shake();
      this.mPendingExit = true;
    });

  }

  onUpdate(dt) {
  }

}
*/