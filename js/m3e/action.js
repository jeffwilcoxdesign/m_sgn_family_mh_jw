/*jshint -W041 */
import * as Slots from 'm3e/slot';
import * as Chips from 'm3e/chip';
import Utils from 'm3e/utils';

/** Class representing game actions. */
export default class Action {
  /**
   * Initialize base action faunctions.
   * @param {string} name - The name of action.
   * @param {M3E} m3e An m3e container.
   */
  constructor(name, m3e) {
    this.mName = name;
    this.m3e = m3e;
    this.mPendingExit = false;
    this.nextActionName = false;
    this.startAsyncActionName = '';
  }

  /**
   * Returns name of action
   * @returns {string} Name of Action
   */
  get name() {
    return this.mName;
  }

  /**
   * Set exit for current action
   */
  exit() {
    this.mPendingExit = true;
  }

  /**
   * Check for exit current action
   * @returns {boolean}
   */
  get isPendingExit() {
    return this.mPendingExit;
  }
}

class BootAction extends Action {
  constructor(m3e) {
    super('boot', m3e);
    this.mPendingExit = false;
  }

  onUpdate() {
    this.createField();
    this.m3e.setAllChipsMatchPending(true);
    //console.log('%c BootAction - %cField is created', 'color: #ff6e00', 'color: #fff400');
    if (this.m3e.level.autoMatchOnStart)
      this.nextActionName = 'moveChips';
    else {
      this.nextActionName = 'userAction';
    }
    this.mPendingExit = true;
  }

  createField() {

    let field = this.m3e.level.fieldMask;
    let c = field.totalColumns;
    let r = field.totalRows;
    // init field array
    this.m3e.mSlots = Array.apply(null, Array(c + 1)).map(e => Array(r + 1).fill(1));
    do {
      do
      {
        let newSlot = {};
        let newChip = {};
        let slotData = field.mask[c][r].split(',');
        let slotMaskType = parseInt(slotData[0]);
        if (slotMaskType < 0) {
          newSlot = new Slots.EmptySlot();
          newSlot.mI = c;
          newSlot.mJ = r;
          newSlot.updateData();
          newSlot.view = null;
        }
        else {
          let slotType = this.getBoardParameter('st', slotData);
          slotType = slotType.exist ? slotType.result : 1;
          switch (slotType) {
            case 1:
              newSlot = new Slots.RegularSlot(this.m3e.level.getMoveFunctions());
              break;
            case 2:
              newSlot = new Slots.ObstacleSlot(this.m3e.level.getMoveFunctions());
              break;
            default:
              newSlot = new Slots.CustomSlot(this.m3e.level.getMoveFunctions(), slotType);
              break;
          }

          newSlot.mI = c;
          newSlot.mJ = r;
          newSlot.updateData();
          newSlot.view = this.m3e.level.cbGetSlotView(newSlot);
          // let newChipColor = slotMaskType === 0 ? Utils.random(0, this.m3e.level.mGameSettings.maxColors) : slotMaskType;
          let newChipColor = this.getBoardParameter('c', slotData);
          if(newChipColor.exist && newChipColor.result> this.m3e.level.mGameSettings.maxColors) newChipColor.exist = false;
          newChipColor = newChipColor.exist ? newChipColor.result : Utils.random(0, this.m3e.level.mGameSettings.maxColors);

          newChip = new Chips.RegularChip();
          newChip.position = {i: c, j: r};

          newChip.color = newChipColor;
          let newType = this.getBoardParameter('t', slotData);
          newType = newType.exist ? newType.result : 0;

          let settings = this.m3e.level.chipSettings.getChipSettings(newType);
          newChip.canFall = settings.canFall;
          newChip.canSwap = settings.canSwap;
          newChip.canMatch = settings.canMatch;


          newChip.type = newType;
          newChip.mView = this.m3e.level.cbGetChipView(newChip);

          this.m3e.assignChipToSlot(newSlot, newChip);
          newSlot.currentChip.saveTempPosition();
        }
        newSlot.mIsBoot = this.getBoardParameter('b', slotData).exist;
        this.m3e.mSlots[c][r] = newSlot;
      } while (0 !== r--);
      r = field.totalRows;
    } while (0 !== c--);
    this.createBorders();

    this.m3e.level.cbFitSlotsView();

    this.m3e.level.cbFitChipsView();

    if (this.m3e.level.dontMatchSortingEnable)
      this.m3e.dontMatchSorting();
  }

  getBoardParameter(targetParam, data) {
    for (let str of data) {
      if (str.indexOf(targetParam) == 0) {
        let result = str.split('=');
        if (result.length > 1) {
          return {exist: true, result: parseInt(result[1])};
        }
        else {
          return {exist: true};
        }
      }
    }

    return {exist: false};
  }

  createBorders() {
    // 'right', 'top-right', top, top-left, left, bottom-left, bottom, bottom-right
    let linesToAdd = [];
    let cornersToAdd = [];

    this.m3e.forEachSlot((item, c, r)=> {
      this.m3e.getAllNeighbours(item,
          (borderType, c, r, newC, newR, sideNumber, neighbourSidesType, exist) => {
            let curSlot = this.m3e.mSlots[c][r];
            if (curSlot.mType === 0)
              return;
            let newSlot = this.m3e.mSlots[newC][newR];
            if (newSlot.mType >= 0) {
              switch (sideNumber) {
                case 1:
                  if (neighbourSidesType[0] < 1 && neighbourSidesType[2] < 1) {
                    if (newSlot.mType !== 0 && exist)
                      borderType += '-outer-skew';
                    cornersToAdd.push({borderType: borderType, slot: curSlot});
                  }
                  if (neighbourSidesType[0] > 0 && neighbourSidesType[2] > 0) {
                    borderType += '-outer';
                    if (newSlot.mType === 0)
                      cornersToAdd.push({borderType: borderType, slot: curSlot});
                  }
                  break;
                case 3:
                  if (neighbourSidesType[4] < 1 && neighbourSidesType[2] < 1) {
                    if (newSlot.mType !== 0 && exist)
                      borderType += '-outer-skew';
                    cornersToAdd.push({borderType: borderType, slot: curSlot});
                  }
                  if (neighbourSidesType[4] > 0 && neighbourSidesType[2] > 0) {
                    borderType += '-outer';
                    if (newSlot.mType === 0)
                      cornersToAdd.push({borderType: borderType, slot: curSlot});
                  }
                  break;
                case 5:
                  if (neighbourSidesType[4] < 1 && neighbourSidesType[6] < 1) {
                    if (newSlot.mType !== 0 && exist)
                      borderType += '-outer-skew';
                    cornersToAdd.push({borderType: borderType, slot: curSlot});
                  }
                  if (neighbourSidesType[4] > 0 && neighbourSidesType[6] > 0) {
                    borderType += '-outer';
                    if (newSlot.mType === 0)
                      cornersToAdd.push({borderType: borderType, slot: curSlot});
                  }
                  break;

                case 7:
                  if (neighbourSidesType[0] < 1 && neighbourSidesType[6] < 1) {
                    if (newSlot.mType !== 0 && exist)
                      borderType += '-outer-skew';
                    cornersToAdd.push({borderType: borderType, slot: curSlot});
                  }
                  if (neighbourSidesType[0] > 0 && neighbourSidesType[6] > 0) {
                    borderType += '-outer';
                    if (newSlot.mType === 0)
                      cornersToAdd.push({borderType: borderType, slot: curSlot});
                  }
                  break;
                default:
                  if (newSlot.mType === 0 || !exist)
                    linesToAdd.push({borderType: borderType, slot: curSlot});
                  break;
              }
            }
          }
      );
    });

    let i = 0;
    if (linesToAdd.length !== 0) {
      do {
        let border = new Slots.Border(linesToAdd[i].borderType, linesToAdd[i].slot);
        border.view = this.m3e.level.cbGetBorderView(border);
      } while (i++ < linesToAdd.length - 1);
    }

    i = 0;
    if (cornersToAdd.length !== 0) {
      do {
        let border = new Slots.Border(cornersToAdd[i].borderType, cornersToAdd[i].slot);
        border.view = this.m3e.level.cbGetBorderView(border);
      } while (i++ < cornersToAdd.length - 1);
    }
  }
}

class MoveSlotsAction extends Action {
  constructor(m3e) {
    super('moveChips', m3e);
    this.mPendingExit = false;
    this._positionsUpdated = false;

    this.verticalPass = false;
    this.cornerPass = false;
    this.verticalSteps = 0;
    this.cornerSteps = 0;
    //console.log('%c MoveSlotsAction - %cStart', 'color: #ff6e00', 'color: #fff400');

  }

  addBootChips() {
    this.m3e.forEachSlot((slot, c, r)=> {
      slot.mSkipPostMove = false;
      if (slot.mIsBoot)
        if (slot.currentChip == 'no_chip' && slot.mIsBoot) {
          let newChip = this.m3e.addNewChip(Utils.random(0, this.m3e.level.mGameSettings.maxColors), c, r);
          newChip.view.setVisible(false);
          newChip.bootOffset = slot.mJ;
          slot.addToBootQueue(newChip);
          slot.currentChip.saveTempPosition();
        }
    });
  }

  addNextMoveStep() {
    let makeChanges = false;

    this.m3e.forEachSlot((slot)=> {
      if (slot.currentChip != 'no_chip') {

        let bottomSlot = this.m3e.getNeighbourBySide(slot, 'bottom');
        if (bottomSlot.exist && bottomSlot.slot.currentChip == 'no_chip' && slot.currentChip.canFall) {
          slot.currentChip.mMoveSteps.push({x: bottomSlot.slot.mI, y: bottomSlot.slot.mJ});

          bottomSlot.slot.assignChip(slot.currentChip);
          slot.pendingMatch = true;
          bottomSlot.slot.pendingMatch = true;
          slot.removeChip();
          makeChanges = true;
        }
      }
    });
    return makeChanges;
  }

  addCornerMoves() {
    let makeChanges = false;
    this.m3e.forEachSlot((slot)=> {
      if (slot.currentChip != 'no_chip') {
        let bottomSlot = this.m3e.getNeighbourBySide(slot, 'bottom');
        if (bottomSlot.exist && bottomSlot.slot.currentChip !== 'no_chip') {
          let fallingSide = false;
          let targetX = slot.mI;
          let bottomLeftSlot = this.m3e.getNeighbourBySide(slot, 'bottom-left');
          let bottomRightSlot = this.m3e.getNeighbourBySide(slot, 'bottom-right');

          let checkLeftSide = bottomLeftSlot.exist && bottomLeftSlot.slot.currentChip === 'no_chip';
          let checkRightSide = bottomRightSlot.exist && bottomRightSlot.slot.currentChip === 'no_chip';

          if (checkLeftSide && checkRightSide) {
            if (Utils.random(0, 1) === 0) {
              fallingSide = bottomLeftSlot;
              targetX--;
            }
            else {
              fallingSide = bottomRightSlot;
              targetX++;
            }
          }
          else if (checkLeftSide) {
            fallingSide = bottomLeftSlot;
            targetX--;
          }
          else if (checkRightSide) {
            fallingSide = bottomRightSlot;
            targetX++;
          }

          if (fallingSide !== false && slot.currentChip.canFall) {
            slot.currentChip.mMoveSteps.push({x: targetX, y: slot.mJ + 1});
            fallingSide.slot.assignChip(slot.currentChip);
            slot.pendingMatch = true;
            fallingSide.slot.pendingMatch = true;
            slot.removeChip();
            makeChanges = true;
          }
        }
      }
    });
    return makeChanges;
  }

  onUpdate(dt) {
    if (!this._positionsUpdated) {
      this.verticalPass = false;
      this.cornerPass = false;

      this.verticalSteps = 0;
      this.cornerSteps = 0;
      do {
        this.addBootChips();
        this.verticalPass = this.addNextMoveStep();
        if (this.verticalPass) this.verticalSteps++;
      } while (this.verticalPass !== false);

      if (this.verticalSteps === 0) {
        do {
          this.addBootChips();
          this.cornerPass = this.addCornerMoves();
          if (this.cornerPass) this.cornerSteps++;
        } while (this.cornerPass !== false);
      }
      this._positionsUpdated = true;
    }
    let isDone = true;
    let postMoveStart = false;
    this.m3e.forEachSlot((slot)=> {
      let state = slot.onSlotUpdate(dt);
      if (!postMoveStart) {
        postMoveStart = state.postMoveStart;
      }
      if (isDone) {
        isDone = state.isDone;
        slot.resetBootQueue();
      }
    });

    if (isDone || postMoveStart) {
      this._positionsUpdated = false;
    }
    if (this.verticalSteps === 0 && this.cornerSteps === 0 && (isDone)) {
      //console.log(isDone, postMoveStart)

      let matchResult = this.m3e.matchAllChips(true);
      if (matchResult === true) {
        this.startAsyncActionName = 'removeChips';
        this.mPendingExit = true;
      }
      else {
        //console.log('%c MoveSlotsAction - %cChips move done', 'color: #ff6e00', 'color: #fff400');
        this.nextActionName = 'userAction';
        this.mPendingExit = true;
      }
    }
  }
}

class UserAction extends Action {
  constructor(m3e, type) {
    super('userAction', m3e);
    //console.log('%c UserAction - %cStart', 'color: #ff6e00', 'color: #fff400');
    this._type = type;
    this._firstSlot = 'empty';
    this._secondSlot = 'empty';
    this._canSwap = false;
    this._swapBack = false;
    this.m3e.level.checkEndGame();
    this.possibleMoves = this.m3e.defaultMatcher.getPossibleMoves();
    for (let r of this.possibleMoves) {
      if (r.refreshedColors) {
        this.nextActionName = 'removeChips';
        this.mPendingExit = true;
        return;
      }
    }
    this.showPossibleMove();
  }

  showPossibleMove() {
    this.m3e.level.cbShowHelpMove(this.possibleMoves, this.m3e.level.gameSettings.highlighHelperTime);
  }

  getSlots() {
    let slotX = this.m3e.mInput.x;
    let slotY = this.m3e.mInput.y;

    let pickedSlot = this.m3e.getSlot(slotX, slotY);
    if (this._firstSlot == 'empty') {
      if (pickedSlot.exist && pickedSlot.slot.currentChip != 'no_chip' && pickedSlot.slot.currentChip.canSwap)
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
          if (pickedSlot.exist && pickedSlot.slot.currentChip != 'no_chip' && pickedSlot.slot.currentChip.canSwap)
            this._secondSlot = pickedSlot.slot;
        }
      }
    }
  }

  tapSlots()
  {
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
    else
    {
      this._firstSlot.currentChip.view.shake(500);
      return false;
    }
  }

  swapSlots() {
    this.m3e.level.cbHideHelpMoves();
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
      let result = this.m3e.specialSlotsMatch(this._firstSlot, this._secondSlot);
      if (!result)
        this.swapSlotsBack();
      else
        this.m3e.decreaseMoves();
    }
    else {
      if (this._firstSlot.currentChip.mColor == this._secondSlot.currentChip.mColor) {
        this.swapSlotsBack();
        let backEffect = this.m3e.level.view.effects.chipHighlight;
        this.backEffect = backEffect != null ? this.m3e.level.view.effects.chipHighlight(this._firstSlot) : null;
        return;
      }
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
      if (!firstChipMatchedGroup.exist && !secondChipMatchedGroup.exist) {
        this.swapSlotsBack();
      }
      else
        this.m3e.decreaseMoves();
    }

    let backEffect = this.m3e.level.view.effects.chipHighlight;
    this.backEffect = backEffect != null ? this.m3e.level.view.effects.chipHighlight(this._firstSlot) : null;
  }

  swapSlotsBack() {
    //console.log('%c UserAction - %cSwap back', 'color: #ff6e00', 'color: #fff400');
    this._firstSlot.currentChip.mMoveSteps.push({x: this._secondSlot.mI, y: this._secondSlot.mJ});
    this._secondSlot.currentChip.mMoveSteps.push({x: this._firstSlot.mI, y: this._firstSlot.mJ});

    this._firstSlot.mSwapBack = true;
    this._secondSlot.mSwapBack = true;
    let tmpChip = this._secondSlot.currentChip;
    this._secondSlot.currentChip = this._firstSlot.currentChip;
    this._firstSlot.currentChip = tmpChip;
    this._swapBack = true;
    this.showPossibleMove();
  }

  onUpdate(dt) {
    let isDone = false;
    if (this.m3e.mInput.onDown) {
      this.getSlots();
    }
    else if (!this._canSwap) {
      if(this._type == 'swipe')
      {
        if (this._firstSlot != 'empty' && this._secondSlot != 'empty') {

          this.swapSlots();
          this._canSwap = true;
        }
      } else if(this._type == 'tap')
      {
        if (this._firstSlot != 'empty') {


          isDone = this.tapSlots();
        }
      }

      this._firstSlot = 'empty';
      this._secondSlot = 'empty';
    }
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
      if (this.backEffect)
        this.backEffect.remove();
      this._canSwap = false;
      if (!this._swapBack) {
       //console.log('%c UserAction - %cUser make swipe', 'color: #ff6e00', 'color: #fff400');
        this.nextActionName = 'removeChips';
        this.mPendingExit = true;
      }
      else {
        this._swapBack = false;
      }
    }
  }
}

class RemoveChips extends Action {
  constructor(m3e) {
    super('removeChips', m3e);
    //console.log('%c RemoveChips - %cStart', 'color: #ff6e00', 'color: #fff400');
    this.startingDestroyEffect = false;
    this.removePendingChips();
    this.m3e.level.cbHideHelpMoves();
  }

  removePendingChips() {
    let counter = 0;
    this.m3e.forEachSlot((slot)=> {
      if (slot.currentChip != 'no_chip') {
        if (slot.mPendingDestroy || slot.currentChip.type.length > 1) {
          slot.pendingMatch = true;
          if (slot.currentChip.type != 0) {
            this.m3e.removeSpecialChips(slot.currentChip.type, slot);
            slot.mPendingDestroy = false;
          }
          else {
            if (this.m3e.level.gameType.mType === 'recipe') {
              let recipeResult = this.m3e.decreaseRecipe(slot.currentChip);
              if (recipeResult !== false) {
                slot.destroyChipEffect(recipeResult, counter);
                counter++;
              }
              else {
                slot.destroyChipEffect();
              }
            }
            else {
              slot.destroyChipEffect();
            }

            slot.mPendingDestroy = false;
          }
        }
      }
    });
    this.startingDestroyEffect = true;
  }

  onUpdate(dt) {
    if (!this.startingDestroyEffect)
      return;
    let isDone = true;
    this.m3e.forEachSlot((slot)=> {
      if (slot.currentChip != 'no_chip' && slot.currentChip.mStartDestroy) {
        if ((!slot.currentChip.isDestroyed && isDone) || slot.currentChip.isEffectShow) {
          isDone = false;
        } else {
          this.m3e.addScore(this.m3e.level.gameSettings.scoreAddByChip);
          slot.removeChip();
        }
      }
    });

    this.m3e.forEachSlot((slot)=> {
      let state = slot.onSlotUpdate(dt);

      if (isDone) {
        isDone = state.isDone;
      }
    });

    if (isDone) {
      //console.log('%c RemoveChips - %cRemove end', 'color: #ff6e00', 'color: #fff400');
      this.nextActionName = 'moveChips';
      this.mPendingExit = true;
    }
  }
}
export {BootAction, MoveSlotsAction, UserAction, RemoveChips};
