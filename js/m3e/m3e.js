/*jshint -W041 */
/*jshint -W069 */
/*jshint -W083 */

import Level from 'm3e/level';
import * as Actions from 'm3e/action';
import * as Chips from 'm3e/chip';
import Utils from 'm3e/utils';
import Input from 'm3e/input';

/** Class representing match3 engine. */
export default class M3E {
  /**
   * Initialize with actions and level settings.
   */
  constructor() {
    this.mInput = new Input();
    this.mLevel = new Level(this);
    this.mSlots = [];
    this.mChipsCache = [];
    this.mActions = {};
    this.mActions['boot'] = {action: Actions.BootAction};


    this.mActionQueue = [];
    this.mAsyncActionsQueue = [];
    this.mActionsPause = false;
    this.mInited = false;
    this.createAction('boot');
  }

  initMatcher(type) {
    this.mActions['moveChips'] = {action: Actions.MoveSlotsAction};
    this.mActions['userAction'] = {action: Actions.UserAction, params: type};
    this.mActions['removeChips'] = {action: Actions.RemoveChips};

    this.specialDestroyBehavior = new SpecialDestroyBehavior(this);
    this.defaultMatcher = type == 'swipe' ? new M3Matcher(this) : new TAPM3Matcher(this);
    this.matchSlot = (c, r)=> {
      return this.defaultMatcher.matchSlot(c, r);
    };
    this.matchAllChips = (checkOnlyPending)=> {
      return this.defaultMatcher.matchAllChips(checkOnlyPending);
    };
    this.setAllChipsMatchPending = (value)=> {
      this.defaultMatcher.setAllChipsMatchPending(value);
    };
    this.resetPendingDestroy = ()=> {
      this.defaultMatcher.resetPendingDestroy();
    };
    this.specialSlotsMatch = (slot1, slot2)=> {
      return this.defaultMatcher.specialSlotsMatch(slot1, slot2);
    };
    this.removeSpecialChips = (type, slot)=> {
      return this.defaultMatcher.removeSpecialChips(type, slot);
    };


  }

  /**
   * Assigning chip to hte slot
   * @param {!Slot} slot Slot class
   * @param {!Chip} chip Chip class
   */
  assignChipToSlot(slot, chip) {
    slot.assignChip(chip);
  }

  /**
   * Get the Level class
   * @returns {Level} The Level cass
   */
  get level() {
    return this.mLevel;
  }

// TODO remake
  init(levelData) {
    this.mInited = true;
    this.mLevel.init(levelData);
    this.currentScore = this.level.gameSettings.maxScore;
    this.currentMoves = this.level.gameSettings.maxMoves;
  }

  addAction(name, action, params) {
    this.mActions[name] = {action: action, params: params};
  }

  /**
   * Add an action to enqueue
   * @param {string} actionName Action name
   */
  createAction(actionName) {
    let a = new this.mActions[actionName].action(this, this.mActions[actionName].params);
    let cb = this['cb_' + a.name + '_onAdd'];
    if (cb != null)
      cb(a);
    this.enqueue(a);
  }

  /**
   * Add async action to enqueue
   * @param {string} actionName Action name
   */
  createAsyncAction(actionName) {
    let a = new this.mActions[actionName].action(this, this.mActions[actionName].params);
    this.asyncEnqueue(a);
  }

  /**
   * Add Action class to enqueue array
   * @param {Action} action Action class
   */
  enqueue(action) {
    this.mActionQueue.push(action);
  }

  /**
   * Add Action class to async enqueu array
   * @param {Action} action Action class
   */
  asyncEnqueue(action) {
    this.mAsyncActionsQueue.push(action);
  }

  /**
   * Remove all actions
   */
  removeAllActions() {
    for (let a of this.mActionQueue) {
      a.mPendingExit = true;
    }

    for (let a of this.mAsyncActionsQueue) {
      a.mPendingExit = true;
    }
  }

  /**
   * Pause all actions
   */
  pauseAllActions() {
    this.mActionsPause = true;
  }

  /**
   * Resume all actions
   */
  resumeAllActions() {
    this.mActionsPause = false;
  }

  /**
   * Call callback function for all slots on the field
   * @param {ForEachSlotsCallback} func Callback that contain slot data
   */
  forEachSlot(func) {
    let c = this.level.fieldMask.totalColumns;
    let r = this.level.fieldMask.totalRows;
    do {
      do
      {
        func(this.mSlots[c][r], c, r);
      } while (0 !== r--);
      r = this.level.fieldMask.totalRows;
    } while (0 !== c--);
  }

  /**
   * Called for each slot
   * @callback ForEachSlotsCallback
   * @param {Slot} slot Slot
   * @param {number} c Column
   * @param {number} r Row
   */

  /**
   * Get slot by column and row
   * @param {number} c Column
   * @param {number} r Row
   * @returns {{exist: boolean, slot: Slot}} Slot if it's exist
   */
  getSlot(c, r) {
    const tC = this.level.fieldMask.totalColumns;
    const tR = this.level.fieldMask.totalRows;
    let slot = null;
    let exist = false;
    if (c >= 0 && c <= tC && r >= 0 && r <= tR) {
      exist = true;
      slot = this.mSlots[c][r];
    }
    return {exist, slot};
  }

  /**
   * Get neighbour slot by side name
   * @param {Slot} curSlot
   * @param {string} sideName
   * @returns {{exist: boolean, slot: Slot}} Slot if it's exist
   */
  getNeighbourBySide(curSlot, sideName) {
    let side = Utils.sideOffsets.find(x=> x[2] == sideName);
    let newC = curSlot.mI + side[0];
    let newR = curSlot.mJ + side[1];
    let slot = null;
    let exist = false;
    if (this.getSlot(newC, newR).exist && this.mSlots[newC][newR].mType > 0) {
      slot = this.mSlots[newC][newR];
      exist = true;
    }
    return {exist, slot};
  }

  // TODO remove straightSides and slantedSides choose
  /**
   * Call Callback function for all exist neighbour slots
   * @param {Sot} slot Current slot
   * @param @param {GetAllNeighboursCallback} func Callback that contain slot data
   * @param {boolean} [straightSides = true] include straight sides
   * @param {boolean} [slantedSides = true] include slanted sides
   */
  getAllNeighbours(slot, func, straightSides = true, slantedSides = true) {
    let callArgStack = [];
    let neighbourSides = [];
    let totalSides = Utils.sideOffsets.length;
    let sideNumber = (slantedSides && !straightSides) ? 1 : 0;
    do
    {
      let newC = slot.mI + Utils.sideOffsets[sideNumber][0];
      let newR = slot.mJ + Utils.sideOffsets[sideNumber][1];
      if (this.getSlot(newC, newR).exist) {
        neighbourSides[sideNumber] = this.mSlots[newC][newR].mType;
        callArgStack.push({
          exist: true,
          sideName: Utils.sideOffsets[sideNumber][2],
          c: slot.mI,
          r: slot.mJ,
          newC: newC,
          newR: newR,
          sideNumber: sideNumber
        });
      }
      else {
        neighbourSides[sideNumber] = -1;
        callArgStack.push({
          exist: false,
          sideName: Utils.sideOffsets[sideNumber][2],
          c: slot.mI,
          r: slot.mJ,
          newC: 0,
          newR: 0,
          sideNumber: sideNumber,
        });
      }
      sideNumber++;
      if (straightSides != slantedSides)
        sideNumber++;
    } while (sideNumber < totalSides);
    let i = 0;
    if (callArgStack.length === 0)
      return;
    do {
      let args = callArgStack[i];
      func(args.sideName, args.c, args.r, args.newC, args.newR, args.sideNumber, neighbourSides, args.exist);
    } while (i++ < callArgStack.length - 1);
  }

  /**
   * Called for all neighbour slots
   * @callback GetAllNeighboursCallback
   * @param {string} borderType Border side name
   * @param {number} c Current slot column
   * @param {number} r Current slot row
   * @param {number} newC Found column
   * @param {number} newR Found row
   * @param {number} sideNumber The array index of found side in Utils.sideOffsets
   * @param {number[]} neighbourSidesType All founded slot types for current slot
   * @param {boolean} exist If side is exist
   */

  /**
   * Change field chips colors in maneer than no each one can't make match patterns
   * @returns {boolean} if make changes or max фееуьеы ьщку ерфт 50
   */
  dontMatchSorting() {
    let i = 0;
    let makeChanges = false;
    while (i < 50 && !makeChanges) {
      i++;
      this.forEachSlot((slot)=> {
        let curChip = slot.currentChip;
        let curColor = curChip != "no_chip" ? curChip.color : null;
        let sR1 = this.getSlot(curChip.mI + 1, curChip.mJ);
        let sR2 = this.getSlot(curChip.mI + 2, curChip.mJ);
        let sB1 = this.getSlot(curChip.mI, curChip.mJ + 1);
        let sB2 = this.getSlot(curChip.mI, curChip.mJ + 2);

        if (sR1.exist && sR2.exist && curColor != null) {
          let cR1 = sR1.slot.currentChip;
          let cR2 = sR2.slot.currentChip;

          if (cR1 != "no_chip" && cR2 != "no_chip") {
            if ((cR1.color == curColor && cR2.color == curColor)) {
              slot.currentChip.color = Utils.randomExcept(0, this.level.mGameSettings.maxColors, curColor);
              slot.currentChip.view.updateView();
              makeChanges = true;
            }
          }
        }

        if (sB1.exist && sB2.exist && curColor != null) {
          let cB1 = sB1.slot.currentChip;
          let cB2 = sB2.slot.currentChip;
          if (cB1 != "no_chip" && cB2 != "no_chip") {
            if ((cB1.color == curColor && cB2.color == curColor)) {
              slot.currentChip.color = Utils.randomExcept(0, this.level.mGameSettings.maxColors, curColor);
              slot.currentChip.view.updateView();
              makeChanges = true;
            }
          }
        }
      });
    }

    if (makeChanges)
      return this.dontMatchSorting();
    else
      return false;
  }

  /**
   * Add new chip on slot
   * @param {number} Target Color
   * @param {number} i Target column
   * @param {number} j Target Row
   * @returns {Chip} newChip Added Chip
   */
  addNewChip(color, i, j) {
    let newChip = null;
    let cachedChipsSize = this.mChipsCache.length;
    while (0 < cachedChipsSize--) {
      if (this.mChipsCache[i].mType == type) {
        newChip = this.mChipsCache[i];
        this.mChipsCache.splice(i, 1);
        break;
      }
    }
    if (newChip === null) {
      newChip = new Chips.RegularChip();
    }
    newChip.mI = i;
    newChip.mJ = j;

    newChip.color = color;
    newChip.mView = this.level.cbGetChipView(newChip);
    this.assignChipToSlot(this.mSlots[i][j], newChip);
    return newChip;
  }

  /**
   * Decrease recipes number and update UI view
   * @param chip
   * @returns {boolean || number} return decreased recipe number or false if none
   */
  decreaseRecipe(chip) {
    let count = 0;
    for (let r of this.level.gameType.recipesInfo) {
      if (chip.color == r.color && chip.type == r.type && r.count > 0) {
        r.count--;
        this.level.cbUpdateRecipesUI();
        return count;
      }
      count++;
    }
    return false;
  }

  /**
   * Decrease moves
   */
  decreaseMoves() {
    this.level.cbUpdateMovesUI(--this.currentMoves);
  }

  /**
   * Add score
   * @param {number} add score value
   */
  addScore(value) {
    this.currentScore += value;
    this.level.cbUpdateScoreUI(value);
  }

  /**
   * Check for slots equals
   * @param {Slot} slot1
   * @param {Slot} slot2
   * @returns {boolean} Are slots equal
   */
  slotsEqual(slot1, slot2) {
    return slot1.mI == slot2.mI && slot1.mJ == slot2.mJ;
  }

  /**
   * Update loop
   * @param {number} dt Delta time
   */
  update(dt) {
    if (!this.mInited)
      return;

    let current = this.mActionQueue[0];
    if (!this.mActionsPause) {
      if (this.mActionQueue.length !== 0) {
        current.onUpdate(dt);
        let cb = this['cb_' + current.name + '_update'];
        if (cb != null)
          cb(current);
      }

      if (current && current.isPendingExit) {
        this.mActionQueue.shift();
        if (current.nextActionName !== false)
          this.createAction(current.nextActionName);
      }
    }


    /// Async actions part

    if (current && current.startAsyncActionName !== '') {
      this.createAsyncAction(current.startAsyncActionName);
      current.startAsyncActionName = '';
    }

    if (!this.mActionsPause) {
      for (let i = 0; i < this.mAsyncActionsQueue.length; i++) {
        let asyncAction = this.mAsyncActionsQueue[i];
        asyncAction.onUpdate(dt);
        let cb = this['cb_' + asyncAction.name + '_update'];
        if (cb != null)
          cb(asyncAction);

        if (asyncAction && asyncAction.startAsyncActionName !== '') {
          this.createAsyncAction(asyncAction.startAsyncActionName);
          asyncAction.startAsyncActionName = '';
        }

        if (asyncAction && asyncAction.isPendingExit) {
          this.mAsyncActionsQueue.splice(i, 1);
          if (asyncAction.nextActionName !== false)
            this.createAction(asyncAction.nextActionName);

        }
      }
    }
  }

}

class SpecialDestroyBehavior {
  constructor(m3e) {
    this._m3e = m3e;
    this.lineEffect = ()=> {
    };
    this.bombEffect = ()=> {
    };
    this.colorBombEffect = ()=> {
    };

    this.line = this.lineDestroy;
    this.crossLine = this.crossLineDestroy;
    this.bomb = this.bombDestroy;
    this.colorRemove = this.colorBombDestroy;
    this.destroyPatterns = [];
  }

  setDefaultPatterns() {
    this.addPattern('1', [{func: this.line, args: [false, 1]}],
        [{func: this.lineEffect, args: [90, 1]}]);
    this.addPattern('2', [{func: this.line, args: [true, 1]}],
        [{func: this.lineEffect, args: [0, 1]}]);
    this.addPattern('3', [{func: this.crossLine, args: [1]}],
        [{func: this.lineEffect, args: [45, 1]}, {func: this.lineEffect, args: [-45, 1]}]);
    this.addPattern('4', [{func: this.bomb, args: [3]}], [{func: this.bombEffect, args: [3]}]);
    this.addPattern('5-x,6', [{func: this.colorRemove, args: []}], [{func: this.colorBombEffect, args: []}]);

    this.addPattern('1-1', [{func: this.line, args: [false, 1]}, {func: this.line, args: [true, 1]}],
        [{func: this.lineEffect, args: [0, 1]}, {func: this.lineEffect, args: [90, 1]}]);
    this.addPattern('1-2', [{func: this.line, args: [false, 1]}, {func: this.line, args: [true, 1]}],
        [{func: this.lineEffect, args: [0, 1]}, {func: this.lineEffect, args: [90, 1]}]);
    this.addPattern('2-2', [{func: this.line, args: [false, 1]}, {func: this.line, args: [true, 1]}],
        [{func: this.lineEffect, args: [0, 1]}, {func: this.lineEffect, args: [90, 1]}]);

    this.addPattern('3-1', [{func: this.line, args: [false, 1]}, {
          func: this.line,
          args: [true, 1]
        }, {func: this.crossLine, args: [1]}],
        [{func: this.lineEffect, args: [0, 1]}, {func: this.lineEffect, args: [90, 1]}, {
          func: this.lineEffect,
          args: [45, 1]
        }, {func: this.lineEffect, args: [-45, 1]}]);
    this.addPattern('3-2', [{func: this.line, args: [false, 1]}, {
          func: this.line,
          args: [true, 1]
        }, {func: this.crossLine, args: [1]}],
        [{func: this.lineEffect, args: [0, 1]}, {func: this.lineEffect, args: [90, 1]}, {
          func: this.lineEffect,
          args: [45, 1]
        }, {func: this.lineEffect, args: [-45, 1]}]);

    this.addPattern('4-1', [{func: this.line, args: [false, 3]}],
        [{func: this.lineEffect, args: [90, 3]}]);

    this.addPattern('4-2', [{func: this.line, args: [true, 3]}],
        [{func: this.lineEffect, args: [0, 3]}]);

    this.addPattern('4-3', [{func: this.crossLine, args: [3]}],
        [{func: this.lineEffect, args: [45, 3]}, {func: this.lineEffect, args: [-45, 3]}]);

    this.addPattern('4-4', [{func: this.bomb, args: [7]}], [{func: this.bombEffect, args: [7]}]);
  }

  addPattern(chipType, func, effects) {
    this.destroyPatterns.push(
        {
          type: chipType,
          func: func,
          effects: effects,
        });
  }

  lineDestroy(isVertical, size, slot) {

    let chipsToRemove = [];
    let curI = slot.mI;
    let curJ = slot.mJ;
    for (let i = -Math.floor(size / 2); i < Math.round(size / 2); i++) {
      let curSlot = this._m3e.getSlot(isVertical ? curI + i : curI, isVertical ? curJ : curJ + i);
      if (curSlot.exist) {
        let i = 0;
        if (!isVertical) {
          for (i = 0; i <= this._m3e.mLevel.fieldMask.totalColumns; i++) {
            let findChip = this._m3e.getSlot(i, curSlot.slot.mJ);
            if (findChip.exist && findChip.slot.currentChip.canMatch)
              chipsToRemove.push(findChip);
          }
        }
        else {
          for (i = 0; i <= this._m3e.mLevel.fieldMask.totalRows; i++) {
            let findChip = this._m3e.getSlot(curSlot.slot.mI, i);
            if (findChip.exist && findChip.slot.currentChip.canMatch)
              chipsToRemove.push(findChip);
          }
        }
      }
    }
    return chipsToRemove;
  }

  crossLineDestroy(size, slot) {
    let chipsToRemove = [];

    let curI = slot.mI;
    let curJ = slot.mJ;

    for (let i = -Math.floor(size / 2); i < Math.round(size / 2); i++) {
      let curSlot = this._m3e.getSlot(curI + i, curJ);
      if (curSlot.exist) {
        let c = curSlot.slot.mI;
        let r = curSlot.slot.mJ;
        let sum = c + r;

        for (let i = 0; i <= this._m3e.mLevel.fieldMask.totalColumns; i++) {
          for (var j = 0; j <= this._m3e.mLevel.fieldMask.totalRows; j++) {
            if (((i + j) == sum) || (Math.abs(c - i) == Math.abs(r - j))) {
              let findChip = this._m3e.getSlot(i, j);
              if (findChip.exist && findChip.slot.currentChip.canMatch)
                chipsToRemove.push(findChip);
            }
          }
        }
      }
    }
    return chipsToRemove;
  }

  bombDestroy(size, chip) {
    let chipsToRemove = [];

    for (var i = -Math.floor(size * 0.5); i < Math.round(size * 0.5); i++) {
      for (var j = -Math.floor(size * 0.5); j < Math.round(size * 0.5); j++) {
        let findChip = this._m3e.getSlot(i + chip.mI, j + chip.mJ);
        if (findChip.exist && findChip.slot.currentChip.canMatch)
          chipsToRemove.push(findChip);
      }
    }
    return chipsToRemove;
  }

  colorBombDestroy(slot) {
    let chipsToRemove = [];
    this._m3e.forEachSlot((s)=> {
      let findChip = this._m3e.getSlot(s.mI, s.mJ);
      if (findChip.exist && findChip.slot.currentChip.color == slot.currentChip.color && findChip.slot.currentChip.color != -1 && findChip.slot.currentChip.canMatch)
        chipsToRemove.push(findChip);
    });
    return chipsToRemove;
  }

  slotDestroy(type, slot, applyEffects = true) {

    let findPattern = false;
    type = type.split(',');
    let matchType = type[0];
    let ignoredElements = [];
    if (type.length > 1) {
      for (let i = 1; i < type.length; i++) {
        ignoredElements.push(type[i]);
      }
    }

    for (let i = 0; i < this.destroyPatterns.length; i++) {
      let dp = this.destroyPatterns[i].type;
      dp = dp.split(',');
      let dpMatchType = dp[0];
      let dpIgnoreElements = [];


      if (dp.length > 1) {
        for (let i = 1; i < dp.length; i++) {
          dpIgnoreElements.push(dp[i]);
        }
      }

      if (dpMatchType == matchType) {
        if (ignoredElements.length == 1) {
          if (dpIgnoreElements.find((x)=>x == ignoredElements[0]) == undefined)
            findPattern = i;
        }
        else if (ignoredElements.length == 2) {
          if (dpIgnoreElements.find((x)=>x == ignoredElements[0]) == undefined && dpIgnoreElements.find((x)=>x == ignoredElements[1]) == undefined)
            findPattern = i;
        }
        else if (ignoredElements.length == 0)
          findPattern = i;
      }

    }

    if (findPattern === false)return false;

    let df = this.destroyPatterns[findPattern];

    let removeChips = [this._m3e.getSlot(slot.mI, slot.mJ)];

    for (let i = 0; i < df.func.length; i++) {
      removeChips = removeChips.concat(df.func[i].func.apply(this, df.func[i].args.concat(slot)));
    }
    if (applyEffects)
      for (let i = 0; i < df.effects.length; i++) {
        df.effects[i].func.apply(this, df.effects[i].args.concat(slot, [removeChips]));
      }
    return removeChips;
  }
}

class M3Matcher {
  constructor(m3e) {
    this._m3e = m3e;
    //console.log('%c Swipe Match 3 Matcher - %cInitialized', 'color: #ff6e00', 'color: #fff400');

  }

  /**
   * Return matched groups for one slot
   * @param c Current column
   * @param r Current row
   * @returns {{exist: boolean, result: [{slot: Slot, simpleDestroy: boolean, targetSlot: Slot, newType: number }]}} Matching result
   */
  matchSlot(c, r) {
    let slot = this._m3e.getSlot(c, r);
    if (!slot.exist && slot.slot.currentChip.mType < 1)
      return {exist: false, result: []};

    let matchedGroup = this.findMatchGroups(slot.slot, true, true);
    if (!matchedGroup.exist)
      matchedGroup = this.findMatchGroups(slot.slot, false, true);
    return matchedGroup;
  }

  /**
   * Finding matched slots by colour and compare them with matched patterns
   * @param {Slot} slot Checked slot
   * @param {boolean} [horizontal=true] Start checking for horizontal or vertical comparing at first
   * @param [boolean} [checkSubGroups=false] check only subgroups (used for second pass)
   * @returns {Slot[] | {exist: boolean, result: [{slot: Slot, simpleDestroy: boolean, targetSlot: Slot, newType: number }]}} Matching result
   */
  findMatchGroups(slot, horizontal = true, checkSubGroups = false) {
    let allSlots = [];
    let previousSlots = [];
    let nextSlots = [];
    let result = {exist: false, items: []};

    let counter = horizontal ? slot.mI : slot.mJ;
    let end = horizontal ? this._m3e.mLevel.fieldMask.totalColumns : this._m3e.mLevel.fieldMask.totalRows;

    while (end > counter++) {
      let curSlot = this._m3e.getSlot(horizontal ? counter : slot.mI, horizontal ? slot.mJ : counter);

      if (!curSlot.slot.mPendingDestroy && curSlot.slot.currentChip != 'no_chip' && curSlot.slot.currentChip.mColor == slot.currentChip.mColor && curSlot.slot.currentChip.canMatch) {
        previousSlots.push(curSlot.slot);
      }
      else break;
    }

    counter = horizontal ? slot.mI : slot.mJ;
    while (0 < counter--) {

      let curSlot = this._m3e.getSlot(horizontal ? counter : slot.mI, horizontal ? slot.mJ : counter);

      if (!curSlot.slot.mPendingDestroy && curSlot.slot.currentChip != 'no_chip' && curSlot.slot.currentChip.mColor == slot.currentChip.mColor && curSlot.slot.currentChip.canMatch) {
        nextSlots.push(curSlot.slot);
      }
      else break;
    }

    if (checkSubGroups) {
      allSlots = allSlots.concat(previousSlots);
      allSlots = allSlots.concat(slot);
      allSlots = allSlots.concat(nextSlots);
    }
    else {
      allSlots = allSlots.concat(previousSlots);
      allSlots = allSlots.concat(nextSlots);
      return allSlots;
    }

    let itemsLength = allSlots.length;
    if (itemsLength > 1) {
      if (checkSubGroups) {
        let i = 0;
        do {
          let subGroup = this.findMatchGroups(allSlots[i], !horizontal);
          if (subGroup.length !== 0) {
            allSlots = allSlots.concat(subGroup);
          }
        } while (itemsLength - 1 > i++);
      }
      result = this.comparePatterns(this.createMatchPattern(allSlots), slot);
      if (result.exist) {
        for (let r of result.items) {
          r.slot.isMatched = true;
        }
      }
    }
    return {exist: result.exist, result: result.items};
  }

  /**
   * Creating 2d array pattern based for  zero start coordinates
   * for next checking with predefined match patterns
   * @param {Slot[]} slots Matched slots
   * @returns {Slot[][]} Result match pattern
   */
  createMatchPattern(slots) {
    let result = [];
    let minColumn = Math.min.apply(Math, slots.map((x)=> {
      return x.mI;
    }));
    let maxColumn = Math.max.apply(Math, slots.map((x)=> {
      return x.mI;
    }));
    let minRow = Math.min.apply(Math, slots.map((x)=> {
      return x.mJ;
    }));
    let maxRow = Math.max.apply(Math, slots.map((x)=> {
      return x.mJ;
    }));

    for (let i = 0; i <= maxColumn - minColumn; i++) {
      result[i] = [];
      for (let j = 0; j <= maxRow - minRow; j++) {
        let slot = slots.find((x)=> {
          return x.mI == minColumn + i && x.mJ == minRow + j;
        });
        result[i][j] = (slot ? slot : 0);
      }
    }
    return result;
  }

  /**
   * Compare matched patterns for matching
   * @param {Slot[][]}  slotsPattern Founded slots pattern
   * @param {Slot} startSlot Starting matching slot
   * @returns {{exist: boolean, items: [{slot: Slot, simpleDestroy: boolean, targetSlot: Slot, newType: number }]} Matching result if exist
   */
  comparePatterns(slotsPattern, startSlot) {
    if (slotsPattern.length > 0) {
      let matchedItems = [];
      let patternsLength = this._m3e.level.matchPatterns.length;
      let spMaxColumns = slotsPattern.length;
      let spMaxRows = slotsPattern[0].length;
      let p = 0;
      let cOffset = 0;
      let rOffset = 0;

      for (p = 0; p < patternsLength; p++) {
        let mP = this._m3e.level.matchPatterns[p].pattern;
        let mPC = mP.length;
        let mPR = mP[0].length;
        if (mPC <= spMaxColumns && mPR <= spMaxRows) {

          for (cOffset = 0; cOffset <= spMaxColumns - mPC; cOffset++) {
            for (rOffset = 0; rOffset <= spMaxRows - mPR; rOffset++) {
              let matched = true;
              let startSlotMatched = false;
              matchedItems = [];
              for (let i = 0; i < mPC; i++) {
                for (let j = 0; j < mPR; j++) {
                  let curSP = slotsPattern[i + cOffset][j + rOffset];
                  if (mP[i][j] == 1 && curSP !== 0) {
                    let newType = null;
                    let newColor = null;
                    let patternParams = this._m3e.level.matchPatterns[p].chipType;
                    if (patternParams != null) {
                      patternParams = this._m3e.level.matchPatterns[p].chipType.split(',');
                      if (patternParams.length == 2) {
                        newType = parseInt(patternParams[0]);
                        newColor = parseInt(patternParams[1]);
                      }
                      else
                        newType = patternParams[0];
                    }

                    if (curSP.mI == startSlot.mI && curSP.mJ == startSlot.mJ)
                      startSlotMatched = true;
                    matchedItems.push({
                      slot: curSP,
                      simpleDestroy: this._m3e.level.matchPatterns[p].chipType === null,
                      targetSlot: startSlot,
                      newType: newType,
                      newColor: newColor,
                    });
                  }
                  else if (mP[i][j] != curSP) {
                    matched = false;
                  }
                }
              }
              if (matched && startSlotMatched) {
                return {exist: true, items: matchedItems};
              }
            }
          }
        }
      }
    }
    return {exist: false, items: []};
  }

  /**
   * Set all chips pendingMatch value
   * @param {boolean} value
   */
  setAllChipsMatchPending(value) {
    this._m3e.forEachSlot((slot)=> {
      slot.pendingMatch = value;
    });
  }

  /**
   * Set all chips PendingDestroy value
   * @param {boolean} value
   */
  resetPendingDestroy() {
    this._m3e.forEachSlot((slot)=> {
      slot.mPendingDestroy = false;
      // slot.mThrowSpecialDestroy = false;
    });
  }

  /**
   * Match all or only lat Action moved chips
   * @param {boolean} checkOnlyPending check only last moved chips
   * {{exist: boolean, result: [{slot: Slot, simpleDestroy: boolean, targetSlot: Slot, newType: number }]}} Matching result
   */
  matchAllChips(checkOnlyPending = false) {
    //checkOnlyPending = false
    let findGroups = false;
    this._m3e.forEachSlot((slot, c, r)=> {
      //if (!slot.mPendingDestroy && (!checkOnlyPending || slot.pendingMatch) && slot.currentChip.canMatch) {
      if ((!checkOnlyPending || slot.pendingMatch) && slot.currentChip.canMatch) {
        let matchGroups = this.matchSlot(c, r);
        if (matchGroups.exist) {
          findGroups = true;
          for (let item of matchGroups.result) {
            if (item.slot !== null) {
              item.slot.pendingDestroy(item);
            }
          }
        }
      }
    });

    this.setAllChipsMatchPending(false);
    return findGroups;
  }

  specialSlotsMatch(slot1, slot2) {
    let matchName = `${slot1.currentChip.type}-${slot2.currentChip.type}`;
    let matchNameReversed = `${slot2.currentChip.type}-${slot1.currentChip.type}`;
    let matchNameX = `${slot1.currentChip.type}-x`;
    let matchNameXReversed = `${slot2.currentChip.type}-x`;
    let tempType1 = slot1.currentChip.type;
    let tempType2 = slot2.currentChip.type;

    matchName += `,${tempType1},${tempType2}`;
    matchNameReversed += `,${tempType1},${tempType2}`;
    matchNameX += `,${tempType1},${tempType2}`;
    matchNameXReversed += `,${tempType1},${tempType2}`;

    let type = matchName;
    let result = this._m3e.specialDestroyBehavior.slotDestroy(matchName, slot1, false);
    if (result) {
      slot1.currentChip.type = 0;
      slot2.currentChip.type = type;
      return result;
    }

    if (!result) {
      result = this._m3e.specialDestroyBehavior.slotDestroy(matchNameReversed, slot1, false);
      type = matchNameReversed;
      if (result) {
        slot1.mThrowSpecialDestroy = true;
        slot1.currentChip.type = 0;
        slot2.currentChip.type = type;
        return result;
      }
    }

    if (!result && slot1.currentChip.type != slot2.currentChip.type) {
      result = this._m3e.specialDestroyBehavior.slotDestroy(matchNameX, slot1, false);
      type = matchNameX;
    }
    if (!result && slot1.currentChip.type != slot2.currentChip.type) {
      result = this._m3e.specialDestroyBehavior.slotDestroy(matchNameXReversed, slot1, false);
      type = matchNameXReversed;
    }
    if (result != false) {
      slot1.mThrowSpecialDestroy = true;
      slot2.currentChip.type = type;
    }
    if (result) {
      slot2.mThrowSpecialDestroy = true;
      slot1.currentChip.type = type;
    }

    slot1.pendingMatch = true;
    slot2.pendingMatch = true;
    return result;
  }

  removeSpecialChips(type, slot, slotsToRemove) {
    slotsToRemove = slotsToRemove || [];
    let counter = 0;
    let chipsForRemove = this._m3e.specialDestroyBehavior.slotDestroy(type.toString(), slot);
    if (!chipsForRemove) {
      slot.destroyChipEffect();
      slot.mPendingDestroy = false;
    }
    else {
      for (let c of chipsForRemove) {
        if (c.slot.currentChip != 'no_chip') {
          if (c.slot.currentChip.type != 0 && !this._m3e.slotsEqual(c.slot, slot) &&
              (slotsToRemove.find((x)=>(this._m3e.slotsEqual(c.slot, x))) == undefined) && !c.slot.mThrowSpecialDestroy) {
            // c.slot.currentChip.mIgnoreDestroyEffect = true;
            // slot.currentChip.mIgnoreDestroyEffect = false;
            this.removeSpecialChips(c.slot.currentChip.type, c.slot, slotsToRemove);
          }
          else {
            slotsToRemove.push({mI: c.slot.mI, mJ: c.slot.mJ});
            // if(c.slot.currentChip.type != 0)
            //   c.slot.currentChip.mIgnoreDestroyEffect = false;
            //slot.currentChip.mIgnoreDestroyEffect = false;

            c.slot.mThrowSpecialDestroy = false;
            c.slot.mSimpleDestroy = true;
            if (this._m3e.level.gameType.mType === 'recipe') {
              let recipeResult = this._m3e.decreaseRecipe(c.slot.currentChip);
              if (recipeResult !== false) {
                c.slot.destroyChipEffect(recipeResult, counter);
                counter++;
              }
              else {
                c.slot.destroyChipEffect();
              }
            }
            else
              c.slot.destroyChipEffect();


            c.slot.mPendingDestroy = true;
            c.slot.currentChip.mStartDestroy = true;
            c.slot.pendingMatch = true;
          }
        }
      }
    }

    slot.currentChip.mIgnoreDestroyEffect = false;
  }

  getPossibleMoves(startRow, endRow = -1) {
    const tC = this._m3e.level.fieldMask.totalColumns;
    const tR = this._m3e.level.fieldMask.totalRows;

    startRow = startRow || 0;
    endRow = endRow == -1 ? tR : endRow;

    let result = [];
    result.refreshedColors = false;

    for (let i = 0; i < tC - 1; i++) {
      for (let j = startRow; j <= endRow; j++) {

        for (let k = 1; k <= 6; k++) {
          let offsetI = k <= 3 ? 1 - k % 3 : 0;
          let offsetJ = k > 3 ? 1 - k % 3 : 0;

          if (offsetI != offsetJ) {
            let slot1 = this._m3e.getSlot(i, j);
            let slot2 = this._m3e.getSlot(i + offsetI, j + offsetJ);
            if (slot1.exist && slot2.exist && slot1.slot.currentChip != 'no_chip' && slot2.slot.currentChip != 'no_chip' && slot1.slot.currentChip.color != slot2.slot.currentChip.color &&
                slot1.slot.currentChip.canMatch && slot2.slot.currentChip.canMatch) {

              [slot1.slot.currentChip.color, slot2.slot.currentChip.color] = [slot2.slot.currentChip.color, slot1.slot.currentChip.color];
              [slot1.slot.currentChip.type, slot2.slot.currentChip.type] = [slot2.slot.currentChip.type, slot1.slot.currentChip.type];

              let matchResult = this.matchSlot(i + offsetI, j + offsetJ);
              [slot2.slot.currentChip.color, slot1.slot.currentChip.color] = [slot1.slot.currentChip.color, slot2.slot.currentChip.color];
              [slot2.slot.currentChip.type, slot1.slot.currentChip.type] = [slot1.slot.currentChip.type, slot2.slot.currentChip.type];

              if (matchResult.exist) {
                result.push({
                  slot1: this._m3e.mSlots[i][j],
                  slot2: this._m3e.mSlots[i + offsetI][j + offsetJ],
                  result: matchResult.result,
                });
                break;
              }
            }
          }
        }
      }
    }

    if (this._m3e.level.canRefreshColours && result.length == 0 && startRow == 0 && endRow == tR) {
      this.refreshColors();
      result = this.getPossibleMoves();
      result.refreshedColors = true;
    }
    return result;
  }

  refreshColors() {
    this._m3e.forEachSlot((slot, c, r)=> {
      let chip = slot.currentChip;
      if (chip != 'no_chip' && chip.color!=-1) {
        chip.color = Utils.random(0, this._m3e.level.mGameSettings.maxColors);
      }
    });
    this._m3e.dontMatchSorting();
    this._m3e.forEachSlot((slot, c, r)=> {
      let chip = slot.currentChip;
      if (chip != 'no_chip' && chip.color!=-1) {
        chip.view.refreshColor();
      }
    });
    return true;
  }
}

class TAPM3Matcher {
  constructor(m3e) {
    this._m3e = m3e;
    //console.log('%c Tap Match 3 Matcher - %cInitialized', 'color: #ff6e00', 'color: #fff400');
  }

  /**
   * Return matched groups for one slot
   * @param c Current column
   * @param r Current row
   * @returns {{exist: boolean, result: [{slot: Slot, simpleDestroy: boolean, targetSlot: Slot, newType: number }]}} Matching result
   */
  matchSlot(c, r) {
    let slot = this._m3e.getSlot(c, r);
    if (!slot.exist && slot.slot.currentChip.mType < 1)
      return {exist: false, result: []};

    let matchedGroup = this.findMatchGroups(slot.slot, true, true);
    if (!matchedGroup.exist)
      matchedGroup = this.findMatchGroups(slot.slot, false, true);
    return matchedGroup;
  }

  /**
   * Finding matched slots by colour and compare them with matched patterns
   * @param {Slot} slot Checked slot
   * @param {boolean} [horizontal=true] Start checking for horizontal or vertical comparing at first
   * @param [boolean} [checkSubGroups=false] check only subgroups (used for second pass)
   * @returns {Slot[] | {exist: boolean, result: [{slot: Slot, simpleDestroy: boolean, targetSlot: Slot, newType: number }]}} Matching result
   */
  findMatchGroups(slot, horizontal = true, checkSubGroups = false) {
    let allSlots = [];
    let previousSlots = [];
    let nextSlots = [];
    let result = {exist: false, items: []};

    let counter = horizontal ? slot.mI : slot.mJ;
    let end = horizontal ? this._m3e.mLevel.fieldMask.totalColumns : this._m3e.mLevel.fieldMask.totalRows;

    while (end > counter++) {
      let curSlot = this._m3e.getSlot(horizontal ? counter : slot.mI, horizontal ? slot.mJ : counter);

      if (!curSlot.slot.mPendingDestroy && curSlot.slot.currentChip != 'no_chip' && curSlot.slot.currentChip.mColor == slot.currentChip.mColor && curSlot.slot.currentChip.canMatch) {
        previousSlots.push(curSlot.slot);
      }
      else break;
    }

    counter = horizontal ? slot.mI : slot.mJ;
    while (0 < counter--) {

      let curSlot = this._m3e.getSlot(horizontal ? counter : slot.mI, horizontal ? slot.mJ : counter);

      if (!curSlot.slot.mPendingDestroy && curSlot.slot.currentChip != 'no_chip' && curSlot.slot.currentChip.mColor == slot.currentChip.mColor && curSlot.slot.currentChip.canMatch) {
        nextSlots.push(curSlot.slot);
      }
      else break;
    }

    if (checkSubGroups) {
      allSlots = allSlots.concat(previousSlots);
      allSlots = allSlots.concat(slot);
      allSlots = allSlots.concat(nextSlots);
    }
    else {
      allSlots = allSlots.concat(previousSlots);
      allSlots = allSlots.concat(nextSlots);
      return allSlots;
    }

    let itemsLength = allSlots.length;
    if (itemsLength > 1) {
      if (checkSubGroups) {
        let i = 0;
        do {
          let subGroup = this.findMatchGroups(allSlots[i], !horizontal);
          if (subGroup.length !== 0) {
            allSlots = allSlots.concat(subGroup);
          }
        } while (itemsLength - 1 > i++);
      }
      result = this.comparePatterns(this.createMatchPattern(allSlots), slot);
      if (result.exist) {
        for (let r of result.items) {
          r.slot.isMatched = true;
        }
      }
    }
    return {exist: result.exist, result: result.items};
  }

  /**
   * Creating 2d array pattern based for  zero start coordinates
   * for next checking with predefined match patterns
   * @param {Slot[]} slots Matched slots
   * @returns {Slot[][]} Result match pattern
   */
  createMatchPattern(slots) {
    let result = [];
    let minColumn = Math.min.apply(Math, slots.map((x)=> {
      return x.mI;
    }));
    let maxColumn = Math.max.apply(Math, slots.map((x)=> {
      return x.mI;
    }));
    let minRow = Math.min.apply(Math, slots.map((x)=> {
      return x.mJ;
    }));
    let maxRow = Math.max.apply(Math, slots.map((x)=> {
      return x.mJ;
    }));

    for (let i = 0; i <= maxColumn - minColumn; i++) {
      result[i] = [];
      for (let j = 0; j <= maxRow - minRow; j++) {
        let slot = slots.find((x)=> {
          return x.mI == minColumn + i && x.mJ == minRow + j;
        });
        result[i][j] = (slot ? slot : 0);
      }
    }
    return result;
  }

  /**
   * Compare matched patterns for matching
   * @param {Slot[][]}  slotsPattern Founded slots pattern
   * @param {Slot} startSlot Starting matching slot
   * @returns {{exist: boolean, items: [{slot: Slot, simpleDestroy: boolean, targetSlot: Slot, newType: number }]} Matching result if exist
   */
  comparePatterns(slotsPattern, startSlot) {
    if (slotsPattern.length > 0) {
      let matchedItems = [];
      let patternsLength = this._m3e.level.matchPatterns.length;
      let spMaxColumns = slotsPattern.length;
      let spMaxRows = slotsPattern[0].length;
      let p = 0;
      let cOffset = 0;
      let rOffset = 0;

      for (p = 0; p < patternsLength; p++) {
        let mP = this._m3e.level.matchPatterns[p].pattern;
        let mPC = mP.length;
        let mPR = mP[0].length;
        if (mPC <= spMaxColumns && mPR <= spMaxRows) {

          for (cOffset = 0; cOffset <= spMaxColumns - mPC; cOffset++) {
            for (rOffset = 0; rOffset <= spMaxRows - mPR; rOffset++) {
              let matched = true;
              let startSlotMatched = false;
              matchedItems = [];
              for (let i = 0; i < mPC; i++) {
                for (let j = 0; j < mPR; j++) {
                  let curSP = slotsPattern[i + cOffset][j + rOffset];
                  if (mP[i][j] == 1 && curSP !== 0) {
                    let newType = null;
                    let newColor = null;
                    let patternParams = this._m3e.level.matchPatterns[p].chipType;
                    if (patternParams != null) {
                      patternParams = this._m3e.level.matchPatterns[p].chipType.split(',');
                      if (patternParams.length == 2) {
                        newType = parseInt(patternParams[0]);
                        newColor = parseInt(patternParams[1]);
                      }
                      else
                        newType = patternParams[0];
                    }

                    if (curSP.mI == startSlot.mI && curSP.mJ == startSlot.mJ)
                      startSlotMatched = true;
                    matchedItems.push({
                      slot: curSP,
                      simpleDestroy: this._m3e.level.matchPatterns[p].chipType === null,
                      targetSlot: startSlot,
                      newType: newType,
                      newColor: newColor,
                    });
                  }
                  else if (mP[i][j] != curSP) {
                    matched = false;
                  }
                }
              }
              if (matched && startSlotMatched) {
                return {exist: true, items: matchedItems};
              }
            }
          }
        }
      }
    }
    return {exist: false, items: []};
  }

  /**
   * Set all chips pendingMatch value
   * @param {boolean} value
   */
  setAllChipsMatchPending(value) {
    this._m3e.forEachSlot((slot)=> {
      slot.pendingMatch = value;
    });
  }

  /**
   * Set all chips PendingDestroy value
   * @param {boolean} value
   */
  resetPendingDestroy() {
    this._m3e.forEachSlot((slot)=> {
      slot.mPendingDestroy = false;
      // slot.mThrowSpecialDestroy = false;
    });
  }

  /**
   * Match all or only lat Action moved chips
   * @param {boolean} checkOnlyPending check only last moved chips
   * {{exist: boolean, result: [{slot: Slot, simpleDestroy: boolean, targetSlot: Slot, newType: number }]}} Matching result
   */
  matchAllChips(checkOnlyPending = false) {
    return false;    //checkOnlyPending = false
    // let findGroups = false;
    // this._m3e.forEachSlot((slot, c, r)=> {
    //   //if (!slot.mPendingDestroy && (!checkOnlyPending || slot.pendingMatch) && slot.currentChip.canMatch) {
    //   if ((!checkOnlyPending || slot.pendingMatch) && slot.currentChip.canMatch) {
    //     let matchGroups = this.matchSlot(c, r);
    //     if (matchGroups.exist) {
    //       findGroups = true;
    //       for (let item of matchGroups.result) {
    //         if (item.slot !== null) {
    //           item.slot.pendingDestroy(item);
    //         }
    //       }
    //     }
    //   }
    // });
    //
    // this.setAllChipsMatchPending(false);
    // return findGroups;
  }

  specialSlotsMatch(slot1, slot2) {
    let matchName = `${slot1.currentChip.type}-${slot2.currentChip.type}`;
    let matchNameReversed = `${slot2.currentChip.type}-${slot1.currentChip.type}`;
    let matchNameX = `${slot1.currentChip.type}-x`;
    let matchNameXReversed = `${slot2.currentChip.type}-x`;
    let type = matchName;
    let result = this._m3e.specialDestroyBehavior.slotDestroy(matchName, slot1, false);
    if (result) {
      slot1.currentChip.type = 0;
      slot2.currentChip.type = type;
      return result;
    }

    if (!result) {
      result = this._m3e.specialDestroyBehavior.slotDestroy(matchNameReversed, slot1, false);
      type = matchNameReversed;
      if (result) {
        slot1.mThrowSpecialDestroy = true;
        slot1.currentChip.type = 0;
        slot2.currentChip.type = type;
        return result;
      }
    }

    if (!result && slot1.currentChip.type != slot2.currentChip.type) {
      result = this._m3e.specialDestroyBehavior.slotDestroy(matchNameX, slot1, false);
      type = matchNameX;
    }
    if (!result && slot1.currentChip.type != slot2.currentChip.type) {
      result = this._m3e.specialDestroyBehavior.slotDestroy(matchNameXReversed, slot1, false);
      type = matchNameXReversed;
    }
    if (result != false) {
      slot1.mThrowSpecialDestroy = true;
      slot2.currentChip.type = type;
    }
    if (result) {
      slot2.mThrowSpecialDestroy = true;
      slot1.currentChip.type = type;
    }

    slot1.pendingMatch = true;
    slot2.pendingMatch = true;
    return result;
  }

  removeSpecialChips(type, slot, slotsToRemove) {
    slotsToRemove = slotsToRemove || [];
    let counter = 0;
    let chipsForRemove = this._m3e.specialDestroyBehavior.slotDestroy(type.toString(), slot);
    if (!chipsForRemove) {
      slot.destroyChipEffect();
      slot.mPendingDestroy = false;
    }
    else {
      for (let c of chipsForRemove) {
        if (c.slot.currentChip != 'no_chip') {
          if (c.slot.currentChip.type != 0 && !this._m3e.slotsEqual(c.slot, slot) &&
              (slotsToRemove.find((x)=>(this._m3e.slotsEqual(c.slot, x))) == undefined) && !c.slot.mThrowSpecialDestroy) {
            // c.slot.currentChip.mIgnoreDestroyEffect = true;
            // slot.currentChip.mIgnoreDestroyEffect = false;
            this.removeSpecialChips(c.slot.currentChip.type, c.slot, slotsToRemove);
          }
          else {
            slotsToRemove.push({mI: c.slot.mI, mJ: c.slot.mJ});
            // if(c.slot.currentChip.type != 0)
            //   c.slot.currentChip.mIgnoreDestroyEffect = false;
            //slot.currentChip.mIgnoreDestroyEffect = false;

            c.slot.mThrowSpecialDestroy = false;
            c.slot.mSimpleDestroy = true;
            if (this._m3e.level.gameType.mType === 'recipe') {
              let recipeResult = this._m3e.decreaseRecipe(c.slot.currentChip);
              if (recipeResult !== false) {
                c.slot.destroyChipEffect(recipeResult, counter);
                counter++;
              }
              else {
                c.slot.destroyChipEffect();
              }
            }
            else
              c.slot.destroyChipEffect();


            c.slot.mPendingDestroy = true;
            c.slot.currentChip.mStartDestroy = true;
            c.slot.pendingMatch = true;
          }
        }
      }
    }

    slot.currentChip.mIgnoreDestroyEffect = false;
  }

  getPossibleMoves(startRow, endRow = -1) {
    const tC = this._m3e.level.fieldMask.totalColumns;
    const tR = this._m3e.level.fieldMask.totalRows;

    startRow = startRow || 0;
    endRow = endRow == -1 ? tR : endRow;

    let result = [];
    result.refreshedColors = false;

    for (let i = 0; i < tC - 1; i++) {
      for (let j = startRow; j <= endRow; j++) {

        let slot = this._m3e.getSlot(i, j);
        if (slot.exist && slot.slot.currentChip != 'no_chip' && slot.slot.currentChip.canMatch) {

          let matchResult = this.matchSlot(i, j);

          if (matchResult.exist) {
            result.push({
              slot1: this._m3e.mSlots[i][j],
              slot2: this._m3e.mSlots[i][j],
              result: matchResult.result,
            });
            break;
          }
        }
      }
    }


    if (this._m3e.level.canRefreshColours && result.length == 0 && startRow == 0 && endRow == tR) {
      this.refreshColors();
      result = this.getPossibleMoves();
      result.refreshedColors = true;
    }
    return result;
  }

  refreshColors() {
    this._m3e.forEachSlot((slot, c, r)=> {
      let chip = slot.currentChip;
      if (chip != 'no_chip' && chip.color!=-1) {
        chip.color = Utils.random(0, this._m3e.level.mGameSettings.maxColors);
      }
    });
    // this._m3e.dontMatchSorting();
    this._m3e.forEachSlot((slot, c, r)=> {
      let chip = slot.currentChip;
      if (chip != 'no_chip' && chip.color!=-1) {
        chip.view.refreshColor();
      }
    });
    return true;
  }
}
